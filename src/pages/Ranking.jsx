import { useState, useEffect } from "react";
import Header from "../components/Header";
import ShowBlock from "../components/ShowBlock";
import initialRanking from "../data/ranking";
import { saveRanking, loadRanking } from "../utils/storage";

function Ranking({ onNavigate, shows, setShows, ranking: rankingProp, setRanking: setRankingProp, isDark, onToggleTheme }) {
  const [ranking, setRankingLocal] = useState(() => {
    const saved = loadRanking();
    return saved ?? initialRanking;
  });

  // Keep parent & local ranking in sync — use prop if provided
  const activeRanking  = rankingProp  ?? ranking;
  const setRanking     = setRankingProp ?? setRankingLocal;

  const [draggedShow,  setDraggedShow]  = useState(null);
  const [newShow,      setNewShow]      = useState("");
  const [searchQuery,  setSearchQuery]  = useState("");

  useEffect(() => {
    const validIds = new Set(shows.map((s) => s.id));
    const cleaned  = activeRanking.filter((id) => validIds.has(id));
    if (cleaned.length !== activeRanking.length) {
      setRanking(cleaned);
      saveRanking(cleaned);
      return;
    }
    saveRanking(activeRanking);
  }, [shows, activeRanking]);

  function handleDragStart(showId) { setDraggedShow(showId); }
  function handleDragOver(e)       { e.preventDefault(); }

  function handleDrop(targetShowId) {
    if (!draggedShow || draggedShow === targetShowId) return;
    const next         = [...activeRanking];
    const fromIdx      = next.indexOf(draggedShow);
    const toIdx        = next.indexOf(targetShowId);
    const [moved]      = next.splice(fromIdx, 1);
    next.splice(toIdx, 0, moved);
    setRanking(next);
    setDraggedShow(null);
  }

  function handleAddShow() {
    const name = newShow.trim();
    if (!name) return;

    const existing = shows.find((s) => s.title.trim().toLowerCase() === name.toLowerCase());
    if (existing) {
      if (activeRanking.includes(existing.id)) { alert("This show is already ranked."); return; }
      setRanking([...activeRanking, existing.id]);
      setNewShow("");
      return;
    }

    const created = { id: Date.now(), title: name, status: "watched" };
    setShows([...shows, created]);
    setRanking([...activeRanking, created.id]);
    setNewShow("");
  }

  function handleRemoveFromRanking(showId) {
    setRanking(activeRanking.filter((id) => id !== showId));
  }

  // Build ordered list with true rank positions, then filter by search
  const validRankedShows = activeRanking
    .filter((id) => shows.some((s) => s.id === id))
    .map((id, i) => ({ show: shows.find((s) => s.id === id), rank: i + 1 }));

  const trimmedQuery   = searchQuery.trim().toLowerCase();
  const displayShows   = trimmedQuery
    ? validRankedShows.filter(({ show }) => show.title.toLowerCase().includes(trimmedQuery))
    : validRankedShows;

  return (
    <div>
      <Header onNavigate={onNavigate} activePage="ranking" isDark={isDark} onToggleTheme={onToggleTheme} />

      <main>
        <h2 className="page-title">MY RANKING</h2>

        {/* Search bar */}
        <div className="ranking-search-bar">
          <div className="search-wrap">
            <span className="search-icon" aria-hidden="true">🔍</span>
            <input
              className="search-input"
              type="text"
              placeholder="Search ranked shows…"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              aria-label="Search ranked shows"
            />
          </div>
        </div>

        {/* Leaderboard */}
        <div className="ranking-list">
          {displayShows.length === 0 ? (
            <div className="empty-state">
              <h3>{trimmedQuery ? "NO RANKED SHOWS FOUND" : "YOUR RANKING IS EMPTY"}</h3>
              <p>
                {trimmedQuery
                  ? `No ranked shows matching "${searchQuery.trim()}".`
                  : "Add a show below to start your ranking."}
              </p>
            </div>
          ) : (
            displayShows.map(({ show, rank }) => (
              <div className="ranking-item" key={show.id}>
                <ShowBlock
                  show={show}
                  rank={rank}
                  onDragStart={() => handleDragStart(show.id)}
                  onDragOver={handleDragOver}
                  onDrop={() => handleDrop(show.id)}
                />
                <button
                  className="remove-ranking-button"
                  onClick={() => handleRemoveFromRanking(show.id)}
                >
                  REMOVE
                </button>
              </div>
            ))
          )}
        </div>

        {/* Add to ranking */}
        <div className="add-show">
          <h3 className="add-ranking-label">ADD TO RANKING</h3>
          <div className="add-show-row">
            <input
              className="add-show-input"
              type="text"
              placeholder="Enter show name…"
              value={newShow}
              onChange={(e) => setNewShow(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleAddShow()}
            />
            <button className="add-show-btn" onClick={handleAddShow}>ADD</button>
          </div>
        </div>
      </main>
    </div>
  );
}

export default Ranking;
