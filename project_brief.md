# Project Brief — MaschineRAG
> Erstellt: 2026-05-23 | Preset: Production

## 0. Project Configuration

### Project Type: Hybrid
> Web-App (Query-Interface, Upload-UI) + Automation (Ragie.ai Ingestion-Pipeline, OpenAI Chat-Layer)

### Quality Preset: Production
> Solide & vollständig. Funktioniert live vor Publikum ohne Abstürze. Gutes Design, klarer Error-Feedback, responsiv. Der Happy Path muss in unter 10 Sekunden sitzen. Kein Perfektionismus — aber auch kein Roulette.

### Expert Team (Der Kreis der Exzellenz)

**Student (Builder):** Priya Sharma — Full-Stack AI Engineer, Stanford AI Lab, Spezialisierung in multimodalen RAG-Systemen, Document Intelligence und LLM-Integrationen
> Warum: Kennt sowohl die Ingestion-Pipeline als auch das Frontend-UX für Knowledge-Apps aus eigener Forschung.

**Examiner (Quality Gate):** Senior RAG Evaluation Engineer bei LlamaIndex — tiefe Expertise in Retrieval-Qualität, Chunking-Strategien, Halluzinations-Detection und End-to-End RAG-Pipelines
> Warum: RAG-Systeme scheitern meistens an subtilen Retrieval-Fehlern — dieser Examiner kennt genau diese Fallstricke.

**Creative Director (Visionary):** Andrej Karpathy — "Software 2.0"-Philosophie: AI-Systeme sollen sich anfühlen wie natürliche Erweiterung des Denkens, nicht wie ein Tool
> Warum: Ein multimodales RAG-System sollte sich mühelos anfühlen — Karpathys Obsession mit AI-native UX ist der richtige Nordstern.

**Revision Agent:** Erbt die Student-Persona (Priya Sharma) im Fix-Modus.

---

## 1. Vision

Ein multimodales RAG-System für Maschinenbauer, das Stillstandskosten und Einarbeitungsaufwand drastisch reduziert. Techniker laden PDFs (Handbücher, Schaltpläne), Videos (Montage-Anleitungen, Fehlerdiagnosen) und Audionotizen hoch — und erhalten sofort präzise Antworten aus der gesamten Wissensbasis, mit Quellenangabe.

**Kern-Demo:** Maschine steht still → Techniker öffnet Web-App → stellt Frage in natürlicher Sprache → bekommt Antwort mit Quellenangabe aus Handbuch / Schulungsvideo / Audionotiz.

**Hackathon-Ziel:** Diesen Flow live vor Publikum demonstrieren. Wenn das sitzt, haben wir gewonnen.

---

## 2. Target Audience

**Primär:** Techniker und Wartungsingenieure im Maschinenbau
- Stehen direkt an der Maschine (Hallenboden, Tablet/Smartphone)
- Haben keine Zeit für langes Suchen
- Brauchen sofortige, korrekte Antworten

**Sekundär:** Ingenieure und Vorgesetzte im Büro (Desktop)
- Verwalten das Wissensarchiv
- Laden neue Dokumente hoch

---

## 3. Functional Requirements

### Must-Haves
- [ ] Upload: PDF (bis 10 MB), Video (MP4), Audio (MP3), Voice Notes
- [ ] Ragie.ai verarbeitet & indexiert alle Dateitypen automatisch (multimodal)
- [ ] Upload-Status / Verarbeitungs-Fortschritt sichtbar (Spinner/Statusanzeige)
- [ ] Datei-Management: Liste aller hochgeladenen Dokumente, Löschfunktion
- [ ] Query-Interface: Freitextfrage gegen die gesamte Wissensbasis
- [ ] Individuelles Befragen: Einzelne Datei auswählen und isoliert abfragen
- [ ] Antwort mit Quellenangabe (Dateiname, bei Video/Audio: Zeitstempel)
- [ ] Ladeindikator während der Antwortgenerierung (unter 10 Sekunden Ziel)

### Nice-to-Haves
- [ ] Login / Authentifizierung (Firebase Auth, für spätere Version)
- [ ] Mehrsprachige Queries (DE/EN)
- [ ] Antwort-History / Chat-Verlauf innerhalb einer Session

---

## 4. User Flows

