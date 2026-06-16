import React, { useRef } from "react";
import { useHandbook } from "../lib/handbook.jsx";

// Lets the user attach their own copy of the handbook PDF (kept locally in the
// browser). Until a PDF is linked, page-reference links stay disabled.
export default function HandbookControl() {
  const { url, name, link, clear } = useHandbook();
  const inputRef = useRef(null);

  const pick = () => inputRef.current && inputRef.current.click();
  const onChange = (e) => {
    const file = e.target.files && e.target.files[0];
    if (file) link(file);
    e.target.value = ""; // allow re-selecting the same file later
  };

  return (
    <div className="handbook-control">
      <input
        ref={inputRef}
        type="file"
        accept="application/pdf,.pdf"
        hidden
        onChange={onChange}
      />
      {url ? (
        <>
          <span className="hb-linked" title={name || "linked"}>
            📖 <span className="hb-name">{name || "Handbook linked"}</span>
          </span>
          <button className="btn ghost btn-sm" onClick={pick}>
            Change
          </button>
          <button className="btn ghost btn-sm" onClick={clear}>
            Remove
          </button>
        </>
      ) : (
        <button
          className="btn ghost"
          onClick={pick}
          title="Select your own copy of the INCOSE SE Handbook PDF to enable page links"
        >
          🔗 Link Handbook PDF
        </button>
      )}
    </div>
  );
}
