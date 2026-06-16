import React, { useState } from "react";

// Modal form for creating or editing one MCQ card. `card` is an existing
// normalized card (edit) or null (create). `meta` carries the fixed
// section/section_title/part for the deck. onSave receives form fields.
export default function CardEditor({ card, meta, onSave, onCancel, onDelete, busy }) {
  const seed = (letter) =>
    card ? (card.choices.find((c) => c.letter === letter)?.text ?? "") : "";

  const [question, setQuestion] = useState(card ? card.stem : "");
  const [options, setOptions] = useState({
    A: seed("A"),
    B: seed("B"),
    C: seed("C"),
    D: seed("D"),
  });
  const [correct, setCorrect] = useState(card ? card.answer : "A");
  const [reference, setReference] = useState(
    card ? card.reference : "INCOSESEHB5 p."
  );
  const [error, setError] = useState(null);

  const setOpt = (k, v) => setOptions((o) => ({ ...o, [k]: v }));

  const submit = (e) => {
    e.preventDefault();
    setError(null);
    if (!question.trim()) return setError("Question is required.");
    for (const k of ["A", "B", "C", "D"]) {
      if (!options[k].trim()) return setError(`Option ${k} is required.`);
    }
    if (!/^INCOSESEHB5 p\.\d+/.test(reference.trim()))
      return setError('Reference must look like "INCOSESEHB5 p.14".');
    onSave({
      section: meta.section,
      section_title: meta.section_title,
      part: meta.part,
      question,
      options,
      correct_answer: correct,
      reference,
    });
  };

  return (
    <div className="modal-overlay" onClick={onCancel}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <h3>{card ? "Edit card" : "Add card"}</h3>
        <p className="muted small">
          {meta.section} — {meta.section_title} ({meta.part})
        </p>

        <form onSubmit={submit}>
          <label className="field">
            <span className="field-label">Question</span>
            <textarea
              rows={3}
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              autoFocus
            />
          </label>

          {["A", "B", "C", "D"].map((k) => (
            <label className="field" key={k}>
              <span className="field-label">
                <input
                  type="radio"
                  name="correct"
                  checked={correct === k}
                  onChange={() => setCorrect(k)}
                />{" "}
                Option {k} {correct === k && <em>(correct)</em>}
              </span>
              <textarea
                rows={2}
                value={options[k]}
                onChange={(e) => setOpt(k, e.target.value)}
              />
            </label>
          ))}

          <label className="field">
            <span className="field-label">Reference</span>
            <input
              type="text"
              value={reference}
              onChange={(e) => setReference(e.target.value)}
              placeholder="INCOSESEHB5 p.14"
            />
          </label>

          {error && <div className="form-error">{error}</div>}

          <div className="modal-actions">
            {card && onDelete && (
              <button
                type="button"
                className="btn danger"
                onClick={onDelete}
                disabled={busy}
              >
                Delete
              </button>
            )}
            <span className="spacer" />
            <button type="button" className="btn" onClick={onCancel} disabled={busy}>
              Cancel
            </button>
            <button type="submit" className="btn primary" disabled={busy}>
              {busy ? "Saving…" : "Save"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
