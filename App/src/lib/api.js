// Client helpers for the dev-server CRUD API (scripts/cards-api.js) and for
// normalizing cards loaded from /all_cards.json. The CRUD calls only work while
// running `npm run dev`; in a static build they fail and editing is hidden.

const CHOICE_KEYS = ["A", "B", "C", "D"];

// Normalize a consolidated all_cards.json document into the shape the app
// renders. Cards carry a stable `card_id`, used as the React/key identity.
export function normalizeDoc(doc, fallbackIdx) {
  const base = {
    id: doc.card_id || `c${fallbackIdx}`,
    cardId: doc.card_id || null,
    reference: String(doc.reference ?? "").trim(),
    partName: String(doc.part ?? "").trim(),
    section: String(doc.section ?? "").trim(),
    sectionTitle: String(doc.section_title ?? "").trim(),
  };

  if (doc.card_type === "drag_and_drop") {
    return {
      ...base,
      type: "ipo",
      prompt: String(doc.question ?? doc.prompt ?? "").trim(),
      categories: Array.isArray(doc.categories) ? doc.categories.map(String) : [],
      items: Array.isArray(doc.items)
        ? doc.items.map((it) => ({
            text: String(it.text ?? "").trim(),
            category: String(it.category ?? "").trim(),
          }))
        : [],
    };
  }

  const options = doc.options || {};
  const keys = CHOICE_KEYS.filter((k) => k in options);
  const choices = (keys.length ? keys : Object.keys(options)).map((k) => ({
    letter: k,
    text: String(options[k] ?? "").trim(),
  }));
  return {
    ...base,
    type: "mcq",
    stem: String(doc.question ?? "").trim(),
    choices,
    answer: String(doc.correct_answer ?? "").trim().toUpperCase(),
    back: String(doc.correct_answer_text ?? options[doc.correct_answer] ?? "").trim(),
  };
}

async function request(method, body) {
  const res = await fetch("/api/deck", {
    method,
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const msg = data.errs ? `${data.error}: ${data.errs.join("; ")}` : data.error;
    throw new Error(msg || `request failed (${res.status})`);
  }
  return data;
}

// Is the editing API reachable (i.e. running under `npm run dev`)?
export async function checkEditable() {
  try {
    const res = await fetch("/api/health");
    if (!res.ok) return false;
    const data = await res.json();
    return !!(data && data.editable);
  } catch {
    return false;
  }
}

export const createCard = (part, section, card) =>
  request("POST", { part, section, card });
export const updateCard = (part, section, expect, card) =>
  request("PUT", { part, section, expect, card });
export const deleteCard = (part, section, expect) =>
  request("DELETE", { part, section, expect });

// Build a source-schema MCQ doc from editor form fields + fixed deck metadata.
export function toDoc({ section, section_title, part, question, options, correct_answer, reference }) {
  return {
    card_type: "mcq",
    section,
    section_title,
    part,
    question: question.trim(),
    options: {
      A: options.A.trim(),
      B: options.B.trim(),
      C: options.C.trim(),
      D: options.D.trim(),
    },
    correct_answer,
    correct_answer_text: options[correct_answer].trim(),
    reference: reference.trim(),
  };
}
