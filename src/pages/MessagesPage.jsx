import { useState, useEffect, useRef } from "react";
import { supabase, isSupabaseConnected, sendMessage as sbSendMessage, fetchThread, markMessagesRead } from "../lib/supabase.js";

// Mock conversation data for demo mode
const MOCK_CONVERSATIONS = [
  {
    id: "apex_structures_1",
    partnerId: "apex_structures_1",
    partnerName: "Apex Structures LLC",
    partnerAvatar: "A",
    partnerColor: "#E74C3C",
    lastMessage: "Are you available for a Q2 framing project?",
    time: "2h ago",
    unread: 1,
    messages: [
      { id: "m1", fromMe: false, body: "Hi — we saw your profile on TradeFeed. We're looking for reliable framing subs for a Q2 commercial project in Charlotte. Interested?", time: "Yesterday 10:14 AM" },
      { id: "m2", fromMe: true,  body: "Hi, thanks for reaching out. Yes, we're available from late March. What's the scope and timeline?", time: "Yesterday 11:32 AM" },
      { id: "m3", fromMe: false, body: "Are you available for a Q2 framing project?", time: "2h ago" },
    ],
  },
  {
    id: "meridian_build_1",
    partnerId: "meridian_build_1",
    partnerName: "Meridian Build Group",
    partnerAvatar: "M",
    partnerColor: "#00C9A7",
    lastMessage: "Thanks for sending over your insurance cert.",
    time: "Yesterday",
    unread: 0,
    messages: [
      { id: "m4", fromMe: false, body: "Hey, could you send over your current insurance cert and license number for our records?", time: "2 days ago" },
      { id: "m5", fromMe: true,  body: "Sure thing, sending it over now via email.", time: "2 days ago" },
      { id: "m6", fromMe: false, body: "Thanks for sending over your insurance cert.", time: "Yesterday" },
    ],
  },
  {
    id: "volt_forward_1",
    partnerId: "volt_forward_1",
    partnerName: "Volt Forward Inc.",
    partnerAvatar: "V",
    partnerColor: "#C0392B",
    lastMessage: "Sounds good, let's set up a call this week.",
    time: "3 days ago",
    unread: 0,
    messages: [
      { id: "m7", fromMe: true,  body: "Hey, saw you're looking for electrical subs on the Durham data center project.", time: "4 days ago" },
      { id: "m8", fromMe: false, body: "Yes! What's your crew size and are you licensed in NC?", time: "4 days ago" },
      { id: "m9", fromMe: true,  body: "6-man crew, licensed and bonded in NC and SC. Happy to share our cert.", time: "3 days ago" },
      { id: "m10", fromMe: false, body: "Sounds good, let's set up a call this week.", time: "3 days ago" },
    ],
  },
];

