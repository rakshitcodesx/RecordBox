function Header({ onNavigate, activePage, isDark, onToggleTheme }) {
  return (
    <header>
      {/* Brand */}
      <div className="header-brand">
        <div className="header-logo-icon" aria-hidden="true">★</div>
        <span className="header-brand-name">RECORDBOX</span>
      </div>

      {/* Pill navigation */}
      <nav className="header-nav">
        <button
          onClick={() => onNavigate("myshows")}
          className={activePage === "myshows" ? "active-nav" : ""}
        >
          MY SHOWS
        </button>
        <button
          onClick={() => onNavigate("ranking")}
          className={activePage === "ranking" ? "active-nav" : ""}
        >
          RANKING
        </button>
        <button
          onClick={() => onNavigate("profile")}
          className={activePage === "profile" ? "active-nav" : ""}
        >
          PROFILE
        </button>
      </nav>

      {/* Theme toggle */}
      <button
        className="theme-toggle"
        onClick={onToggleTheme}
        aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
        title={isDark ? "Light mode" : "Dark mode"}
      >
        {isDark ? "☀️" : "🌙"}
      </button>
    </header>
  );
}

export default Header;
