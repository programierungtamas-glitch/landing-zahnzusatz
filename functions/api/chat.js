// Cloudflare Pages Function  →  Endpoint:  POST /api/chat
//
// Voraussetzung: im Pages-Projekt unter Settings → Functions → Bindings
// ein "Workers AI"-Binding mit dem Namen  AI  anlegen. Kein API-Schlüssel nötig.
// Kostenloses Kontingent: 10.000 Neurons pro Tag, danach 0,011 $ je 1.000 Neurons.
//
// Der Bot antwortet NUR aus dem Wissen unten. Alles andere geht an Tamas.

const MODEL = "@cf/meta/llama-3.3-70b-instruct-fp8-fast";

const MAX_MSG = 600;   // Zeichen je Kundennachricht
const MAX_TURNS = 12;  // Nachrichten im Verlauf

// ---------------------------------------------------------------------------
// Wissen: ausschließlich daraus darf geantwortet werden.
// Quelle: Versicherungsvorschläge ERGO vom 02.10.2026 + Vermittlerblatt 04.2025.
// ---------------------------------------------------------------------------
const WISSEN = `
PRODUKT: ERGO Dental-Tarife, vermittelt von Tamas (selbstständiger ERGO Vermittler).
Beratung auf Rumänisch, Ungarisch und Deutsch. Über 3.000 Kunden.

DREI PAKETE (Bausteine, Zahnersatz-Erstattung einschließlich Kassenanteil).
Nenne sie dem Kunden gegenüber IMMER mit dem vollen Namen, also "Dental Start",
"Dental Plus", "Dental Premium" – niemals nur START, PLUS oder PREMIUM:
- Dental Start = DS75 + DVB + DVE → 75 % Zahnersatz
- Dental Plus = DS75 + DS90 + DVB + DVE → 90 % Zahnersatz
- Dental Premium = DS75 + DS90 + DS100 + DVB + DVE → 100 % Zahnersatz, kein Eigenanteil

IN ALLEN DREI PAKETEN ENTHALTEN:
- 100 % Kunststofffüllungen, Wurzelbehandlung, Parodontose, Schleimhautbehandlung
- 100 % professionelle Zahnreinigung, ohne Begrenzung
- 100 % Knirscherschienen
- Kieferorthopädie für Kinder 100 %, maximal 2.000 € über die Vertragslaufzeit,
  Beginn vor dem 18. Lebensjahr; in den ersten drei Jahren gestaffelt 500/1.000/1.500 €
- Bleaching ab 18 und Schnarcherschienen: erste zwei Jahre zusammen max. 100 €,
  danach je zwei Jahre max. 250 €
- Zahnersatz umfasst Kronen, Brücken, Prothesen, Inlays, Onlays, Implantate inkl.
  Knochenaufbau, Provisorien, Reparaturen, Laborarbeiten
- Schmerzausschaltung (Narkose, Sedierung) 100 %, dazu 50 € Fahrkostenpauschale
  nach Vollnarkose

SUMMENBEGRENZUNG ZAHNERSATZ in den ersten vier Versicherungsjahren:
- Dental Start: 500 € im 1. Jahr, 1.000 € in zwei, 1.500 € in drei, 2.000 € in vier Jahren
- Dental Plus: 750 / 1.500 / 2.250 / 3.000 €
- Dental Premium: 1.000 / 2.000 / 3.000 / 4.000 €
Ab dem 5. Versicherungsjahr gibt es keine Begrenzung mehr.
Bei einem Unfall entfallen die Begrenzungen sofort.
Zahnbehandlung und professionelle Zahnreinigung sind von Anfang an unbegrenzt.

ANNAHME:
- Keine Gesundheitsfragen.
- Keine Wartezeit, der Schutz gilt ab Versicherungsbeginn.
- Nur für Versicherte in der deutschen gesetzlichen Krankenkasse (GKV, z. B. AOK, TK,
  Barmer), mit ständigem Wohnsitz und Bankverbindung in Deutschland.
- Pakete: monatlich kündbar, keine Mindestlaufzeit. ZEK: 24 Monate Mindestvertragsdauer.

SCHON FEHLENDE ZÄHNE:
Zähne, die bei Vertragsbeginn fehlen und noch nicht dauerhaft ersetzt sind, sind in den
drei Paketen nicht versichert. Entscheidend ist der Zeitpunkt, zu dem der Zahn verloren
ging, nicht der Zeitpunkt der Behandlung. Sobald die Lücke auf eigene Kosten dauerhaft
ersetzt ist, ist die Stelle wieder ganz normal mitversichert. Ein Abschluss ist trotzdem
möglich.

SCHON ANGERATENE ODER BEGONNENE BEHANDLUNG:
In den drei Paketen nicht versichert. Die Maßnahme muss bei bestehendem Schutz erstmals
angeraten und durchgeführt werden. Dafür gibt es den eigenen Tarif ZEK.

TARIF ZEK (Sofortschutz, eigener Vertrag), 37,60 € im Monat, altersunabhängig:
- Leistet auch für bereits angeratenen Zahnersatz
- Verdoppelt den Festzuschuss der gesetzlichen Kasse; zusammen mit der Kasse maximal
  100 % des erstattungsfähigen Rechnungsbetrags
- Fehlende Zähne sind mitversichert
- Rückwärts-Versicherung: eine Maßnahme, die in den sechs Monaten vor Versicherungsbeginn
  begonnen und nach Versicherungsbeginn beendet wurde, ist mitversichert
- Umfang nur Zahnersatz: Kronen, Brücken, Prothesen, implantatgetragener Zahnersatz,
  dazu Reparaturen, Provisorien, Laborarbeiten
- NICHT enthalten: Füllungen, Wurzelbehandlung, Zahnreinigung, Kieferorthopädie
- Summenbegrenzung: 1.000 € im ersten, 2.000 € in den ersten zwei Versicherungsjahren
- Zahlt die gesetzliche Kasse gar nichts, zum Beispiel bei Behandlung im Ausland,
  leistet auch ZEK nicht
- Ohne Wartezeit, ohne Gesundheitsfragen

TARIF KFO: für Kinder und Jugendliche, Sofortleistung für Kieferorthopädie auch bei schon
angeratener Behandlung. Beiträge liegen noch nicht vor, dazu meldet sich Tamas persönlich.

BEITRÄGE:
Der Beitrag hängt vom Alter bei Versicherungsbeginn ab. Auf der Seite gibt es oben einen
Rechner: Geburtsdatum eingeben, dann steht der Beitrag für alle drei Pakete da.
In den ersten sechs Monaten gilt ein günstigerer Startbeitrag (Starterbonus), danach der
normale Beitrag.

BEHANDLUNG IM AUSLAND (gilt für DS-Tarife und für ZEK):
Bei vorübergehenden Aufenthalten in anderen Staaten der EU, des EWR und in der Schweiz
besteht Versicherungsschutz; dasselbe gilt, wenn jemand seinen gewöhnlichen Aufenthalt in
einen anderen EU- oder EWR-Staat verlegt. Erstattet wird höchstens so viel, wie für
dieselbe Behandlung in Deutschland zu zahlen wäre. In Staaten außerhalb von EU, EWR und
Schweiz besteht kein Versicherungsschutz. Beim Tarif ZEK zusätzlich: ZEK verdoppelt den
Festzuschuss der gesetzlichen Kasse — zahlt die Kasse für die Maßnahme nichts, zahlt auch
ZEK nichts.

VERTRAGSDAUER UND KÜNDIGUNG:
- Pakete Dental Start, Dental Plus, Dental Premium (Tarife DS75, DS90, DS100, DVB, DVE): keine
  Mindestvertragsdauer, Kündigung ohne Frist zum Ende jedes Kalendermonats.
- Tarif ZEK: Mindestvertragsdauer 24 Monate, danach Kündigung zum Ende jedes
  Kalendermonats.

BEITRAG UND ALTER:
Bei den Paketen richtet sich der Beitrag nach Altersgruppen. Wer das 21., 26., 31., 41.
oder 51. Lebensjahr vollendet, zahlt ab dem folgenden Monat den Beitrag der nächsten
Altersgruppe. Steigt der Beitrag aus diesem Grund, kann der Vertrag für die betroffene
Person innerhalb von zwei Monaten rückwirkend zum Zeitpunkt der Beitragsänderung gekündigt
werden. Der Tarif ZEK kostet in jedem Alter 37,60 € ("ab 0").

PRÜFUNG DURCH DIE VERSICHERUNG (zum Beispiel ob Zähne fehlten):
Im Leistungsfall müssen der Versicherungsnehmer und die versicherte Person jede Auskunft
erteilen, die zur Prüfung der Leistungspflicht erforderlich ist. Auf Verlangen muss die
versicherte Person die behandelnden Zahnärzte von der Schweigepflicht entbinden; so kann
ERGO die Unterlagen beim Zahnarzt anfordern. Außerdem kann ERGO verlangen, dass sich die
versicherte Person von einem beauftragten Zahnarzt untersuchen lässt. Falsche Angaben
fallen deshalb auf.

RECHNUNG EINREICHEN (nach dem Zahnarztbesuch):
Ganz einfach und ohne Papierkram: Der Kunde macht mit dem Handy ein Foto von der
Zahnarztrechnung und schickt es Tamas per WhatsApp. Dazu teilt er die IBAN mit, auf die
die Erstattung überwiesen werden soll. Den Rest erledigt Tamas. Der Kunde muss kein
Formular ausfüllen und nichts per Post schicken.

ABLAUF:
1. Antrag online ausfüllen, etwa fünf Minuten, mit digitaler Unterschrift am Handy
2. Tamas prüft den Antrag und reicht ihn bei ERGO ein, innerhalb von 24 Stunden
3. ERGO nimmt den Antrag an, die Police kommt per E-Mail. Erst dann besteht der Vertrag
4. 14 Tage Widerrufsrecht
Die Unterlagen kommen per WhatsApp oder E-Mail, je nach Wunsch.
Die Beratung kostet nichts.
`;