export default function MessagesPage({ user, initialPartnerId, showToast }) {
  const [conversations, setConversations] = useState(MOCK_CONVERSATIONS);
  const [activeId, setActiveId] = useState(initialPartnerId || MOCK_CONVERSATIONS[0]?.id);
  const [draft, setDraft] = useState("");
  const [mobileShowThread, setMobileShowThread] = useState(Boolean(initialPartnerId));
  const threadEndRef = useRef(null);

  const activeConv = conversations.find((c) => c.id === activeId);

  // Scroll to bottom of thread when messages change
  useEffect(() => {
    threadEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [activeConv?.messages?.length]);

  // If initialPartnerId is provided (from ContractorProfileModal "Send Message"),
  // ensure that conversation is active and mark any unread messages read
  useEffect(() => {
    if (initialPartnerId) {
      setActiveId(initialPartnerId);
      setMobileShowThread(true);
    }
  }, [initialPartnerId]);

  function handleSelectConv(conv) {
    setActiveId(conv.id);
    setMobileShowThread(true);
    // Mark as read
    setConversations((prev) =>
      prev.map((c) => (c.id === conv.id ? { ...c, unread: 0 } : c))
    );
    if (isSupabaseConnected && user) {
      markMessagesRead(user.id, conv.partnerId);
    }
  }

  async function handleSend() {
    if (!draft.trim() || !activeConv) return;
    const body = draft.trim();
    setDraft("");

    const newMsg = { id: "msg_" + Date.now(), fromMe: true, body, time: "Just now" };

    if (isSupabaseConnected && user) {
      await sbSendMessage(user.id, activeConv.partnerId, body);
    }

    setConversations((prev) =>
      prev.map((c) =>
        c.id === activeId
          ? { ...c, lastMessage: body, time: "Just now", messages: [...c.messages, newMsg] }
          : c
      )
    );
  }

  function handleKeyDown(e) {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend(); }
  }

  const totalUnread = conversations.reduce((s, c) => s + (c.unread || 0), 0);

  return (
    <div className="page" style={{ paddingTop: 24, paddingBottom: 0 }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
        <div>
          <div className="section-label">Inbox</div>
          <h2 style={{ fontFamily: "var(--font-display)", fontSize: 26, fontWeight: 800 }}>
            Messages {totalUnread > 0 && <span style={{ color: "var(--blue)", fontSize: 16 }}>({totalUnread} unread)</span>}
          </h2>
        </div>
      </div>

      <div className="messages-container">
        {/* Conversation Sidebar */}
        <div className={`messages-sidebar ${mobileShowThread ? "mobile-hidden" : ""}`}>
          {conversations.length === 0 ? (
            <div style={{ padding: 24, color: "#aaa", fontSize: 13 }}>
              No conversations yet. Message a contractor from their profile.
            </div>
          ) : (
            conversations.map((conv) => (
              <div
                key={conv.id}
                className={`conv-item ${activeId === conv.id ? "active" : ""}`}
                onClick={() => handleSelectConv(conv)}
              >
                <div className="conv-avatar" style={{ background: conv.partnerColor }}>
                  {conv.partnerAvatar}
                </div>
                <div className="conv-info">
                  <div className="conv-name-row">
                    <span className="conv-name">{conv.partnerName}</span>
                    <span className="conv-time">{conv.time}</span>
                  </div>
                  <div className="conv-last">{conv.lastMessage}</div>
                </div>
                {conv.unread > 0 && (
                  <div className="conv-unread-badge">{conv.unread}</div>
                )}
              </div>
            ))
          )}
        </div>

        {/* Thread */}
        <div className={`messages-thread ${!mobileShowThread ? "mobile-hidden" : ""}`}>
          {activeConv ? (
            <>
              <div className="thread-header">
                <button
                  className="thread-back-btn"
                  onClick={() => setMobileShowThread(false)}
                  aria-label="Back to conversations"
                >
                  ←
                </button>
                <div className="conv-avatar" style={{ background: activeConv.partnerColor, width: 34, height: 34, fontSize: 13 }}>
                  {activeConv.partnerAvatar}
                </div>
                <div>
                  <div className="thread-partner-name">{activeConv.partnerName}</div>
                  <div className="thread-partner-status">TradeFeed verified contractor</div>
                </div>
              </div>

              <div className="thread-messages">
                {activeConv.messages.map((msg) => (
                  <div key={msg.id} className={`msg-bubble-wrap ${msg.fromMe ? "me" : "them"}`}>
                    {!msg.fromMe && (
                      <div className="msg-avatar" style={{ background: activeConv.partnerColor }}>
                        {activeConv.partnerAvatar}
                      </div>
                    )}
                    <div className="msg-bubble-col">
                      <div className={`msg-bubble ${msg.fromMe ? "me" : "them"}`}>
                        {msg.body}
                      </div>
                      <div className="msg-time">{msg.time}</div>
                    </div>
                  </div>
                ))}
                <div ref={threadEndRef} />
              </div>

              <div className="thread-compose">
                <textarea
                  className="thread-input"
                  placeholder={`Message ${activeConv.partnerName}...`}
                  value={draft}
                  onChange={(e) => setDraft(e.target.value)}
                  onKeyDown={handleKeyDown}
                  rows={2}
                />
                <button
                  className="thread-send-btn"
                  onClick={handleSend}
                  disabled={!draft.trim()}
                >
                  Send →
                </button>
              </div>
            </>
          ) : (
            <div className="thread-empty">
              <div style={{ fontSize: 36, marginBottom: 12 }}>💬</div>
              <div style={{ fontFamily: "var(--font-display)", fontWeight: 700, marginBottom: 6 }}>Your messages</div>
              <div style={{ fontSize: 13, color: "#aaa" }}>Select a conversation to start messaging, or find a contractor in the Directory.</div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
