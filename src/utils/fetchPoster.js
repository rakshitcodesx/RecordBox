/**
 * fetchPoster(title)
 *
 * Poster resolution strategy:
 *   1. Jikan v4  — search up to 5 anime results, score each against the
 *                  normalised query. ONLY return a result if score >= 1.
 *                  Score 0 → immediate cascade (no data[0] fallback).
 *                  HTTP 429 / timeout → immediate cascade.
 *   2. TVmaze    — search TV shows, score each result. Only accept score >= 1.
 *   3. null      — both sources missed or failed.
 *
 * Timeouts: Jikan 3 500 ms, TVmaze 6 000 ms.
 * All errors are swallowed — callers never need to catch.
 */

const JIKAN_TIMEOUT_MS  = 3500;
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
 *   - lowercase + trim
 *   - strip trailing season markers: "Season 1", "S2", "S02", "Part 2"
 *   - strip common punctuation ( : – — ' " )
 *   - collapse internal whitespace to a single space
 */
function norm(str) {
  return String(str ?? "")
    .toLowerCase()
    .replace(/\s*[\-–—:]\s*/g, " ")          // separators → space
    .replace(/['"]/g, "")                      // strip quotes
    .replace(/\b(season|part|s)\s*\d+\b/gi, "") // trailing season markers
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * Score a Jikan anime item against the (already-normalised) query.
 *   3 — primary title (title / title_english) is an exact match
 *   2 — any entry in item.titles[] is an exact match
 *   1 — primary title contains the query as a substring
 *   0 — no match
 */
function scoreJikanItem(item, normQuery) {
  const primary     = norm(item.title);
  const english     = norm(item.title_english);
  const altTitles   = Array.isArray(item.titles)
    ? item.titles.map((t) => norm(t.title))
    : [];

  if (primary === normQuery || english === normQuery) return 3;
  if (altTitles.includes(normQuery))                  return 2;
  if (primary.includes(normQuery) || english.includes(normQuery)) return 1;
  return 0;
}

/**
 * Score a TVmaze result against the (already-normalised) query.
 *   3 — show.name is an exact match
 *   1 — show.name contains the query
 *   0 — no match
 */
function scoreTVmazeItem(item, normQuery) {
  const name = norm(item.show?.name);
  if (name === normQuery)        return 3;
  if (name.includes(normQuery)) return 1;
  return 0;
}

/** Best image URL from a Jikan anime item. */
function jikanImage(item) {
  return (
    item?.images?.jpg?.large_image_url ||
    item?.images?.jpg?.image_url       ||
    null
  );
}

/** Best image URL from a TVmaze search result. */
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
    const res = await fetchWithTimeout(url, JIKAN_TIMEOUT_MS);

    // 429 = rate-limited → cascade immediately
    if (res.status === 429) return null;
    if (!res.ok)            return null;

    const json = await res.json();
    const data = json?.data;
    if (!Array.isArray(data) || data.length === 0) return null;

    const normQuery = norm(title);
    let bestItem  = null;
    let bestScore = 0;

    for (const item of data) {
      const score = scoreJikanItem(item, normQuery);
      if (score > bestScore) {
        bestScore = score;
        bestItem  = item;
      }
    }

    // Score 0 → no meaningful match → cascade to TVmaze (no data[0] fallback)
    if (bestScore === 0) return null;

    return jikanImage(bestItem);
  } catch {
    // AbortError (timeout) or network error → cascade
    return null;
  }
}

// ── TVmaze ────────────────────────────────────────────────

async function fetchFromTVmaze(title) {
  try {
    const url = `https://api.tvmaze.com/search/shows?q=${encodeURIComponent(title)}`;
    const res = await fetchWithTimeout(url, TVMAZE_TIMEOUT_MS);
    if (!res.ok) return null;

    const data = await res.json();
    if (!Array.isArray(data) || data.length === 0) return null;

    const normQuery = norm(title);
    let bestItem  = null;
    let bestScore = 0;

    for (const item of data) {
      const score = scoreTVmazeItem(item, normQuery);
      if (score > bestScore) {
        bestScore = score;
        bestItem  = item;
      }
    }

    // Only trust results that at least contained the query as a substring
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
