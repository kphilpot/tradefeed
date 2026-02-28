import { useState, useRef, useEffect } from "react";

const TYPE_ICONS = {
  message:      "💬",
  application:  "📋",
  lead_match:   "🔗",
  review:       "⭐",
  verification: "✓",
};

function timeAgo(isoDate) {
  const diff = (Date.now() - new Date(isoDate)) / 1000;
  if (diff < 60)    return "just now";
  if (diff < 3600)  return Math.floor(diff / 60) + "m ago";
  if (diff < 86400) return Math.floor(diff / 3600) + "h ago";
  return Math.floor(diff / 86400) + "d ago";
}

export default function NotificationBell({ notifications, unreadCount, markRead, markAllRead, onNavigate }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  // Close on outside click
  useEffect(() => {
    function handler(e) {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    }
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  function handleNotifClick(n) {
    markRead(n.id);
    if (n.link_page && onNavigate) onNavigate(n.link_page);
    setOpen(false);
  }

  return (
    <div className="notif-bell-wrap" ref={ref}>
      <button
        className="notif-bell-btn"
        onClick={() => setOpen((o) => !o)}
        aria-label={`Notifications${unreadCount ? ` — ${unreadCount} unread` : ""}`}
      >
        🔔
        {unreadCount > 0 && (
          <span className="notif-badge">{unreadCount > 9 ? "9+" : unreadCount}</span>
        )}
      </button>

      {open && (
        <div className="notif-dropdown">
          <div className="notif-dropdown-header">
            <span>Notifications</span>
            {unreadCount > 0 && (
              <button className="notif-mark-all" onClick={markAllRead}>
                Mark all read
              </button>
            )}
          </div>

          {notifications.length === 0 ? (
            <div className="notif-empty">No notifications yet</div>
          ) : (
            <div className="notif-list">
              {notifications.slice(0, 10).map((n) => (
                <div
                  key={n.id}
                  className={`notif-item ${!n.read ? "unread" : ""}`}
                  onClick={() => handleNotifClick(n)}
                >
                  <div className="notif-icon">{TYPE_ICONS[n.type] || "📌"}</div>
                  <div className="notif-body">
                    <div className="notif-title">{n.title}</div>
                    {n.body && <div className="notif-sub">{n.body}</div>}
                    <div className="notif-time">{timeAgo(n.created_at)}</div>
                  </div>
                  {!n.read && <div className="notif-dot" />}
                </div>
              ))}
            </div>
          )}

          {notifications.length > 10 && (
            <div style={{ padding: "10px 16px", textAlign: "center", borderTop: "1px solid #1a1a1a" }}>
              <button
                style={{ background: "none", border: "none", color: "var(--yellow)", fontSize: 12, cursor: "pointer", fontFamily: "var(--font-body)" }}
                onClick={() => { onNavigate && onNavigate("notifications"); setOpen(false); }}
              >
                View all {notifications.length} notifications →
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
