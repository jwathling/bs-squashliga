

# Anpassungen der Startseite

## Zusammenfassung
Zwei kleine Änderungen an der Startseite:
1. **Mehr Abstand** zwischen den Einträgen in "Top Spieler" und "Letzte Turniere"
2. **"Aktive Turniere"-Block entfernen** aus der Statistik-Sektion

---

## Änderungen

### 1. Abstände vergrößern
Die `CardContent`-Container für beide Listen verwenden aktuell `space-y-4`. Ich werde das auf `space-y-6` erhöhen, um mehr Luft zwischen den einzelnen Karten zu schaffen.

**Betroffene Stellen:**
- Zeile 85: `<CardContent className="space-y-4">` → `space-y-6`
- Zeile 112: `<CardContent className="space-y-4">` → `space-y-6`

### 2. "Aktive Turniere" entfernen
Der vierte StatCard-Block (Zeile 66) mit "Aktive Turniere" wird komplett entfernt. Das Grid passt sich automatisch an - mit 3 Karten statt 4 wird das Layout auf größeren Bildschirmen von `lg:grid-cols-4` auf `lg:grid-cols-3` geändert.

**Änderungen:**
- Zeile 62: Grid-Klasse von `lg:grid-cols-4` auf `lg:grid-cols-3` ändern
- Zeile 66: `<StatCard title="Aktive Turniere" ... />` entfernen
- Zeile 30: Die nicht mehr benötigte Variable `activeTournaments` entfernen

---

## Betroffene Datei
- `src/pages/Index.tsx`

