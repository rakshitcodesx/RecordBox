/**
 * fetchPoster(title)
 *
 * Poster resolution strategy:
 *   1. AniList GraphQL — fuzzy search sorted by popularity, no API key needed.
 *      Returns on any non-null coverImage result.
 *   2. TVmaze          — fallback for Western TV shows. Picks the best-scoring
 *      result; score 0 (no name overlap) → null.
 *   3. null            — both sources missed or failed.
 *
 * Timeouts: AniList 3 000 ms, TVmaze 6 000 ms.
 * All errors are swallowed — callers never need to catch.
 */

const ANILIST_URL       = "https://graphql.anilist.co";
const ANILIST_TIMEOUT_MS = 3000;
const TVMAZE_TIMEOUT_MS  = 6000;

// ── Helpers ───────────────────────────────────────────────

/** Race a fetch against a timeout. Throws on abort or network error. */
async function fetchWithTimeout(url, ms, options = {}) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), ms);
  try {
    return await fetch(url, { ...options, signal: controller.signal });
  } finally {
    clearTimeout(timer);
  }
}

/**
 * Clean a title before sending to any API:
 *   - Normalise smart quotes / apostrophes to plain ASCII
 *   - Strip trailing season / part markers  (Season 1, S2, S02, Part 2)
 *   - Strip common separator characters     (: – — between words)
 *   - Collapse runs of whitespace to a single space and trim
 */
function cleanTitle(raw) {
  return String(raw ?? "")
    .replace(/[\u2018\u2019]/g, "'")          // smart single quotes
    .replace(/[\u201C\u201D]/g, '"')           // smart double quotes
    .replace(/\s*[\-–—:]\s*/g, " ")           // separators → space
    .replace(/\b(season|part|s)\s*\d+\b/gi, "") // season markers
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * Normalise a string for scoring comparison:
 *   lower-case + cleanTitle transformations.
 */
function norm(str) {
  return cleanTitle(String(str ?? "")).toLowerCase();
}

// ── Scoring ───────────────────────────────────────────────

/**
 * Score a TVmaze result against the normalised query.
 *   3 — exact name match
 *   1 — name contains the query as a substring
 *   0 — no match
 */
function scoreTVmazeItem(item, normQuery) {
  const name = norm(item.show?.name ?? "");
  if (name === normQuery)        return 3;
  if (name.includes(normQuery)) return 1;
  return 0;
}

// ── AniList ───────────────────────────────────────────────

const ANILIST_QUERY = `
  query ($search: String) {
    Media (search: $search, type: ANIME, sort: POPULARITY_DESC) {
      id
      title {
        romaji
        english
        native
      }
      coverImage {
        extraLarge
        large
      }
    }
  }
`;

async function fetchFromAniList(title) {
  try {
    const res = await fetchWithTimeout(
      ANILIST_URL,
      ANILIST_TIMEOUT_MS,
      {
        method:  "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body:    JSON.stringify({ query: ANILIST_QUERY, variables: { search: cleanTitle(title) } }),
      }
    );

    if (!res.ok) return null;

    const json  = await res.json();
    const media = json?.data?.Media;
    if (!media) return null;

    return media.coverImage?.extraLarge || media.coverImage?.large || null;
  } catch {
    // AbortError (timeout) or network error
    return null;
  }
}

// ── TVmaze ────────────────────────────────────────────────

async function fetchFromTVmaze(title) {
  try {
    const url = `https://api.tvmaze.com/search/shows?q=${encodeURIComponent(cleanTitle(title))}`;
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

    // Require at least a substring match; never return an unrelated show
    if (bestScore === 0) return null;

    return (
      bestItem?.show?.image?.original ||
      bestItem?.show?.image?.medium   ||
      null
    );
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
  const anilistResult = await fetchFromAniList(title);
  if (anilistResult) return anilistResult;

  const tvmazeResult = await fetchFromTVmaze(title);
  if (tvmazeResult) return tvmazeResult;

  return null;
}
