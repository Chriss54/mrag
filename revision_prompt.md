# Revision Prompt — MaschineRAG

> Examiner-Verdict: ❌ FAIL — 3 P1-Blocker, 2 P2, 4 P3
> Kontext: 5-Stunden-Hackathon. Zeitbudget ist EXTREM knapp. Fixe nur was nötig ist. Kein Refactoring, kein Perfektionismus.

---

## Auftrag

Du bist Priya Sharma (Full-Stack AI Engineer) im **Fix-Modus**. Lies den `examiner_report.md` und fixe die Bugs in exakt dieser Reihenfolge. Stoppe nach jeder Prioritätsstufe und bestätige.

**Regeln:**
- Minimale Änderungen — so wenig Code wie möglich anfassen
- Kein Refactoring, keine neuen Features
- Wenn ein Fix mehr als 15 Minuten braucht, nimm den einfacheren Workaround
- Nach jedem Fix: `npm run build` zur Verifikation

---

## P1 — App-Breaking (MUSS sofort gefixt werden)

### Fix #1: Dokumentenliste permanent leer
**Datei:** `lib/ragie.ts` Zeile 55
**Bug:** `data.results` → Ragie API gibt `data.documents` zurück
**Fix:** Ändere `return data.results ?? [];` zu `return data.documents ?? [];`
**Aufwand:** 1 Zeile, 10 Sekunden

### Fix #2: Knowledge Store crasht auf Vercel (read-only Filesystem)
**Datei:** `lib/knowledge-store.ts`
**Bug:** `writeFileSync` funktioniert nicht auf Vercel Serverless (read-only FS)
**Fix (Hackathon-pragmatisch):** Ersetze den File-Store durch einen **In-Memory Store mit Fallback**:
- Behalte den File-Store für lokale Entwicklung (`process.env.NODE_ENV === "development"`)
- Für Production: nutze eine einfache `Map<string, KnowledgeCard>` im Speicher
- JA, das heißt die Wissensskarten gehen bei Cold-Start verloren — das ist OK für eine 5-Stunden-Demo
- Alternative falls mehr Zeit: Vercel KV oder Upstash Redis (aber das kostet Setup-Zeit)

### Fix #3: Upload-Timeout auf Vercel Hobby (25s > 10s Limit)
**Datei:** `app/api/upload/route.ts` Zeile 19
**Bug:** `maxWaitMs = 25000` überschreitet Vercel Hobby Function Timeout von 10 Sekunden
**Fix:**
1. Reduziere `maxWaitMs` auf `7000` (unter 10s Limit mit Puffer)
2. Reduziere das Polling-Intervall von `3000` auf `2000`ms
3. Wenn Indexierung nicht fertig → trotzdem Placeholder-Wissensskarte zurückgeben (macht der Code schon)
4. Das reicht — der Upload selbst funktioniert, nur die Wissensskarte kommt ggf. als Placeholder

---

## P2 — Degradiert (Fixe wenn P1 fertig UND Zeit übrig)

### Fix #4: Polling-Loop Reset
**Datei:** `app/page.tsx` Zeile 42
**Bug:** `documents` im useEffect Dependency-Array → Endlos-Reset des Intervals
**Fix:** Entferne `documents` aus dem Dependency-Array. Nutze `useRef` für den Check:
```typescript
const documentsRef = useRef(documents);
documentsRef.current = documents;

useEffect(() => {
  fetchDocuments();
  const interval = setInterval(() => {
    if (documentsRef.current.some((d) => d.status !== "ready" && d.status !== "failed")) {
      fetchDocuments();
    }
  }, 5000);
  return () => clearInterval(interval);
}, [fetchDocuments]);
```

### Fix #5: tailwindcss-animate fehlt
**Fix:** `npm install tailwindcss-animate` und in `tailwind.config.ts`:
```typescript
plugins: [require("tailwindcss-animate")],
```

---

## P3 — UX (NUR wenn noch Zeit nach P1 + P2)

### Fix #6: Upload-Status "uploading" wird nie gerendert
**Datei:** `components/UploadZone.tsx` Zeilen 33-39
**Bug:** `setStatus("processing")` wird vor `await fetch()` gesetzt → React batcht
**Fix:** Verschiebe Zeile 39 (`setStatus processing`) NACH `await fetch()` auf Zeile 44

### Fix #7: alert() für Delete-Fehler
**Datei:** `components/DocumentList.tsx`
**Fix:** Ersetze `alert(err.message)` durch `console.error(err)` + optional inline error state

### Fix #8: ESLint nicht konfiguriert
**Skip für Hackathon** — keine Zeit, kein Impact auf Demo

---

## Verifizierung nach allen Fixes

1. `npm run build` — muss sauber durchlaufen
2. `npm run dev` → Upload PDF → Dokumentenliste zeigt Dokument
3. Frage stellen → Antwort mit Quellenangabe
4. Wenn Vercel-Deploy geplant: `vercel --prod` testen

---

## WICHTIG: Zeitbudget

Maximale Fix-Zeit: **45 Minuten für alles**.
- P1: 20 Minuten (davon Fix #2 am aufwändigsten)
- P2: 15 Minuten
- P3: 10 Minuten (oder skippen)

Wenn P1 nach 30 Minuten nicht fertig ist → P2 und P3 skippen. Die App funktioniert lokal auch mit den P2/P3 Bugs.
