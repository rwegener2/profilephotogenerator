# Immigrants Make America Great Profile Photo Generator

A simple, secure, and modern web application for adding a "Immigrants Make America Great" banner to a social media profile picture. All image processing happens entirely in the browser - no server uploads required.

## Security Features

- **Client-side only**: Images never leave your device
- **File validation**: Only PNG and JPG files accepted
- **Size limits**: 10MB max file size
- **Dimension limits**: Max 4096x4096px to prevent memory issues
- **Input sanitization**: Text inputs are sanitized to prevent injection attacks
- **No external dependencies**: No third-party scripts that could be compromised

## Github Pages Deployment Notes

1. Push to GitHub
2. Enable GitHub Pages (if not done already)

## Local Development

### Option 1
Open `index.html` in a modern web browser.

### Option 2 (updates)

```bash
# Using Python
python3 -m http.server 8000
```
Open `http://localhost:8000`

## Browser Compatibility

Works in all modern browsers that support:
- HTML5 Canvas API
- FileReader API
- ES6 JavaScript

## File Structure

```
.
├── index.html      # Main HTML structure
├── styles.css      # Modern, responsive CSS
├── app.js          # Client-side image processing
└── README.md       # Documentation
```
