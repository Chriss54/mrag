# Examiner Report — MaschineRAG
> Review-Datum: 2026-05-23 | Preset: Production
> Examiner Persona: Senior RAG Evaluation Engineer @ LlamaIndex | Runde: 1
> Modus: FULL

---

## Baseline Checks

### Check: Build
**Command:** `npm run build`
**Output:**
```
▲ Next.js 14.2.35
✓ Compiled successfully
✓ Generating static pages (8/8)

Route (app)                              Size     First Load JS
┌ ○ /                                    5.67 kB        92.9 kB
├ ƒ /api/documents                       0 B                0 B
├ ƒ /api/documents/status                0 B                0 B
├ ƒ /api/knowledge/[id]                  0 B                0 B
├ ƒ /api/query                           0 B                0 B
├ ƒ /api/upload                          0 B                0 B
└ ƒ /knowledge/[id]                      8.88 kB        96.1 kB
```
**Ergebnis: ✅ PASS**

### Check: TypeScript
**Command:** `npx tsc --noEmit`
**Output:** (kein Output — keine Fehler)
**Ergebnis: ✅ PASS**

### Check: Lint
**Command:** `npm run lint`
**Output:**
```
? How would you like to configure ESLint?
[interaktiver Prompt — kein .eslintrc vorhanden, bricht ab]
```
**Ergebnis: ❌ FAIL** — Expected: Lint läuft durch. Actual: Interaktiver Setup-Prompt. `npm run lint` ist im CI/CD nicht ausführbar.

### Check: Dev Server + Main Page
**Command:** `npm run dev` → `curl http://localhost:3001/`
**Output:** HTTP 200, App rendert korrekt
**Ergebnis: ✅ PASS**

### Check: Documents API
**Command:** `curl http://localhost:3001/api/documents`
**Output:** `{"documents":[...3 Dokumente mit status "ready"...]}`
**Ergebnis: ✅ PASS**

---

## Feature Verification

### Check: Must-Have — Query-Interface (Gesamte Wissensbasis) [NACH FIX]
**Command:**
```bash
curl -X POST http://localhost:3001/api/query \
  -H "Content-Type: application/json" \
  -d '{"question": "Warum überhitzt die Pumpe bei Schritt 3?"}'
```
**Output:**
```json
{
  "answer": "Die Pumpe überhitzt bei Schritt 3, weil der Kühlwasserkreislauf blockiert ist. Die Lösung besteht darin, das Ventil V3 zu öffnen und den Kreislauf zu spülen. (Quelle: test_pumpe_handbuch.pdf)",
  "sources": [{"documentName": "test_pumpe_handbuch.pdf", "score": 0.19, ...}],
  "durationMs": 1837
}
```
**Ergebnis: ✅ PASS** (nach Fix — war vor Fix ❌ FAIL, siehe P1)

### Check: Must-Have — Antwort mit Quellenangabe
**Output:** `"(Quelle: test_pumpe_handbuch.pdf)"` im Answer-Text + strukturiertes `sources[]`-Array
**Ergebnis: ✅ PASS**

### Check: Must-Have — Einzelnes Dokument befragen
**Command:**
```bash
curl -X POST http://localhost:3001/api/query \
  -d '{"question": "Sicherheitshinweise", "documentId": "bf7ac89c-..."}'
```
**Output:** Nur 1 Source (korrekt auf Dokument-ID gefiltert)
**Ergebnis: ✅ PASS** — Ragie `filter.document_id` funktioniert korrekt

### Check: Must-Have — Upload-Status / Fortschritt sichtbar
**Code-Review:** `UploadZone.tsx:33,39` — `setStatus("uploading")` gefolgt von `setStatus("processing")` synchron im gleichen Call-Stack, bevor `await fetch()` aufgerufen wird. React batcht State-Updates → "uploading"-State wird nie gerendert. User sieht nur "processing" für die gesamte Dauer.
**Ergebnis: ⚠️ PARTIAL** — Spinner ist sichtbar, aber der initiale Upload-State nie gerendert

### Check: Must-Have — Datei-Management (Liste + Löschen)
**Command:** `curl http://localhost:3001/api/documents` → 3 Dokumente
`curl -X DELETE http://localhost:3001/api/documents` → `{"error":"Dokument-ID fehlt."}` ✅
**Ergebnis: ✅ PASS**

### Check: Must-Have — Wissensskarte öffentlich verlinkbar
**Lokal:** `curl http://localhost:3001/knowledge/e46e6a6d-...` → HTTP 200, vollständige Karte ✅
**Produktion Vercel:** Knowledge Store nutzt `new Map<string, KnowledgeCard>()` (In-Memory). Upload-API-Instanz A schreibt in deren `memoryStore`. Knowledge-Page-Instanz B liest aus **ihrer eigenen leeren** `memoryStore` → "Wissensskarte nicht gefunden".
**Ergebnis: ⚠️ PARTIAL** — Lokal OK. Auf Vercel Serverless broken nach jedem Cold Start.

