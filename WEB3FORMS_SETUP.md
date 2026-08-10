# Kontaktformular: E-Mail-Zustellung einrichten

Diese Website ist eine **rein statische Seite** (HTML/CSS/JS, gehostet auf
GitHub Pages) - es gibt keinen eigenen Server, kein Next.js/Express-Backend
und keinen Build-Schritt, der eine `.env`-Datei einlesen könnte. Eine
klassische `.env`-Datei würde hier von nichts geladen und wäre daher
wirkungslos - deshalb gibt es hier keine.

Stattdessen senden die Formulare direkt (per `fetch`) an
**[Web3Forms](https://web3forms.com)**, einen kostenlosen Dienst genau für
diesen Fall: Er validiert serverseitig, filtert Spam und leitet die
Einreichung als E-Mail an dein Postfach weiter.

## Warum der "Access Key" kein Geheimnis ist

Bei einem echten Server wäre ein SMTP-Passwort ein Geheimnis, das niemals im
Frontend landen darf. Web3Forms funktioniert bewusst anders: Der Access Key
ist ein **öffentlicher Formular-Identifikator**, vergleichbar mit einer
Postfach-Nummer, keinem Passwort. Er ist an eine einzige Ziel-E-Mail-Adresse
gebunden und erlaubt niemandem, an diese Adresse heranzukommen, sie zu lesen
oder zu ändern - er kann ausschließlich verwendet werden, um Formulardaten
**an** diese Adresse zu senden. Deshalb ist es für dieses Setup korrekt und
sicher, ihn direkt im JavaScript-Code stehen zu haben.

## Einrichtung (einmalig, ca. 5 Minuten)

1. Gehe zu **https://web3forms.com**
2. Trage deine Ziel-E-Mail-Adresse ein (die Adresse, an die die Anfragen
   gehen sollen, z. B. `wn-kontakt@wn-webting.com`)
3. Du erhältst den **Access Key** per E-Mail - kopiere ihn
4. Trage den Key an **zwei Stellen** im Projekt ein (beide müssen
   aktualisiert werden, da die Seite keinen Server hat, der das zentral
   verwalten könnte):

   - [app.js](app.js) - Zeile mit `WEB3FORMS_ACCESS_KEY` (gilt für die drei
     Leistungsseiten: Meta-Ads, Social-Media-Management,
     Website-Management)
   - [index.html](index.html) - Zeile mit `WEB3FORMS_ACCESS_KEY` im
     `<script>`-Block vor `</body>` (gilt für das Kontaktformular auf der
     Startseite)

   Ersetze jeweils `'YOUR_WEB3FORMS_ACCESS_KEY'` durch deinen echten Key,
   z. B. `'a1b2c3d4-e5f6-7890-abcd-ef1234567890'`.

5. Hochladen wie gewohnt (siehe frühere Anleitung: alle geänderten Dateien
   per GitHub-Upload).

## Was in der E-Mail ankommt

Für jede der vier Formulare (Startseite + 3 Leistungsseiten) erhältst du
eine E-Mail mit:

- **Name**, **E-Mail**, **Nachricht** (alle vier Formulare)
- **Leistung** (nur die drei Unterseiten - z. B. "Meta-Ads"), automatisch
  auch als Betreff verwendet ("Neue Anfrage: Meta-Ads")
- Die jeweilige Zusatzauswahl (Budget bei Meta-Ads, Kanäle bei Social Media,
  Website-Status bei Website-Management)
- **Übermittlungszeitpunkt** (Datum/Uhrzeit der Einreichung)

Web3Forms fasst alle benannten Formularfelder automatisch in einer
lesbaren E-Mail zusammen - kein zusätzliches Template nötig.

## Sicherheit, bereits eingebaut

- **Client- und serverseitige Validierung**: Name und E-Mail-Format werden
  vor dem Senden geprüft; Web3Forms validiert zusätzlich serverseitig.
- **Spam-Schutz**: ein unsichtbares Honeypot-Feld (`botcheck`) fängt Bots ab
  - füllt ein Bot es aus, wird die Einreichung verworfen, ohne dass eine
    E-Mail verschickt wird.
- **Rate-Limiting & Spam-Filter**: von Web3Forms serverseitig übernommen.
- Der Access Key kann **nicht** verwendet werden, um E-Mails zu lesen, dein
  Postfach zu übernehmen oder Formulardaten abzugreifen - nur um
  Einreichungen an die hinterlegte Adresse zu senden.

## Formular testen

1. Trag den Access Key wie oben beschrieben ein (lokal reicht das schon,
   kein Upload nötig zum Testen).
2. Öffne eine der Seiten lokal (z. B. über `python3 -m http.server` im
   Projektordner) und fülle ein Formular mit einer echten
   Test-E-Mail-Adresse als Absender aus.
3. Abschicken - du solltest:
   - kurz "Wird gesendet …" auf dem Button sehen,
   - danach die grüne Erfolgsmeldung,
   - innerhalb weniger Sekunden eine E-Mail in deinem Postfach (ggf. Spam-
     Ordner prüfen).
4. Fehlerfall testen: trag testweise einen falschen/leeren Access Key ein
   und sende ab - es sollte eine rote Fehlermeldung erscheinen ("Senden hat
   nicht geklappt ..."), das Formular bleibt ausgefüllt und du kannst es
   erneut versuchen.

## Alternative

Falls du lieber **Formspree** statt Web3Forms nutzen möchtest (ähnliches
Prinzip, andere Anbieter-Konditionen): sag Bescheid, die Umstellung ist eine
kleine Änderung an `WEB3FORMS_ENDPOINT`/`access_key` in genau den zwei oben
genannten Dateien.
