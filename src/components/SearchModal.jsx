// ═══════════════════════════════════════════════════════════════════
// SearchModal — global search across posts, contractors, and jobs
// Triggered by the search icon in the nav bar (or Cmd/Ctrl+K).
// No backend required — searches in-memory data; when Supabase is
// connected it can be swapped for full-text search with pg_fts.
// ═══════════════════════════════════════════════════════════════════

import { useState, useEffect, useRef } from "react";

const RESULT_TYPE_LABEL = {
  post: "Post",
  contractor: "Contractor",
  job: "Job",
};

const RESULT_TYPE_ICON = {
  post: "📝",
  contractor: "👷",
  job: "💼",
};

export default function SearchModal({ onClose, posts, contractors, jobs, navigateTo, onSelectContractor }) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const inputRef = useRef(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  // Keyboard: Escape = close, Cmd/Ctrl+K = close if already open
  useEffect(() => {
    function onKey(e) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose]);

  useEffect(() => {
    const q = query.trim().toLowerCase();
    if (q.length < 2) { setResults([]); return; }

    const postResults = (posts || [])
      .filter(p => p.content.toLowerCase().includes(q) || p.author.toLowerCase().includes(q) || (p.tags || []).some(t => t.toLowerCase().includes(q)))
      .slice(0, 4)
      .map(p => ({
        type: "post",
        id: `post-${p.id}`,
        title: p.author,
        subtitle: p.content.slice(0, 90) + (p.content.length > 90 ? "…" : ""),
        meta: p.time,
        raw: p,
      }));

    const contractorResults = (contractors || [])
      .filter(c => c.name.toLowerCase().includes(q) || c.trade.toLowerCase().includes(q) || c.location.toLowerCase().includes(q))
      .slice(0, 4)
      .map(c => ({
        type: "contractor",
        id: `con-${c.id}`,
        title: c.name,
        subtitle: `${c.trade} · ${c.location}`,
        meta: `⭐ ${c.rating}`,
        raw: c,
      }));

    const jobResults = (jobs || [])
      .filter(j => (j.title || j.role || "").toLowerCase().includes(q) || (j.company || "").toLowerCase().includes(q) || (j.trade || j.category || "").toLowerCase().includes(q))
      .slice(0, 4)
      .map(j => ({
        type: "job",
        id: `job-${j.id}`,
        title: j.title || j.role,
        subtitle: `${j.company || ""} · ${j.location || ""}`.replace(/^·\s/, ""),
        meta: j.pay || j.wage || "",
        raw: j,
      }));

    setResults([...postResults, ...contractorResults, ...jobResults].slice(0, 10));
  }, [query, posts, contractors, jobs]);

  function handleSelect(result) {
    if (result.type === "post" || result.type === "job") {
      navigateTo(result.type === "post" ? "home" : "jobs");
    } else if (result.type === "contractor") {
      onSelectContractor(result.raw);
      navigateTo("directory");
    }
    onClose();
  }

  return (
    <div className="search-modal-overlay" onClick={onClose}>
      <div className="search-modal" onClick={e => e.stopPropagation()}>
        <div className="search-modal-input-row">
          <span className="search-modal-icon">🔍</span>
          <input
            ref={inputRef}
            className="search-modal-input"
            placeholder="Search posts, contractors, jobs…"
            value={query}
            onChange={e => setQuery(e.target.value)}
          />
          <button className="search-modal-esc" onClick={onClose}>Esc</button>
        </div>

        {results.length > 0 && (
          <div className="search-results">
            {results.map(r => (
              <button
                key={r.id}
                className="search-result-item"
                onClick={() => handleSelect(r)}
              >
                <span className="search-result-icon">{RESULT_TYPE_ICON[r.type]}</span>
                <span className="search-result-body">
                  <span className="search-result-title">{r.title}</span>
                  <span className="search-result-sub">{r.subtitle}</span>
                </span>
                <span className="search-result-meta">
                  <span className="search-result-type">{RESULT_TYPE_LABEL[r.type]}</span>
                  {r.meta && <span style={{ fontSize: 11, color: "#aaa" }}>{r.meta}</span>}
                </span>
              </button>
            ))}
          </div>
        )}

        {query.trim().length >= 2 && results.length === 0 && (
          <div className="search-empty">
            No results for <strong>"{query}"</strong>
          </div>
        )}

        {query.trim().length < 2 && (
          <div className="search-hint">
            Type at least 2 characters to search posts, contractors, and jobs.
          </div>
        )}
      </div>
    </div>
  );
}
