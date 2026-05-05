# Turnierpreise und Brackets sind jetzt sichtbar

Die Turnierseite zeigt jetzt die Preise ganz oben und darunter eine kompakte Bracket-Ansicht.

## Enthaltene Preise

- 16-9: 1 freies Booster-Pack
- 8-5: 2x Sammelheft
- 4: Kostenloses Bundle
- 3: 5 Booster + 1 Bundle
- 2: Kopfhörer
- 1: iPad

## So passt du die Optik an

Wenn du die Darstellung ändern willst, bearbeite die CSS-Regeln in `index.html`.

```css
:root {
  --tournament-box-width: clamp(230px, 26vw, 340px);
}
```

Damit steuerst du die gemeinsame Breite der Preis-, Bracket- und Match-Boxen.
