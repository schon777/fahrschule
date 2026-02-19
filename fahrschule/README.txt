PROJECT_CONTEXT.md
Zweck dieser Datei

Diese Datei erklaert die Projekt- und Datenlage rund um die AP2-Vorbereitung und die dazugehoerigen ZIP-Artefakte. Sie ist fuer andere KI-Chats/Agents (z.B. Codex in WebStorm) gedacht, damit sie ohne Rueckfragen verstehen:

Was die ZIP-Dateien sind

Wofuer sie genutzt werden

Wie sie strukturiert sind

Welche Regeln/Constraints gelten (Pruefungsstil, Mehrfachangabe, Quellen, Lizenz)

Was der aktuelle Zielzustand ist (AP2 Training + Offline-KI/RAG)

Wenn Angaben irgendwo widersprechen: Diese Datei + die Datei REPORT.md im Upgrade-ZIP gelten als aktueller Stand.

Kontext: Wer / Wofuer

Nutzer/Owner: Alwin, IT-Systemelektroniker (AP2 Vorbereitung)

Ziel: Vorbereitung auf AP2 (IHK Essen), mit Fokus auf Netzwerktechnik + Elektrotechnik (und angrenzend IT-Systeme/WISO).

Lernstil: viele random Begriffs-/Bezeichnungsfragen kommen vor -> Lexikon/Bezeichnungen sind wichtig.

Wichtige Quiz-Regel: Mehrfachangabe (mehrere Antworten koennen korrekt sein). In Multiple-Choice werden Antworten nicht innerhalb der Optionen markiert/hervorgehoben; Loesung steht getrennt als Klartext.

Datei 1: AP2_Library_Offline_Upgraded.zip
Was ist das?

Das ist die aufbereitete Offline-Wissensbibliothek fuer:

Lernen / Nachschlagen (pruefungsnah, kompakt)

Offline-KI/RAG (z.B. Raspberry Pi 5, ohne Internet)

Fragen-App (Fahrschulfragen-Stil): Questionbank + Glossar + Indizes

Die Library ist so gebaut, dass eine KI oder eine App daraus zuverlaessig Inhalte ziehen kann, ohne in rohen PDFs/DOCs zu wuehlen.

Warum gibt es das?

Die AP2 hat viele zufaellige Begriff-/Bezeichnungsfragen. Die Idee ist:

Wissen ist versionierbar (Markdown)

RAG-freundlich (Chunks/Abschnitte, Metadaten)

Pruefungsnah (Anwendung + typische Fehler + Mini-Beispiel)

Offline nutzbar

Was ist drin?

Top-Level (im ZIP):

REPORT.md (Zusammenfassung des Upgrades, Zaehler, Hinweise)

AP2_Lernliste.xlsx (Index/Tracking/Inventar/Questionbank/Glossar/Dashboard)

Library/ (alle Notizen, Lexikon, Methoden, Templates, Questionbank, Indizes)

Wichtige Kennzahlen (aus REPORT.md):

Markdown gesamt: 181

Lernliste-Entries: 91

Questionbank-Fragen: 90 (30 Netzwerk, 30 Elektrotechnik, 30 IT-Systeme)

Glossar-Eintraege: 31

Wie ist die Library aufgebaut?

Wichtige Ordner in Library/:

Library/_index/

map-themen.md (Themenuebersicht)

glossary.md (Liste/Index der Notizen)

tags.md (Tag-Index)

map-netzwerk.md, map-elektrotechnik.md, map-it-systeme.md, map-bezeichnungen.md

consistency-checks.md (Verwechslungsfallen/Abgrenzungen)

Library/Bezeichnungen/

Lexikon fuer Bezeichnungen (Kabel/Leitungen, Netzwerk-Begriffe, LWL, Abkuerzungen)

Library/_templates/

Templates fuer Dokumentation, Troubleshooting, Begruendungen, etc.

Library/Netzwerk/Methoden/

Checklisten + Troubleshooting-Karten (z.B. VLAN/DHCP/DNS/VPN)

Library/_questionbank/

Pro Frage i.d.R. eine Datei (Mehrfachangabe), mit neutralen Optionen + Klartext-Loesung

Library/_external/