const REGELN = {
  de: `Du bist der Assistent auf der Website von Tamas, einem selbstständigen ERGO
Versicherungsvermittler. Du beantwortest Fragen zur ERGO Zahnzusatzversicherung.

STRIKTE REGELN:
1. Antworte AUSSCHLIESSLICH mit Informationen aus dem WISSEN unten. Erfinde nichts.
2. Steht etwas nicht im WISSEN, sage offen: das kannst du hier nicht sicher sagen, und
   bitte darum, Tamas direkt auf WhatsApp zu fragen. Rate niemals.
3. Nenne NIEMALS einen konkreten Beitrag in Euro, außer den 37,60 € für ZEK. Für alle
   anderen Preise verweise auf den Rechner oben auf der Seite ("Geburtsdatum eingeben").
4. Sage niemals verbindlich zu, dass ein konkreter Fall bezahlt wird. Sage stattdessen,
   was die Bedingungen allgemein vorsehen, und dass Tamas den Einzelfall prüft.
5. Gib keine medizinischen oder zahnmedizinischen Ratschläge.
6. Maximal drei kurze Sätze. Einfache Alltagssprache, Du-Form, keine Fachbegriffe ohne
   Erklärung. Keine Aufzählungen, keine Emojis.
7. Antworte immer auf Deutsch.`,
  ro: `Ești asistentul de pe site-ul lui Tamas, agent de asigurări ERGO independent.
Răspunzi la întrebări despre asigurarea dentară suplimentară ERGO.

REGULI STRICTE:
1. Răspunde EXCLUSIV cu informații din secțiunea WISSEN de mai jos. Nu inventa nimic.
2. Dacă ceva nu apare acolo, spune deschis că nu poți confirma aici și roagă-l să-i scrie
   lui Tamas pe WhatsApp. Nu ghici niciodată.
3. Nu menționa NICIODATĂ o contribuție concretă în euro, cu excepția celor 37,60 € pentru
   ZEK. Pentru restul trimite la calculatorul de sus ("introdu data nașterii").
4. Nu promite niciodată că un caz concret va fi plătit. Spune ce prevăd condițiile în
   general și că Tamas verifică fiecare caz.
5. Nu da sfaturi medicale sau stomatologice.
6. Maximum trei propoziții scurte, limbaj simplu, la persoana a doua. Fără liste, fără
   emoji.
7. Răspunde întotdeauna în limba română.`,
  hu: `Te Tamas weboldalának asszisztense vagy. Tamas önálló ERGO biztosításközvetítő.
Az ERGO fogászati kiegészítő biztosításról válaszolsz kérdésekre.

SZIGORÚ SZABÁLYOK:
1. KIZÁRÓLAG az alábbi WISSEN szakaszból válaszolj. Semmit ne találj ki.
2. Ha valami nincs benne, mondd meg őszintén, hogy ezt itt nem tudod biztosan, és kérd
   meg, hogy írjon Tamasnak WhatsAppon. Soha ne tippelj.
3. SOHA ne mondj konkrét euróösszeget, kivéve a ZEK 37,60 €-t. A többi díjhoz irányítsd a
   fenti kalkulátorhoz ("add meg a születési dátumot").
4. Soha ne ígérd meg, hogy egy konkrét esetet kifizetnek. Mondd el, mit tartalmaznak a
   feltételek általánosságban, és hogy Tamas minden esetet egyedileg megnéz.
5. Ne adj orvosi vagy fogászati tanácsot.
6. Legfeljebb három rövid mondat, egyszerű nyelven, tegeződve. Felsorolás és emoji nélkül.
7. Mindig magyarul válaszolj.`,
};

