// Resolve a card reference to a page in the user's handbook PDF.
//
// References look like "INCOSESEHB5 p.14", where 14 is the *book* page number.
// The handbook PDF is offset: PDF page = book page + 26 (PDF p.27 = book p.1,
// verified against the 5th-edition handbook). Browsers' built-in PDF viewers
// honor the "#page=N" fragment to open at a specific (1-based) physical page.
//
// The PDF is not bundled with the app — the user links their own copy (see
// src/lib/handbook.jsx), which provides the base object URL.

const PAGE_OFFSET = 26;

export function pdfPage(reference) {
  const m = /p\.?\s*(\d+)/i.exec(reference || "");
  if (!m) return null;
  return parseInt(m[1], 10) + PAGE_OFFSET;
}

// Build a deep link given the user's linked PDF base URL. Returns null if the
// reference has no page or no handbook is linked yet.
export function pdfHref(reference, baseUrl) {
  const page = pdfPage(reference);
  if (page == null || !baseUrl) return null;
  return `${baseUrl}#page=${page}`;
}
