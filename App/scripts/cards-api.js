// Vite dev-server plugin: cardsApi() — an optional, local-only editing API.
//
// The app loads its cards from /all_cards.json, which Vite serves directly from
// App/public/. This plugin adds CRUD over the per-leaf source files (which are
// kept locally, outside the shipped repo, and remain authoritative for edits):
//   GET    /api/health
//   POST   /api/deck   { part, section, card }
//   PUT    /api/deck   { part, section, expect, card }
//   DELETE /api/deck   { part, section, expect }
//
// After any write it reruns the local build script to refresh all_cards.json and
// copies the result into App/public/ so the change shows up on reload. Editing
// is only available where the local source files exist (see /api/health); a
// plain clone of the shipped app has no source and is read-only.
//
// A card is located by (part, section) -> its leaf file (derived from the
// directory-naming convention), then matched within the file by `expect` (the
// original question text), since per-leaf files carry no stable id.

import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const CARDS_ROOT = path.resolve(__dirname, "..", "..", "card_source");
const ALL_CARDS = path.join(CARDS_ROOT, "all_cards.json");
const BUILD_SCRIPT = path.resolve(CARDS_ROOT, "..", "python", "build_all_cards.py");
// The app serves this committed copy (App/public is served at /all_cards.json).
const PUBLIC_ALL = path.resolve(__dirname, "..", "public", "all_cards.json");

const FIELD_ORDER = [
  "card_type",
  "section",
  "section_title",
  "part",
  "question",
  "options",
  "correct_answer",
  "correct_answer_text",
  "reference",
];

function send(res, status, body) {
  res.statusCode = status;
  res.setHeader("Content-Type", "application/json");
  res.end(JSON.stringify(body));
}

function readBody(req) {
  return new Promise((resolve, reject) => {
    let data = "";
    req.on("data", (c) => {
      data += c;
      if (data.length > 5_000_000) reject(new Error("body too large"));
    });
    req.on("end", () => {
      try {
        resolve(data ? JSON.parse(data) : {});
      } catch (e) {
        reject(e);
      }
    });
    req.on("error", reject);
  });
}

// "Part II" -> "PartII"
function partDirPrefix(part) {
  const roman = String(part || "").replace(/^Part\s+/i, "").trim();
  return `Part${roman}_`;
}

// Resolve the leaf cards.json for (part, section) using the directory naming
// convention: Part<roman>_…/<section-with-p>_…/cards.json. Returns null if not found.
function resolveLeaf(part, section) {
  if (!part || !section) return null;
  const wantPart = partDirPrefix(part);
  const sectionPrefix = section.replace(/\./g, "p") + "_";
  let parts;
  try {
    parts = fs.readdirSync(CARDS_ROOT, { withFileTypes: true });
  } catch {
    return null;
  }
  const partDir = parts.find((d) => d.isDirectory() && d.name.startsWith(wantPart));
  if (!partDir) return null;
  const partPath = path.join(CARDS_ROOT, partDir.name);
  const subs = fs.readdirSync(partPath, { withFileTypes: true });
  const secDir = subs.find((d) => d.isDirectory() && d.name.startsWith(sectionPrefix));
  if (!secDir) return null;
  const file = path.join(partPath, secDir.name, "cards.json");
  return fs.existsSync(file) ? file : null;
}

export function validateCard(c) {
  const errs = [];
  if (!c || typeof c !== "object") return ["card must be an object"];
  if (!c.question || typeof c.question !== "string" || !c.question.trim())
    errs.push("question is required");
  if (!c.options || typeof c.options !== "object") {
    errs.push("options are required");
  } else {
    const keys = Object.keys(c.options);
    if (keys.length !== 4 || !["A", "B", "C", "D"].every((k) => keys.includes(k)))
      errs.push("options must have exactly keys A, B, C, D");
    for (const k of ["A", "B", "C", "D"]) {
      if (typeof c.options[k] !== "string" || !c.options[k].trim())
        errs.push(`option ${k} must be non-empty text`);
    }
  }
  if (!["A", "B", "C", "D"].includes(c.correct_answer))
    errs.push("correct_answer must be one of A, B, C, D");
  if (c.options && c.correct_answer && c.correct_answer_text !== c.options[c.correct_answer])
    errs.push("correct_answer_text must equal options[correct_answer]");
  if (!c.reference || !/^INCOSESEHB5 p\.\d+/.test(c.reference))
    errs.push('reference must start with "INCOSESEHB5 p.<number>"');
  return errs;
}

