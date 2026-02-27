import { useState, useRef } from "react";
import { DEMO_GIFS, EMOJI_QUICK } from "../data/index.js";

export default function ComposeBox({ user, onPost, placeholder = "What's happening in your trade?" }) {
  const [content, setContent] = useState("");
  const [mediaPreview, setMediaPreview] = useState(null);
  const [showGifPicker, setShowGifPicker] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [showPollBuilder, setShowPollBuilder] = useState(false);
  const [pollOptions, setPollOptions] = useState(["", ""]);
  const [gifSearch, setGifSearch] = useState("");
  const fileInputRef = useRef(null);
  const MAX = 280;
  const remaining = MAX - content.length;
  const isOver = remaining < 0;
  const isNearLimit = remaining <= 40;

  function handleFileChange(e) {
    const file = e.target.files[0];
    if (!file) return;
    const url = URL.createObjectURL(file);
    setMediaPreview({ type: "image", url, file });
    setShowGifPicker(false);
  }

  function handleGifSelect(gif) {
    setMediaPreview({ type: "gif", url: gif.url, title: gif.title });
    setShowGifPicker(false);
  }

  function handleEmojiClick(emoji) {
    setContent(prev => (prev + emoji).slice(0, MAX));
    setShowEmojiPicker(false);
  }

  function handleSubmit() {
    if ((!content.trim() && !mediaPreview) || isOver) return;
    onPost(content, mediaPreview, showPollBuilder ? pollOptions.filter(Boolean) : null);
    setContent("");
    setMediaPreview(null);
    setShowPollBuilder(false);
    setPollOptions(["", ""]);
  }

  const radius = 10;
  const circumference = 2 * Math.PI * radius;
  const progress = Math.min(content.length / MAX, 1);
  const strokeDash = circumference * progress;

  return (
    <div className="compose-box" style={{ marginBottom: 16 }}>
      <div className="compose-inner">
        <div className="compose-avatar" style={{ background: user.avatarColor, color: user.avatarColor === "#FFD600" ? "#111" : "white" }}>
          {user.name[0]}
        </div>
        <div style={{ flex: 1 }}>
          <textarea
            className="compose-textarea"
            placeholder={placeholder}
            value={content}
            onChange={e => setContent(e.target.value)}
            style={{ color: isOver ? "#E74C3C" : undefined }}
          />

          {mediaPreview && (
            <div style={{ position: "relative", marginTop: 8, borderRadius: 10, overflow: "hidden", border: "1px solid var(--border)", display: "inline-block" }}>
              <img src={mediaPreview.url} alt={mediaPreview.title || "media"} style={{ maxWidth: "100%", maxHeight: 220, display: "block", borderRadius: 10 }} />
              <button onClick={() => setMediaPreview(null)} style={{ position: "absolute", top: 6, right: 6, background: "rgba(0,0,0,0.7)", border: "none", color: "white", width: 24, height: 24, borderRadius: "50%", cursor: "pointer", fontSize: 12, display: "flex", alignItems: "center", justifyContent: "center" }}>✕</button>
            </div>
          )}

          {showPollBuilder && (
            <div style={{ background: "#f8f7f2", borderRadius: 10, padding: "12px 14px", marginTop: 10, border: "1px solid var(--border)" }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: "#555", marginBottom: 8 }}>Poll Options</div>
              {pollOptions.map((opt, i) => (
                <input key={i} className="form-input" style={{ marginBottom: 6, fontSize: 13, padding: "8px 12px" }} placeholder={`Option ${i + 1}`} value={opt} onChange={e => { const next = [...pollOptions]; next[i] = e.target.value; setPollOptions(next); }} />
              ))}
              {pollOptions.length < 4 && (
                <button onClick={() => setPollOptions([...pollOptions, ""])} style={{ background: "none", border: "none", color: "var(--blue)", fontSize: 12, fontWeight: 600, cursor: "pointer" }}>+ Add option</button>
              )}
            </div>
          )}
        </div>
      </div>

      {showGifPicker && (
        <div style={{ background: "#f8f7f2", borderRadius: 10, padding: 12, marginTop: 10, border: "1px solid var(--border)" }}>
          <input className="form-input" style={{ marginBottom: 10, fontSize: 13, padding: "8px 12px" }} placeholder="Search GIFs..." value={gifSearch} onChange={e => setGifSearch(e.target.value)} autoFocus />
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 6 }}>
            {DEMO_GIFS.map(gif => (
              <img key={gif.id} src={gif.url} alt={gif.title} onClick={() => handleGifSelect(gif)} style={{ width: "100%", height: 70, objectFit: "cover", borderRadius: 6, cursor: "pointer", border: "2px solid transparent", transition: "border-color 0.15s" }} onMouseEnter={e => e.target.style.borderColor = "var(--yellow)"} onMouseLeave={e => e.target.style.borderColor = "transparent"} />
            ))}
          </div>
          <div style={{ fontSize: 11, color: "#aaa", marginTop: 8 }}>Production: connect GIPHY API (free tier, 100 searches/day)</div>
        </div>
      )}

      {showEmojiPicker && (
        <div style={{ background: "#f8f7f2", borderRadius: 10, padding: 10, marginTop: 8, border: "1px solid var(--border)" }}>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 4 }}>
            {EMOJI_QUICK.map(e => (
              <button key={e} onClick={() => handleEmojiClick(e)} style={{ background: "none", border: "none", fontSize: 22, cursor: "pointer", padding: "4px", borderRadius: 6, transition: "background 0.1s" }} onMouseEnter={el => el.target.style.background = "#e0e0e0"} onMouseLeave={el => el.target.style.background = "none"}>{e}</button>
            ))}
          </div>
          <div style={{ fontSize: 11, color: "#aaa", marginTop: 6 }}>Production: npm install emoji-picker-react for full picker</div>
        </div>
      )}

      <div className="compose-footer">
        <div className="compose-actions">
          <button className="compose-action-btn" title="Photo / Video" onClick={() => fileInputRef.current?.click()}>📷</button>
          <input ref={fileInputRef} type="file" accept="image/*,video/*" style={{ display: "none" }} onChange={handleFileChange} />
          <button className="compose-action-btn" title="GIF" onClick={() => { setShowGifPicker(!showGifPicker); setShowEmojiPicker(false); }} style={{ fontWeight: 800, fontSize: 12, color: showGifPicker ? "var(--blue)" : undefined }}>GIF</button>
          <button className="compose-action-btn" title="Emoji" onClick={() => { setShowEmojiPicker(!showEmojiPicker); setShowGifPicker(false); }}>😄</button>
          <button className="compose-action-btn" title="Poll" onClick={() => setShowPollBuilder(!showPollBuilder)} style={{ color: showPollBuilder ? "var(--blue)" : undefined }}>📊</button>
          <button className="compose-action-btn" title="Tag trade" onClick={() => setContent(prev => prev + " #")}>🏷️</button>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <svg width="24" height="24" style={{ transform: "rotate(-90deg)", opacity: content.length === 0 ? 0.2 : 1 }}>
            <circle cx="12" cy="12" r={radius} fill="none" stroke="#e0e0e0" strokeWidth="2" />
            <circle cx="12" cy="12" r={radius} fill="none" stroke={isOver ? "#E74C3C" : isNearLimit ? "var(--orange)" : "var(--blue)"} strokeWidth="2" strokeDasharray={`${strokeDash} ${circumference}`} strokeLinecap="round" style={{ transition: "stroke-dasharray 0.1s" }} />
          </svg>
          {isNearLimit && <span style={{ fontSize: 12, color: isOver ? "#E74C3C" : "var(--orange)", fontWeight: 700 }}>{remaining}</span>}
          <button className="compose-submit" onClick={handleSubmit} disabled={(!content.trim() && !mediaPreview) || isOver}>Post</button>
        </div>
      </div>
    </div>
  );
}
