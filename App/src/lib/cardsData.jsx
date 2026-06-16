import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { normalizeDoc } from "./api.js";
import { buildTree } from "./cards.js";
import { checkEditable } from "./api.js";

// Loads the consolidated card set from /all_cards.json once at startup and
// exposes it to the app: the Part→Section→Subsection tree, the MCQ exam pool,
// stats, whether editing is available, and a reload() to refetch after edits.

const Ctx = createContext(null);

export function CardsProvider({ children }) {
  const [raw, setRaw] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [editable, setEditable] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/all_cards.json", { cache: "no-store" });
      if (!res.ok) throw new Error(`Failed to load cards (HTTP ${res.status})`);
      const arr = await res.json();
      if (!Array.isArray(arr)) throw new Error("all_cards.json is not an array");
      setRaw(arr);
    } catch (e) {
      setError(e.message);
      setRaw([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    checkEditable().then(setEditable);
  }, []);

  const derived = useMemo(() => {
    const cards = (raw || []).map((d, i) => normalizeDoc(d, i));
    const parts = buildTree(cards);
    const mcq = cards.filter((c) => c.type === "mcq");
    const stats = {
      totalCards: cards.length,
      totalMcq: mcq.length,
      totalIpo: cards.length - mcq.length,
    };
    return { cards, parts, mcq, stats };
  }, [raw]);

  const mcqByParts = useCallback(
    (partNames) => {
      if (!partNames || !partNames.length) return derived.mcq;
      const set = new Set(partNames);
      return derived.mcq.filter((c) => set.has(c.partName));
    },
    [derived.mcq]
  );

  const value = {
    loading,
    error,
    editable,
    reload: load,
    parts: derived.parts,
    stats: derived.stats,
    mcqByParts,
  };

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useCards() {
  return useContext(Ctx);
}
