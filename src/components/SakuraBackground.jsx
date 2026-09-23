import { useMemo } from "react";

// ── Seeded PRNG (Mulberry32) ──────────────────────────────
// Deterministic so layout is stable across re-renders, unique per petal.
function seededRandom(seed) {
  let s = seed >>> 0;
  return () => {
    s += 0x6D2B79F5;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t ^= t + Math.imul(t ^ (t >>> 7), 61 | t);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function range(rand, min, max) {
  return min + rand() * (max - min);
}

// ── Config ────────────────────────────────────────────────
const PETAL_COUNT = 18;

// Warm amber/gold tones — visible against #121214 charcoal
const PETAL_COLORS = [
  "#f6ad55", // amber-400  (primary)
  "#fbbf24", // amber-400  (golden)
  "#fcd34d", // amber-300  (bright)
  "#f59e0b", // amber-500  (deep)
  "#fed7aa", // orange-200 (soft blush)
];

// ── Component ─────────────────────────────────────────────
export default function SakuraBackground() {
  // Bail out completely if user prefers reduced motion
  const prefersReduced =
    typeof window !== "undefined" &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  // eslint-disable-next-line react-hooks/rules-of-hooks
  const petals = useMemo(() => {
    return Array.from({ length: PETAL_COUNT }, (_, i) => {
      const rand = seededRandom(i * 9973 + 1234);

      return {
        id:          i,
        left:        range(rand, 0, 100),          // vw  — horizontal start
        size:        range(rand, 8, 18),            // px  — petal dimensions
        fallDur:     range(rand, 10, 22),           // s   — how long to fall
        fallDelay:   range(rand, 0, 18),            // s   — staggered entrance
        swayAmount:  range(rand, 25, 80),           // px  — horizontal swing
        swayDur:     range(rand, 3, 6),             // s   — sway period
        rotateDeg:   range(rand, 0, 360),           // deg — initial angle
        rotateDelta: (rand() > 0.5 ? 1 : -1) * range(rand, 90, 360), // total spin
        color:       PETAL_COLORS[Math.floor(rand() * PETAL_COLORS.length)],
        opacity:     range(rand, 0.55, 0.85),       // clearly visible
      };
    });
  }, []);

  if (prefersReduced) return null;

  return (
    <div className="sakura-container" aria-hidden="true">
      {petals.map((p) => (
        /*
         * Two-div nesting is the key to avoiding the transform-conflict bug:
         *   outer (.sakura-petal)       — sakuraSway  (translateX only)
         *   inner (.sakura-petal-inner) — sakuraFall  (translateY + rotate)
         *
         * Each animation writes to a different transform stack, so they
         * compose instead of overwriting each other.
         */
        <div
          key={p.id}
          className="sakura-petal"
          style={{
            left:              `${p.left}vw`,
            width:             `${p.size}px`,
            height:            `${p.size}px`,
            backgroundColor:   p.color,
            opacity:           p.opacity,
            "--sway-amount":   `${p.swayAmount}px`,
            "--sway-dur":      `${p.swayDur}s`,
            "--sway-delay":    `${p.fallDelay}s`,
          }}
        >
          <div
            className="sakura-petal-inner"
            style={{
              "--fall-dur":      `${p.fallDur}s`,
              "--fall-delay":    `${p.fallDelay}s`,
              "--rotate-start":  `${p.rotateDeg}deg`,
              "--rotate-end":    `${p.rotateDeg + p.rotateDelta}deg`,
            }}
          />
        </div>
      ))}
    </div>
  );
}
