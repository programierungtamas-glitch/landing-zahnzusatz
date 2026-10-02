// Cloudflare Pages Function  →  Endpoint:  POST /api/lead
// Env-Variablen (Settings → Environment variables, für Production UND Preview):
//   RESEND_API_KEY  (Secret)   re_...
//   LEAD_TO         (Text)     deine Mailadresse für Leads
//   LEAD_FROM       (Text)     Leads <lead@deine-domain.de>
//   LEAD_CC         (Text, optional)

const LABELS = {
  product: "Produkt",
  type: "Art der Anfrage",
  anrede: "Anrede",
  vorname: "Vorname",
  nachname: "Nachname",
  name: "Name",
  birthdate: "Geburtsdatum",
  age: "Alter bei Beginn",
  phone: "Telefon / WhatsApp",
  email: "E-Mail",
  kanal: "Unterlagen senden per",
  strasse: "Straße und Hausnummer",
  plz: "PLZ",
  ort: "Ort",
  tarif: "Tarif",
  persons: "Personen",
  members: "Versicherte Personen",
  birthdates: "Geburtsdaten (alle)",
  plan: "Paket",
  beitrag: "Beitrag (berechnet)",
  startbeitrag: "Startbeitrag erste 6 Monate",
  beginn_wunsch: "Versicherungsbeginn (Wunsch)",
  beginn: "Versicherungsbeginn (berechnet)",
  gkv: "Gesetzlich krankenversichert",
  missing: "Fehlende, nicht ersetzte Zähne",
  zek_plan: "ZEK: Behandlung schon geplant",
  zek_when: "ZEK: erste Planung",
  treatment: "Zahnsituation",
  bedarf: "Wunsch und Bedarf (§ 61 VVG)",
  zahlweise: "Zahlweise",
  kontoinhaber: "Kontoinhaber",
  iban: "IBAN",
  sepa: "SEPA-Lastschriftmandat",
  docs_ok: "Unterlagen erhalten und gelesen",
  consent: "Datenschutz-Einwilligung",
  time: "Rückrufzeit",
  message: "Nachricht des Kunden",
  lang: "Sprache der Seite",
};

const ORDER = [
  "product", "type",
  "anrede", "vorname", "nachname", "birthdate", "age",
  "phone", "kanal", "email", "strasse", "plz", "ort",
  "tarif", "persons", "members", "birthdates",
  "plan", "beitrag", "startbeitrag", "beginn_wunsch", "beginn",
  "gkv", "missing", "zek_plan", "zek_when", "treatment", "bedarf",
  "zahlweise", "kontoinhaber", "iban", "sepa",
  "docs_ok", "consent", "time", "message", "lang",
];

const esc = (s) =>
  String(s ?? "")
    .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

export async function onRequestPost({ request, env }) {
  try {
    const form = await request.formData();

    // Honeypot: Bots füllen das versteckte Feld aus → still verwerfen
    if (String(form.get("website") || "").trim() !== "") {
      return new Response("ok", { status: 200 });
    }

    const data = {};
    let signature = "";
    for (const [k, v] of form.entries()) {
      if (k === "website") continue;
      if (k === "signature") { signature = String(v || ""); continue; }
      data[k] = typeof v === "string" ? v.trim() : v;
    }

    // Name aus Vor- und Nachname zusammensetzen, falls getrennt übergeben
    if (!data.name && (data.vorname || data.nachname)) {
      data.name = `${data.vorname || ""} ${data.nachname || ""}`.trim();
    }

    if (!data.name || !data.phone || !data.consent) {
      return new Response("missing fields", { status: 400 });
    }

    const keys = ORDER.filter((k) => data[k]).concat(
      Object.keys(data).filter((k) => !ORDER.includes(k) && data[k])
    );

    const rows = keys
      .map(
        (k) =>
          `<tr><td style="padding:6px 10px;background:#f7f3ec;font-weight:600;white-space:nowrap">${
            esc(LABELS[k] || k)
          }</td><td style="padding:6px 10px">${esc(data[k])}</td></tr>`
      )
      .join("");

    const text = keys.map((k) => `${LABELS[k] || k}: ${data[k]}`).join("\n");

    const subject =
      `Zahnzusatz-${data.type === "antrag" ? "ANTRAG" : "Anfrage"} · ${data.name}` +
      (data.plan ? ` · ${data.plan}` : "") +
      (data.lang ? ` · ${String(data.lang).toUpperCase()}` : "");

    const html = `<div style="font-family:system-ui,Segoe UI,Roboto,sans-serif;color:#15211e">
      <h2 style="margin:0 0 4px">Neue Anfrage: Zahnzusatzversicherung</h2>
      <p style="margin:0 0 14px;color:#5b6b67">${esc(
        new Date().toLocaleString("de-DE", { timeZone: "Europe/Berlin" })
      )} · Landing Page Zahnzusatz</p>
      <table style="border-collapse:collapse;font-size:14px">${rows}</table>
      ${signature ? `<p style="margin-top:16px"><b>Unterschrift</b><br>
        <img src="${esc(signature)}" alt="Unterschrift" style="max-width:320px;border:1px solid #dfe6e3;border-radius:8px"></p>` : ""}
      <p style="margin-top:16px">
        <a href="https://wa.me/${esc(
          String(data.phone).replace(/[^0-9]/g, "")
        )}" style="background:#1fa855;color:#fff;padding:10px 16px;border-radius:8px;text-decoration:none;font-weight:700">
          Auf WhatsApp antworten
        </a>
      </p>
    </div>`;

    const payload = {
      from: env.LEAD_FROM,
      to: [env.LEAD_TO],
      subject,
      html,
      text,
    };
    if (signature.startsWith("data:image/png;base64,")) {
      payload.attachments = [{
        filename: `unterschrift-${String(data.name).replace(/[^a-z0-9]+/gi, "-").toLowerCase()}.png`,
        content: signature.split(",")[1],
      }];
    }
    if (env.LEAD_CC) payload.cc = [env.LEAD_CC];
    if (data.email) payload.reply_to = data.email;

    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${env.RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      console.log("resend error", res.status, await res.text());
      return new Response("mail failed", { status: 502 });
    }

    return new Response("ok", { status: 200 });
  } catch (e) {
    console.log("lead error", e && e.message);
    return new Response("error", { status: 500 });
  }
}

export const onRequestGet = () => new Response("ok", { status: 200 });
