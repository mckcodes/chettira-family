# Chettira Family Heritage

A static, multi-page family archive website built with HTML, CSS, and vanilla JavaScript. The site highlights family history, deities, rituals, festivals, stories, documents, and an interactive family tree. Designed to run on GitHub Pages with no build step.

## Site Map
- Home: index.html
- Family Tree: family-tree.html (interactive D3 tree)
- History: history.html
- Guru Kaarana: gurukaarana.html
- Deities: deities.html
- Festivals: festivals.html
- Festival Rituals: festival-rituals.html
- Gallery: gallery.html
- Documents: documents.html
- Stories: stories.html
- Contact: contact.html
- Ritual/Deity pages:
	- ajjappa-chaundi-kodpo.html
	- bhadrakali.html
	- bote-aiyappa.html
	- karvale-bhagavathi.html
	- maithalappa.html
	- thademotte-chaundi-kodpo.html
	- vishnu-moorthy-meleri.html

## Key Features
- Responsive layout with a consistent header, navigation, and card-based sections.
- Light/dark theme toggle (persists in localStorage).
- Interactive family tree built with D3.
- Data-driven tree from JSON, with photos and notes.

## Project Structure
- assets/css/style.css: global styles and theme variables
- assets/js/tree.js: interactive family tree logic
- js/theme-toggle.js: light/dark theme toggle
- assets/data/family-tree.json: family tree data
- assets/images/people/: photos for family members (default avatar fallback)

## Local Preview
You can serve the site locally with any static server. Example:

```bash
python3 -m http.server 8000
```

Then open http://localhost:8000 in your browser.

## Family Tree Data
The family tree is defined in assets/data/family-tree.json. Each node can include:
- name
- notes
- photo (path to assets/images/people/...)
- children

Spouse nodes are represented with a name prefix of "wife:" or "husband:" and are rendered with a role label.

## Publish on GitHub Pages
1. Create a GitHub repository
2. Upload these files
3. Go to Settings → Pages
4. Under Build and deployment, choose Deploy from a branch
5. Select branch main and folder /(root)

Your site will be live at:
https://mck-personal.github.io/chettira-family/