Platz fuer lizenzsaubere Referenzen/Metadaten (z.B. spaeter Wikipedia CC BY-SA), ohne Copy-Paste

Library/_gaps/

Workflow fuer Luecken/Low-Confidence Themen

Format-Regeln in jeder Markdown-Datei

YAML Frontmatter am Anfang (Metadaten, z.B.):

title

tags

priority (z.B. P1/P2)

exam_relevance (hoch/mittel/niedrig)

sources (z.B. internal:generated oder spaeter externe Quellen)

last_updated

confidence (low/medium/high)

license (internal / external license mapping)

type (note / lexikon / methode / template / questionbank / map)

topic_area (netzwerk / elektrotechnik / it-systeme / bezeichnungen / pruefung / wiso)

Pflicht-Sektionen (pruefungsnah, RAG-tauglich):

## Kontext & Grundlagen (Voraussetzungen)

## Pruefungsnahe Anwendung

## Typische Fehler & Stolperfallen

## Mini-Beispiel

ASCII-only: Inhalte sind absichtlich ohne Umlaute/Sonderzeichen gehalten (ae/oe/ue/ss), damit Offline-Toolchains/Parser stabil laufen.

Wiki-Links: Es gibt Links im Stil [[dateiname|Anzeigename]].

Das ist ein einfaches Wiki/Obsidian-Linkformat.

Tools duerfen es als Graph/Relation nutzen.

Wenn ein Tool das nicht kann, darf es die Links als Text ignorieren.

Questionbank: Regeln (wichtig fuer Apps/Importer)

Jede Frage ist Mehrfachangabe (Checkbox-Logik).

Optionen bleiben neutral (keine Markierung/kein Hinweis, was richtig ist).

Loesung steht getrennt unter ## Loesung (Klartext, nicht markieren in Optionen)

Jede Frage hat mind. Stolperfalle + Mini-Beispiel + kurze Erklaerung.

source_ref verweist auf passende Note/Quelle (intern).

AP2_Lernliste.xlsx: Wofuer ist die da?

Diese Excel ist ein Management-Layer fuer die Library. Sie ist nicht nur "Lernliste", sondern Index + Tracking + Mapping.

Sheets:

Lernliste: zentrale Liste aller Themen/Notizen (Prioritaet, Status, Wiederholung, Tags, Notizpfad, Quelle)

Inventar: Mapping der Originaldateien (aus Source-Paket) inkl. Hinweis, ob/wo sie als Source genutzt wurden

Questionbank: strukturierte Exportansicht der Fragen (zum Import in Apps/DB)

Glossar: Begriffe + Kurzdefinition + Verwechslungsgefahr

Aliases_Mapping: IDs/Umbenennungen (damit Links stabil bleiben)

Dashboard: einfache Kennzahlen (Notizen pro topic_area/type, Prioritaetenabdeckung, etc.)

Praktischer Nutzen fuer Codex/Apps:

Excel kann als einheitliche Datenquelle fuer Import/Build-Pipelines dienen (Questionbank/Glossar).

Die Library bleibt "Source of Truth" fuer Inhalte, Excel ist Index/Controlling.

Wann wird dieses ZIP gebraucht?

Wenn eine Offline-KI (RAG) Kontext braucht (Pi 5, offline)

Wenn eine Lern-/Quiz-App Fragen, Tags, Glossar, Indizes laden soll

Wenn neue Inhalte aus AP2.zip / Schule dazukommen und sauber eingepflegt werden sollen

Datei 2: AP2.zip
Was ist das?

Das ist ein Rohdaten-/Quellpaket mit Material zur AP2-Vorbereitung. Es ist nicht die RAG-optimierte Library, sondern die Sammlung aus:

vielen PDFs (u.a. alte AP2-Pruefungen, Loesungen, Belegsaetze)

eigenen Notizen/Dokumenten (DOCX/RTF/XLSX/TXT)

Bildern/sonstigen Dateien

Unterordnern, die bereits fruehe Strukturen/Ideen enthalten (z.B. "Ordnerstruktur fuer PI")

Kurz: AP2.zip ist der Input, AP2_Library_Offline_Upgraded.zip ist der aufbereitete Output.

Warum gibt es das?

Es enthaelt Originalquellen (Schule, eigene Mitschriften, alte Pruefungen, Analysen).

