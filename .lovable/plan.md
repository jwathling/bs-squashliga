
# Fix: Spielernamen bei Punkte-Vergleich anzeigen

## Problem
Im Head-to-Head-Vergleich zeigt die "Punkte"-Leiste ueber der Bar die Punktzahlen (z.B. "97" und "114") statt der Spielernamen. Die Zahlen sind redundant, da sie bereits in der Leiste selbst stehen.

## Loesung
In `src/components/players/OpponentStats.tsx` die Labels der Punkte-StatBar von den Punktwerten auf die Spielernamen aendern -- genau wie bei der Siege-Leiste.

## Aenderung

| Datei | Aenderung |
|-------|-----------|
| `src/components/players/OpponentStats.tsx` | `leftLabel` und `rightLabel` bei Punkte von Zahlenwerten auf `playerName` / `opponent.opponentName` aendern |

### Vorher
```text
leftLabel={`${opponent.playerPoints}`}
rightLabel={`${opponent.opponentPoints}`}
```

### Nachher
```text
leftLabel={playerName}
rightLabel={opponent.opponentName}
```
