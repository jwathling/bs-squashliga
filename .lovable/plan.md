

# Minimum auf 2 Spieler ändern

## Änderungen

**Datei: `src/components/tournaments/CreateTournamentForm.tsx`**

| Zeile | Vorher | Nachher |
|-------|--------|---------|
| 53 | `selectedPlayers.length < 3` | `selectedPlayers.length < 2` |
| 54 | `"Mindestens 3 Spieler erforderlich"` | `"Mindestens 2 Spieler erforderlich"` |
| 156 | `selectedPlayers.length < 3` | `selectedPlayers.length < 2` |

## Ergebnis

Nach der Änderung können auch 1v1-Duelle als Turnier erstellt werden. Der Match-Scheduler unterstützt dies bereits technisch.

