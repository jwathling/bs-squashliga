
# Turnier-Bearbeitung vor dem Start

## Zusammenfassung
Einführung eines "Geplant"-Status für Turniere, bei dem Name, Datum und Teilnehmer noch frei bearbeitbar sind. Erst beim expliziten Starten werden die Matches generiert.

## Vorteile dieses Ansatzes

| Aspekt | Vorteil |
|--------|---------|
| Flexibilität | Teilnehmer können bis zum Turnierstart beliebig geändert werden |
| Einfachheit | Keine komplizierte Match-Neugenerierung nötig |
| Klarheit | Drei klare Status: Geplant -> Aktiv -> Beendet |

## Geplante Änderungen

### 1. Datenbank-Änderung
- Neuer Status-Wert `planned` für Turniere hinzufügen (neben `active` und `completed`)
- Bestehende Logik bleibt unberührt

### 2. Neue Hooks in `useTournaments.ts`
- `useUpdateTournamentName`: Turniername ändern
- `useUpdateTournamentPlayers`: Spieler hinzufügen/entfernen (nur bei Status "planned")
- `useStartTournament`: Matches generieren und Status auf "active" setzen

### 3. Neue Seite: Turnier-Bearbeitungsseite
Eine separate Bearbeitungsseite (oder Dialog) für geplante Turniere mit:
- Textfeld für Turniernamen
- Kalender für Datum (bereits vorhanden)
- Spieler-Auswahl mit Checkboxen (ähnlich wie bei Turniererstellung)
- "Turnier starten" Button

### 4. Anpassung CreateTournamentForm
- Status `planned` statt `active` bei Erstellung
- Keine Matches bei Erstellung generieren
- Keine `total_tournaments` Erhöhung bei Erstellung

### 5. Anpassung TournamentLive.tsx
- Unterscheidung zwischen "geplant" und "aktiv"
- Bei geplanten Turnieren: Bearbeitungs-UI statt Match-Ansicht
- "Turnier starten" Button für geplante Turniere

### 6. UI-Anpassungen
- Badge-Farben: Geplant (blau/outline), Aktiv (grün), Beendet (grau)
- Tabs in Turnierübersicht: Geplant, Aktiv, Beendet

## Ablauf

```text
+------------------+     +-----------------+     +------------------+
|  Turnier planen  | --> | Turnier starten | --> | Turnier beenden  |
+------------------+     +-----------------+     +------------------+
        |                        |                       |
   Status: planned          Status: active         Status: completed
   - Name bearbeitbar       - Matches generiert    - Alles gesperrt
   - Datum bearbeitbar      - Scores eintragen     - Nur Ansicht
   - Spieler bearbeitbar    - Runden hinzufügen
   - Keine Matches
```

---

## Technische Details

### Neue TypeScript-Typen
```typescript
// Status erweitert
type TournamentStatus = "planned" | "active" | "completed";
```

### Neue Mutation: useStartTournament
```typescript
export function useStartTournament() {
  return useMutation({
    mutationFn: async (tournamentId: string) => {
      // 1. Hole alle Turnier-Spieler
      // 2. Generiere Round-Robin Matches
      // 3. Erhöhe total_tournaments für jeden Spieler
      // 4. Setze Status auf "active"
    }
  });
}
```

### Neue Mutation: useUpdateTournamentPlayers
```typescript
export function useUpdateTournamentPlayers() {
  return useMutation({
    mutationFn: async ({ 
      tournamentId, 
      playerIds 
    }: { 
      tournamentId: string; 
      playerIds: string[] 
    }) => {
      // 1. Lösche alle bestehenden tournament_players
      // 2. Füge neue tournament_players hinzu
      // Nur bei status === "planned" erlaubt
    }
  });
}
```

### Bearbeitungs-Komponente
Eine neue Komponente `TournamentEditForm` mit:
- Ähnlichem Layout wie `CreateTournamentForm`
- Vorausgefüllten Werten
- Speichern einzelner Felder oder gesamtes Formular
