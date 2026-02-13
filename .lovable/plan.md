

# Inaktive Spieler in der Rangliste

## Zusammenfassung
Spieler, die an keinem der letzten 5 abgeschlossenen Turniere teilgenommen haben, werden als "Inaktiv" markiert und standardmaessig aus der Rangliste ausgeblendet. Ein Toggle erlaubt es, sie wieder einzublenden.

## Funktionsweise

Die Inaktivitaet wird rein clientseitig berechnet -- keine Datenbank-Aenderungen noetig:

1. Die letzten 5 abgeschlossenen Turniere ermitteln (sortiert nach `completed_at`)
2. Fuer jedes Turnier die Teilnehmer aus `tournament_players` laden
3. Ein Spieler ist **aktiv**, wenn seine `player_id` in mindestens einem dieser 5 Turniere vorkommt
4. Alle anderen Spieler sind **inaktiv**

## Geplante Aenderungen

### 1. Neuer Hook: `src/hooks/useInactivePlayers.ts`
- Laedt die letzten 5 abgeschlossenen Turniere und deren Teilnehmer
- Gibt ein `Set<string>` mit den IDs inaktiver Spieler zurueck
- Wiederverwendbar auf der Spieler-Seite und der Startseite

### 2. Aenderung: `src/pages/Players.tsx`
- Neuer State `showInactive` (default: `false`)
- Toggle-Button/Switch neben der Suchleiste: "Inaktive anzeigen"
- Filtert inaktive Spieler aus, wenn `showInactive === false`
- Ranking-Nummern basieren nur auf den sichtbaren (aktiven) Spielern
- Anzeige im Header: z.B. "12 Spieler registriert (3 inaktiv)"

### 3. Aenderung: `src/components/players/PlayerCard.tsx`
- Neue optionale Prop `inactive?: boolean`
- Wenn inaktiv: Badge "Inaktiv" neben dem Namen, leicht abgedunkelte Darstellung (opacity)

### 4. Aenderung: `src/pages/Index.tsx` (Top Spieler)
- Top-Spieler-Liste auf der Startseite zeigt nur aktive Spieler

## Technische Details

### Hook-Logik (Pseudocode)
```text
function useInactivePlayers(allPlayers):
  // 1. Lade letzte 5 completed tournaments
  tournaments = query("tournaments", status=completed, order by completed_at desc, limit 5)
  
  // 2. Lade alle tournament_players fuer diese Turniere
  participantIds = query("tournament_players", tournament_id in tournamentIds).map(tp => tp.player_id)
  
  // 3. Set aus aktiven Spielern
  activeSet = new Set(participantIds)
  
  // 4. Inaktive = alle Spieler deren ID nicht in activeSet
  inactiveSet = allPlayers.filter(p => !activeSet.has(p.id))
  
  return { inactivePlayerIds: inactiveSet }
```

### Dateien-Uebersicht

| Datei | Aktion |
|-------|--------|
| `src/hooks/useInactivePlayers.ts` | Neuer Hook |
| `src/pages/Players.tsx` | Toggle + Filter-Logik |
| `src/components/players/PlayerCard.tsx` | Inaktiv-Badge + Styling |
| `src/pages/Index.tsx` | Top-Spieler nur aktive |

