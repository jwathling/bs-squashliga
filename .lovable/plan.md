
# Löschbutton nur bei aktiven Turnieren anzeigen

## Zusammenfassung
Der Löschbutton wird nur bei aktiven (nicht beendeten) Turnieren angezeigt. Bei beendeten Turnieren wird er komplett ausgeblendet.

## Änderung

**Datei: `src/pages/TournamentLive.tsx`**

Der gesamte AlertDialog-Block für das Löschen (Zeilen 449-473) wird mit einer Bedingung `{!isCompleted && (...)}` umschlossen, sodass er nur angezeigt wird, wenn das Turnier noch nicht beendet ist.

**Vorher:**
```jsx
<AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
  ...
</AlertDialog>
```

**Nachher:**
```jsx
{!isCompleted && (
  <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
    ...
  </AlertDialog>
)}
```

## Ergebnis
- Aktive Turniere: Löschbutton sichtbar
- Beendete Turniere: Kein Löschbutton

---

## Technische Details

Die Variable `isCompleted` existiert bereits in der Komponente:
```typescript
const isCompleted = tournament.status === "completed";
```

Diese wird bereits verwendet, um andere Buttons (wie "Neue Runde" und "Turnier beenden") nur bei aktiven Turnieren anzuzeigen. Der gleiche Mechanismus wird nun auf den Löschbutton angewandt.
