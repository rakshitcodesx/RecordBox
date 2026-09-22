/**
 * fetchPoster(title)
 *
 * Poster resolution strategy:
 *   1. Jikan v4 — fetch top 5 anime results, pick the tightest title match.
 *      Falls back to data[0] if no title string matches exactly.
 *   2. TVmaze  — search for TV shows, pick the closest name match.
 *   3. null    — if both sources fail or return nothing.
 *
 * All errors are swallowed so callers never need to catch.
 */

const JIKAN_TIMEOUT_MS  = 6000;
const TVMAZE_TIMEOUT_MS = 6000;

// ── Helpers ───────────────────────────────────────────────

/** Race a fetch against a timeout. Throws on abort or network error. */
async function fetchWithTimeout(url, ms) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), ms);
  try {
    return await fetch(url, { signal: controller.signal });
  } finally {
    clearTimeout(timer);
  }
}

/**
 * Normalise a string for comparison:
 *   - lowercase
 *   - strip leading/trailing whitespace
 *   - collapse internal whitespace to a single space
 */
function norm(str) {
  return String(str ?? "").toLowerCase().replace(/\s+/g, " ").trim();
}

/**
 * Score a Jikan anime item against the query.
 * Returns:
 *   3 — primary title (title / title_english) is an exact match
 *   2 — any entry in item.titles[] is an exact match
 *   1 — primary title contains the query as a substring
 *   0 — no match
 */
function scoreJikanItem(item, query) {
  const q = norm(query);

  // Primary titles
  if (norm(item.title) === q || norm(item.title_english) === q) return 3;

  // titles[] array — each entry has a .title field
  const altTitles = Array.isArray(item.titles)
    ? item.titles.map((t) => norm(t.title))
    : [];
  if (altTitles.includes(q)) return 2;

  // Substring fallback on the primary title
  if (norm(item.title).includes(q) || norm(item.title_english).includes(q)) return 1;

  return 0;
}

/**
 * Score a TVmaze result against the query.
 * Returns:
 *   3 — show.name is an exact match
 *   1 — show.name contains the query
 *   0 — no match
 */
function scoreTVmazeItem(item, query) {
  const q    = norm(query);
  const name = norm(item.show?.name);
  if (name === q)          return 3;
  if (name.includes(q))   return 1;
  return 0;
}

/** Extract the best available image URL from a Jikan anime item. */
function jikanImage(item) {
  return (
    item?.images?.jpg?.large_image_url ||
    item?.images?.jpg?.image_url       ||
    null
  );
}

/** Extract the best available image URL from a TVmaze search result. */
function tvmazeImage(item) {
  return (
    item?.show?.image?.original ||
    item?.show?.image?.medium   ||
    null
  );
}

// ── Jikan ─────────────────────────────────────────────────

async function fetchFromJikan(title) {
  try {
    const url = `https://api.jikan.moe/v4/anime?q=${encodeURIComponent(title)}&limit=5`;
    const res  = await fetchWithTimeout(url, JIKAN_TIMEOUT_MS);
    if (!res.ok) return null;

    const json = await res.json();
    const data = json?.data;
    if (!Array.isArray(data) || data.length === 0) return null;

    // Score every result; pick the highest-scoring one
    let bestItem  = null;
    let bestScore = -1;

    for (const item of data) {
      const score = scoreJikanItem(item, title);
      if (score > bestScore) {
        bestScore = score;
        bestItem  = item;
      }
    }

    // If no item even matched by substring, bestScore is 0 — still use data[0]
    // as a last-resort anime fallback (Jikan ranks by relevance anyway).
    const chosen = bestScore > 0 ? bestItem : data[0];
    return jikanImage(chosen);
  } catch {
    return null;
  }
}

// ── TVmaze ────────────────────────────────────────────────

async function fetchFromTVmaze(title) {
  try {
    // Use /search/shows (returns an array) instead of /singlesearch so we can
    // pick the closest match rather than accepting whatever TVmaze ranks first.
    const url = `https://api.tvmaze.com/search/shows?q=${encodeURIComponent(title)}`;
    const res  = await fetchWithTimeout(url, TVMAZE_TIMEOUT_MS);
    if (!res.ok) return null;

    const data = await res.json();
    if (!Array.isArray(data) || data.length === 0) return null;

    let bestItem  = null;
    let bestScore = -1;

    for (const item of data) {
      const score = scoreTVmazeItem(item, title);
      if (score > bestScore) {
        bestScore = score;
        bestItem  = item;
      }
    }

    // Only trust the result if at least a substring matched; otherwise skip
    // to avoid returning a completely unrelated show.
    if (bestScore === 0) return null;

    return tvmazeImage(bestItem);
  } catch {
    return null;
  }
}

// ── Public entry point ────────────────────────────────────

/**
 * Resolve a poster URL for the given show title.
 * Always returns string | null — never throws.
 */
export async function fetchPoster(title) {
  const jikanResult = await fetchFromJikan(title);
  if (jikanResult) return jikanResult;

  const tvmazeResult = await fetchFromTVmaze(title);
  if (tvmazeResult) return tvmazeResult;

  return null;
}
