# Unvollständige Runden beim Turnierende behandeln

## Problem
Wird ein Turnier vorzeitig beendet während eine Runde nur teilweise gespielt wurde (z.B. 2 von 3 Spielen aus Runde 3), entsteht eine **unfaire Tabelle**: einige Spieler haben mehr Spiele und damit mehr Sieg-Chancen als andere. Da nach Siegen sortiert wird, verfälscht das das Ergebnis.

## Lösung
Beim Beenden eines Turniers mit unvollständiger Runde bekommt der User eine **manuelle Auswahl** im Bestätigungsdialog. Verworfene Matches bleiben in der DB, werden aber als `discarded` markiert — so ist nachvollziehbar was passiert ist.

## Umsetzung

### 1. DB-Schema
`matches.status` ist ein freies `text`-Feld (kein Enum) — neuer Wert `'discarded'` ist ohne Migration möglich.

### 2. Erkennung "unvollständige Runde"
Im Beenden-Dialog prüfen: Gibt es eine Runde mit mind. einem `completed` UND mind. einem `pending` Match? Wenn ja → erweiterten Dialog zeigen.

### 3. Erweiterter Beenden-Dialog (`TournamentLive.tsx`)
Bei unvollständiger Runde mit RadioGroup:

```
Turnier vorzeitig beenden?

Runde 3 ist nur teilweise gespielt (2 von 3 Spielen).

○ Letzte Runde verwerfen (empfohlen)
  Alle Spiele aus Runde 3 werden ignoriert.
  Tabelle bleibt fair, alle haben gleich viele Spiele.

○ Alle gespielten Spiele werten
  Auch die 2 Spiele aus Runde 3 zählen.
  Achtung: ungleiche Spielanzahl pro Spieler.
```

### 4. Logik beim Beenden
**"Letzte Runde verwerfen":**
- Für jedes `completed` Match der Runde:
  - ELO zurückrechnen (Logik analog `useDeleteTournament`)
  - `tournament_players`-Stats korrigieren (games_played, wins, points_for/against, elo_change)
  - Globale `players`-Stats korrigieren (elo, total_games, total_wins)
- Match-Status auf `'discarded'` setzen, Score/Winner behalten
- Pending Matches der Runde ebenfalls auf `'discarded'`
- Turnier auf `completed`

**"Alle werten":** Aktuelles Verhalten — pending bleibt pending.

### 5. Anzeige verworfener Matches (`MatchCard.tsx`)
- Ausgegraut, Badge "Verworfen", Score durchgestrichen, nicht editierbar.

### 6. Hook (`useCompleteTournament`)
Erweitern um optionalen Parameter `discardRound?: number`.

### 7. LiveTable
Bleibt unverändert — Stats werden in `tournament_players` korrekt zurückgerechnet.

### 8. Badge-Berechnung
Bestehende Logik filtert nach `status === "completed"` → verworfene fliegen automatisch raus.

## Erwartetes Ergebnis
4 Spieler, Runde 3 angefangen, 2/6 Spiele, "Letzte Runde verwerfen":
- Alle Spieler haben exakt 4 Spiele
- ELO-Änderungen aus Runde 3 zurückgerollt
- Globale Stats sauber
- Runde-3-Spiele als "Verworfen" sichtbar (Transparenz)
- Tabelle fair und aussagekräftig

## Technische Details
- `src/hooks/useTournaments.ts` (erweitern `useCompleteTournament`)
- `src/pages/TournamentLive.tsx` (RadioGroup im Dialog)
- `src/components/tournaments/MatchCard.tsx` (Discarded-Darstellung)
- Kein DB-Schema-Update nötig
- Memory-Update: `mem://features/turnier-verwaltung/vorzeitiges-beenden`