PWA Icons — Placeholder Information
====================================

This directory contains the PWA app icons for the Pomodoro Timer.

Current state:
  - icon.svg — Master vector icon (tomato-red circle + white clock design)
  - icon-192.png — PLACEHOLDER (generated from icon.svg)
  - icon-512.png — PLACEHOLDER (generated from icon.svg)

TO GENERATE REAL PNG ICONS:

Option A: Node.js (recommended)
  1. Install sharp:  npm install sharp
  2. Run:
     node -e "const sharp=require('sharp');sharp('icons/icon.svg').resize(192,192).png().toFile('icons/icon-192.png');sharp('icons/icon.svg').resize(512,512).png().toFile('icons/icon-512.png')"

Option B: Inkscape (CLI)
  inkscape -w 192 -h 192 icons/icon.svg -o icons/icon-192.png
  inkscape -w 512 -h 512 icons/icon.svg -o icons/icon-512.png

Option C: Browser-based
  Open icons/generate.html in a browser to render and download the PNGs.
  (Copy the SVG into a <canvas>, resize, and export via toBlob/toDataURL)

Option D: Online converter
  Upload icon.svg to https://svgtopng.com or similar service
  with sizes 192x192 and 512x512.

The manifest.json references these PNG paths:
  - icons/icon-192.png
  - icons/icon-512.png
