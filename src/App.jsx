import { useState } from "react";
import { TICKER_ITEMS } from "./data/index.js";
import { useAuth } from "./hooks/useAuth.js";
import { usePosts } from "./hooks/usePosts.js";
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
  const [toast, setToast] = useState(null);
  const [selectedContractor, setSelectedContractor] = useState(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const { user, login, signup, logout, isVerifiedUser, isSuperAdmin } = useAuth();
  const { posts, addPost, toggleLike, toggleRepost } = usePosts();

  // Pro = paid subscriber OR superadmin gets full access
  const isProUser = user?.role === "pro" || isSuperAdmin;

  function showToast(msg) { setToast(msg); setTimeout(() => setToast(null), 3200); }
  function openLogin()  { setModalMode("login");  setShowModal(true); }
  function openSignup() { setModalMode("signup"); setShowModal(true); }

  async function handleLogin(email, password) {
    const { error } = await login(email, password);
    if (error) { showToast("Login failed: " + error.message); return; }
    setShowModal(false);
    showToast("Welcome back!");
  }

  async function handleSignup({ email, password, name, role, avatarColor }) {
    const { error, pendingVerification } = await signup({ email, password, name, role, avatarColor });
    if (error) { showToast("Signup failed: " + error.message); return; }
    setShowModal(false);
    showToast(pendingVerification
      ? "Application submitted! We'll verify within 24h."
      : "Welcome to TradeFeed!"
    );
  }

  async function handleLogout() {
    await logout();
    showToast("Logged out.");
    if (page === "admin") setPage("home");
  }

  function handlePost(content, media, pollOptions) {
    if (!user) return;
    addPost(user, content, media, pollOptions);
    showToast("Posted! ✓");
  }

  function handleLike(postId) {
    if (!user) { openLogin(); return; }
    toggleLike(postId, user.id);
  }

  function handleRepost(postId) {
    if (!user) { openLogin(); return; }
    toggleRepost(postId);
    showToast("Reposted");
  }

  function navigateTo(p) {
    setPage(p);
    setMobileMenuOpen(false);
  }

  if (page === "admin" && isSuperAdmin) {
    return (
      <AdminDashboard
        onBack={() => setPage("home")}
        onLogout={handleLogout}
        posts={posts}
        showToast={showToast}
      />
    );
  }

  const NAV_PAGES = ["home", "newsletter", "jobs", "directory", "forum", "intel"];
  const navLabel = (p) => p === "home" ? "Feed" : p === "intel" ? "🔒 Intel" : p.charAt(0).toUpperCase() + p.slice(1);

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
        <div className="nav-logo" onClick={() => navigateTo("home")}>Trade<span>Feed</span></div>

        {/* Desktop links */}
        <div className="nav-links">
          {NAV_PAGES.map(p => (
            <button key={p} className={`nav-link ${page === p ? "active" : ""}`} onClick={() => navigateTo(p)}>
              {navLabel(p)}
            </button>
          ))}
          {isSuperAdmin && (
            <button className="nav-link" onClick={() => navigateTo("admin")} style={{ color: "#FFD600" }}>⚙ Admin</button>
          )}
        </div>

        <div className="nav-right">
          {user ? (
            <>
              <span className="nav-user">
                {user.verified && <span style={{ color: "var(--verified)" }}>✓</span>}
                {user.name}
                {isSuperAdmin && <span className="admin-badge">ADMIN</span>}
                {isProUser && !isSuperAdmin && <span className="admin-badge" style={{ background: "var(--yellow)", color: "var(--dark)" }}>PRO</span>}
              </span>
              <button className="nav-ghost" onClick={handleLogout}>Log Out</button>
            </>
          ) : (
            <>
              <button className="nav-ghost" onClick={openLogin}>Log In</button>
              <button className="nav-cta" onClick={openSignup}>Join Free</button>
            </>
          )}
          {/* Mobile hamburger */}
          <button className="nav-hamburger" onClick={() => setMobileMenuOpen(true)} aria-label="Open menu">
            <span /><span /><span />
          </button>
        </div>
      </nav>

      {/* MOBILE MENU */}
      {mobileMenuOpen && (
        <div className="mobile-menu">
          <div className="mobile-menu-header">
            <div className="mobile-menu-logo">Trade<span>Feed</span></div>
            <button className="mobile-menu-close" onClick={() => setMobileMenuOpen(false)}>✕</button>
          </div>
          <div className="mobile-menu-links">
            {NAV_PAGES.map(p => (
              <button
                key={p}
                className={`mobile-nav-link ${page === p ? "active" : ""}`}
                onClick={() => navigateTo(p)}
              >
                {navLabel(p)}
              </button>
            ))}
            {isSuperAdmin && (
              <button
                className="mobile-nav-link"
                style={{ color: "var(--yellow)" }}
                onClick={() => navigateTo("admin")}
              >
                ⚙ Admin
              </button>
            )}
          </div>
          <div className="mobile-menu-footer">
            {user ? (
              <>
                <div className="mobile-menu-user">
                  {user.verified && <span style={{ color: "var(--verified)", marginRight: 4 }}>✓</span>}
                  {user.name}
                  {isProUser && !isSuperAdmin && <span style={{ color: "var(--yellow)", marginLeft: 6, fontSize: 11, fontWeight: 700 }}>PRO</span>}
                </div>
                <button className="btn-primary" onClick={() => { handleLogout(); setMobileMenuOpen(false); }}>
                  Log Out
                </button>
              </>
            ) : (
              <>
                <button className="nav-ghost" style={{ width: "100%", padding: "12px", textAlign: "center" }}
                  onClick={() => { openLogin(); setMobileMenuOpen(false); }}>
                  Log In
                </button>
                <button className="nav-cta" style={{ width: "100%", padding: "12px", borderRadius: 10 }}
                  onClick={() => { openSignup(); setMobileMenuOpen(false); }}>
                  Join Free
                </button>
              </>
            )}
          </div>
        </div>
      )}

      {/* PAGE CONTENT */}
      <div className="page-enter" key={page}>
        {page === "home" && (
          <HomePage
            user={user} posts={posts}
            openLogin={openLogin} openSignup={openSignup}
            onLike={handleLike} onRepost={handleRepost} onPost={handlePost}
            isVerifiedUser={isVerifiedUser}
          />
        )}
        {page === "newsletter" && <NewsletterPage showToast={showToast} />}
        {page === "jobs" && (
          <JobsPage user={user} openLogin={openLogin} openSignup={openSignup} showToast={showToast} isVerifiedUser={isVerifiedUser} />
        )}
        {page === "directory" && (
          <DirectoryPage user={user} onSelectContractor={setSelectedContractor} showToast={showToast} />
        )}
        {page === "forum" && (
          <ForumPage user={user} isVerifiedUser={isVerifiedUser} openSignup={openSignup} showToast={showToast} posts={posts} onLike={handleLike} />
        )}
        {page === "intel" && (
          <IntelPage isVerifiedUser={isVerifiedUser} isProUser={isProUser} openSignup={openSignup} showToast={showToast} />
        )}
      </div>

      {/* MODALS */}
      {showModal && (
        <AuthModal
          mode={modalMode} setMode={setModalMode}
          onLogin={handleLogin} onSignup={handleSignup}
          onClose={() => setShowModal(false)}
        />
      )}
      {selectedContractor && (
        <ContractorProfileModal
          contractor={selectedContractor}
          onClose={() => setSelectedContractor(null)}
          showToast={showToast}
          user={user}
        />
      )}

      {toast && <div className="toast">{toast}</div>}
    </>
  );
}
