/**
 * LiveWallpaper
 *
 * Renders the reference sakura illustration as a fixed full-screen background,
 * then floats 18 animated SVG petals over it.
 *
 * Asset: /sakura-wallpaper.png  (place the reference image in /public/)
 *
 * Layer order:
 *   1. <img>        — reference illustration, object-fit: cover
 *   2. .lw-overlay  — rgba(13, 8, 20, 0.35) dark-violet wash
 *   3. Petal SVGs   — 18 animated petals; ~25% carry .lw-petal-dof for
 *                     depth-of-field (blur + reduced opacity)
 */

// ── Seeded PRNG (Mulberry32) ──────────────────────────────
function seededRandom(seed) {
  let s = seed >>> 0;
  return () => {
    s += 0x6D2B79F5;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t ^= t + Math.imul(t ^ (t >>> 7), 61 | t);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
const rng = (rand, lo, hi) => lo + rand() * (hi - lo);

// ── Petal colours — matched to the reference illustration ─
const FILLS = [
  "#ffe4e6", "#fecdd3", "#fda4af",
  "#fbcfe8", "#fce7f3", "#f9a8d4",
  "#fde8ea", "#fff1f2",
];

// ── 18 petal configs, stable at module load ───────────────
// Petals whose index satisfies (i % 4 === 1) are "background" petals
// (~22% of 18) — they receive the .lw-petal-dof class which applies
// blur(1.5px) + reduced opacity to simulate camera depth of field.
const PETALS = Array.from({ length: 18 }, (_, i) => {
  const rand = seededRandom(i * 7919 + 31337);
  return {
    id:        i,
    dof:       i % 4 === 1,               // ~25% get depth-of-field treatment
    startX:    rng(rand, 0, 100),
    size:      rng(rand, 8, 18),
    fill:      FILLS[Math.floor(rand() * FILLS.length)],
    opacity:   rng(rand, 0.55, 0.88),
    fallDur:   rng(rand, 10, 24),
    fallDelay: rng(rand, 0, 20),
    swayAmt:   rng(rand, 28, 80),
    swayDur:   rng(rand, 3.5, 7),
    rotZ:      rng(rand, 0, 360),
    rotZDelta: (rand() > 0.5 ? 1 : -1) * rng(rand, 90, 360),
    tumbleAmp: rng(rand, 20, 52),
    tumbleDur: rng(rand, 1.8, 4.0),
  };
});

export default function LiveWallpaper() {
  const prefersReduced =
    typeof window !== "undefined" &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  return (
    <div className="lw-container" aria-hidden="true">

      {/* ── 1. Background illustration ──────────────────── */}
      <img
        src="/sakura-wallpaper.png"
        alt=""
        className="lw-bg-img"
        draggable={false}
      />

      {/* ── 2. Dark-violet atmospheric overlay ──────────── */}
      <div className="lw-overlay" />

      {/* ── 3. Floating petals ──────────────────────────── */}
      {!prefersReduced && (
        <svg
          className="lw-petals-svg"
          viewBox="0 0 1440 900"
          preserveAspectRatio="xMidYMid slice"
          xmlns="http://www.w3.org/2000/svg"
          aria-hidden="true"
        >
          <defs>
            <clipPath id="lw-vp">
              <rect width="1440" height="900" />
            </clipPath>
          </defs>

          <g clipPath="url(#lw-vp)">
            {PETALS.map((p) => (
              /*
               * Three-level nesting — each level owns one transform axis:
               *   outer  (.lw-petal-sway)   → translateX  (wind sway)
               *   middle (.lw-petal-fall)   → translateY + rotateZ (fall + spin)
               *   inner  (.lw-petal-tumble) → rotateX (3-D tumble)
               *
               * DoF petals additionally get .lw-petal-dof on the outermost
               * group, which applies CSS filter: blur(1.5px) + opacity: 0.55.
               */
              <g
                key={p.id}
                className={`lw-petal-sway${p.dof ? " lw-petal-dof" : ""}`}
                style={{
                  "--sway-amt":   `${p.swayAmt.toFixed(1)}px`,
                  "--sway-dur":   `${p.swayDur.toFixed(2)}s`,
                  "--sway-delay": `${(p.fallDelay % p.swayDur).toFixed(2)}s`,
                  transform:      `translateX(${(p.startX * 14.4).toFixed(1)}px)`,
                }}
              >
                <g
                  className="lw-petal-fall"
                  style={{
                    "--fall-dur":   `${p.fallDur.toFixed(2)}s`,
                    "--fall-delay": `${p.fallDelay.toFixed(2)}s`,
                    "--rot-start":  `${p.rotZ.toFixed(1)}deg`,
                    "--rot-end":    `${(p.rotZ + p.rotZDelta).toFixed(1)}deg`,
                  }}
                >
                  <g
                    className="lw-petal-tumble"
                    style={{
                      "--tumble-amp": `${p.tumbleAmp.toFixed(1)}deg`,
                      "--tumble-dur": `${p.tumbleDur.toFixed(2)}s`,
                    }}
                  >
                    {/* Notched cherry-blossom teardrop */}
                    <path
                      d="M0,-14 C5,-22 17,-20 18,-10 C19,2 10,14 0,20
                         C-10,14 -19,2 -18,-10 C-17,-20 -5,-22 0,-14 Z"
                      fill={p.fill}
                      opacity={p.opacity}
                      style={{ transform: `scale(${(p.size / 14).toFixed(3)})` }}
                    />
                  </g>
                </g>
              </g>
            ))}
          </g>
        </svg>
      )}

    </div>
  );
}
