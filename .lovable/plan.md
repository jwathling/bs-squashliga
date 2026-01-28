

# Gleichmäßige Spielverteilung im Round-Robin Scheduler

## Problem-Analyse

Bei 6 Spielern (15 Spiele) spielt Ron erst ab Spiel 7. Er hat 6 Spiele Pause am Anfang, während andere Spieler früher und öfter drankommen. Der aktuelle Algorithmus verhindert nur Back-to-Back, achtet aber nicht auf Fairness.

**Aktueller Spielplan (aus Screenshot):**
```text
Spiel 1: Jonny-Jan
Spiel 2: Freddy-Fin
Spiel 3: Jonny-Mitze
Spiel 4: Jan-Freddy
Spiel 5: Jonny-Fin
Spiel 6: Jan-Mitze
Spiel 7: Jonny-Ron ← Ron spielt erst hier!
...
```

**Problem:** Ron hat 6 Spiele Pause, andere spielen viel häufiger.

---

## Lösung: Pausenzeit-Balance

Der Algorithmus muss nicht nur Back-to-Back vermeiden, sondern auch priorisieren, dass Spieler mit längerer Pause bevorzugt drankommen.

### Neues Scoring-System

Statt nur zu prüfen "war dieser Spieler gerade dran?", wird gezählt "wie viele Spiele ist dieser Spieler schon pausiert?".

**Neue Bewertungskriterien:**
1. **Back-to-Back vermeiden** (weiterhin Priorität 1)
2. **Spieler mit längster Pause bevorzugen** (neu)

### Technischer Ansatz

```text
Algorithmus-Änderungen:

1. Tracking der Pausenzeiten:
   - Für jeden Spieler: "matchesSinceLastGame" zählen
   - Nach jedem Match: Zähler für alle nicht-spielenden erhöhen
   - Für spielende Spieler: Zähler auf 0 setzen

2. Neues Match-Scoring:
   - Alte Methode: Score = 2 - (Anzahl Spieler aus letztem Match)
   - Neue Methode: Score = Summe der Pausenzeiten beider Spieler
     (falls kein Back-to-Back möglich)
   
3. Match-Auswahl:
   - Zunächst: Alle Matches ohne Back-to-Back filtern
   - Dann: Match mit höchster kombinierter Pausenzeit wählen
   - Falls nötig: Look-ahead für Konfliktfreiheit
```

---

## Erwartete Verbesserung

**6 Spieler - Ideal verteilt:**
```text
Jeder Spieler sollte ca. alle 2-3 Spiele drankommen
(15 Spiele / 6 Spieler = jeder spielt 5x)
Optimale Pause zwischen Spielen: ~2 Spiele
```

**Statt:**
- Ron: Pause 6, dann 4x Pause 1
  
**Besser:**
- Alle Spieler: Pausenzeiten zwischen 1-3 Spielen

---

## Implementierungsdetails

### Datei: `src/lib/matchScheduler.ts`

**Neue Datenstruktur:**
```typescript
// Track wie lange jeder Spieler pausiert hat
const playerIdleTime: Map<string, number> = new Map();
for (const id of playerIds) {
  playerIdleTime.set(id, 0);
}
```

**Angepasste Bewertungsfunktion:**
```typescript
function scoreMatch(
  pairing: [string, string],
  lastPlayers: Set<string>,
  idleTime: Map<string, number>
): { isBackToBack: boolean; idleScore: number } {
  const [p1, p2] = pairing;
  const isBackToBack = lastPlayers.has(p1) || lastPlayers.has(p2);
  const idleScore = (idleTime.get(p1) || 0) + (idleTime.get(p2) || 0);
  return { isBackToBack, idleScore };
}
```

**Angepasste Match-Auswahl:**
1. Alle Matches ohne Back-to-Back sammeln
2. Unter diesen: Das mit höchstem idleScore wählen
3. Falls alle Back-to-Back: höchsten idleScore unter allen wählen
4. Look-ahead für Konfliktfreiheit am Ende beibehalten

**Nach Match-Auswahl:**
```typescript
// Idle-Zeit aktualisieren
for (const [id, time] of idleTime) {
  if (id === selected[0] || id === selected[1]) {
    idleTime.set(id, 0); // Spieler hat gespielt
  } else {
    idleTime.set(id, time + 1); // Spieler pausiert weiter
  }
}
```

---

## Beispiel-Ablauf (6 Spieler: A, B, C, D, E, F)

```text
Start: Alle idle=0
Spiel 1: A-B gewählt (idle jeweils 0) → C,D,E,F idle=1
Spiel 2: C-D gewählt (idle je 1, Summe=2) → E,F idle=2, A,B idle=1
Spiel 3: E-F gewählt (idle je 2, Summe=4) → A,B,C,D idle=2
Spiel 4: A-C gewählt (idle je 2) → B,D,E,F idle=1 oder 3
...
```

---

## Betroffene Dateien

- `src/lib/matchScheduler.ts`

## Look-Ahead Anpassung

Der Look-ahead für Back-to-Back-Vermeidung am Ende bleibt bestehen, wird aber mit dem neuen Idle-Time-Scoring kombiniert.

## Hinweis

Bestehende Turniere müssen gelöscht und neu erstellt werden, um den verbesserten Spielplan zu generieren.

