

# ELO-Verlauf Filter-Optionen einbauen

## Ziel
Im ELO-Verlauf-Chart auf der Spielerprofil-Seite sollen Filter eingebaut werden, mit denen man die Anzahl der angezeigten Turniere einschränken kann (z.B. nur die letzten 5).

## Umsetzung

### Datei: `src/components/players/EloChart.tsx`

**1. Filter-Auswahl oben rechts im Chart-Header**
Ein kompakter Toggle-Group oder Select-Button mit folgenden Optionen:
- **Letzte 5**
- **Letzte 10**
- **Letzte 20**
- **Alle** (Default)

**2. State für Filter**
- Lokaler `useState` für die ausgewählte Option (`5 | 10 | 20 | 'all'`)
- Default: `'all'` (aktuelles Verhalten bleibt erhalten)

**3. Logik**
- Turniere werden weiterhin chronologisch sortiert (älteste zuerst)
- Bei Filter `5/10/20`: nur die **letzten N Turniere** (also die neuesten N) anzeigen
- Der "Start"-Punkt (ELO 1000) wird **nur bei "Alle"** angezeigt. Bei gefilterten Ansichten startet der Chart beim ELO-Wert vor dem ersten sichtbaren Turnier (`elo_at_start` des ersten gezeigten Turniers).

**4. Y-Achsen-Skalierung**
Die bestehende Auto-Skalierung (`yMin`/`yMax` mit Padding) wird auf den gefilterten Datensatz angewendet — dadurch wird der Chart bei wenigen Turnieren automatisch detaillierter.

**5. Chart-Header anpassen**
Der Filter-Button wird in den `CardHeader` rechts neben den Titel platziert (flex layout).

## Erwartetes Ergebnis

```text
┌─────────────────────────────────────────┐
│ 📈 ELO-Verlauf      [5] [10] [20] [Alle]│
├─────────────────────────────────────────┤
│                                          │
│   (Chart zeigt nur gefilterte Turniere)  │
│                                          │
└─────────────────────────────────────────┘
```

- Spieler mit vielen Turnieren bekommen eine übersichtlichere Ansicht
- Bei wenigen Turnieren als Filter erlaubt: zeigt einfach alle vorhandenen
- Kein DB-Update, keine neuen Hooks — rein UI-Änderung im Chart-Component

## Technische Details
- Datei: `src/components/players/EloChart.tsx`
- UI-Komponente: `ToggleGroup` aus `@/components/ui/toggle-group` (bereits vorhanden)
- Keine Änderung an `PlayerProfile.tsx` nötig — das Component bekommt weiterhin alle Turniere und filtert intern

