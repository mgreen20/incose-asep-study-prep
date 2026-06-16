import React, { useMemo, useState } from "react";
import { useCards } from "../lib/cardsData.jsx";
import FlashcardViewer from "./FlashcardViewer.jsx";
import { createCard, updateCard, deleteCard, toDoc } from "../lib/api.js";

// The card tree has variable depth (Part / Section / Subsection / Deck).
// We walk it with one selector per level until a deck (leaf) is chosen.
const LEVEL_LABELS = ["Part", "Section", "Subsection", "Topic", "Topic"];

export default function StudyView() {
  const { parts, editable, reload } = useCards();

  // selection = array of chosen node ids, one per level walked so far.
  const [selection, setSelection] = useState([]);

  const { levels, deck } = useMemo(() => {
    const levels = [];
    let siblings = parts;
    let deck = null;
    for (let depth = 0; depth < selection.length; depth++) {
      const chosen = siblings.find((n) => n.id === selection[depth]);
      levels.push({ options: siblings, value: selection[depth] });
      if (!chosen) break;
      if (chosen.type === "deck") {
        deck = chosen;
        siblings = [];
        break;
      }
      siblings = chosen.children || [];
    }
    if (!deck && siblings.length) {
      levels.push({ options: siblings, value: "" });
    }
    return { levels, deck };
  }, [selection, parts]);

  const choose = (depth, id) => {
    const next = selection.slice(0, depth);
    if (id) next.push(id);
    setSelection(next);
  };

  const meta = deck
    ? { section: deck.section, section_title: deck.sectionTitle, part: deck.partName }
    : null;

  // Editing writes to the per-leaf source file, then reloads the consolidated
  // data so the view reflects the change.
  const editApi = useMemo(() => {
    if (!editable || !deck) return null;
    const part = deck.partName;
    const section = deck.section;
    return {
      create: (fields) => createCard(part, section, toDoc(fields)).then(reload),
      update: (expect, fields) =>
        updateCard(part, section, expect, toDoc(fields)).then(reload),
      remove: (expect) => deleteCard(part, section, expect).then(reload),
    };
  }, [editable, deck, reload]);

  return (
    <div className="study">
      <div className="selectors">
        {levels.map((lvl, depth) => (
          <label className="field" key={depth}>
            <span className="field-label">{LEVEL_LABELS[depth] || "Topic"}</span>
            <select value={lvl.value} onChange={(e) => choose(depth, e.target.value)}>
              <option value="">— select —</option>
              {lvl.options.map((n) => (
                <option key={n.id} value={n.id}>
                  {n.name}
                  {n.type === "deck" ? `  (${n.count})` : ""}
                </option>
              ))}
            </select>
          </label>
        ))}
      </div>

      {deck ? (
        <FlashcardViewer
          key={deck.id}
          cards={deck.cards}
          deckId={deck.id}
          editApi={editApi}
          meta={meta}
        />
      ) : (
        <div className="empty">
          <p>Select a Part, then drill down to a topic to study its cards.</p>
        </div>
      )}
    </div>
  );
}
