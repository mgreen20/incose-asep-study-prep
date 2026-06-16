// Pure helpers over the in-memory card list (loaded at runtime by CardsProvider
// from /all_cards.json). No build-time data import lives here anymore.

const natural = (a, b) =>
  String(a).localeCompare(String(b), undefined, { numeric: true, sensitivity: "base" });

// Build the Part → Section → Subsection → deck tree from a flat list of
// normalized cards. The hierarchy comes from each card's dotted `section`
// number (e.g. 1.3.6 nests under 1.3 under its Part), not from any file paths.
export function buildTree(cards) {
  const rootChildren = [];
  const rootMap = new Map();

  const ensure = (children, map, key, name, extra = {}) => {
    if (map.has(key)) return map.get(key);
    const node = { id: key, name, type: "folder", children: [], _map: new Map(), ...extra };
    map.set(key, node);
    children.push(node);
    return node;
  };

  for (const card of cards) {
    const partName = card.partName || "(unknown)";
    const comps = card.section ? card.section.split(".") : [];

    const partNode = ensure(rootChildren, rootMap, `part:${partName}`, partName, { partName });

    let cursor = partNode;
    for (let i = 2; i < comps.length; i++) {
      const prefix = comps.slice(0, i).join(".");
      ensure(cursor.children, cursor._map, `${partName}|${prefix}`, prefix);
      cursor = cursor._map.get(`${partName}|${prefix}`);
    }

    const deckKey = `${partName}|${card.section || card.sectionTitle}`;
    let deck = cursor._map.get(deckKey);
    if (!deck) {
      const label = card.section ? `${card.section} ${card.sectionTitle}` : card.sectionTitle;
      deck = {
        id: deckKey,
        name: (label || "").trim(),
        type: "deck",
        cards: [],
        partName,
        section: card.section,
        sectionTitle: card.sectionTitle,
        count: 0,
      };
      cursor._map.set(deckKey, deck);
      cursor.children.push(deck);
    }
    deck.cards.push(card);
  }

  const finalize = (node) => {
    if (node.type === "deck") {
      node.count = node.cards.length;
      return;
    }
    delete node._map;
    node.children.sort((a, b) => natural(a.name, b.name));
    node.children.forEach(finalize);
  };
  rootChildren.sort((a, b) => natural(a.name, b.name));
  rootChildren.forEach(finalize);
  return rootChildren;
}

// Fisher–Yates shuffle returning a new array.
export function shuffle(arr) {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}
