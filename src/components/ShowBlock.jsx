function ShowBlock({ show, rank, onDragStart, onDragOver, onDrop }) {
  return (
    <div
      className="ranking-block"
      draggable
      onDragStart={onDragStart}
      onDragOver={onDragOver}
      onDrop={onDrop}
    >
      {/* Rank badge */}
      <div className="ranking-badge">
        <span className="ranking-number">#{rank}</span>
      </div>

      {/* Poster thumbnail */}
      <div className="ranking-poster">
        {show.posterUrl ? (
          <img
            src={show.posterUrl}
            alt={show.title}
            className="ranking-poster-img"
          />
        ) : (
          <span className="ranking-poster-initials" aria-hidden="true">
            {show.title.slice(0, 2).toUpperCase()}
          </span>
        )}
      </div>

      {/* Title + meta */}
      <div className="ranking-info">
        <div className="ranking-title">{show.title}</div>
        <div className="ranking-meta">Ranked • {show.status.charAt(0).toUpperCase() + show.status.slice(1)}</div>
      </div>

      {/* Drag handle */}
      <div className="ranking-drag-handle" aria-hidden="true">⠿</div>
    </div>
  );
}

export default ShowBlock;
