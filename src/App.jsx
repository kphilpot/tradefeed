import { useState } from "react";
import { DUMMY_POSTS, TICKER_ITEMS } from "./data/index.js";
import AuthModal from "./components/AuthModal.jsx";
import ContractorProfileModal from "./components/ContractorProfileModal.jsx";
import HomePage from "./pages/HomePage.jsx";
import NewsletterPage from "./pages/NewsletterPage.jsx";
import JobsPage from "./pages/JobsPage.jsx";
import DirectoryPage from "./pages/DirectoryPage.jsx";
import ForumPage from "./pages/ForumPage.jsx";
import IntelPage from "./pages/IntelPage.jsx";
import AdminDashboard from "./pages/AdminDashboard.jsx";

export default function App() {
  const [page, setPage] = useState("home");
  const [showModal, setShowModal] = useState(false);
  const [modalMode, setModalMode] = useState("login");
  const [user, setUser] = useState(null);
  const [toast, setToast] = useState(null);
  const [posts, setPosts] = useState(DUMMY_POSTS);
  const [selectedContractor, setSelectedContractor] = useState(null);

  function showToast(msg) { setToast(msg); setTimeout(() => setToast(null), 3200); }
  function openLogin() { setModalMode("login"); setShowModal(true); }
  function openSignup() { setModalMode("signup"); setShowModal(true); }

  function handleLogin(e) {
    e.preventDefault();
    const email = e.target.email.value;
    if (email.toLowerCase().includes("korey") || email.toLowerCase() === "admin@tradefeed.com") {
      setUser({ name: "Korey Philpot", handle: "@koreyphilpot", role: "superadmin", verified: true, avatarColor: "#FFD600" });
      setShowModal(false); showToast("Welcome back, Korey 👋"); return;
    }
    setUser({ name: "Mike R.", handle: "@miker_concrete", role: "verified_sub", verified: true, avatarColor: "#FF6B2B" });
    setShowModal(false); showToast("Welcome back! 👋");
  }

  function handleSignup(e) {
    e.preventDefault();
    const tier = e.target.getAttribute("data-tier") || "free";
    const name = e.target.name?.value || "New User";
    const isVerified = tier === "verified_sub" || tier === "verified_gc";
    setUser({ name, handle: "@" + name.toLowerCase().replace(/\s/g, ""), role: tier, verified: isVerified, avatarColor: "#0057FF" });
    setShowModal(false);
    showToast(isVerified ? "Application submitted! We'll verify within 24h. ✅" : "Welcome to TradeFeed! 🎉");
  }

  function handleLogout() {
    setUser(null); showToast("Logged out.");
    if (page === "admin") setPage("home");
  }

  function handlePost(content, media, pollOptions) {
    if (!content?.trim() && !media) return;
    const newPost = {
      id: Date.now(), author: user.name, handle: user.handle,
      avatar: user.name[0], avatarColor: user.avatarColor,
      time: "just now", content: content || "", likes: 0, reposts: 0, replies: 0,
      tags: [], verified: user.verified, liked: false, reposted: false,
      trending: false, ghostReplies: [],
      imageUrl: media?.url || null,
      pollOptions: pollOptions || null,
    };
    setPosts(prev => [newPost, ...prev]);
    showToast("Posted! ✓");
  }

  function handleLike(id) {
    if (!user) { openLogin(); return; }
    setPosts(prev => prev.map(p => p.id === id ? { ...p, liked: !p.liked, likes: p.liked ? p.likes - 1 : p.likes + 1 } : p));
  }

  function handleRepost(id) {
    if (!user) { openLogin(); return; }
    setPosts(prev => prev.map(p => p.id === id ? { ...p, reposted: !p.reposted, reposts: p.reposted ? p.reposts - 1 : p.reposts + 1 } : p));
    showToast("Reposted ↗️");
  }

  const isVerifiedUser = user?.role === "verified_sub" || user?.role === "verified_gc" || user?.role === "superadmin";

  if (page === "admin" && user?.role === "superadmin") {
    return <AdminDashboard onBack={() => setPage("home")} onLogout={handleLogout} posts={posts} />;
  }

  return (
    <>
      {/* LIVE TICKER */}
      <div className="ticker-wrap">
        <div className="ticker-label">LIVE</div>
        <div className="ticker-track">
          {[...TICKER_ITEMS, ...TICKER_ITEMS].map((t, i) => <span key={i} className="ticker-item">{t}</span>)}
        </div>
      </div>

      {/* NAV */}
      <nav className="nav">
        <div className="nav-logo" onClick={() => setPage("home")}>Trade<span>Feed</span></div>
        <div className="nav-links">
          {["home", "newsletter", "jobs", "directory", "forum", "intel"].map(p => (
            <button key={p} className={`nav-link ${page === p ? "active" : ""}`} onClick={() => setPage(p)}>
              {p === "home" ? "Feed" : p === "intel" ? "🔒 Intel" : p.charAt(0).toUpperCase() + p.slice(1)}
            </button>
          ))}
          {user?.role === "superadmin" && (
            <button className="nav-link" onClick={() => setPage("admin")} style={{ color: "#FFD600" }}>⚙ Admin</button>
          )}
        </div>
        <div className="nav-right">
          {user ? (
            <>
              <span className="nav-user">
                {user.verified && <span style={{ color: "var(--verified)" }}>✓</span>}
                {user.name}
                {user.role === "superadmin" && <span className="admin-badge">ADMIN</span>}
              </span>
              <button className="nav-ghost" onClick={handleLogout}>Log Out</button>
            </>
          ) : (
            <>
              <button className="nav-ghost" onClick={openLogin}>Log In</button>
              <button className="nav-cta" onClick={openSignup}>Join Free</button>
            </>
          )}
        </div>
      </nav>

      {/* PAGE CONTENT */}
      <div className="page-enter" key={page}>
        {page === "home" && (
          <HomePage user={user} posts={posts} openLogin={openLogin} openSignup={openSignup} onLike={handleLike} onRepost={handleRepost} onPost={handlePost} isVerifiedUser={isVerifiedUser} />
        )}
        {page === "newsletter" && <NewsletterPage />}
        {page === "jobs" && (
          <JobsPage user={user} openLogin={openLogin} openSignup={openSignup} showToast={showToast} />
        )}
        {page === "directory" && (
          <DirectoryPage user={user} onSelectContractor={setSelectedContractor} showToast={showToast} />
        )}
        {page === "forum" && (
          <ForumPage user={user} isVerifiedUser={isVerifiedUser} openSignup={openSignup} showToast={showToast} posts={posts} onLike={handleLike} />
        )}
        {page === "intel" && (
          <IntelPage isVerifiedUser={isVerifiedUser} openSignup={openSignup} />
        )}
      </div>

      {/* MODALS */}
      {showModal && (
        <AuthModal mode={modalMode} setMode={setModalMode} onLogin={handleLogin} onSignup={handleSignup} onClose={() => setShowModal(false)} />
      )}
      {selectedContractor && (
        <ContractorProfileModal contractor={selectedContractor} onClose={() => setSelectedContractor(null)} showToast={showToast} />
      )}

      {/* TOAST */}
      {toast && <div className="toast">{toast}</div>}
    </>
  );
}
