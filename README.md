# Das MWG Sammelkarten-Spiel — Website

## Aufbau

```
index.html        ← die gesamte Website (eine Datei)
data.json         ← zentrale Konfiguration für E-Mail und Karten
cards/            ← lege hier alle Karten-Bilder rein
  lehrer_mueller.jpg
  mensa_koenig.png
  ...
```

---

## Karten hinzufügen

1. Lege deine Kartenbilder in den Ordner `cards/` (JPG, PNG, GIF oder WebP).
2. Öffne `data.json` in einem Texteditor.
3. Lege deine Karten in Sets an. Jedes Set hat einen Namen und eine `cards`-Liste:

```json
{
  "contactEmail": "abi2027.mwg@outlook.de",
  "rarities": {
    "Common": {
      "borderColor": "#64748b",
      "glowColor": "rgba(100, 116, 139, 0.22)"
    },
    "Rare": {
      "borderColor": "#3b82f6",
      "glowColor": "rgba(59, 130, 246, 0.24)"
    },
    "Legendary": {
      "borderColor": "#f59e0b",
      "glowColor": "rgba(245, 158, 11, 0.28)"
    }
  },
  "sets": [
    {
      "name": "Set 1: The beginnings",
      "description": "Der erste Drop.",
      "cards": [
        {
          "path": "cards/lehrer_mueller.jpg",
          "name": "Herr Müller",
          "rarity": "Common"
        },
        {
          "path": "cards/mensa_koenig.png",
          "name": "Mensa-König",
          "rarity": "Rare"
        }
      ]
    },
    {
      "name": "Set 2: Electric Boogaloo",
      "description": "Das zweite Set.",
      "cards": [
        {
          "path": "cards/abitur_hero.jpg",
          "name": "Abi Hero",
          "rarity": "Epic"
        }
      ]
    }
  ]
}
```

Fertig! Der Kartenname und die Rarität werden direkt in der Karte angezeigt. Wenn `name` fehlt, wird der Dateiname (ohne Endung) als Fallback genutzt.  
`_` und `-` werden als Leerzeichen dargestellt, der erste Buchstabe wird großgeschrieben.

Im Kartenalbum werden die Karten nach Set gruppiert und oben kannst du zwischen den Sets filtern.

Die Kartenränder werden je Rarität aus `rarities` eingefärbt. Dort kannst du `borderColor` und optional `glowColor` anpassen.
---

## Turnierseite

Die Website hat zusätzlich eine Seite für das Schulturnier. Dort werden die Brackets als Stufen angezeigt, damit man direkt sieht, wer in welcher Phase ist.

In `data.json` steuerst du das über `tournament`:

```json
{
  "upcoming": true,
  "title": "Turnier-Brackets",
  "description": "Hier siehst du die aktuellen Brackets, Stufen und Paarungen des Schulturniers.",
  "stages": [
    {
      "name": "Vorrunde",
      "status": "Stage 1",
      "participants": ["Team Alpha", "Team Beta"],
      "matches": [
        {
          "label": "Spiel 1",
          "left": "Team Alpha",
          "right": "Team Beta"
        }
      ]
    }
  ]
}
```

Wenn `upcoming` auf `true` steht, erscheint oben auf der Turnierseite zusätzlich ein `Coming soon`-Hinweis.

### Optik der Brackets anpassen

Die visuelle Darstellung der Turnierseite wird direkt in `index.html` über CSS gesteuert. Wenn du die Boxen größer oder kleiner machen willst, ändere zuerst die CSS-Variable `--tournament-box-width` im `:root`-Block.

Für das Aussehen der einzelnen Bereiche sind diese Klassen wichtig:

- `.tournament-prize-ladder` für den Preis-Block oben
- `.tournament-prize-card` für die einzelnen Preis-Karten
- `.bracket-columns` für die Spalten der Bracket-Ansicht
- `.bracket-match` für die Match-Kästchen in der Bracket-Ansicht
- `.tournament-stage` für die großen Stage-Boxen mit Details

Wenn du Farben, Abstände, Rahmen oder Schatten ändern willst, bearbeite diese CSS-Regeln direkt in `index.html`. Damit alle Boxen weiterhin gleich breit bleiben, sollten die jeweiligen `width`- und `max-width`-Werte zusammen mit `--tournament-box-width` angepasst werden.

---

## Newsseite

Die Website hat jetzt zusätzlich eine News-Seite im Blog-Stil. Dort werden einzelne Markdown-Dateien aus dem Ordner `blogs/` geladen und nacheinander angezeigt. Auf der Startseite erscheint außerdem ein kurzer Hinweis auf die neuesten News.

Damit neue Beiträge angezeigt werden, brauchst du zwei Dinge:

1. Lege eine Markdown-Datei in `blogs/` an, zum Beispiel `blogs/mein-beitrag.md`.
2. Trage die Datei in `blogs/index.json` ein.

Beispiel:

```json
{
  "posts": [
    {
      "file": "mein-beitrag.md",
      "title": "Mein neuer News-Beitrag",
      "date": "2026-05-05",
      "excerpt": "Eine kurze Zusammenfassung des Beitrags."
    }
  ]
}
```

Im Markdown kannst du normale Überschriften, Listen, Zitate, Links und Codeblöcke verwenden. Die Seite rendert die Beiträge automatisch im Blog-Stil.

---

## Produkte hinzufügen

`data.json` enthält auch die bestellbaren Produkte. Dort kannst du Booster-Packs, Kartensammelhefte, Bundles oder weitere Artikel definieren.

Jedes Produkt braucht mindestens diese Felder:

```json
{
  "id": "kartensammelhefte",
  "name": "Kartensammelhefte",
  "description": "Sammelhefte zum Einordnen und Aufbewahren deiner Karten.",
  "unitLabel": "Heft(e)",
  "price": 7,
  "minQuantity": 1,
  "maxQuantity": 20,
  "defaultQuantity": 1
}
```

`id` wird intern verwendet, `name` erscheint im Formular, `description` erklärt das Produkt, `unitLabel` steuert die Mengenanzeige und `price` ist der Stückpreis in Euro.

---

## Bestellformular

Das Bestellformular sendet die Reservierung direkt über einen E-Mail-Formular-Dienst an die Adresse aus `data.json`.  
Oben im Formular gibt es eine horizontale Produkt-Schiene, in der du mehrere Produkte gleichzeitig auswählen und jeweils die Menge setzen kannst.  
Es wird kein lokales E-Mail-Programm geöffnet. Wenn du die E-Mail ändern willst, passe einfach `contactEmail` in `data.json` an.

Im Warenkorb werden außerdem die Gesamtkosten der Bestellung angezeigt.

---

## Hosting

Die Website besteht aus einer einzigen HTML-Datei — kein Server nötig.  
Einfach `index.html` + den Ordner `cards/` auf einen Webspace hochladen, fertig.

Kostenlose Optionen: **GitHub Pages**, **Netlify**, **Vercel**.
