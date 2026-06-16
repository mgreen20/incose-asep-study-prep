# INCOSE ASEP Study App

A local web app for studying for the **INCOSE ASEP** (Associate Systems
Engineering Professional) certification. It turns the handbook-based flashcards
into an interactive study tool with two modes:

- **Flashcards** — drill down by Part → Section → Subsection and flip through
  cards. Multiple-choice cards double as a self-check: pick an answer and it
  instantly turns **green** (correct) or **red** (your wrong pick), with the
  handbook page reference.
- **Practice Exam** — generate a random, auto-graded multiple-choice exam.
  Choose how many questions, which Parts to cover, and an optional timer. You
  get a score plus a full review with the correct answer and a link to the exact
  handbook page for every question.

Every page reference is a clickable link that opens the INCOSE SE Handbook PDF
to the right page.

---

## 1. Prerequisites

You need two things installed on your computer:

| Requirement | Version | Where to get it |
|-------------|---------|-----------------|
| **Node.js** (includes `npm`) | 18 or newer (LTS recommended) | https://nodejs.org/ |
| **Git** (only to clone the repo) | any recent | https://git-scm.com/ |

To check what you already have, open a terminal (PowerShell, Command Prompt, or
Terminal) and run:

```bash
node --version
npm --version
```

If both print a version number, you're set. If `node` is not found, install
Node.js from the link above and reopen your terminal.

---

## 2. Get the project

Clone the repository (or download and unzip it), then open a terminal **in the
`App` folder**:

```bash
git clone <your-repo-url>
cd incose-asep-study-prep/App
```

