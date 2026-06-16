import React, { useState } from "react";
import StudyView from "./components/StudyView.jsx";
import ExamView from "./components/ExamView.jsx";
import HandbookControl from "./components/HandbookControl.jsx";
import { useCards } from "./lib/cardsData.jsx";

export default function App() {
  const [tab, setTab] = useState("study");
  const { loading, error, stats } = useCards();

  return (
    <div className="app">
      <header className="app-header">
        <div className="brand">
          <h1>INCOSE ASEP Study Prep Guide</h1>
          <span className="muted small">
            {stats.totalCards.toLocaleString()} cards ·{" "}
            {stats.totalMcq.toLocaleString()} exam questions
          </span>
        </div>
        <nav className="tabs">
          <button
            className={`tab ${tab === "study" ? "active" : ""}`}
            onClick={() => setTab("study")}
          >
            Flashcards
          </button>
          <button
            className={`tab ${tab === "exam" ? "active" : ""}`}
            onClick={() => setTab("exam")}
          >
            Practice Exam
          </button>
        </nav>
        <HandbookControl />
      </header>

      <main className="app-main">
        {loading ? (
          <div className="empty">
            <p>Loading cards…</p>
          </div>
        ) : error ? (
          <div className="empty">
            <p className="form-error">Could not load cards: {error}</p>
            <p className="muted small">
              Make sure <code>public/all_cards.json</code> exists and the dev
              server is running.
            </p>
          </div>
        ) : stats.totalCards === 0 ? (
          <div className="empty">
            <p>No cards found.</p>
            <p className="muted small">
              <code>public/all_cards.json</code> appears to be empty.
            </p>
          </div>
        ) : tab === "study" ? (
          <StudyView />
        ) : (
          <ExamView />
        )}
      </main>
    </div>
  );
}
