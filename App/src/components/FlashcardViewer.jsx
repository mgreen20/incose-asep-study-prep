import React, { useEffect, useState } from "react";
import { RichText, answerBody, RefLink } from "../lib/format.jsx";
import { shuffle } from "../lib/cards.js";
import { pdfHref } from "../lib/pdf.js";
import { useHandbook } from "../lib/handbook.jsx";
import CardEditor from "./CardEditor.jsx";
import IPOExercise from "./IPOExercise.jsx";

export default function FlashcardViewer({ cards, deckId, editApi, meta }) {
  const [order, setOrder] = useState(() => cards.map((_, i) => i));
  const [pos, setPos] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [shuffled, setShuffled] = useState(false);
  const [picked, setPicked] = useState(null); // selected choice letter (MCQ study self-check)
  const { url: handbookUrl } = useHandbook();

  const [editorMode, setEditorMode] = useState(null); // null | "add" | "edit"
  const [busy, setBusy] = useState(false);
  const [opError, setOpError] = useState(null);

  // Full reset when switching decks.
  useEffect(() => {
    setOrder(cards.map((_, i) => i));
    setPos(0);
    setFlipped(false);
    setShuffled(false);
    setPicked(null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [deckId]);

  // Reconcile the order array when the number of cards changes (add/delete).
  useEffect(() => {
    setOrder((prev) => {
      if (prev.length === cards.length) return prev;
      return cards.map((_, i) => i);
    });
    setShuffled(false);
    setPos((p) => Math.min(p, Math.max(cards.length - 1, 0)));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cards.length]);

  const card = cards[order[pos]];

  const go = (delta) => {
    setFlipped(false);
    setPicked(null);
    setPos((p) => Math.min(Math.max(p + delta, 0), order.length - 1));
  };

  const toggleShuffle = () => {
    setOrder(shuffled ? cards.map((_, i) => i) : shuffle(cards.map((_, i) => i)));
    setShuffled(!shuffled);
    setPos(0);
    setFlipped(false);
    setPicked(null);
  };

  // Keyboard: space/enter flip, arrows navigate (disabled while editing).
  useEffect(() => {
    const onKey = (e) => {
      if (editorMode) return;
      if (e.target.matches?.("input, textarea")) return;
      if (e.key === " " || e.key === "Enter") {
        e.preventDefault();
        setFlipped((f) => !f);
      } else if (e.key === "ArrowRight") go(1);
      else if (e.key === "ArrowLeft") go(-1);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  });

  const handleSave = async (fields) => {
    setBusy(true);
    setOpError(null);
    try {
      if (editorMode === "add") await editApi.create(fields);
      else await editApi.update(card.stem, fields);
      setEditorMode(null);
      setPicked(null);
      setFlipped(false);
    } catch (e) {
      setOpError(e.message);
    } finally {
      setBusy(false);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm("Delete this card? This edits the source file.")) return;
    setBusy(true);
    setOpError(null);
    try {
      await editApi.remove(card.stem);
      setEditorMode(null);
    } catch (e) {
      setOpError(e.message);
    } finally {
      setBusy(false);
    }
  };

  // Empty deck (e.g. after deleting the last card).
  if (!card) {
    return (
      <div className="viewer">
        <div className="empty">
          <p>No cards in this topic.</p>
          {editApi && (
            <button className="btn primary" onClick={() => setEditorMode("add")}>
              ＋ Add a card
            </button>
          )}
        </div>
        {editorMode && (
          <CardEditor
            card={null}
            meta={meta}
            busy={busy}
            onSave={handleSave}
            onCancel={() => setEditorMode(null)}
          />
        )}
        {opError && <div className="form-error">{opError}</div>}
      </div>
    );
  }

  const front = card.type === "mcq" ? card.stem : card.front;

  return (
    <div className="viewer">
      <div className="viewer-bar">
        <span className="muted">
          Card {pos + 1} / {order.length}
        </span>
        <div className="viewer-actions">
          {editApi && (
            <button className="btn ghost" onClick={() => setEditorMode("add")}>
              ＋ Add
            </button>
          )}
          {editApi && card.type === "mcq" && (
            <button className="btn ghost" onClick={() => setEditorMode("edit")}>
              ✎ Edit
            </button>
          )}
          {pdfHref(card.reference, handbookUrl) && (
            <a
              className="btn ghost"
              href={pdfHref(card.reference, handbookUrl)}
              target="_blank"
              rel="noopener noreferrer"
              title="Open the handbook at this card's page"
            >
              📖 Handbook
            </a>
          )}
          <button className="btn ghost" onClick={toggleShuffle}>
            {shuffled ? "↺ Unshuffle" : "🔀 Shuffle"}
          </button>
        </div>
      </div>

      {card.type === "ipo" ? (
        <div className="ipo-card">
          <IPOExercise card={card} key={card.id} />
          {card.reference && (
            <div className="ref">
              <RefLink reference={card.reference} />
            </div>
          )}
        </div>
      ) : (
      <div
        className={`flashcard ${flipped ? "is-flipped" : ""}`}
        onClick={() => setFlipped((f) => !f)}
        role="button"
        tabIndex={0}
      >
        <div className="flashcard-inner">
          <div className="flashcard-face front">
            <div className="face-label">Question</div>
            <div className="face-body">
              <RichText text={front} />
            </div>
            {card.type === "mcq" && (
              <>
                <ul className="choices study">
                  {card.choices.map((ch) => {
                    const isCorrect = ch.letter === card.answer;
                    const isPicked = ch.letter === picked;
                    const cls = picked
                      ? isCorrect
                        ? "correct"
                        : isPicked
                        ? "incorrect"
                        : ""
                      : "";
                    return (
                      <li key={ch.letter} className={cls}>
                        <button
                          type="button"
                          className="study-choice"
                          disabled={!!picked}
                          onClick={(e) => {
                            e.stopPropagation();
                            setPicked(ch.letter);
                          }}
                        >
                          <span className="choice-letter">{ch.letter}</span>
                          <span className="choice-text">{ch.text}</span>
                          {picked && isCorrect && <span className="tick">✓</span>}
                          {picked && isPicked && !isCorrect && (
                            <span className="tick">✗</span>
                          )}
                        </button>
                      </li>
                    );
                  })}
                </ul>
                {picked && (
                  <div className="study-feedback">
                    {picked === card.answer ? (
                      <span className="fb-correct">✓ Correct</span>
                    ) : (
                      <span className="fb-wrong">
                        ✗ Correct answer: {card.answer}
                      </span>
                    )}
                    {card.reference && <RefLink reference={card.reference} />}
                  </div>
                )}
              </>
            )}
            <div className="flip-hint">
              {card.type === "mcq" && !picked
                ? "Select an answer — or flip for the full answer"
                : "Click or press Space to flip"}
            </div>
          </div>
          <div className="flashcard-face back">
            <div className="face-label">Answer</div>
            <div className="face-body">
              {card.type === "mcq" ? (
                <>
                  <div className="answer-letter">Answer: {card.answer}</div>
                  <div>{answerBody(card.back)}</div>
                </>
              ) : (
                <RichText text={card.back} />
              )}
            </div>
            {card.reference && (
              <div className="ref">
                <RefLink reference={card.reference} />
              </div>
            )}
          </div>
        </div>
      </div>
      )}

      <div className="viewer-nav">
        <button className="btn" onClick={() => go(-1)} disabled={pos === 0}>
          ← Prev
        </button>
        {card.type !== "ipo" && (
          <button className="btn primary" onClick={() => setFlipped((f) => !f)}>
            Flip
          </button>
        )}
        <button
          className="btn"
          onClick={() => go(1)}
          disabled={pos === order.length - 1}
        >
          Next →
        </button>
      </div>

      {opError && <div className="form-error">{opError}</div>}

      {editorMode && (
        <CardEditor
          card={editorMode === "edit" ? card : null}
          meta={meta}
          busy={busy}
          onSave={handleSave}
          onCancel={() => setEditorMode(null)}
          onDelete={editorMode === "edit" ? handleDelete : undefined}
        />
      )}
    </div>
  );
}
