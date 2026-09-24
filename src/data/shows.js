// ─────────────────────────────────────────────────────────────────────────────
// Default show list — used on first load when localStorage is empty.
// posterUrl is a self-contained data-URI SVG so it never relies on an
// external image that could 404.
// ─────────────────────────────────────────────────────────────────────────────

const PLACEHOLDER_POSTER =
  "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='400' height='550'%3E" +
  "%3Crect width='400' height='550' fill='%231a1030'/%3E" +
  "%3Crect x='1' y='1' width='398' height='548' fill='none' stroke='%23ffffff18' stroke-width='1'/%3E" +
  "%3Ccircle cx='200' cy='220' r='52' fill='none' stroke='%23ffffff22' stroke-width='2'/%3E" +
  "%3Cpolygon points='183,200 183,240 222,220' fill='%23ffffff30'/%3E" +
  "%3Crect x='120' y='295' width='160' height='3' rx='2' fill='%23ffffff18'/%3E" +
  "%3Crect x='150' y='310' width='100' height='3' rx='2' fill='%23ffffff12'/%3E" +
  "%3C/svg%3E";

const shows = [
  // ── Ranking shows (IDs 1-3 — must match ranking.js) ──────────────────────
  {
    id: 1,
    title: "Example Show 1",
    status: "watched",
    rating: null,
    posterUrl: PLACEHOLDER_POSTER,
  },
  {
    id: 2,
    title: "Example Show 2",
    status: "watched",
    rating: null,
    posterUrl: PLACEHOLDER_POSTER,
  },
  {
    id: 3,
    title: "Example Show 3",
    status: "watched",
    rating: null,
    posterUrl: PLACEHOLDER_POSTER,
  },

  // ── Status-tab placeholders ───────────────────────────────────────────────
  {
    id: 4,
    title: "Example Show",
    status: "watchlist",
    rating: null,
    posterUrl: PLACEHOLDER_POSTER,
  },
  {
    id: 5,
    title: "Example Show",
    status: "dropped",
    rating: null,
    posterUrl: PLACEHOLDER_POSTER,
  },
];

export default shows;
