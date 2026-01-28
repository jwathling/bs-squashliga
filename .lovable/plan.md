

# Verbesserung des Match-Scheduling-Algorithmus

## Problem-Zusammenfassung
Bei 5 Spielern spielt Ron in Spiel 9 und 10 hintereinander. Der Greedy-Algorithmus wählt immer das "beste" nächste Spiel, plant aber nicht voraus.

## Bestehende Funktionalität
Der Runden-Übergang ist bereits implementiert (`generateAdditionalRound` mit `lastMatchPlayers` Parameter). Das erste Spiel einer neuen Runde berücksichtigt bereits die Spieler des letzten Spiels der vorherigen Runde.

---

## Lösung: Look-Ahead Optimierung

### Datei: `src/lib/matchScheduler.ts`

**1. Neue Hilfsfunktion `wouldCauseBackToBack`:**
Prüft rekursiv, ob die verbleibenden Spiele ohne Back-to-Back-Konflikte angeordnet werden können.

**2. Verbesserte `optimizeMatchOrder` Funktion:**
- Sammelt alle Kandidaten mit gleichem Score
- Bei wenigen verbleibenden Spielen: simuliert Auswirkungen jeder Wahl
- Wählt den Kandidaten, der am Ende keine Back-to-Back-Situation verursacht

---

## Technische Details

```text
Algorithmus-Ablauf:
1. Finde alle Spiele mit bestem Score (keine Spieler aus letztem Match)
2. Falls mehrere gleichwertig UND ≤4 Spiele übrig:
   → Für jeden Kandidaten simulieren: führt diese Wahl zu Back-to-Back am Ende?
   → Wähle Kandidat ohne Back-to-Back-Folge
3. Ansonsten: wähle ersten besten Kandidaten (wie bisher)
```

**`wouldCauseBackToBack` Funktion:**
```text
- Wenn nur 1 Spiel übrig: prüfe ob einer der Spieler gerade gespielt hat
- Sonst: rekursiv prüfen ob es einen Pfad ohne Konflikte gibt
- Gibt true zurück wenn Back-to-Back unvermeidbar
```

---

## Erwartetes Ergebnis

**5 Spieler - Vorher:**
```text
9. Jan vs Ron
10. Mitze vs Ron ← Ron spielt 2x hintereinander
```

**5 Spieler - Nachher:**
```text
Optimierte Reihenfolge ohne aufeinanderfolgende Spiele
```

**Runden-Übergang funktioniert weiterhin:**
- Letztes Spiel Runde 1: z.B. Jan vs Mitze
- Erstes Spiel Runde 2: keiner von beiden spielt

---

## Betroffene Dateien
- `src/lib/matchScheduler.ts`

## Hinweis
Das bestehende Test-Turnier muss gelöscht und neu erstellt werden, damit der neue Spielplan generiert wird.

