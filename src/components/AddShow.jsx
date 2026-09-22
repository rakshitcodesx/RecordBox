import { useState } from "react";

function AddShow({ onAddShow, activeTab }) {
  const [title,     setTitle]     = useState("");
  const [imageUrl,  setImageUrl]  = useState("");
  const [isLoading, setIsLoading] = useState(false);

  async function handleSubmit() {
    const t = title.trim();
    if (!t || isLoading) return;

    setIsLoading(true);
    try {
      // Pass the optional URL; App will use it or fall back to API fetch
      await onAddShow(t, activeTab, imageUrl.trim() || null);
      setTitle("");
      setImageUrl("");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="add-show">
      <h3>ADD SHOW</h3>

      <div className="add-show-fields">
        {/* Title row */}
        <div className="add-show-row">
          <input
            className="add-show-input"
            type="text"
            placeholder="Enter show name…"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
            disabled={isLoading}
            aria-label="Show title"
          />
          <button
            className={`add-show-btn${isLoading ? " add-show-btn--loading" : ""}`}
            onClick={handleSubmit}
            disabled={isLoading}
            aria-label={isLoading ? "Fetching poster…" : "Add show"}
          >
            {isLoading ? (
              <>
                <span className="add-show-spinner" aria-hidden="true" />
                ADDING…
              </>
            ) : (
              "ADD"
            )}
          </button>
        </div>

        {/* Optional poster URL */}
        <input
          className="add-show-input add-show-input--url"
          type="url"
          placeholder="Poster image URL (optional — leave blank to auto-fetch)"
          value={imageUrl}
          onChange={(e) => setImageUrl(e.target.value)}
          disabled={isLoading}
          aria-label="Poster image URL (optional)"
        />
      </div>

      {isLoading && (
        <p className="add-show-hint">
          {/* Clarify what's happening based on whether a URL was supplied */}
          {imageUrl.trim()
            ? "Adding show with custom poster…"
            : "Fetching poster artwork…"}
        </p>
      )}
    </div>
  );
}

export default AddShow;
