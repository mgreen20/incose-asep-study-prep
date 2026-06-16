import React, { useEffect, useMemo, useState } from "react";
import { shuffle } from "../lib/cards.js";

const POOL = "__pool__";

// Categorize-into-buckets exercise. Each item starts in the pool; the user
// drags (desktop) or taps (touch) it into one of the category buckets, then
// checks. Supports both interaction modes for cross-device use.
export default function IPOExercise({ card }) {
  // Stable item objects with ids tied to their original index.
  const items = useMemo(
    () => card.items.map((it, i) => ({ id: i, text: it.text, category: it.category })),
    [card]
  );

  const [placement, setPlacement] = useState({}); // itemId -> category | POOL
  const [selected, setSelected] = useState(null); // tap-to-place selection
  const [checked, setChecked] = useState(false);
  const [poolOrder, setPoolOrder] = useState([]);

  const reset = () => {
    const init = {};
    items.forEach((it) => (init[it.id] = POOL));
    setPlacement(init);
    setSelected(null);
    setChecked(false);
    setPoolOrder(shuffle(items.map((it) => it.id)));
  };

  useEffect(reset, [card]); // reset whenever the card changes

  const place = (itemId, category) => {
    setPlacement((p) => ({ ...p, [itemId]: category }));
    setSelected(null);
    setChecked(false);
  };

  // Tapping an item selects it; tapping a target places the selected item.
  const onItemClick = (itemId) => {
    setSelected((s) => (s === itemId ? null : itemId));
  };
  const onTargetClick = (category) => {
    if (selected != null) place(selected, category);
  };

  // Native drag handlers (desktop).
  const onDragStart = (e, itemId) => {
    e.dataTransfer.setData("text/plain", String(itemId));
    e.dataTransfer.effectAllowed = "move";
  };
  const onDrop = (e, category) => {
    e.preventDefault();
    const itemId = Number(e.dataTransfer.getData("text/plain"));
    if (!Number.isNaN(itemId)) place(itemId, category);
  };
  const allowDrop = (e) => e.preventDefault();

  const itemsIn = (category) =>
    (category === POOL ? poolOrder : items.map((it) => it.id)).filter(
      (id) => placement[id] === category
    );

  const correctCount = items.filter((it) => placement[it.id] === it.category).length;
  const placedCount = items.filter((it) => placement[it.id] !== POOL).length;
  const allPlaced = placedCount === items.length;

  const renderItem = (id) => {
    const it = items[id];
    let cls = "ipo-item";
    if (selected === id) cls += " selected";
    if (checked) cls += placement[id] === it.category ? " ok" : " bad";
    return (
      <li
        key={id}
        className={cls}
        draggable={!checked}
        onDragStart={(e) => onDragStart(e, id)}
        onClick={() => !checked && onItemClick(id)}
      >
        {it.text}
        {checked && (
          <span className="ipo-mark">
            {placement[id] === it.category ? "✓" : "✗"}
          </span>
        )}
      </li>
    );
  };

  return (
    <div className="ipo">
      <div className="face-label">Drag &amp; Drop — categorize each item</div>
      <p className="ipo-prompt">{card.prompt}</p>

      <div className="ipo-board">
        <div
          className={`ipo-bucket pool ${selected != null ? "droppable" : ""}`}
          onDrop={(e) => onDrop(e, POOL)}
          onDragOver={allowDrop}
          onClick={() => onTargetClick(POOL)}
        >
          <div className="ipo-bucket-title">Items</div>
          <ul className="ipo-list">{itemsIn(POOL).map(renderItem)}</ul>
        </div>

        <div className="ipo-categories">
          {card.categories.map((cat) => (
            <div
              key={cat}
              className={`ipo-bucket ${selected != null ? "droppable" : ""}`}
              onDrop={(e) => onDrop(e, cat)}
              onDragOver={allowDrop}
              onClick={() => onTargetClick(cat)}
            >
              <div className="ipo-bucket-title">{cat}</div>
              <ul className="ipo-list">{itemsIn(cat).map(renderItem)}</ul>
            </div>
          ))}
        </div>
      </div>

      <div className="ipo-actions">
        {!checked ? (
          <button
            className="btn primary"
            onClick={() => setChecked(true)}
            disabled={!allPlaced}
            title={allPlaced ? "" : "Place every item first"}
          >
            Check answers
          </button>
        ) : (
          <span className={`ipo-score ${correctCount === items.length ? "pass" : "fail"}`}>
            {correctCount} / {items.length} correct
          </span>
        )}
        <button className="btn" onClick={reset}>
          Reset
        </button>
        {!allPlaced && !checked && (
          <span className="muted small">
            {placedCount}/{items.length} placed
          </span>
        )}
      </div>

      <p className="muted small ipo-hint">
        Drag items into a category, or tap an item then tap a category.
      </p>
    </div>
  );
}