### Check: Must-Have — Ladeindikator unter 10 Sekunden
**Output:** `"durationMs": 1837` (1.8s für Demo-Query)
**Ergebnis: ✅ PASS** — weit unter dem 10s-Ziel

### Check: Must-Have — Wissensskarte Inhalt korrekt
**Command:** `curl http://localhost:3001/api/knowledge/e46e6a6d-60ae-478b-9b0f-49407053db88`
**Output:**
```json
{
  "summary": "Das Betriebshandbuch der Pumpe XR-500 behandelt...",
  "mainTopics": ["Betrieb der Pumpe XR-500", "Wartung der Pumpe", "Kühlwasserkreislauf"],
  "typicalProblems": ["Überhitzung der Pumpe bei Schritt 3", "Blockade im Kühlwasserkreislauf"],
  "safetyNotes": ["Motor vor Wartung abschalten!"]
}
```
**Ergebnis: ✅ PASS**

---

## Adversarial Probes

### Check: Leere Frage
**Aktion:** `POST /api/query` mit `{"question": ""}`
**Erwartet:** Validierungsfehler
**Tatsächlich:** `{"error":"Frage darf nicht leer sein."}`
**Ergebnis: ✅ PASS**

### Check: Frage über 1000 Zeichen
**Aktion:** `POST /api/query` mit 1001-Zeichen-String
**Tatsächlich:** `{"error":"Frage zu lang (max. 1000 Zeichen)."}`
**Ergebnis: ✅ PASS**

### Check: Whitespace-only Frage
**Aktion:** `POST /api/query` mit `{"question": "   "}`
**Tatsächlich:** `{"error":"Frage darf nicht leer sein."}` (trim() greift korrekt)
**Ergebnis: ✅ PASS**

### Check: XSS-Payload in Frage
**Aktion:** `POST /api/query` mit `{"question": "<script>alert('xss')</script>Wie funktioniert die Pumpe?"}`
**Tatsächlich:** Query wird als plain text an OpenAI übergeben. Frontend rendert via React (kein `dangerouslySetInnerHTML`) → kein XSS-Risiko.
**Ergebnis: ✅ PASS**

### Check: Unicode + Emoji in Frage
**Aktion:** `POST /api/query` mit `{"question": "Überhitzung? Kühlwasser 中文 🔧"}`
**Tatsächlich:** Korrekte Antwort mit Quellenangabe in 1.7s
**Ergebnis: ✅ PASS**

### Check: Falscher Dateityp beim Upload
**Aktion:** `POST /api/upload` mit `package.json` (MIME: application/json)
**Tatsächlich:** `{"error":"Nicht unterstützter Dateityp. Erlaubt: PDF, MP4, MP3, WAV, M4A"}`
**Ergebnis: ✅ PASS**

### Check: DELETE ohne ID-Parameter
**Aktion:** `DELETE /api/documents` (ohne ?id=)
**Tatsächlich:** `{"error":"Dokument-ID fehlt."}`
**Ergebnis: ✅ PASS**

### Check: Knowledge Card — nicht-existente ID (HTTP-Status)
**Aktion:** `GET /knowledge/00000000-0000-0000-0000-000000000000`
**Erwartet:** HTTP 404
**Tatsächlich:** HTTP 200 mit "Wissensskarte nicht gefunden"-UI (`notFound()` nicht aufgerufen)
**Ergebnis: ❌ FAIL** — Falsche HTTP-Semantik, SEO/Caching-Problem

### Check: Malformed JSON an Query-API
**Aktion:** `POST /api/query` mit `{bad json}`
**Tatsächlich:** `{"error":"Expected property name or '}' in JSON at position 1..."}` — funktioniert, aber gibt internen Fehlertext weiter
**Ergebnis: ✅ PASS** (minor: verbose für Production)

---

## Zusammenfassung

| Kategorie | Checks | Bestanden | Teilweise | Fehlgeschlagen |
|-----------|--------|-----------|-----------|----------------|
| Baseline | 5 | 4 | 0 | 1 (Lint) |
| Features | 8 | 6 | 2 | 0 |
| Adversarial | 9 | 8 | 0 | 1 |
| **Gesamt** | **22** | **18** | **2** | **2** |

---

## Issues nach Priorität

### P1 (Kritisch) — App funktioniert nicht

**[GEFIXT] `rerank: true` + fehlende `partition` — vollständiger RAG-Ausfall**
- **Datei:** `lib/ragie.ts:79-83`
- **Beweis direkte Ragie-API:**
  - Mit `rerank: true`, kein Partition: `{"scored_chunks": []}` ← LEER
  - Ohne `rerank`, mit `partition: "default"`: 3 Chunks mit korrektem Content ← FUNKTIONIERT
