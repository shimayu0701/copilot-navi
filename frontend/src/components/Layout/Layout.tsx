import { Outlet, Link, useLocation } from "react-router-dom";

const navItems = [
  { path: "/", label: "ホーム" },
  { path: "/diagnose", label: "診断する" },
  { path: "/models", label: "モデル一覧" },
  { path: "/history", label: "履歴" },
  { path: "/settings", label: "設定" },
];

export default function Layout() {
  const location = useLocation();

  return (
    <div className="min-h-screen flex flex-col" style={{ background: "#0f172a" }}>
      <header
        style={{
          background: "rgba(15, 23, 42, 0.95)",
          borderBottom: "1px solid rgba(255,255,255,0.08)",
          backdropFilter: "blur(12px)",
          position: "sticky",
          top: 0,
          zIndex: 50,
        }}
      >
        <div
          style={{
            maxWidth: "1200px",
            margin: "0 auto",
            padding: "0 1.5rem",
            height: "64px",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <Link to="/" style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
            <span style={{ fontSize: "1.5rem" }}>🤖</span>
            <span
              style={{
                fontWeight: 700,
                fontSize: "1.125rem",
                background: "linear-gradient(135deg, #3b82f6, #8b5cf6)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
              }}
            >
              Copilot Model Navigator
            </span>
          </Link>

          <nav style={{ display: "flex", gap: "0.25rem" }}>
            {navItems.map((item) => {
              const isActive = location.pathname === item.path;
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  style={{
                    padding: "0.375rem 0.875rem",
                    borderRadius: "0.5rem",
                    fontSize: "0.875rem",
                    fontWeight: isActive ? 600 : 400,
                    color: isActive ? "#e2e8f0" : "#94a3b8",
                    background: isActive ? "rgba(59, 130, 246, 0.15)" : "transparent",
                    transition: "all 0.15s",
                  }}
                >
                  {item.label}
                </Link>
              );
            })}
          </nav>
        </div>
      </header>

      <main style={{ flex: 1 }}>
        <Outlet />
      </main>

      <footer
        style={{
          borderTop: "1px solid rgba(255,255,255,0.06)",
          padding: "1.5rem",
          textAlign: "center",
          color: "#475569",
          fontSize: "0.875rem",
        }}
      >
        <p>Copilot Model Navigator — 社内向け GitHub Copilot モデル選択支援ツール</p>
      </footer>
    </div>
  );
}
