import { useState } from "react";
import { TICKER_ITEMS } from "./data/index.js";
import { useAuth } from "./hooks/useAuth.js";
import { usePosts } from "./hooks/usePosts.js";
import { useNotifications } from "./hooks/useNotifications.js";
import AuthModal from "./components/AuthModal.jsx";
import ContractorProfileModal from "./components/ContractorProfileModal.jsx";
import NotificationBell from "./components/NotificationBell.jsx";
import HomePage from "./pages/HomePage.jsx";
import NewsletterPage from "./pages/NewsletterPage.jsx";
import JobsPage from "./pages/JobsPage.jsx";
import DirectoryPage from "./pages/DirectoryPage.jsx";
import ForumPage from "./pages/ForumPage.jsx";
import IntelPage from "./pages/IntelPage.jsx";
import AdminDashboard from "./pages/AdminDashboard.jsx";
import MessagesPage from "./pages/MessagesPage.jsx";
import ProfilePage from "./pages/ProfilePage.jsx";
import SettingsPage from "./pages/SettingsPage.jsx";
import ContractorDashboard from "./pages/ContractorDashboard.jsx";

export default function App() {
  const [page, setPage] = useState("home");
  const [showModal, setShowModal] = useState(false);
  const [modalMode, setModalMode] = useState("login");
  const [toast, setToast] = useState(null);
  const [selectedContractor, setSelectedContractor] = useState(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  // Deep-link: open MessagesPage with a specific conversation partner pre-selected
  const [messagingPartnerId, setMessagingPartnerId] = useState(null);

  const { user, login, signup, logout, updateProfile, isVerifiedUser, isSuperAdmin } = useAuth();
  const { posts, addPost, toggleLike, toggleRepost } = usePosts();
  const { notifications, unreadCount, markRead, markAllRead } = useNotifications(user);

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
    if (page === "admin" || page === "dashboard") setPage("home");
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
    // Clear messaging partner when navigating away from messages
    if (p !== "messages") setMessagingPartnerId(null);
  }

  // Open messages page with a specific partner pre-selected
  function openMessages(contractor) {
    setMessagingPartnerId(contractor?.id || null);
    setPage("messages");
    setMobileMenuOpen(false);
    setSelectedContractor(null);
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

  // Unread messages count (notifications of type "message")
  const unreadMessages = notifications.filter((n) => n.type === "message" && !n.read).length;

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
          {user && (
            <button
              className={`nav-link ${page === "messages" ? "active" : ""}`}
              onClick={() => navigateTo("messages")}
              style={{ position: "relative" }}
            >
              Messages
              {unreadMessages > 0 && (
                <span style={{ position: "absolute", top: -4, right: -6, background: "#e53935", color: "white", borderRadius: "50%", width: 14, height: 14, fontSize: 9, fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "center" }}>
                  {unreadMessages > 9 ? "9+" : unreadMessages}
                </span>
              )}
            </button>
          )}
          {(isVerifiedUser || isSuperAdmin) && (
            <button
              className={`nav-link ${page === "dashboard" ? "active" : ""}`}
              onClick={() => navigateTo("dashboard")}
            >
              Dashboard
            </button>
          )}
          {isSuperAdmin && (
            <button className="nav-link" onClick={() => navigateTo("admin")} style={{ color: "#FFD600" }}>⚙ Admin</button>
          )}
        </div>

        <div className="nav-right">
          {user ? (
            <>
              {/* Notification bell */}
              <NotificationBell
                notifications={notifications}
                unreadCount={unreadCount}
                markRead={markRead}
                markAllRead={markAllRead}
                onNavigate={navigateTo}
              />
              {/* Username → profile page */}
              <button
                className="nav-user"
                style={{ background: "none", border: "none", cursor: "pointer", fontFamily: "var(--font-body)" }}
                onClick={() => navigateTo("profile")}
                title="View profile"
              >
                {user.verified && <span style={{ color: "var(--verified)" }}>✓</span>}
                {user.name}
                {isSuperAdmin && <span className="admin-badge">ADMIN</span>}
                {isProUser && !isSuperAdmin && <span className="admin-badge" style={{ background: "var(--yellow)", color: "var(--dark)" }}>PRO</span>}
              </button>
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
            {user && (
              <button
                className={`mobile-nav-link ${page === "messages" ? "active" : ""}`}
                onClick={() => navigateTo("messages")}
              >
                Messages{unreadMessages > 0 && ` (${unreadMessages})`}
              </button>
            )}
            {(isVerifiedUser || isSuperAdmin) && (
              <button
                className={`mobile-nav-link ${page === "dashboard" ? "active" : ""}`}
                onClick={() => navigateTo("dashboard")}
              >
                Dashboard
              </button>
            )}
            {user && (
              <button
                className={`mobile-nav-link ${page === "profile" ? "active" : ""}`}
                onClick={() => navigateTo("profile")}
              >
                My Profile
              </button>
            )}
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
        {page === "messages" && (
          <MessagesPage
            user={user}
            initialPartnerId={messagingPartnerId}
            showToast={showToast}
          />
        )}
        {page === "profile" && (
          <ProfilePage
            user={user}
            posts={posts}
            onUpdateProfile={updateProfile}
            showToast={showToast}
            navigateTo={navigateTo}
          />
        )}
        {page === "settings" && (
          <SettingsPage
            user={user}
            showToast={showToast}
            navigateTo={navigateTo}
          />
        )}
        {page === "dashboard" && (isVerifiedUser || isSuperAdmin) && (
          <ContractorDashboard
            user={user}
            navigateTo={navigateTo}
            showToast={showToast}
          />
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
          onMessage={openMessages}
        />
      )}

      {toast && <div className="toast">{toast}</div>}
    </>
  );
}