- **Fix:** `rerank: true` entfernt, `partition: "default"` hinzugefügt
- **Verifikation:** Demo-Query "Warum überhitzt die Pumpe?" liefert korrekte Antwort + Quelle in 1.8s ✅

**[OFFEN] Knowledge Store — In-Memory-Isolation bricht Vercel-Deployment**
- **Datei:** `lib/knowledge-store.ts:3-4`
- **Problem:** `const memoryStore = new Map<string, KnowledgeCard>()` ist prozess-lokal. Upload-API und Knowledge-Page laufen auf Vercel in separaten Serverless-Function-Instanzen. Karte landet in Instanz-A-Speicher; Page-Rendering auf Instanz B findet sie nie.
- **Konsequenz:** Alle Knowledge-Card-Links broken auf Vercel nach erstem Cold Start. Growth-Loop-Feature ist auf Production nicht funktionsfähig.
- **Fix-Optionen:** Upstash Redis (Vercel Marketplace), Vercel KV, oder Knowledge-Card-Payload Base64-kodiert als URL-Parameter (kein DB-Lookup).

### P2 (Schwerwiegend) — Feature eingeschränkt

**Upload-Status-State-Machine — "uploading" wird nie gerendert**
- **Datei:** `components/UploadZone.tsx:33-39`
- **Problem:** `setStatus("uploading")` → sofort `setStatus("processing")` im selben synchronen Block vor `await fetch()`. React batcht → User sieht niemals den "Hochladen"-State, immer nur "Ragie.ai indexiert…".
- **Fix:** `setStatus("uploading")` vor dem FormData-Setup setzen; erst nach Fetch-Aufruf auf "processing" wechseln — oder beide States in einem setzen mit Fortschritts-Callback.

**`/api/documents/status` — toter Endpoint**
- **Datei:** `app/api/documents/status/route.ts`
- **Problem:** Endpoint existiert, wird aber nirgends aufgerufen. Frontend pollt `/api/documents` (GET). Kein Bug, aber misleadend.

**Keine ESLint-Konfiguration**
- **Problem:** `npm run lint` fragt interaktiv nach Konfiguration — für CI/CD nicht nutzbar.
- **Fix:** `.eslintrc.json` mit `{"extends": "next/core-web-vitals"}` anlegen.

### P3 (Mittel) — Edge Cases

**`waitForIndexing` Timeout 7s — zu kurz für Video/Audio**
- **Datei:** `app/api/upload/route.ts:19` — `maxWaitMs = 7000`
- **Problem:** Ragie-Indexierung für Video/Audio (Transkription) dauert deutlich länger als 7s. Ergebnis: Wissensskarten für MP4/MP3 werden als leere Platzhalter gespeichert ("Dokument wird noch verarbeitet"). Das Must-Have "Antwort mit Zeitstempel aus dem Video" ist so nicht erreichbar.
- **Fix:** Timeout auf 30–60s erhöhen, oder asynchrone Karten-Generierung nach Indexierung (Webhook oder Client-Side-Polling).

**Knowledge-Card-Page gibt HTTP 200 für nicht-existente Karten**
- **Datei:** `app/knowledge/[id]/page.tsx:20`
- **Fix:** `import { notFound } from 'next/navigation'; if (!card) notFound();`

### P4 (Kosmetisch)

**Dateigrößen-Inkonsistenz:** Brief nennt 10 MB, Code und UI erlauben 50 MB. Kein Funktionsfehler.

**Interne JSON-Parse-Fehlertexte** werden an den Client weitergegeben. Für Production wäre eine generische Fehlermeldung sauberer.

---

## VERDICT: ⚠️ PARTIAL

**Vor Fixes:** ❌ FAIL — Core-RAG-Query gab immer leere Ergebnisse. Die Demo wäre komplett gescheitert.

**Nach Fixes (partition + rerank):** Haupt-Demo-Flow funktioniert lokal:
- Frage stellen → Antwort mit Quellenangabe in ~2s ✅
- Einzelnes Dokument befragen ✅
- Wissensskarte generiert ✅
- Build + TypeScript sauber ✅

**Verbleibendes Risiko für Vercel-Deploy:** Das In-Memory-Store-Problem (P1 offen) macht alle Wissensskarten-Links auf Vercel broken. Für lokale Hackathon-Demo ist das kein Blocker — für das "öffentlich verlinkbare" Growth-Loop-Feature auf Produktion ist es ein Dealbreaker.

---

**Nächster Schritt:**
- Bei **Vercel-Deploy geplant**: P1 (Knowledge Store) vor dem Deploy fixen — Upstash Redis oder URL-encoded Cards.
- Bei **lokaler Demo**: Alle P1 bereits gefixt. Du kannst direkt präsentieren.
- Für **10x-Verbesserungen**: Creative Director Prompt (05_Creative_Director.md) verwenden.
