import { useRef } from "react";
import Header from "../components/Header";

function Profile({ onNavigate, shows, ranking, onExport, onImport, isDark, onToggleTheme }) {
  const fileInputRef = useRef(null);

  const total          = shows.length;
  const watched        = shows.filter((s) => s.status === "watched").length;
  const watchlist      = shows.filter((s) => s.status === "watchlist").length;
  const dropped        = shows.filter((s) => s.status === "dropped").length;
  const completionRate = total > 0 ? Math.round((watched / total) * 100) : 0;
  const topRankedShow  = ranking.length > 0
    ? shows.find((s) => s.id === ranking[0])
    : null;

  function handleImportClick() {
    fileInputRef.current.value = "";
    fileInputRef.current.click();
  }

  function handleFileChange(e) {
    const file = e.target.files[0];
    if (file) onImport(file);
  }

  return (
    <div>
      <Header onNavigate={onNavigate} activePage="profile" isDark={isDark} onToggleTheme={onToggleTheme} />

      <main>
        <h2 className="page-title">PROFILE</h2>

        {/* ── Stat strip ─────────────────────────────────── */}
        <div className="profile-stat-strip">
          <div className="profile-stat-segment">
            <span className="profile-stat-value">{total}</span>
            <span className="profile-stat-label">Total Shows</span>
          </div>
          <div className="profile-stat-segment">
            <span className="profile-stat-value">{watched}</span>
            <span className="profile-stat-label">Watched</span>
          </div>
          <div className="profile-stat-segment">
            <span className="profile-stat-value">{watchlist}</span>
            <span className="profile-stat-label">Watchlist</span>
          </div>
          <div className="profile-stat-segment">
            <span className="profile-stat-value">{dropped}</span>
            <span className="profile-stat-label">Dropped</span>
          </div>
          <div className="profile-stat-segment">
            <span className="profile-stat-value profile-stat-value--accent">{completionRate}%</span>
            <span className="profile-stat-label">Completion Rate</span>
          </div>
        </div>

        {/* ── Top ranked spotlight ────────────────────────── */}
        <div className="profile-spotlight-card">
          <div className="profile-spotlight-header">
            <h3>TOP RANKED SHOW SPOTLIGHT</h3>
          </div>
          {topRankedShow ? (
            <div className="profile-spotlight-body">
              <div className="profile-spotlight-poster">
                {topRankedShow.title.slice(0, 3).toUpperCase()}
              </div>
              <div>
                <div className="profile-spotlight-rank-badge">#1</div>
                <div className="profile-spotlight-title">{topRankedShow.title}</div>
              </div>
            </div>
          ) : (
            <p className="profile-spotlight-empty">No ranking set yet. Head to the Ranking page to get started.</p>
          )}
        </div>

        {/* ── Data management ─────────────────────────────── */}
        <div className="profile-data-section">
          <h3>DATA MANAGEMENT</h3>
          <p>Export your shows and ranking as a JSON backup, or restore data from a previous backup file.</p>
          <div className="profile-data-actions">
            <button className="data-btn data-btn--export" onClick={onExport}>
              EXPORT BACKUP
            </button>
            <button className="data-btn data-btn--import" onClick={handleImportClick}>
              IMPORT BACKUP
            </button>
          </div>
          <input
            ref={fileInputRef}
            type="file"
            accept=".json,application/json"
            style={{ display: "none" }}
            onChange={handleFileChange}
            aria-hidden="true"
          />
        </div>
      </main>
    </div>
  );
}

export default Profile;
