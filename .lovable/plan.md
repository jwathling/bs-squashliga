
# ELO-Verlauf-Chart auf der Spieler-Profilseite

## Datengrundlage

Die Daten sind bereits verfügbar über `usePlayerTournaments`:
- `elo_at_start` - ELO zu Beginn des Turniers
- `elo_change` - ELO-Änderung nach dem Turnier
- `tournament.created_at` - Datum für die X-Achse

Die finale ELO nach einem Turnier ist: `elo_at_start + elo_change`

## Visualisierung

```text
ELO
 ^
1150 |                          ●───────── Aktuell: 1143
     |                    ●────┘
1100 |              ●────┘
     |        ●────┘
1050 |  ●────┘
     |  │
1000 +──┼────────────────────────────────────> Zeit
     Start  Turnier 1   Turnier 2   Turnier 3
```

Ein Liniendiagramm zeigt:
- Y-Achse: ELO-Wert
- X-Achse: Turniere chronologisch
- Startpunkt bei 1000 (oder erstem Turnier)
- Datenpunkte für jedes Turnier

## Änderungen

### 1. Neue Komponente: `src/components/players/EloChart.tsx`

Eine dedizierte Chart-Komponente für den ELO-Verlauf:
- Nimmt Turnierdaten als Props
- Verwendet Recharts `LineChart` mit `Area` für visuellen Effekt
- Zeigt Turniername im Tooltip
- Responsive Darstellung
- Fallback-Nachricht wenn keine Turniere vorhanden

### 2. Integration in `src/pages/PlayerProfile.tsx`

- Import der neuen EloChart-Komponente
- Platzierung zwischen den StatCards und OpponentStats
- Daten werden aus den bereits geladenen Turnieren berechnet

## Chart-Details

| Element | Beschreibung |
|---------|--------------|
| Typ | Area Line Chart mit Gradient |
| Farbe | Primary-Farbe des Themes |
| Punkte | Kreise an jedem Datenpunkt |
| Tooltip | Turniername + ELO-Wert + Datum |
| Y-Achse | Auto-Skalierung mit Padding |
| X-Achse | Turniernamen (gekürzt) |

## Datenaufbereitung

```text
Tournaments (chronologisch sortiert):
1. Start-ELO: 1000
2. Nach Turnier 1: elo_at_start + elo_change = 1032
3. Nach Turnier 2: elo_at_start + elo_change = 1087
4. Nach Turnier 3: elo_at_start + elo_change = 1143

Chart-Daten:
[
  { name: "Start", elo: 1000 },
  { name: "Turnier 1", elo: 1032, change: +32 },
  { name: "Turnier 2", elo: 1087, change: +55 },
  ...
]
```

## Betroffene Dateien

| Datei | Aktion |
|-------|--------|
| `src/components/players/EloChart.tsx` | Neu erstellen |
| `src/pages/PlayerProfile.tsx` | Import + Integration |
