import React, { createContext, useContext, useEffect, useRef, useState } from "react";

// Holds the user's own handbook PDF. The file is never bundled or uploaded — it
// stays on the user's machine. We persist the chosen file as a Blob in
// IndexedDB so it survives page reloads, and expose an object URL that
// reference links use to deep-link into it.

const HandbookCtx = createContext(null);

const DB_NAME = "asep-handbook";
const STORE = "files";
const KEY = "handbook";

function openDb() {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, 1);
    req.onupgradeneeded = () => req.result.createObjectStore(STORE);
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

async function idbGet() {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const req = db.transaction(STORE, "readonly").objectStore(STORE).get(KEY);
    req.onsuccess = () => resolve(req.result || null);
    req.onerror = () => reject(req.error);
  });
}

async function idbSet(record) {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, "readwrite");
    tx.objectStore(STORE).put(record, KEY);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

async function idbDel() {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, "readwrite");
    tx.objectStore(STORE).delete(KEY);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

export function HandbookProvider({ children }) {
  const [url, setUrl] = useState(null);
  const [name, setName] = useState(null);
  const [ready, setReady] = useState(false);
  const urlRef = useRef(null);

  const swapUrl = (next) => {
    if (urlRef.current) URL.revokeObjectURL(urlRef.current);
    urlRef.current = next;
    setUrl(next);
  };

  // Restore a previously linked PDF on load.
  useEffect(() => {
    let cancelled = false;
    idbGet()
      .then((rec) => {
        if (cancelled || !rec || !rec.blob) return;
        swapUrl(URL.createObjectURL(rec.blob));
        setName(rec.name || "handbook.pdf");
      })
      .catch(() => {})
      .finally(() => !cancelled && setReady(true));
    return () => {
      cancelled = true;
      if (urlRef.current) URL.revokeObjectURL(urlRef.current);
    };
  }, []);

  const link = async (file) => {
    if (!file) return;
    try {
      await idbSet({ blob: file, name: file.name });
    } catch {
      // Persisting failed (e.g. private mode); still usable for this session.
    }
    swapUrl(URL.createObjectURL(file));
    setName(file.name);
  };

  const clear = async () => {
    try {
      await idbDel();
    } catch {
      /* ignore */
    }
    swapUrl(null);
    setName(null);
  };

  return (
    <HandbookCtx.Provider value={{ url, name, ready, link, clear }}>
      {children}
    </HandbookCtx.Provider>
  );
}

export function useHandbook() {
  return useContext(HandbookCtx);
}