Daraus werden Inhalte in eigenen Worten in die Markdown-Library ueberfuehrt (kompakt, pruefungsnah, chunkbar).

Wichtige Unterordner (Beispiele)

AP2/Alte AP2 Pruefungen/

sehr viele PDFs (Pruefungen/Loesungen/WISO/Belegsaetze etc.)

AP2/KI Ergebnisse/

KI-generierte/zusammengefasste Dokumente (u.a. eine Elektrotechnik-Themencheckliste als .md)

AP2/Ordnerstruktur fuer PI/

fruehe textbasierte Wissensordner (TXT) als Ansatz fuer Offline/PI

weitere Ordner: Elektrotechnik/, IT/, Wirtschaft/, Youtube Analyse/, etc.

Lizenz-/Copyright-Hinweis (wichtig fuer GitHub/Codex)

In AP2.zip koennen copyright-geschuetzte Inhalte liegen (z.B. Pruefungs-PDFs, Loesungen, Skripte).
Regel:

Nicht oeffentlich in ein Public-Repo pushen, wenn Rechte unklar sind.

Stattdessen: nur eigene Zusammenfassungen/Notizen (die Markdown-Library) ins Repo committen.

Rohmaterial ggf. in private Storage/Private Repo, oder lokal behalten und ueber .gitignore ausschliessen.

Wie wird dieses ZIP praktisch genutzt?

Als Referenz/Quelle fuer neue Inhalte.

Workflow: relevante Inhalte -> in eigenen Worten in Library/ uebernehmen -> YAML ausfuellen -> Tags/Links -> Excel aktualisieren.

Keine 1:1 Kopien von Pruefungen in die Library (stattdessen: Themen/Skill-Fokus, Musteranalyse).

Beziehung der beiden ZIPs (Kurz)

AP2.zip = Rohquellen (PDF/DOC/TXT etc.)

AP2_Library_Offline_Upgraded.zip = strukturierte Wissensdatenbank (Markdown + Excel + Questionbank + Indizes)

Der Normalfall ist: AP2.zip liefert Material, daraus werden neue/verbesserte Notes/Questions in der Upgraded-Library erstellt.

Aktuelles Ziel (fuer Codex / Programmierung)

Es soll eine selbstgehostete Lern-App entstehen (Fahrschulfragen-Prinzip), erreichbar im Heimnetz und ueber Tailscale.

Hauptfeatures (High-Level, keine Implementation hier):

Themenbrowser (nach topic_area/tags)

Quiz-Modi:

kleine Fragen (Begriffe/Bezeichnungen)

mittlere Fragen (Anwendung)

grosse/pruefungsnahe Aufgaben (Szenario, Teilpunkte)

Fortschritt:

Coverage (wie viel gesehen)

Accuracy (wie viel richtig)

Mastery/Schwachstellen

Datenimport:

primaer aus AP2_Lernliste.xlsx (Sheets Questionbank/Glossar) und/oder Library/_questionbank/

Offline-faehig (Backend lokal, DB lokal), fuer Zugriff ueber Tailscale

Wichtig: Diese Datei beschreibt bewusst nur Kontext/Datenlage, nicht den aktuellen Code-Stand in irgendeinem Repo.

Zusatz: Relevante Alt-Infos aus "Taschenrechner" (Legacy, aber wichtig)

Es existiert ein weiteres (hardware-nahes) Projekt: AI-Taschenrechner im Casio-Gehaeuse mit ESP32 + Raspberry Pi + Offline-KI. Kernideen daraus, die weiterhin fuer das Gesamtziel relevant sein koennen: Offline-LLM (llama.cpp), RAG mit eigener Markdown-Library, Key-Event/Input ueber ESP32, Display-Output auf kleinem reflektivem LCD, klare State-Machine fuer Modi (Calculator vs AI). 

Tacehnrechner

Hinweis: Diese Taschenrechner-Notizen sind "legacy" (ein aelterer Stand). Wenn Details dort mit aktuellen Entscheidungen kollidieren, muss zuerst der aktuelle Stand geklaert werden. Die Grundidee "Offline-KI + RAG + Markdown als Source of Truth" ist aber weiterhin kompatibel zur AP2-Library.