> The card set ships with the app at `App/public/all_cards.json`, so it runs out
> of the box — no extra data files required.
>
> **The handbook PDF is not included** (it is copyrighted and cannot be
> redistributed). The page-reference links are disabled until you link your own
> copy from inside the app — see [section 5](#linking-your-handbook-pdf). The app
> is fully usable for studying without it; you just won't get the jump-to-page
> links.

---

## 3. Install dependencies

From inside the `App` folder, run this once:

```bash
npm install
```

This downloads the libraries the app needs into a local `node_modules` folder.
It may take a minute the first time.

---

## 4. Run the app

```bash
npm run dev
```

This starts a local development server and **automatically opens the app in your
browser** at:

```
http://localhost:5173
```

If it doesn't open automatically, paste that address into your browser.

To **stop** the app, return to the terminal and press `Ctrl + C`.

### Open it on your phone or tablet

Start the server with the `--host` flag so other devices on the same Wi‑Fi can
reach it:

```bash
npm run dev -- --host
```

The terminal will print a **Network** address (e.g. `http://192.168.1.20:5173`).
Open that on your phone's browser. The app is designed to work on small screens.

---

## 5. Using the app

Use the two tabs at the top to switch between **Flashcards** and
**Practice Exam**.

### Flashcards

1. Pick a **Part** from the first dropdown.
2. Keep choosing from the dropdowns that appear (**Section**, then
   **Subsection**) until you reach a topic — the number in parentheses is how
   many cards it has.
3. The card appears. You can:
   - **Flip it** — click the card, press the **Flip** button, or press
     `Space` / `Enter` to reveal the answer.
   - **Navigate** — use **Prev** / **Next** or the `←` / `→` arrow keys.
   - **Shuffle** — randomize the order of the deck (click again to unshuffle).
   - **Self-check** — on a multiple-choice card, click an answer choice. The
     correct choice turns green; if you picked wrong, your choice turns red. A
     feedback line shows the correct letter and the handbook page.
   - **📖 Handbook** — opens your linked handbook PDF to this card's page in a
     new tab (appears only once you've linked a PDF — see below).

Some topics (the Part II IPO process diagrams) use **drag-and-drop** cards
instead of flip cards: drag each item into the correct category (Input /
Activity / Output …), or tap an item then tap a category, then **Check answers**
to see what you got right. These are authored separately and are read-only in
the app.

### Practice Exam

1. Open the **Practice Exam** tab.
2. **Scope** — check one or more Parts to draw questions only from those. Leave
   everything unchecked to use the entire question bank.
3. **Number of questions** — pick a preset or type your own (capped at how many
   are available in the chosen scope).
4. **Timed exam** — optional. Turn it on and set the minutes; the exam
   auto-submits when time runs out.
5. Click **Start Exam**. Answer the questions (you can scroll through them all),
   then click **Submit**.
6. You'll see your **score** and a **review** of every question — your answer vs.
   the correct one, with a link to the handbook page. Use **Retake** for a fresh
   random set, or **Change settings** to reconfigure.

Your exam settings are remembered in the browser for next time.

### Editing cards (fix errors or add new ones)

While running `npm run dev`, you can correct or add cards directly from the
Flashcards view — changes are written straight back to the source `cards.json`
file for that topic.

- **✎ Edit** — opens the current card in a form. Fix the question, the four
  options, which one is correct, or the page reference, then **Save**.
- **＋ Add** — adds a new card to the current topic.
- **Delete** — removes the current card (from inside the Edit form).

Edits are validated (four options A–D, one correct answer, a
`INCOSESEHB5 p.<n>` reference) and the file keeps its original formatting. Two
things to know:

- Editing only works under `npm run dev` (it needs the local dev server to write
  files). In a static build the buttons don't appear and cards are read-only.
- These files are also generated by separate authoring tools. If those tools
  regenerate a file, they may overwrite manual edits made here — so coordinate
  if both are in play.

### Linking your handbook PDF

The INCOSE SE Handbook is copyrighted, so it is **not** included with this app.
If you own a copy of the 5th-edition PDF, you can link it to turn every page
reference into a clickable jump-to-page link:

1. Click **🔗 Link Handbook PDF** in the top-right of the header.
2. Choose your handbook PDF file.

That's it. Your selection is stored locally in your browser (it is never
uploaded anywhere), so it stays linked the next time you open the app. Use
**Change** to swap files or **Remove** to unlink.

Until a PDF is linked, references still show the page number (e.g.
`INCOSESEHB5 p.14`) as plain text — they just aren't clickable, and the
📖 Handbook button is hidden.

> The page mapping assumes the official 5th-edition PDF, where PDF page = printed
> book page + 26. If your copy is paginated differently, edit `PAGE_OFFSET` in
> `src/lib/pdf.js`.

---

## 6. Keeping the cards up to date

The app loads `App/public/all_cards.json`, which ships with the repo. Updating
the card set requires the local card-source files and Python (the authoring
pipeline), which are **not part of this repo** — so a plain clone is read-only.
If you have that local setup, `npm run gen` rebuilds and refreshes
`App/public/all_cards.json`, and in-app edits refresh it for you automatically.

---

## 7. Optional: build a static version

For everyday studying, `npm run dev` is all you need. If you want a built copy:

```bash
npm run build     # creates the dist/ folder
npm run preview   # serves the built app locally for a final check
```

The built app keeps the same handbook-linking behavior — your linked PDF is
stored per browser, so you'd link it again in whatever browser serves the build.

---

## 8. Troubleshooting

| Problem | Likely cause & fix |
|---------|--------------------|
| **No Parts / cards appear** | `App/public/all_cards.json` is missing or empty (it ships with the repo). Try a hard refresh in the browser. |
| **References aren't clickable / no 📖 button** | You haven't linked a handbook PDF yet. Click **🔗 Link Handbook PDF** in the header (section 5). |
| **Handbook opens to the wrong page** | The page offset assumes the official 5th-edition PDF (PDF page = book page + 26). If your copy is paginated differently, edit `PAGE_OFFSET` in `src/lib/pdf.js`. |
| **Linked PDF doesn't stick / lost after reload** | Private/incognito windows and "clear site data" wipe the stored file. Re-link it, or use a normal browser window. |
| **`node` or `npm` not recognized** | Node.js isn't installed or the terminal predates the install. Install from nodejs.org and open a new terminal. |
| **Port 5173 is already in use** | Another dev server is running. Stop it, or run `npm run dev -- --port 5174`. |
| **`npm install` fails** | Make sure you're on Node 18+ (`node --version`), then delete `node_modules` and try again. |

---

## 9. How it works (for the curious)

- Built with **React** and **Vite**. It's a client-side app — no database, and
  the only server piece is dev-only helper middleware.
- At startup it fetches `/all_cards.json` (served from `App/public/`, a
  consolidated list of every card) and builds the Part → Section → Subsection
  tree in memory from each card's section number.
- The handbook PDF is never bundled or uploaded. When you link your copy, it is
  stored locally in the browser (IndexedDB) and referenced via an in-memory
  object URL, so page links work entirely on your machine.
