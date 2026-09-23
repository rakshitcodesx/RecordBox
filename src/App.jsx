import { useState, useEffect, useRef } from "react";
import { fetchPoster } from "./utils/fetchPoster";
import MyShows from "./pages/MyShows";
import Ranking from "./pages/Ranking";
import Profile from "./pages/Profile";
import ConfirmModal from "./components/ConfirmModal";
import UndoToast from "./components/UndoToast";
import LiveWallpaper from "./components/LiveWallpaper";
import shows from "./data/shows";
import initialRanking from "./data/ranking";
import { loadRanking, saveRanking } from "./utils/storage";

function App() {
  const [currentPage, setCurrentPage] = useState("myshows");

  // ── Theme ─────────────────────────────────────────────────
  const [isDark, setIsDark] = useState(() => {
    const saved = localStorage.getItem("showTrackerTheme");
    return saved ? saved === "dark" : true;
  });

  useEffect(() => {
    const root = document.documentElement;
    if (isDark) {
      root.classList.remove("light");
    } else {
      root.classList.add("light");
    }
    localStorage.setItem("showTrackerTheme", isDark ? "dark" : "light");
  }, [isDark]);

  // ── Shows & ranking ───────────────────────────────────────
  const [showList, setShowList] = useState(() => {
    const saved = localStorage.getItem("showTrackerShows");
    return saved ? JSON.parse(saved) : shows;
  });

  const [ranking, setRanking] = useState(() => {
    const saved = loadRanking();
    return saved ?? initialRanking;
  });

  // ── Confirm modal ─────────────────────────────────────────
  const [pendingDelete, setPendingDelete] = useState(null);

  // ── Undo toast ────────────────────────────────────────────
  const [undoSnapshot, setUndoSnapshot] = useState(null);
  const undoTimerRef = useRef(null);

  // ── Persistence ───────────────────────────────────────────
  useEffect(() => {
    localStorage.setItem("showTrackerShows", JSON.stringify(showList));
  }, [showList]);

  useEffect(() => {
    saveRanking(ranking);
  }, [ranking]);

  useEffect(() => {
    return () => { if (undoTimerRef.current) clearTimeout(undoTimerRef.current); };
  }, []);

  // ── Handlers ──────────────────────────────────────────────
  function handleStatusChange(showId, newStatus) {
    setShowList((cur) =>
      cur.map((s) => (s.id === showId ? { ...s, status: newStatus } : s))
    );
  }

  // handleEditShow now accepts { title, posterUrl } as the second argument.
  // posterUrl: null means "keep whatever is already stored" (not "clear it").
  // posterUrl: "" (empty string from the field) is normalised to null = clear.
  function handleEditShow(showId, { title: newTitle, posterUrl: newPosterUrl }) {
    setShowList((cur) => {
      const exists = cur.some(
        (s) => s.id !== showId &&
          s.title.trim().toLowerCase() === newTitle.trim().toLowerCase()
      );
      if (exists) { alert("A show with this name already exists."); return cur; }
      return cur.map((s) =>
        s.id === showId
          ? { ...s, title: newTitle.trim(), posterUrl: newPosterUrl ?? s.posterUrl }
          : s
      );
    });
  }

  // manualPosterUrl: string provided by the user in the form, or null.
  // If provided, skip the API fetch entirely and use it directly.
  async function handleAddShow(title, status, manualPosterUrl = null) {
    const trimmed = title.trim();

    const duplicate = showList.some(
      (s) => s.title.trim().toLowerCase() === trimmed.toLowerCase()
    );
    if (duplicate) { alert("This show is already in your list."); return; }

    const id = Date.now();

    if (manualPosterUrl) {
      // User supplied a URL — insert with it immediately, no fetch needed
      setShowList((cur) => [
        ...cur,
        { id, title: trimmed, status, posterUrl: manualPosterUrl },
      ]);
      return;
    }

    // Optimistic insert; patch once the API resolves
    setShowList((cur) => [...cur, { id, title: trimmed, status, posterUrl: null }]);

    const posterUrl = await fetchPoster(trimmed);
    if (posterUrl) {
      setShowList((cur) =>
        cur.map((s) => (s.id === id ? { ...s, posterUrl } : s))
      );
    }
  }

  function handleRequestDelete(showId, showTitle) {
    setPendingDelete({ showId, showTitle });
  }

  function handleConfirmDelete() {
    const { showId } = pendingDelete;
    setPendingDelete(null);
    const deletedShow   = showList.find((s) => s.id === showId);
    const rankingIndex  = ranking.indexOf(showId);
    setShowList((cur) => cur.filter((s) => s.id !== showId));
    setRanking((cur) => cur.filter((id) => id !== showId));
    if (undoTimerRef.current) clearTimeout(undoTimerRef.current);
    setUndoSnapshot({ show: deletedShow, rankingIndex });
    undoTimerRef.current = setTimeout(() => setUndoSnapshot(null), 5000);
  }

  function handleCancelDelete() { setPendingDelete(null); }

  function handleUndo() {
    if (!undoSnapshot) return;
    const { show, rankingIndex } = undoSnapshot;
    setShowList((cur) => [...cur, show]);
    if (rankingIndex !== -1) {
      setRanking((cur) => {
        const next = [...cur];
        next.splice(rankingIndex, 0, show.id);
        return next;
      });
    }
    if (undoTimerRef.current) clearTimeout(undoTimerRef.current);
    setUndoSnapshot(null);
  }

  function handleDismissUndo() {
    if (undoTimerRef.current) clearTimeout(undoTimerRef.current);
    setUndoSnapshot(null);
  }

  function handleExport() {
    const payload = JSON.stringify({ shows: showList, ranking }, null, 2);
    const blob    = new Blob([payload], { type: "application/json" });
    const url     = URL.createObjectURL(blob);
    const a       = document.createElement("a");
    a.href = url; a.download = "show-tracker-backup.json"; a.click();
    URL.revokeObjectURL(url);
  }

  function handleImport(file) {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const parsed = JSON.parse(e.target.result);
        if (!Array.isArray(parsed.shows) || !Array.isArray(parsed.ranking)) {
          alert("Invalid backup file. Expected { shows: [], ranking: [] }."); return;
        }
        setShowList(parsed.shows);
        setRanking(parsed.ranking);
        localStorage.setItem("showTrackerShows", JSON.stringify(parsed.shows));
        saveRanking(parsed.ranking);
      } catch { alert("Could not read the file. Make sure it is a valid JSON backup."); }
    };
    reader.readAsText(file);
  }

  // ── Render ────────────────────────────────────────────────
  const headerProps = { onNavigate: setCurrentPage, isDark, onToggleTheme: () => setIsDark((d) => !d) };

  return (
    <>
      <LiveWallpaper />
      {currentPage === "ranking" && (
        <Ranking
          onNavigate={setCurrentPage}
          shows={showList}
          setShows={setShowList}
          ranking={ranking}
          setRanking={setRanking}
          isDark={isDark}
          onToggleTheme={headerProps.onToggleTheme}
        />
      )}

      {currentPage === "profile" && (
        <Profile
          onNavigate={setCurrentPage}
          shows={showList}
          ranking={ranking}
          onExport={handleExport}
          onImport={handleImport}
          isDark={isDark}
          onToggleTheme={headerProps.onToggleTheme}
        />
      )}

      {currentPage === "myshows" && (
        <MyShows
          onNavigate={setCurrentPage}
          shows={showList}
          onStatusChange={handleStatusChange}
          onAddShow={handleAddShow}
          onRequestDelete={handleRequestDelete}
          onEditShow={handleEditShow}
          isDark={isDark}
          onToggleTheme={headerProps.onToggleTheme}
        />
      )}

      {pendingDelete && (
        <ConfirmModal
          title="Delete Show"
          message={`Are you sure you want to delete "${pendingDelete.showTitle}"? This cannot be undone.`}
          onConfirm={handleConfirmDelete}
          onCancel={handleCancelDelete}
        />
      )}

      {undoSnapshot && (
        <UndoToast
          message={`"${undoSnapshot.show.title}" deleted.`}
          onUndo={handleUndo}
          onDismiss={handleDismissUndo}
        />
      )}
    </>
  );
}

export default App;
