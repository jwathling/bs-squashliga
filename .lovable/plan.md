

# Turnier-Badges (Auszeichnungen) - Aktualisierter Plan

## Zusammenfassung
Beim Beenden eines Turniers werden automatisch Badges berechnet und gespeichert. Badges koennen an mehrere Spieler gleichzeitig vergeben werden, wenn sie den gleichen Bestwert teilen.

## Badge-Liste

| Badge | Icon | Farbe | Berechnung | Mehrfach moeglich? |
|-------|------|-------|------------|-------------------|
| Turniersieg | Trophy | Gold | Platz 1 (Siege, dann Punktedifferenz) | Ja, bei Gleichstand |
| Hoechster Sieg | Zap | Blau | Groesste Punktedifferenz in einem Match | Ja |
| ELO-Rakete | TrendingUp | Gruen | Bester elo_change | Ja |
| Punktemaschine | Target | Orange | Meiste points_for | Ja |
| Mauer | Shield | Silber | Wenigste points_against (min. 1 Spiel) | Ja |
| Arsch der Schande | Skull | Rot | Letzter Platz in der Tabelle | Ja, bei Gleichstand |

## Geplante Aenderungen

### 1. Neue Datenbank-Tabelle: `player_badges`
- `id` (uuid, PK)
- `player_id` (uuid, FK -> players)
- `tournament_id` (uuid, FK -> tournaments)
- `badge_type` (text) - z.B. "tournament_winner", "highest_win"
- `badge_label` (text) - Anzeigename, z.B. "Hoechster Sieg"
- `badge_value` (text) - Detail, z.B. "11:3 vs Max"
- `created_at` (timestamptz)

Ein Badge-Typ kann pro Turnier mehrere Eintraege haben (ein Eintrag pro Spieler).

### 2. Badge-Berechnung: `src/lib/badges.ts`

Kernprinzip: Fuer jeden Badge-Typ den Bestwert ermitteln, dann **alle** Spieler mit diesem Wert sammeln.

```text
Beispiel "Hoechster Sieg":
  Match A: Spieler 1 gewinnt 11:3 (Diff = 8)
  Match B: Spieler 2 gewinnt 11:3 (Diff = 8)
  Match C: Spieler 3 gewinnt 11:5 (Diff = 6)
  -> Badge geht an Spieler 1 UND Spieler 2
```

Fuer jeden Badge-Typ:
- **Turniersieg**: Alle Spieler auf Platz 1 (gleiche Siege + gleiche Punktedifferenz)
- **Hoechster Sieg**: Alle Gewinner von Matches mit der hoechsten Punktedifferenz
- **ELO-Rakete**: Alle Spieler mit dem hoechsten elo_change
- **Punktemaschine**: Alle Spieler mit den meisten points_for
- **Mauer**: Alle Spieler mit den wenigsten points_against
- **Arsch der Schande**: Alle Spieler auf dem letzten Platz

### 3. Hooks: `src/hooks/useBadges.ts`
- `usePlayerBadges(playerId)` - Alle Badges eines Spielers (mit Turniername per Join)
- `useTournamentBadges(tournamentId)` - Alle Badges eines Turniers
- `useAwardBadges()` - Mutation zum Speichern (Array von Badges)

### 4. UI-Komponenten
- `src/components/badges/BadgeDisplay.tsx` - Einzelner Badge mit Icon, Farbe, Label, Wert
- `src/components/badges/BadgeGrid.tsx` - Grid-Layout fuer mehrere Badges

### 5. Aenderung: `src/pages/TournamentLive.tsx`
- `handleCompleteTournament`: Nach dem Beenden Badges berechnen und speichern
- Bei abgeschlossenen Turnieren: Badge-Bereich unter der Live-Tabelle mit allen vergebenen Badges

### 6. Aenderung: `src/pages/PlayerProfile.tsx`
- Neuer Abschnitt "Auszeichnungen" mit gesammelten Badges, gruppiert nach Turnier

## Technische Details

### Badge-Berechnung (Pseudocode)
```text
function calculateTournamentBadges(matches, tournamentPlayers, allPlayers):
  badges = []

  // Tabelle sortieren (wie LiveTable)
  sorted = sortByWinsThenPointDiff(tournamentPlayers)
  
  // Turniersieg: alle mit gleichen Werten wie Platz 1
  topWins = sorted[0].wins
  topDiff = sorted[0].points_for - sorted[0].points_against
  winners = sorted.filter(p => p.wins == topWins && diff(p) == topDiff)
  -> badges fuer alle winners

  // Arsch der Schande: alle mit gleichen Werten wie letzter Platz
  lastWins = sorted[last].wins
  lastDiff = diff(sorted[last])
  losers = sorted.filter(p => p.wins == lastWins && diff(p) == lastDiff)
  -> badges fuer alle losers

  // Hoechster Sieg: groesste Differenz ueber alle Matches
  completedMatches = matches.filter(completed)
  maxDiff = max(|score1 - score2|)
  matchesWithMaxDiff = completedMatches.filter(diff == maxDiff)
  -> badges fuer alle Gewinner dieser Matches

  // ELO-Rakete, Punktemaschine, Mauer: analog
  maxElo = max(elo_change) -> alle mit diesem Wert
  maxPoints = max(points_for) -> alle mit diesem Wert
  minAgainst = min(points_against) -> alle mit diesem Wert (games_played > 0)

  return badges
```

### Dateien-Uebersicht

| Datei | Aktion |
|-------|--------|
| `supabase/migrations/...` | Neue Tabelle `player_badges` |
| `src/lib/badges.ts` | Badge-Berechnungslogik (mit Mehrfachvergabe) |
| `src/hooks/useBadges.ts` | Hooks fuer Badges |
| `src/components/badges/BadgeDisplay.tsx` | Badge-Anzeige-Komponente |
| `src/components/badges/BadgeGrid.tsx` | Badge-Grid |
| `src/pages/TournamentLive.tsx` | Badge-Vergabe + Anzeige |
| `src/pages/PlayerProfile.tsx` | Auszeichnungen-Bereich |