### Haupt-Flow (Demo-kritisch)
1. Techniker öffnet Web-App im Browser
2. Lädt Datei(en) hoch — Drag & Drop oder File-Picker (PDF / MP4 / MP3)
3. App zeigt Upload- und Verarbeitungsstatus (Ragie.ai Indexierung)
4. Techniker wählt: *Alle Dokumente befragen* oder *spezifische Datei auswählen*
5. Gibt Frage in natürlicher Sprache ein (z.B. "Warum überhitzt die Pumpe bei Schritt 3?")
6. System liefert Antwort mit Quellenangabe (Dateiname + ggf. Zeitstempel)

---

## 5. Design & UX

- **Stil:** Industriell & robust — klare, funktionale UI ohne Schnörkel. Wirkt wie ein professionelles Werkzeug, nicht wie eine Consumer-App.
- **Farben:** BMW-Designsprache — tiefes Blau (`#003399`), Reines Weiß (`#FFFFFF`), Akzent Hellblau (`#0066CC`), Neutral Grau (`#F5F5F5`)
- **Typographie:** Sans-Serif, gut lesbar auch auf kleinen Screens unter Hallenlichtverhältnissen
- **Responsive:** Mobile/Tablet-first (Techniker auf dem Hallenboden), Desktop für Büro-Nutzung
- **UX-Prinzip:** Zero-Ambiguity — jeder Status ist sichtbar, jede Aktion hat sofortiges Feedback
- **Referenzen:** BMW ConnectedDrive UI, industrielle Dashboards, Linear.app (Klarheit)

---

## 6. Tech Stack

- **Frontend:** Next.js 14+ (App Router), React, Tailwind CSS
- **API Layer:** Next.js API Routes (kein separates Backend nötig)
- **RAG Pipeline:** Ragie.ai — Upload, Chunking, multimodales Indexieren, Retrieval
- **Chat Layer:** OpenAI GPT-4o — Antwortgenerierung auf Basis der Ragie-Chunks
- **Auth:** Keine (Demo-Modus, kein Login)
- **Hosting:** Vercel (Hobby Tier) — ein Push = deployed
- **Externe APIs:** Ragie.ai, OpenAI API

---

## 7. Success Criteria

- [ ] PDF hochladen → Ragie.ai indexiert → Frage stellen → korrekte Antwort MIT Quellenangabe
- [ ] Video (MP4) hochladen → Frage stellen → Antwort mit Zeitstempel aus dem Video
- [ ] Audio (MP3) hochladen → Frage stellen → Antwort mit Quellenangabe
- [ ] Antwortzeit unter 10 Sekunden (Ladeindikator während Generierung)
- [ ] App läuft stabil durch die komplette Live-Demo ohne Crash

---

## 8. Dealbreakers

- Antwort ohne Quellenangabe → sieht aus wie halluziniert, sofort disqualifiziert
- Upload schlägt fehl oder hängt → Demo-Flow unterbrochen
- App crashed während der Live-Demo → Game Over
- Ladezeit über 15 Sekunden ohne Feedback → Publikum verliert Vertrauen

---

## 9. References

- **Ragie.ai Docs:** https://www.ragie.ai/
- **Design-Referenz:** BMW ConnectedDrive UI (industriell, blau/weiß, präzise)
- **UX-Referenz:** Linear.app (Klarheit, Zero-Ambiguity)
- **RAG-Pattern:** Ragie.ai für Retrieval + OpenAI GPT-4o für Generation (RAG-Fusion Pattern)

---

## 10. Zeitbudget & Prioritäten (Hackathon-spezifisch)

**Gesamtbudget:** 5 Stunden

| Priorität | Feature | Geschätzte Zeit |
|-----------|---------|----------------|
| P0 | Ragie.ai Setup + Upload-Flow (PDF) | 1h |
| P0 | Query-Interface + OpenAI Integration | 1h |
| P0 | Antwort mit Quellenangabe | 30min |
| P1 | Video + Audio Upload | 45min |
| P2 | UI-Polish (BMW-Stil, Responsive) | 1h |
| P3 | Nice-to-Haves | falls Zeit übrig |

**Regel:** Wenn P0 sitzt und Zeit fehlt, P1 kürzen — niemals P0 halbfertig lassen.
