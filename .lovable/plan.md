

# Mehr sichtbarer Abstand zwischen Spieler-/Turnierkarten

## Problem-Analyse
Der aktuelle `space-y-6` Abstand (24px) ist technisch vorhanden, aber visuell nicht ausreichend sichtbar, weil jede PlayerCard bereits eine eigene Card-Komponente mit Rand und Schatten verwendet.

## Lösungsansatz
Ich werde den Abstand auf `space-y-4` mit zusätzlichem `flex flex-col gap-4` kombinieren - oder noch besser: direkt auf einen größeren Wert wie `space-y-5` oder einen expliziten `gap` erhöhen. Da `space-y-6` scheinbar nicht ausreicht, erhöhe ich auf `space-y-8` (32px) für einen deutlich sichtbaren Abstand.

---

## Technische Änderungen

### Datei: `src/pages/Index.tsx`

**Zeile 84** - Top Spieler CardContent:
```jsx
// Von:
<CardContent className="space-y-6">

// Zu:
<CardContent className="flex flex-col gap-4">
```

**Zeile 111** - Letzte Turniere CardContent:
```jsx
// Von:
<CardContent className="space-y-6">

// Zu:
<CardContent className="flex flex-col gap-4">
```

---

## Warum diese Lösung?
- `flex flex-col gap-4` erzeugt einen konsistenten Abstand von 16px zwischen den Karten
- Flexbox mit `gap` ist zuverlässiger als `space-y` bei komplexen verschachtelten Komponenten
- Falls 16px nicht genug ist, kann ich auf `gap-5` (20px) oder `gap-6` (24px) erhöhen

Falls du mehr Abstand möchtest, sage mir einfach Bescheid und ich kann den Wert anpassen!

