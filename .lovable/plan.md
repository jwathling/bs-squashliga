

# ELO-Konsistenz Fix und Datenkorrektur

## Zusammenfassung
1. **Code-Fix**: ELO-Berechnung in TournamentLive.tsx anpassen, damit zukünftige Turniere konsistente Werte liefern
2. **Datenkorrektur**: Globale Spieler-ELO auf die korrekten Werte nach dem letzten Turnier setzen

---

## Teil 1: Code-Änderungen

### Datei: `src/pages/TournamentLive.tsx`

**Änderung 1 - ELO-Berechnung (ca. Zeile 148-154):**
Statt der aktuellen globalen ELO wird die turnier-basierte ELO verwendet:
```typescript
// Berechne aktuelle Turnier-ELO für beide Spieler
const p1CurrentTournamentElo = tp1.elo_at_start + tp1.elo_change;
const p2CurrentTournamentElo = tp2.elo_at_start + tp2.elo_change;

const eloChanges = calculateMatchEloChanges(
  p1CurrentTournamentElo,
  p2CurrentTournamentElo,
  player1Score,
  player2Score
);
```

**Änderung 2 - Globale ELO-Aktualisierung (ca. Zeile 242-258):**
Die globale ELO wird basierend auf Turnier-Start + Änderung berechnet:
```typescript
await Promise.all([
  updatePlayerStats.mutateAsync({
    id: match.player1_id,
    elo: tp1.elo_at_start + p1EloChange,
    // ... rest bleibt gleich
  }),
  updatePlayerStats.mutateAsync({
    id: match.player2_id,
    elo: tp2.elo_at_start + p2EloChange,
    // ... rest bleibt gleich
  }),
]);
```

**Änderung 3 - Revert-Logik anpassen (ca. Zeile 161-179):**
Wenn ein bereits gespieltes Match geändert wird, muss die Revert-Logik auch die turnier-basierte ELO verwenden.

---

## Teil 2: Datenkorrektur

Die globale ELO der Spieler wird auf die Werte gesetzt, die sich aus dem letzten Turnier ("Dienstagsprügelei") ergeben:

| Spieler | Aktuell | Korrigiert auf |
|---------|---------|----------------|
| Jan     | 1019    | **1037**       |
| Jonny   | 1179    | **1175**       |
| Mitze   | 1010    | **992**        |
| Ron     | 792     | **796**        |

Diese Korrektur erfolgt über direkte Datenbank-Updates.

---

## Betroffene Dateien
- `src/pages/TournamentLive.tsx` (Code-Fix)
- Datenbank: `players` Tabelle (Datenkorrektur)

---

## Technische Details

### Warum funktioniert der Fix?
- **Vorher**: Jedes Match berechnet ELO basierend auf `players.elo` (globale ELO), die sich nach jedem Match ändert
- **Nachher**: Jedes Match berechnet ELO basierend auf `elo_at_start + elo_change` (Turnier-konsistent)
- **Ergebnis**: Die finale globale ELO ist immer exakt `elo_at_start + elo_change`

### Formel-Beispiel für Jonny:
```text
Turnier-Start: 1081
Nach allen Spielen: elo_change = +94
Globale ELO = 1081 + 94 = 1175 ✓
```

