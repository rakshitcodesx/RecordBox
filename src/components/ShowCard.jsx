import { useState } from "react";

const STATUS_LABELS = {
  watched:   "Watched",
  watchlist: "Watchlist",
  dropped:   "Dropped",
};

// onEditShow signature: (showId, { title, posterUrl })
function ShowCard({ show, onStatusChange, onRequestDelete, onEditShow }) {
  const [isEditing,   setIsEditing]   = useState(false);
  const [editedTitle, setEditedTitle] = useState(show.title);
  const [editedUrl,   setEditedUrl]   = useState(show.posterUrl || "");

  function handleSave() {
    const t   = editedTitle.trim();
    const url = editedUrl.trim() || null;
    if (!t) return;
    onEditShow(show.id, { title: t, posterUrl: url });
    setIsEditing(false);
  }

  function handleCancelEdit() {
    setEditedTitle(show.title);
    setEditedUrl(show.posterUrl || "");
    setIsEditing(false);
  }

  const posterUrl = show.posterUrl || show.image || null;
  const rating    = show.rating != null ? show.rating : null;

  return (
    <div className="show-card">

      {/* ── 2:3 Poster ─────────────────────────────────── */}
      <div className="show-card-poster">
        {posterUrl ? (
          <img src={posterUrl} alt={show.title} className="show-card-img" />
        ) : (
          <div className="show-card-fallback">{show.title}</div>
        )}

        {/* Floating status badge — top-right corner of poster */}
        <span className={`show-card-badge show-card-badge--${show.status}`}>
          {STATUS_LABELS[show.status]}
        </span>

        {/* Hover overlay */}
        <div className="show-card-overlay">
          {isEditing ? (
            <div className="overlay-edit-form">
              <label className="overlay-edit-label">TITLE</label>
              <input
                className="overlay-status-select"
                type="text"
                value={editedTitle}
                onChange={(e) => setEditedTitle(e.target.value)}
                onClick={(e) => e.stopPropagation()}
                autoFocus
                aria-label="Edit show title"
              />

              <label className="overlay-edit-label">POSTER URL (optional)</label>
              <input
                className="overlay-status-select overlay-url-input"
                type="url"
                placeholder="https://…"
                value={editedUrl}
                onChange={(e) => setEditedUrl(e.target.value)}
                onClick={(e) => e.stopPropagation()}
                aria-label="Edit poster URL"
              />

              <div className="overlay-edit-actions">
                <button className="overlay-btn" onClick={handleSave}>SAVE</button>
                <button className="overlay-btn" onClick={handleCancelEdit}>CANCEL</button>
              </div>
            </div>
          ) : (
            <>
              <select
                className="overlay-status-select"
                value={show.status}
                onChange={(e) => onStatusChange(show.id, e.target.value)}
                onClick={(e) => e.stopPropagation()}
                aria-label="Move to status"
              >
                <option value="watched">Move Status ∨ Watched</option>
                <option value="watchlist">Move Status ∨ Watchlist</option>
                <option value="dropped">Move Status ∨ Dropped</option>
              </select>

              <button className="overlay-btn" onClick={() => setIsEditing(true)}>
                EDIT NAME
              </button>

              <button
                className="overlay-btn overlay-btn--delete"
                onClick={() => onRequestDelete(show.id, show.title)}
              >
                DELETE
              </button>
            </>
          )}
        </div>
      </div>

      {/* ── Card footer — two-line vertical hierarchy ───── */}
      <div className="show-card-footer">
        {/* Line 1: title */}
        <span className="show-card-title">{show.title}</span>

        {/* Line 2: secondary metadata in muted lavender-gray */}
        <div className="show-card-meta">
          {rating != null ? (
            <span className="show-card-rating" aria-label={`Rating ${rating} out of 5`}>
              ★ {rating}/5
            </span>
          ) : (
            <span className="show-card-rating" aria-label="Unrated">★ —</span>
          )}
        </div>
      </div>

    </div>
  );
}

export default ShowCard;
