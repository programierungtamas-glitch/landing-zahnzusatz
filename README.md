# Landing Page Zahnzusatz – Inbetriebnahme

Die Seite besteht aus zwei Teilen: der `index.html` (läuft überall) und den
**Server-Funktionen** im Ordner `functions/`:

| Datei | Endpunkt | wofür |
|---|---|---|
| `functions/api/lead.js` | `POST /api/lead` | Antrag und Rückruf per E-Mail an dich |
| `functions/api/chat.js` | `POST /api/chat` | der KI-Chat unten rechts |
| `functions/_middleware.js` | `/ro` `/hu` `/de` | ein eigener Link je Sprache |

---

## Die drei Links zum Verschicken

Sobald die Seite online ist, hast du für jede Sprache einen eigenen Link:

| Sprache | Link | für wen |
|---|---|---|
| Rumänisch | `https://DEINE-DOMAIN/ro` | rumänischsprachige Kunden |
| Ungarisch | `https://DEINE-DOMAIN/hu` | ungarischsprachige Kunden |
| Deutsch | `https://DEINE-DOMAIN/de` | deutschsprachige Kunden |

Der Kunde landet sofort in der richtigen Sprache, auch wenn sein Handy auf etwas
anderes eingestellt ist. Umschalten kann er oben trotzdem.

**Warum eine eigene Funktion und nicht einfach `?lang=hu`:** `?lang=hu` funktioniert
ebenfalls, aber WhatsApp und Facebook führen beim Einlesen eines Links kein JavaScript
aus. In der Vorschau stünde dann immer der rumänische Titel, egal welchen Link du
verschickst. `functions/_middleware.js` schreibt Titel, Beschreibung und Sprache schon
auf dem Server um – die WhatsApp-Vorschau ist also in der Sprache des Links.

Die Adresse ohne Zusatz (`https://DEINE-DOMAIN/`) bleibt wie bisher: sie nimmt die
Sprache des Browsers, sonst Rumänisch.

Die Vorschautexte (Titel und Beschreibung, die bei WhatsApp unter dem Link stehen)
stehen oben in `functions/_middleware.js` im Block `META`.

---

**Wichtig:** Die Funktionen laufen nur, wenn die Seite auf einem Server liegt.
Öffnest du die `index.html` per Doppelklick oder in einer Vorschau, gibt es keine
`/api/…`-Adresse – deshalb sagt der Chat dort „Gerade kann ich nicht frei antworten"
und fällt auf die festen Fragen zurück. Das ist kein Fehler, sondern der eingebaute
Rückfallweg.

---

## Weg 1 · Online stellen (empfohlen, ~10 Minuten)

### 1. Repo anlegen

Auf github.com ein neues Repository anlegen (Private reicht), zum Beispiel
`landing-zahnzusatz`. Dann im Browser **Add file → Upload files** und den kompletten
Ordner hineinziehen – samt `functions/` und `unterlagen/`.

Oder per Kommandozeile:

```bash
cd landing-zahnzusatz
git init
git add .
git commit -m "Landing Page Zahnzusatz"
git branch -M main
git remote add origin https://github.com/<DEIN-USER>/landing-zahnzusatz.git
git push -u origin main
```

### 2. Cloudflare Pages

1. dash.cloudflare.com → **Workers & Pages** → **Create** → **Pages** → **Connect to Git**
2. Repository auswählen
3. Framework preset **None**, Build command **leer**, Build output directory **`/`**
4. **Save and Deploy**

Nach etwa 30 Sekunden läuft die Seite unter `https://<projektname>.pages.dev`.

### 3. KI-Chat einschalten

Im Pages-Projekt:

1. **Settings → Functions → Bindings → Add binding**
2. Typ: **Workers AI**
3. Variable name: **`AI`** – genau so geschrieben, sonst findet die Funktion das Modell nicht
4. Speichern
5. **Deployments → Retry deployment** (sonst kennt die Funktion das Binding noch nicht)

Kein API-Schlüssel nötig. Kostenlos sind 10.000 Neurons pro Tag, danach 0,011 USD je
1.000 Neurons. Das Kontingent setzt sich täglich um 00:00 UTC zurück.

### 4. Lead-Mails einschalten

**Settings → Environment variables**, für Production *und* Preview:

| Variable | Wert | Typ |
|---|---|---|
| `RESEND_API_KEY` | `re_…` von resend.com | Secret |
| `LEAD_TO` | deine Mailadresse für Leads | Text |
| `LEAD_FROM` | `Leads <lead@deine-domain.de>` | Text |

Danach wieder **Retry deployment**.

### 5. Ausprobieren

Seite unter `…pages.dev` öffnen, unten rechts auf die grüne Blase tippen und etwas
fragen, zum Beispiel:

- „Zahlt ihr auch, wenn mir schon ein Zahn fehlt?"
- „Mein Sohn braucht eine Zahnspange, geht das noch?"
- „Was kostet das bei mir?" → der Bot darf keinen Preis nennen und verweist auf den
  Rechner. Wenn er doch einen nennt, sag mir Bescheid.

Logs zur Fehlersuche: Pages-Projekt → **Functions → Real-time Logs**.

---

## Weg 2 · Vorher lokal testen

Du brauchst Node.js und einen Cloudflare-Account.

```bash
cd landing-zahnzusatz
npx wrangler login          # einmalig, öffnet den Browser
npx wrangler pages dev . --ai AI
```

Dann im Browser `http://localhost:8788` öffnen. Der Chat läuft damit gegen die echte
Cloudflare-KI, es wird also vom Tageskontingent abgezogen.

Die Lead-Mails gehen lokal nur, wenn du die Variablen mitgibst:

```bash
npx wrangler pages dev . --ai AI \
  --binding RESEND_API_KEY=re_… LEAD_TO=du@example.de "LEAD_FROM=Leads <lead@example.de>"
```

---

## Was noch fehlt, bevor es scharf geht

- [ ] Die vier PDFs in `unterlagen/` einsetzen – siehe `unterlagen/README.txt`.
      Ohne sie laufen die Links in Antragsschritt 5 ins Leere.
- [ ] Portraitfoto statt des goldenen „T" (Hero, Über-mich, Chat-Kopf)
- [ ] Original-Logo-SVG aus der KFZ-Seite einsetzen
- [ ] `og-image.jpg` (1200×630) und die `og:url` in der `index.html` auf die echte Domain
- [ ] Impressum und Datenschutz mit deinen echten Daten füllen
- [ ] Facebook-Pixel-ID eintragen und den Block im `<head>` aktivieren
- [ ] Ablauf von der ERGO-Vertriebsunterstützung und der IHK gegenlesen lassen

## Wenn sich Beiträge oder Bedingungen ändern

| Was | Wo |
|---|---|
| Beiträge je Baustein | `index.html`, Objekt `MOD` |
| ZEK-Beitrag | `index.html`, Konstante `ZEK` |
| Summenbegrenzung | `index.html`, Konstante `STAFFEL` |
| Erstattungssätze | `index.html`, Konstante `PCT` |
| Wissen des KI-Chats | `functions/api/chat.js`, Konstante `WISSEN` |

Rechner, Startbeitrag, Familiensumme, Rechenbeispiele und Lead-Mail ziehen automatisch
nach. Der Chat **nicht** – dessen Wissenstext musst du von Hand mitpflegen.
