# INCOSE ASEP Study Prep Guide

An interactive web app for studying for the **INCOSE ASEP** (Associate Systems
Engineering Professional) certification, built on flashcards and practice exams
derived from the INCOSE Systems Engineering Handbook (5th edition).

- **Flashcards** — pick a Part → Section → Subsection and flip through cards.
  Multiple-choice cards double as a self-check: choose an answer and it turns
  **green** (correct) or **red** (your wrong pick), with the handbook page.
- **Practice Exam** — generate a random, auto-graded multiple-choice exam.
  Choose how many questions, which Parts to cover, and an optional timer; get a
  score plus a full review with the correct answer for every question.
- **Drag-and-drop (IPO) exercises** — for the Part II Input/Process/Output
  process diagrams: drag each item into the correct category, then check.
- **Edit cards in-app** — fix a typo or add a card while you study (dev mode).
- **Handbook deep-links** — link your own copy of the handbook PDF and every
  page reference becomes a click-through to the exact page.

> **Note on the handbook:** the INCOSE SE Handbook is copyrighted and is **not**
> included in this repository. The app works without it; if you own the PDF you
> can link your own copy from inside the app to enable the page links.

---

## 1. Prerequisites

| Requirement | Version | Needed for | Where to get it |
|-------------|---------|-----------|-----------------|
| **Node.js** (includes `npm`) | 18 or newer (LTS recommended) | running the app | https://nodejs.org/ |
| **Git** | any recent | cloning the repo | https://git-scm.com/ |
| **Python** | 3.x | *only* if you edit/add cards in-app or regenerate card data | https://www.python.org/ |

Check what you have:

```bash
node --version
npm --version
```

If both print a version, you're set. Python is optional — you only need it if
you plan to edit cards (see section 5).

---

## 2. Get the project

```bash
git clone https://github.com/mgreen20/incose-asep-study-prep.git
cd incose-asep-study-prep
```

### Repository layout

```
incose-asep-study-prep/
├─ App/                          ← the React app you run (start here)
│  └─ public/all_cards.json      ← the card set the app loads
├─ python/                       ← optional card build/maintenance scripts
└─ README.md                     ← this file
```

The card set (`App/public/all_cards.json`) ships with the repo, so the app runs
out of the box — no extra build step needed to study.

---

## 3. Install & run (dev)

```bash
cd App
npm install        # first time only — downloads dependencies
npm run dev        # starts the dev server and opens the app in your browser
```

The app opens at **http://localhost:5173**. If it doesn't open automatically,
visit that address. Press `Ctrl + C` in the terminal to stop it.

### Use it on your phone or tablet

```bash
npm run dev -- --host
```

The terminal prints a **Network** address (e.g. `http://192.168.1.20:5173`) you
can open on any device on the same Wi-Fi. The UI is mobile-friendly.

---

## 4. Using the app

Switch between **Flashcards** and **Practice Exam** with the tabs at the top.

- **Flashcards:** choose a Part, then keep choosing from the dropdowns that
  appear until you reach a topic. Click a card (or press `Space`) to flip; use
  the arrow keys or Prev/Next to move; **Shuffle** to randomize. On a
  multiple-choice card, click a choice for instant green/red feedback.
- **Practice Exam:** pick the scope (specific Parts or the whole bank), the
  number of questions, and an optional timer; **Start Exam**, answer, then
  **Submit** for your score and a full review.
- **Handbook links:** click **🔗 Link Handbook PDF** in the header and choose
  your handbook file. It's stored locally in your browser (never uploaded), so
  it stays linked. References then become click-through links to the page.

---

## 5. Editing cards (optional)

The Flashcards view can show **✎ Edit**, **＋ Add**, and **Delete** controls for
correcting or adding cards. These require the local card-source files and Python
(the editing pipeline), which are **not part of this repo** — a plain clone runs
read-only, with editing automatically disabled. If you have the source files,
edits are written back and `App/public/all_cards.json` is refreshed
automatically; you can also regenerate it manually with `npm run gen` from the
`App` folder.

---

## 6. Optional: production build

For everyday studying, `npm run dev` is all you need. To build a static copy:

```bash
npm run build      # outputs to App/dist/
npm run preview    # serve the built app locally to check it
```

---

## 7. Troubleshooting

| Problem | Fix |
|---------|-----|
| `node`/`npm` not recognized | Install Node.js (section 1) and open a new terminal. |
| **No cards appear** | Make sure `App/public/all_cards.json` exists (it ships with the repo). Try a hard refresh in the browser. |
| **Port 5173 in use** | Run `npm run dev -- --port 5174`. |
| **References aren't clickable / no 📖 button** | Link your handbook PDF via **🔗 Link Handbook PDF** in the header. |
| **Handbook opens to the wrong page** | The offset assumes the official 5th-edition PDF (PDF page = book page + 26); adjust `PAGE_OFFSET` in `App/src/lib/pdf.js` for a different copy. |
| **`npm install` fails** | Confirm Node 18+ (`node --version`), delete `App/node_modules`, and retry. |

---

## More documentation

- **`App/README.md`** — fuller user guide.

## Tech stack

React + Vite (JavaScript). Client-side app — no database or backend to set up;
the only server piece is dev-only helper middleware that serves the card data
and handles in-app edits.
