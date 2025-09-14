# Fonts

Place custom fonts for your game here:

## Supported formats:
- TTF (TrueType Font)
- OTF (OpenType Font)
- WOFF (Web Open Font Format)
- WOFF2 (Web Open Font Format 2.0 - recommended)

## Usage:
Add font files here and reference them in your CSS:

```css
@font-face {
    font-family: 'GameFont';
    src: url('../assets/fonts/your-font.woff2') format('woff2'),
         url('../assets/fonts/your-font.woff') format('woff');
}
```