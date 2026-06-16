import React from "react";
import { pdfHref } from "./pdf.js";
import { useHandbook } from "./handbook.jsx";

const BR = /<br\s*\/?>/i;

// Render a card reference. If the user has linked their handbook PDF and we can
// resolve a page, make it a link that opens the PDF at that page. Otherwise
// show plain text (page navigation stays disabled until a PDF is linked).
export function RefLink({ reference }) {
  const { url } = useHandbook();
  if (!reference) return null;
  const href = pdfHref(reference, url);
  if (!href) {
    return (
      <span
        className="ref-link plain"
        title={url ? undefined : "Link your handbook PDF to enable page links"}
      >
        {reference}
      </span>
    );
  }
  return (
    <a
      className="ref-link"
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      title="Open the handbook at this page"
      onClick={(e) => e.stopPropagation()}
    >
      {reference} ↗
    </a>
  );
}

// Card text uses literal <br> tags as line breaks and no other markup.
// Render them as real line breaks without dangerouslySetInnerHTML.
export function RichText({ text }) {
  if (!text) return null;
  const lines = text.split(BR);
  return (
    <>
      {lines.map((line, i) => (
        <React.Fragment key={i}>
          {line}
          {i < lines.length - 1 && <br />}
        </React.Fragment>
      ))}
    </>
  );
}

// Strip a leading "Answer: X — " prefix from an MCQ answer for clean display.
export function answerBody(back) {
  return back.replace(/^\s*Answer:\s*[A-D]\s*[—-]?\s*/i, "").trim();
}
