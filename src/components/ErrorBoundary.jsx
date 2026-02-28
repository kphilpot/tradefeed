// ═══════════════════════════════════════════════════════════════════
// ErrorBoundary — catches render errors in any child subtree and
// shows a friendly fallback instead of crashing the whole app.
// Must be a class component (React requirement for error boundaries).
// ═══════════════════════════════════════════════════════════════════

import { Component } from "react";

export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, info) {
    // In production swap this for a real error tracking service (Sentry, etc.)
    console.error("[TradeFeed] Render error:", error, info.componentStack);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
          minHeight: "60vh", padding: "40px 20px", textAlign: "center",
        }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>⚠️</div>
          <h2 style={{ fontFamily: "var(--font-display)", fontSize: 22, fontWeight: 800, marginBottom: 10 }}>
            Something went wrong
          </h2>
          <p style={{ fontSize: 14, color: "#777", maxWidth: 380, lineHeight: 1.6, marginBottom: 24 }}>
            An unexpected error occurred loading this section. The rest of TradeFeed is still working.
          </p>
          <button
            className="btn-primary"
            style={{ width: "auto", padding: "10px 24px" }}
            onClick={() => this.setState({ hasError: false, error: null })}
          >
            Try Again
          </button>
          {import.meta.env.DEV && this.state.error && (
            <pre style={{ marginTop: 20, fontSize: 11, color: "#e53935", textAlign: "left", maxWidth: 600, overflow: "auto" }}>
              {this.state.error.toString()}
            </pre>
          )}
        </div>
      );
    }
    return this.props.children;
  }
}
