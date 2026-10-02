// Cloudflare Pages Function – Sprach-Links /ro  /hu  /de
//
// Warum es diese Datei gibt: Die Seite schaltet die Sprache per JavaScript um.
// WhatsApp, Facebook und Google führen beim Einlesen eines Links aber kein
// JavaScript aus – sie würden in der Vorschau immer den rumänischen Titel zeigen.
// Diese Funktion liefert für /ro, /hu und /de dieselbe index.html aus, schreibt
// aber Titel, Beschreibung und Sprache schon auf dem Server um und gibt der
// Seite die Startsprache mit.

const META = {
  ro: {
    htmlLang: "ro",
    locale: "ro_RO",
    title: "Asigurare dentară ERGO · Asigurare cu Tamas",
    desc: "Până la 100 % pentru proteze dentare și implanturi. Fără perioadă de așteptare, fără întrebări de sănătate. Calculează prețul în 10 secunde.",
  },
  hu: {
    htmlLang: "hu",
    locale: "hu_HU",
    title: "ERGO fogászati biztosítás · Biztosítás Tamassal",
    desc: "Akár 100 % a fogpótlásra és az implantátumra. Várakozási idő és egészségügyi kérdések nélkül. Számold ki a díjat 10 másodperc alatt.",
  },
  de: {
    htmlLang: "de",
    locale: "de_DE",
    title: "ERGO Dental-Tarif · Versicherung mit Tamas",
    desc: "Bis zu 100 % für Zahnersatz und Implantate. Ohne Wartezeit, ohne Gesundheitsfragen. Beitrag in 10 Sekunden berechnen.",
  },
};

const esc = (s) =>
  String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;")
           .replace(/>/g, "&gt;").replace(/"/g, "&quot;");

export async function onRequest(context) {
  const url = new URL(context.request.url);
  const m = url.pathname.match(/^\/(ro|hu|de)\/?$/);
  if (!m) return context.next();

  const lang = m[1];
  const meta = META[lang];

  // dieselbe Startseite holen, nur eben nicht unter /ro ausliefern lassen
  const page = await context.env.ASSETS.fetch(new URL("/index.html", url));
  if (!page.ok) return context.next();

  return new HTMLRewriter()
    .on("html", {
      element(el) { el.setAttribute("lang", meta.htmlLang); },
    })
    .on("title", {
      element(el) { el.setInnerContent(meta.title); },
    })
    .on('meta[name="description"]', {
      element(el) { el.setAttribute("content", meta.desc); },
    })
    .on('meta[property="og:title"]', {
      element(el) { el.setAttribute("content", meta.title); },
    })
    .on('meta[property="og:description"]', {
      element(el) { el.setAttribute("content", meta.desc); },
    })
    .on('meta[property="og:locale"]', {
      element(el) { el.setAttribute("content", meta.locale); },
    })
    .on('meta[property="og:url"]', {
      element(el) { el.setAttribute("content", url.origin + "/" + lang); },
    })
    .on('meta[property="og:image"]', {
      element(el) { el.setAttribute("content", url.origin + "/og-" + lang + ".jpg"); },
    })
    .on("head", {
      element(el) {
        // die Seite liest das beim Start aus, noch vor ?lang= und localStorage
        el.append(`<script>window.__lang="${esc(lang)}";</script>`, { html: true });
      },
    })
    .transform(new Response(page.body, {
      status: 200,
      headers: {
        "content-type": "text/html; charset=utf-8",
        "cache-control": "public, max-age=0, must-revalidate",
      },
    }));
}
