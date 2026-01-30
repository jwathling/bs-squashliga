
# Turnierdatum mit Bearbeitung und Countdown auf der Startseite

## Zusammenfassung

1. Beim Erstellen eines Turniers muss ein Datum angegeben werden (Pflichtfeld, Standard: heute)
2. Auf der Startseite erscheint ein prominenter Hinweis auf das nachste geplante Turnier
3. Das Turnierdatum ist bearbeitbar, solange das Turnier nicht abgeschlossen ist

## Anderungen

### 1. Datenbank-Migration

Neue Spalte `scheduled_date` in der `tournaments`-Tabelle:

| Spalte | Typ | Standard | Nullable |
|--------|-----|----------|----------|
| `scheduled_date` | `date` | `CURRENT_DATE` | Nein |

```sql
ALTER TABLE tournaments
ADD COLUMN scheduled_date date NOT NULL DEFAULT CURRENT_DATE;
```

### 2. Frontend-Anderungen

**Datei: `src/hooks/useTournaments.ts`**

- Interface `Tournament` um `scheduled_date: string` erweitern
- `useCreateTournament`: neuen Parameter `scheduledDate` hinzufugen
- Neuer Hook `useUpdateTournamentDate`: zum Andern des Datums bei aktiven Turnieren

**Datei: `src/components/tournaments/CreateTournamentForm.tsx`**

- State fur ausgewahltes Datum (Standard: heute)
- DatePicker mit Popover und Calendar hinzufugen
- Datum beim Erstellen mitsenden

**Datei: `src/components/tournaments/TournamentCard.tsx`**

- Props um `scheduledDate` erweitern
- Anzeige von `scheduled_date` statt `created_at`

**Datei: `src/pages/Index.tsx`**

- Neuer Abschnitt direkt nach dem Hero: "Nachstes Turnier"-Banner
- Logik: Finde das nachste Turnier mit `scheduled_date >= heute` und `status = active`
- Zeige Turniername, Datum und Link

**Datei: `src/pages/TournamentLive.tsx`**

- Datum-Anzeige im Header
- Bearbeitungs-Button (nur wenn nicht abgeschlossen)
- Dialog/Popover zum Andern des Datums

### 3. UI-Konzepte

**Startseite - Nachstes Turnier Banner:**

```text
+--------------------------------------------------+
|  Nachstes Turnier                                |
|  Freitagsturnier - 07. Feb 2026                  |
|                                    [Zum Turnier] |
+--------------------------------------------------+
```

Wird nur angezeigt wenn ein zukunftiges oder heutiges aktives Turnier existiert.

**Turnier-Live-Seite - Datum bearbeiten:**

```text
+-----------------------------------------------+
| <- | Freitagsturnier     [Live]               |
|    | 07.02.2026 (Bearbeiten)  | 3/6 Spiele    |
+-----------------------------------------------+
```

Der "(Bearbeiten)"-Link offnet einen DatePicker-Popover.

### 4. Betroffene Dateien

| Datei | Aktion |
|-------|--------|
| Datenbank-Migration | Neue Spalte `scheduled_date` |
| `src/hooks/useTournaments.ts` | Interface + Hooks erweitern |
| `src/components/tournaments/CreateTournamentForm.tsx` | DatePicker hinzufugen |
| `src/components/tournaments/TournamentCard.tsx` | scheduledDate anzeigen |
| `src/pages/Index.tsx` | Nachstes-Turnier-Banner |
| `src/pages/TournamentLive.tsx` | Datum-Bearbeitung |
| `src/pages/Tournaments.tsx` | scheduledDate an TournamentCard ubergeben |
