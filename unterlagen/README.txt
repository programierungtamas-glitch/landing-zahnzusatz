UNTERLAGEN
==========
Hier gehören die vier Pflicht-PDFs hinein. Die Seite verlinkt sie im Antrag
(Schritt 5) und die Erstinformation zusätzlich im Footer.

  bedingungen.pdf                ERGO Versicherungsbedingungen
                                 Tarife DS75, DS90, DS100, DVB, DVE
                                 (fuer Sofortschutz zusaetzlich Tarif ZEK)
  produktinformationsblatt.pdf   Produktinformationsblatt / IPID
  erstinformation.pdf            Erstinformation nach § 15 VersVermV:
                                 Name, Anschrift, Status als Versicherungs-
                                 vertreter, Registernummer, Vermittlerregister,
                                 Beschwerde- und Schlichtungsstellen
  widerrufsbelehrung.pdf         Widerrufsbelehrung nach § 8 VVG

Bedingungen und Produktinformationsblatt bekommst du von der ERGO
Vertriebsunterstuetzung. Erstinformation und Widerrufsbelehrung gibt es dort
ebenfalls als Vorlage.

Solange die Dateien fehlen, laufen die Links im Antrag ins Leere - vor dem
Livegang unbedingt einsetzen.


KI-CHAT EINSCHALTEN
===================
Der Chat unten rechts nutzt Cloudflare Workers AI. Dafuer im Pages-Projekt:

  Settings -> Functions -> Bindings -> Add binding
  Typ:  Workers AI
  Name: AI            <- genau so, ohne das laeuft der Chat nicht

Danach einmal neu deployen (Deployments -> Retry deployment).
Kein API-Schluessel noetig. Kostenloses Kontingent: 10.000 Neurons pro Tag,
darueber 0,011 USD je 1.000 Neurons.

Ohne das Binding faellt der Chat automatisch auf die festen FAQ-Antworten
zurueck - die Seite bleibt also in jedem Fall funktionsfaehig.

Das Wissen des Bots steht in functions/api/chat.js in der Konstante WISSEN.
Aenderst du Tarife oder Preise, musst du diesen Text mit anpassen - der Bot
darf ausschliesslich daraus antworten.