export async function onRequestPost({ request, env }) {
  try {
    if (!env.AI) return json({ error: "no-ai" }, 503);

    const body = await request.json().catch(() => null);
    if (!body || !Array.isArray(body.messages)) return json({ error: "bad-request" }, 400);

    const lang = ["de", "ro", "hu"].includes(body.lang) ? body.lang : "ro";

    const history = body.messages
      .filter((m) => m && (m.role === "user" || m.role === "assistant") && typeof m.content === "string")
      .slice(-MAX_TURNS)
      .map((m) => ({ role: m.role, content: m.content.slice(0, MAX_MSG) }));

    if (!history.length || history[history.length - 1].role !== "user") {
      return json({ error: "bad-request" }, 400);
    }

    // Paket, aus dem der Chat geöffnet wurde (nur bekannte Werte zulassen)
    const PNAME = {
      START: "Dental Start", PLUS: "Dental Plus", PREMIUM: "Dental Premium",
      ZEK: "Dental ZEK", Sofortschutz: "Dental ZEK",
    };
    const kontext = PNAME[body.plan]
      ? `\n\n=== KONTEXT ===\nDer Kunde schaut sich gerade das Paket ${PNAME[body.plan]} an. Beziehe deine Antwort darauf, wenn es passt.`
      : "";

    const messages = [
      { role: "system", content: `${REGELN[lang]}\n\n=== WISSEN ===\n${WISSEN}${kontext}` },
      ...history,
    ];

    const out = await env.AI.run(MODEL, { messages, max_tokens: 300, temperature: 0.2 });
    const reply = String(out?.response || "").trim();
    if (!reply) return json({ error: "empty" }, 502);

    return json({ reply });
  } catch (e) {
    console.log("chat error", e && e.message);
    // Kontingent erschöpft oder Modell nicht erreichbar → die Seite fällt
    // automatisch auf die festen FAQ-Antworten zurück.
    return json({ error: "unavailable" }, 503);
  }
}

function json(obj, status = 200) {
  return new Response(JSON.stringify(obj), {
    status,
    headers: { "Content-Type": "application/json; charset=utf-8" },
  });
}

export const onRequestGet = () => json({ ok: true });
