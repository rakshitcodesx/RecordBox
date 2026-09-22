import { useState } from "react";
import Header from "../components/Header";
import ShowCard from "../components/ShowCard";
import AddShow from "../components/AddShow";

const SORT_OPTIONS = [
  { value: "newest", label: "Date Added: Newest" },
  { value: "oldest", label: "Date Added: Oldest" },
  { value: "az",     label: "Title: A → Z" },
  { value: "za",     label: "Title: Z → A" },
];

const TAB_LABELS = { watched: "WATCHED", watchlist: "WATCHLIST", dropped: "DROPPED" };

function applySort(arr, key) {
  const copy = [...arr];
  switch (key) {
    case "oldest": return copy.sort((a, b) => a.id - b.id);
    case "az":     return copy.sort((a, b) => a.title.localeCompare(b.title));
    case "za":     return copy.sort((a, b) => b.title.localeCompare(a.title));
    default:       return copy.sort((a, b) => b.id - a.id);
  }
}

function MyShows({ onNavigate, shows, onStatusChange, onAddShow, onRequestDelete, onEditShow, isDark, onToggleTheme }) {
  const [activeTab,    setActiveTab]    = useState("watched");
  const [searchQuery,  setSearchQuery]  = useState("");
  const [sortKey,      setSortKey]      = useState("newest");
  const [viewMode,     setViewMode]     = useState("grid"); // "grid" | "list"

  const visibleShows = applySort(
    shows
      .filter((s) => s.status === activeTab)
      .filter((s) => s.title.toLowerCase().includes(searchQuery.toLowerCase().trim())),
    sortKey
  );

  function handleTabChange(tab) { setActiveTab(tab); setSearchQuery(""); }

  return (
    <div>
      <Header onNavigate={onNavigate} activePage="myshows" isDark={isDark} onToggleTheme={onToggleTheme} />

      <main>
        <h2 className="page-title">MY SHOWS</h2>

        {/* Status tabs */}
        <div className="show-tabs">
          {["watched", "watchlist", "dropped"].map((tab) => (
            <button
              key={tab}
              className={activeTab === tab ? "active-tab" : ""}
              onClick={() => handleTabChange(tab)}
            >
              {TAB_LABELS[tab]}
            </button>
          ))}
        </div>

        {/* Controls row */}
        <div className="controls-row">
          <div className="search-wrap">
            <span className="search-icon" aria-hidden="true">🔍</span>
            <input
              className="search-input"
              type="text"
              placeholder="Search shows…"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              aria-label="Search shows"
            />
          </div>

          <select
            className="sort-select"
            value={sortKey}
            onChange={(e) => setSortKey(e.target.value)}
            aria-label="Sort shows"
          >
            {SORT_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>

          {/* View toggle */}
          <div className="view-toggle" role="group" aria-label="View layout">
            <button
              className={`view-btn${viewMode === "grid" ? " active" : ""}`}
              onClick={() => setViewMode("grid")}
              aria-label="Grid view"
              title="Grid view"
            >
              ⊞
            </button>
            <button
              className={`view-btn${viewMode === "list" ? " active" : ""}`}
              onClick={() => setViewMode("list")}
              aria-label="List view"
              title="List view"
            >
              ☰
            </button>
          </div>
        </div>

        {/* Cards */}
        <div className={`show-grid${viewMode === "list" ? " list-view" : ""}`}>
          {visibleShows.length === 0 ? (
            <div className="empty-state">
              <h3>{searchQuery.trim() ? "NO RESULTS FOUND" : "NO SHOWS HERE"}</h3>
              <p>
                {searchQuery.trim()
                  ? `No shows match "${searchQuery.trim()}".`
                  : "You haven't added any shows to this list yet."}
              </p>
            </div>
          ) : (
            visibleShows.map((show) => (
              <ShowCard
                key={show.id}
                show={show}
                onStatusChange={onStatusChange}
                onRequestDelete={onRequestDelete}
                onEditShow={onEditShow}
              />
            ))
          )}
        </div>

        <AddShow onAddShow={onAddShow} activeTab={activeTab} />
      </main>
    </div>
  );
}

export default MyShows;
