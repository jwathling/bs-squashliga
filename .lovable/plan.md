

# Spielerprofil aufraumen -- Gegner und Turnierhistorie als Unterseiten

## Uebersicht

Die Spielerprofil-Seite wird schlanker: **Gegner** und **Turnierhistorie** werden jeweils auf eigene Unterseiten ausgelagert. Auf dem Hauptprofil erscheinen stattdessen kompakte Zusammenfassungs-Kacheln mit einem Button, der zur jeweiligen Detail-Seite fuehrt.

Jede Detail-Seite zeigt zuerst eine Fakten-Zusammenfassung (Statistik-Karten) und darunter eine **filterbare, chronologisch sortierte Liste**.

## Neues Seitenkonzept

```text
/players/:id                 --> Profil (Stats, ELO-Chart, Badges, 2 Vorschau-Kacheln)
/players/:id/tournaments     --> Turnierhistorie (Fakten + filterbare Liste)
/players/:id/opponents       --> Gegner-Uebersicht (Fakten + filterbare Liste)
```

## Aenderungen im Detail

### 1. Zwei neue Seiten erstellen

**`src/pages/PlayerTournaments.tsx`** -- Turnierhistorie
- Fakten oben: Anzahl Turniere, Durchschnittliche ELO-Aenderung, Bestes Turnier (hoechste ELO-Aenderung), Gesamte Siegquote ueber alle Turniere
- Darunter: Chronologisch sortierte Liste aller Turniere (neueste oben), wie bisher gestaltet
- Suchfeld zum Filtern nach Turniername
- Zurueck-Button zum Profil

**`src/pages/PlayerOpponents.tsx`** -- Gegner-Uebersicht
- Fakten oben: Anzahl verschiedener Gegner, Bester Gegner (hoechste Siegquote), Schwierigster Gegner (niedrigste Siegquote), Meistgespielter Gegner
- Darunter: Liste aller Gegner (sortiert nach Anzahl Spiele, neueste Begegnung), inklusive Head-to-Head-Detail bei Klick
- Suchfeld zum Filtern nach Gegnername
- Zurueck-Button zum Profil

### 2. PlayerProfile.tsx verschlanken

Die Sektionen "Gegner" und "Turnierhistorie" werden ersetzt durch zwei kompakte Vorschau-Kacheln:

- **Turnierhistorie-Kachel**: Zeigt Anzahl Turniere + letztes Turnier + Button "Alle Turniere anzeigen" (Link zu `/players/:id/tournaments`)
- **Gegner-Kachel**: Zeigt Anzahl Gegner + meistgespielter Gegner + Button "Alle Gegner anzeigen" (Link zu `/players/:id/opponents`)

Die Reihenfolge auf dem Profil wird:
1. Stats (ELO, Spiele, Siege, Siegquote)
2. ELO-Chart
3. Badges
4. Turnierhistorie-Vorschau (Kachel)
5. Gegner-Vorschau (Kachel)

### 3. Routing erweitern (App.tsx)

Zwei neue Routen hinzufuegen:
- `/players/:id/tournaments` --> `PlayerTournaments`
- `/players/:id/opponents` --> `PlayerOpponents`

## Technische Details

- Die bestehenden Hooks `usePlayerTournaments` und `usePlayerOpponents` werden wiederverwendet
- Die Filter-Logik ist rein clientseitig (einfacher `filter()` auf den geladenen Daten)
- Die `OpponentStats`-Komponente wird in der neuen Gegner-Seite wiederverwendet (Head-to-Head-Detail bei Klick bleibt erhalten)
- Keine Datenbank-Aenderungen noetig

