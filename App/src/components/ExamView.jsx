import React, { useEffect, useMemo, useRef, useState } from "react";
import { shuffle } from "../lib/cards.js";
import { useCards } from "../lib/cardsData.jsx";
import { RichText, RefLink } from "../lib/format.jsx";

const CONFIG_KEY = "asep-exam-config";

function loadConfig() {
  try {
    return JSON.parse(localStorage.getItem(CONFIG_KEY)) || {};
  } catch {
    return {};
  }
}

export default function ExamView() {
  const { parts: partNodes, mcqByParts } = useCards();
  const saved = loadConfig();
  const [phase, setPhase] = useState("config"); // config | running | results
  const [parts, setParts] = useState(saved.parts || []); // [] = all
  const [count, setCount] = useState(saved.count || 60);
  const [useTimer, setUseTimer] = useState(saved.useTimer ?? true);
  const [minutes, setMinutes] = useState(saved.minutes || 75);

  const [questions, setQuestions] = useState([]);
  const [answers, setAnswers] = useState({}); // cardId -> letter
  const [remaining, setRemaining] = useState(0);
  const timerRef = useRef(null);

  const pool = useMemo(() => mcqByParts(parts), [parts, mcqByParts]);

  useEffect(() => {
    localStorage.setItem(
      CONFIG_KEY,
      JSON.stringify({ parts, count, useTimer, minutes })
    );
  }, [parts, count, useTimer, minutes]);

  const togglePart = (name) => {
    setParts((prev) =>
      prev.includes(name) ? prev.filter((p) => p !== name) : [...prev, name]
    );
  };

  const start = () => {
    const n = Math.min(count, pool.length);
    setQuestions(shuffle(pool).slice(0, n));
    setAnswers({});
    setPhase("running");
    if (useTimer) {
      setRemaining(minutes * 60);
    }
    window.scrollTo(0, 0);
  };

  // Countdown timer with auto-submit.
  useEffect(() => {
    if (phase !== "running" || !useTimer) return;
    timerRef.current = setInterval(() => {
      setRemaining((r) => {
        if (r <= 1) {
          clearInterval(timerRef.current);
          setPhase("results");
          return 0;
        }
        return r - 1;
      });
    }, 1000);
    return () => clearInterval(timerRef.current);
  }, [phase, useTimer]);

  const submit = () => {
    clearInterval(timerRef.current);
    setPhase("results");
    window.scrollTo(0, 0);
  };

  const reset = () => setPhase("config");

  if (phase === "config") {
    return (
      <div className="exam-config">
        <h2>Practice Exam</h2>
        <p className="muted">
          Auto-graded multiple-choice test drawn at random from the question
          bank. {pool.length} questions available in the current scope.
        </p>

        <div className="field">
          <span className="field-label">Scope (leave all unchecked = entire bank)</span>
          <div className="part-checks">
            {partNodes.map((p) => (
              <label key={p.id} className="check">
                <input
                  type="checkbox"
                  checked={parts.includes(p.partName)}
                  onChange={() => togglePart(p.partName)}
                />
                {p.name}
              </label>
            ))}
          </div>
        </div>

        <div className="field">
          <span className="field-label">Number of questions</span>
          <div className="presets">
            {[25, 50, 60, 100, 120].map((n) => (
              <button
                key={n}
                className={`btn ghost ${count === n ? "active" : ""}`}
                onClick={() => setCount(n)}
              >
                {n}
              </button>
            ))}
            <input
              type="number"
              min="1"
              max={pool.length}
              value={count}
              onChange={(e) => setCount(Number(e.target.value) || 1)}
            />
          </div>
          <span className="muted small">
            Will use {Math.min(count, pool.length)} (capped at available pool).
          </span>
        </div>

        <div className="field">
          <label className="check">
            <input
              type="checkbox"
              checked={useTimer}
              onChange={(e) => setUseTimer(e.target.checked)}
            />
            Timed exam
          </label>
          {useTimer && (
            <div className="presets">
              <input
                type="number"
                min="1"
                value={minutes}
                onChange={(e) => setMinutes(Number(e.target.value) || 1)}
              />
              <span className="muted">minutes</span>
            </div>
          )}
        </div>

        <button className="btn primary big" onClick={start} disabled={!pool.length}>
          Start Exam
        </button>
      </div>
    );
  }

  if (phase === "running") {
    const answeredCount = Object.keys(answers).length;
    return (
      <div className="exam-running">
        <div className="exam-topbar">
          <span className="muted">
            {answeredCount} / {questions.length} answered
          </span>
          {useTimer && (
            <span className={`timer ${remaining < 60 ? "low" : ""}`}>
              ⏱ {String(Math.floor(remaining / 60)).padStart(2, "0")}:
              {String(remaining % 60).padStart(2, "0")}
            </span>
          )}
          <button className="btn primary" onClick={submit}>
            Submit
          </button>
        </div>

        <ol className="qlist">
          {questions.map((q, i) => (
            <li key={q.id} className="question">
              <div className="q-stem">
                <span className="q-num">{i + 1}.</span>
                <RichText text={q.stem} />
              </div>
              <ul className="choices">
                {q.choices.map((ch) => (
                  <li key={ch.letter}>
                    <label className="choice">
                      <input
                        type="radio"
                        name={q.id}
                        checked={answers[q.id] === ch.letter}
                        onChange={() =>
                          setAnswers((a) => ({ ...a, [q.id]: ch.letter }))
                        }
                      />
                      <span className="choice-letter">{ch.letter}</span>
                      {ch.text}
                    </label>
                  </li>
                ))}
              </ul>
            </li>
          ))}
        </ol>

        <button className="btn primary big" onClick={submit}>
          Submit Exam
        </button>
      </div>
    );
  }

  // results
  const correct = questions.filter((q) => answers[q.id] === q.answer).length;
  const pct = questions.length
    ? Math.round((correct / questions.length) * 100)
    : 0;
  const misses = questions.filter((q) => answers[q.id] !== q.answer);

  return (
    <div className="exam-results">
      <div className={`score-card ${pct >= 70 ? "pass" : "fail"}`}>
        <div className="score-pct">{pct}%</div>
        <div className="score-detail">
          {correct} / {questions.length} correct
          <br />
          <span className="muted">Indicative passing line ≈ 70%</span>
        </div>
      </div>

      <div className="results-actions">
        <button className="btn primary" onClick={start}>
          Retake (new random set)
        </button>
        <button className="btn" onClick={reset}>
          Change settings
        </button>
      </div>

      <h3>Review {misses.length ? `— ${misses.length} missed` : "— perfect score!"}</h3>
      <ol className="review">
        {questions.map((q, i) => {
          const picked = answers[q.id];
          const right = picked === q.answer;
          return (
            <li key={q.id} className={`review-item ${right ? "ok" : "bad"}`}>
              <div className="q-stem">
                <span className="q-num">{i + 1}.</span>
                <RichText text={q.stem} />
              </div>
              <ul className="choices">
                {q.choices.map((ch) => {
                  const isAnswer = ch.letter === q.answer;
                  const isPicked = ch.letter === picked;
                  return (
                    <li
                      key={ch.letter}
                      className={`review-choice ${isAnswer ? "answer" : ""} ${
                        isPicked && !isAnswer ? "wrong" : ""
                      }`}
                    >
                      <span className="choice-letter">{ch.letter}</span>
                      {ch.text}
                      {isAnswer && <span className="badge ok">correct</span>}
                      {isPicked && !isAnswer && (
                        <span className="badge bad">your answer</span>
                      )}
                    </li>
                  );
                })}
              </ul>
              <div className="review-meta">
                {!picked && <span className="badge bad">not answered</span>}
                {q.reference && <RefLink reference={q.reference} />}
                <span className="ref">{q.partName}</span>
              </div>
            </li>
          );
        })}
      </ol>
    </div>
  );
}