function ordered(c) {
  const o = {};
  for (const k of FIELD_ORDER) o[k] = c[k];
  o.card_type = "mcq";
  o.options = { A: c.options.A, B: c.options.B, C: c.options.C, D: c.options.D };
  return o;
}

function readArr(full) {
  const raw = fs.readFileSync(full, "utf8");
  const eol = raw.includes("\r\n") ? "\r\n" : "\n";
  const arr = JSON.parse(raw);
  if (!Array.isArray(arr)) throw new Error("file is not a JSON array");
  return { arr, eol };
}

function writeArr(full, arr, eol) {
  let text = JSON.stringify(arr, null, 2);
  if (eol === "\r\n") text = text.replace(/\n/g, "\r\n");
  fs.writeFileSync(full, text + eol, "utf8");
}

// Refresh all_cards.json from the per-leaf source files, then copy it to the
// app's served public/ copy so the change shows up on reload. Returns {ok,error}.
function rebuildAllCards() {
  if (!fs.existsSync(BUILD_SCRIPT)) return { ok: false, error: "build script missing" };
  for (const py of ["python", "py", "python3"]) {
    const r = spawnSync(py, [BUILD_SCRIPT], { encoding: "utf8" });
    if (r.error && r.error.code === "ENOENT") continue; // try next interpreter
    if (r.status !== 0) {
      return { ok: false, error: (r.stderr || r.error?.message || "build failed").trim() };
    }
    try {
      fs.copyFileSync(ALL_CARDS, PUBLIC_ALL);
    } catch (e) {
      return { ok: false, error: `built but copy to public failed: ${e.message}` };
    }
    return { ok: true };
  }
  return { ok: false, error: "python not found" };
}

async function handle(req, res) {
  const url = new URL(req.url, "http://localhost");

  if (req.method === "GET" && url.pathname === "/api/health") {
    // Editing is only possible where the per-leaf source files exist (i.e. a
    // local authoring checkout, not a plain clone of the shipped app).
    return send(res, 200, { ok: true, editable: fs.existsSync(CARDS_ROOT) });
  }

  const body = await readBody(req).catch(() => null);
  if (!body) return send(res, 400, { error: "invalid JSON body" });

  const full = resolveLeaf(body.part, body.section);
  if (!full) return send(res, 404, { error: "could not locate cards file for part/section" });
  const { arr, eol } = readArr(full);

  // Ensure the card carries the identifying fields the per-leaf schema and the
  // consolidation script require, filling from the request / existing cards.
  const fill = (c) => ({
    ...c,
    card_type: "mcq",
    part: c.part || body.part,
    section: c.section || body.section,
    section_title: c.section_title || (arr[0] && arr[0].section_title) || "",
  });

  if (req.method === "POST") {
    const card = fill(body.card || {});
    const errs = validateCard(card);
    if (errs.length) return send(res, 422, { error: "validation failed", errs });
    arr.push(ordered(card));
    writeArr(full, arr, eol);
    return send(res, 200, { ok: true, rebuild: rebuildAllCards() });
  }

  if (req.method === "PUT" || req.method === "DELETE") {
    const idx = arr.findIndex((c) => c.question === body.expect);
    if (idx === -1) return send(res, 409, { error: "card not found (it may have changed); please refresh" });

    if (req.method === "DELETE") {
      arr.splice(idx, 1);
      writeArr(full, arr, eol);
      return send(res, 200, { ok: true, rebuild: rebuildAllCards() });
    }
    const card = fill(body.card || {});
    const errs = validateCard(card);
    if (errs.length) return send(res, 422, { error: "validation failed", errs });
    arr[idx] = ordered(card);
    writeArr(full, arr, eol);
    return send(res, 200, { ok: true, rebuild: rebuildAllCards() });
  }

  return send(res, 405, { error: "method not allowed" });
}

export function cardsApi() {
  const mw = (req, res, next) => {
    if (!req.url || !req.url.startsWith("/api/")) return next();
    handle(req, res).catch((e) => send(res, 500, { error: String(e.message || e) }));
  };
  return {
    name: "cards-api",
    configureServer(server) {
      server.middlewares.use(mw);
    },
  };
}

// Note: all_cards.json is served by Vite directly from App/public/ at
// /all_cards.json (dev, preview, and static build) — no middleware needed.
