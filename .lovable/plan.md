
# 3-Spieler-Logik vereinfachen

## Ziel
Bei genau 3 Spielern soll der Spielplan **jede Runde identisch** bleiben. Kein Sonderfall fuer den Rundenuebergang, keine Rotation, keine "Optimierung" zwischen Runden.

## Warum
Du hast recht: Bei 3 Spielern spielt **jeder pro Runde genau 2 Spiele** und damit hat **jeder automatisch einmal Back-to-Back**.  
Das ist nicht unfair, sondern die normale Struktur eines 3er-Round-Robin.

Das eigentliche Problem war, dass ich den Rundenuebergang separat "fair" machen wollte. Das brauchen wir hier nicht.

## Umsetzung

### 1. `matchScheduler.ts` fuer 3 Spieler bewusst simpel machen
- Die 3er-Logik bleibt ein **festes Template**
- Pro Runde immer exakt dieselbe Reihenfolge:
```text
Spiel 1: A-B
Spiel 2: C-A
Spiel 3: B-C
```
- Diese Reihenfolge gilt fuer:
  - `generateRoundSchedule(...)`
  - `generateAdditionalRound(...)`

### 2. Keine Sonderbehandlung fuer `lastMatchPlayers` bei 3 Spielern
- In `generateAdditionalRound(...)` wird `lastMatchPlayers` fuer 3 Spieler **ignoriert**
- Der Parameter bleibt nur fuer 4+ Spieler relevant

### 3. Kommentare im Code korrigieren
Die aktuellen Kommentare erzeugen falsche Erwartungen. Ich wuerde sie anpassen zu:
- Bei 3 Spielern ist Back-to-Back unvermeidbar
- Jede Runde verwendet dieselbe feste Reihenfolge
- Das Verhalten ist absichtlich und korrekt

### 4. Vorschau und echte Match-Erzeugung konsistent halten
Pruefen, dass dieselbe 3er-Logik ueberall verwendet wird:
- Planungs-Vorschau (`MatchSchedulePreview`)
- Turnierstart (`useStartTournament`)
- Runde hinzufuegen (`handleAddRound` / `generateAdditionalRound`)

## Erwartetes Ergebnis
Bei 3 Spielern sieht ein Turnier dann bewusst so aus:

```text
Runde 1: A-B, C-A, B-C
Runde 2: A-B, C-A, B-C
Runde 3: A-B, C-A, B-C
```

Damit ist das Verhalten:
- vorhersehbar
- einfach
- mathematisch korrekt
- ohne unnoetige "Fairness-Korrekturen", die nur neue Probleme erzeugen

## Technische Details
- Datei: `src/lib/matchScheduler.ts`
- Kein Datenbank-Update noetig
- Keine UI-Aenderung noetig
- Nur Scheduling-Logik und Kommentare bereinigen
