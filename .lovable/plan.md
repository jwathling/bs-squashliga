

# Turnierplan sofort bei Planung anzeigen

## Idee
Statt nur ein Bearbeitungsformular zu zeigen, wird auf der "Geplant"-Seite direkt der generierte Spielplan (Match-Reihenfolge) angezeigt. Die Matches werden dabei nicht in der Datenbank gespeichert, sondern live im Frontend berechnet -- basierend auf den aktuell ausgewaehlten Spielern.

## Ablauf

1. Spieler werden ausgewaehlt/geaendert
2. Der Matchplan wird sofort im Frontend berechnet (mit `generateRoundSchedule`)
3. Der Plan wird als Vorschau angezeigt (Reihenfolge der Spiele)
4. Erst beim "Turnier starten" werden die Matches tatsaechlich in die Datenbank geschrieben (wie bisher)

## Vorteile
- Keine Nachteile: Die Matches werden nur als Vorschau generiert, nicht gespeichert
- Spielerliste kann weiterhin frei geaendert werden -- der Plan aktualisiert sich automatisch
- Man sieht sofort, wie das Turnier ablaufen wird

## Aenderungen

### 1. Neue Komponente: `MatchSchedulePreview`
- Nimmt eine Liste von Spieler-IDs entgegen
- Ruft `generateRoundSchedule()` auf und zeigt die geplanten Paarungen als Liste an
- Zeigt Spielnummer, Spieler 1 vs. Spieler 2
- Braucht Zugriff auf die Spielernamen (aus `usePlayers`)

### 2. `TournamentEditForm` erweitern
- Unterhalb der Spielerauswahl die `MatchSchedulePreview` einbinden
- Zeigt den Plan nur an, wenn mindestens 2 Spieler ausgewaehlt sind
- Aktualisiert sich automatisch bei Aenderung der Spielerauswahl

### 3. Design der Vorschau
- Einfache nummerierte Liste der Paarungen
- Kompaktes Layout, passend zum bestehenden Design
- Ueberschrift z.B. "Spielplan-Vorschau" mit Info, dass sich der Plan bei Spieleraenderung aktualisiert

## Technische Details

- `generateRoundSchedule(playerIds, 1)` wird direkt im Frontend aufgerufen (keine DB-Aenderung)
- Die Spielernamen werden aus dem bereits geladenen `allPlayers`-Array gemappt
- Keine Datenbankschema-Aenderungen noetig
- Beim "Turnier starten" bleibt der bisherige Flow unveraendert (Matches werden dann in die DB geschrieben)

