# Vaelondrisyl — World of Mythical Creatures

An interactive, auto-updating Bestiary codex showcasing the mythical creatures of Vaelondrisyl, powered by GitHub Pages and the GitHub REST API.

![Vaelondrisyl Codex](https://img.shields.io/badge/Vaelondrisyl-Mythical_Bestiary-10b981?style=for-the-badge&logo=github)

---

## 🔮 Features

- **⚡ Automatic Image Auto-Discovery**: Every image file (`.jpg`, `.png`, `.webp`, `.svg`) pushed to the `Creatures/` folder is automatically fetched and rendered on the website via the GitHub REST API—**no manual HTML/JS edits required!**
- **✨ Ethereal Glassmorphism Design**: Dark mythical theme with glowing ambient lighting, responsive grid, and smooth micro-animations.
- **🔍 Real-Time Search & Sorting**: Instantly filter creatures by name and sort by filename or size.
- **🔍 Interactive Lightbox Modal**: View high-resolution images, inspect file metadata, and access direct GitHub links.
- **📱 Fully Responsive**: Optimized for mobile, tablet, and desktop screens.

---

## 🐉 Adding New Creatures

Adding a new creature to the website codex is simple:

1. Add your new image file (e.g. `ShadowDragon.jpg`, `Gryphon.png`, `Platyrag.jpg`) into the `Creatures/` directory.
2. Commit and push your changes to GitHub:
   ```bash
   git add Creatures/
   git commit -m "Add new creature"
   git push origin main
   ```
3. Open or refresh your site—your new creature will instantly appear in the Bestiary!

---

## 🚀 GitHub Pages Setup

To enable your GitHub Pages site:

1. Go to repository settings on GitHub: [https://github.com/JaredCraigSmith/Vaelondrisyl/settings/pages](https://github.com/JaredCraigSmith/Vaelondrisyl/settings/pages)
2. Under **Build and deployment** -> **Source**, select **Deploy from a branch**.
3. Select branch `main` and folder `/ (root)`, then click **Save**.
4. Your website will be live at: **[https://jaredcraigsmith.github.io/Vaelondrisyl/](https://jaredcraigsmith.github.io/Vaelondrisyl/)**

---

## 📁 Repository Structure

```
Vaelondrisyl/
├── Creatures/             # Add creature image files here
│   ├── Axolcon.jpg
│   ├── Camraya.jpg
│   ├── Platyrag.jpg
│   └── Seaunglin.jpg
├── index.html             # Main codex HTML interface
├── style.css              # Custom mythical glassmorphism styling
├── app.js                 # Dynamic auto-discovery & gallery script
└── README.md              # Project documentation
```
