export function PalmGuide({ width = 250, dashed = true, faint = false }: { width?: number; dashed?: boolean; faint?: boolean }) {
  const h = (width / 250) * 360;
  const outline = faint ? "#6B6194" : "#D9A04A";
  const sw = dashed ? 2 : 6;
  const lw = dashed ? 3 : 9;
  return (
    <svg width={width} height={h} viewBox="0 0 250 360" fill="none" aria-hidden>
      <g stroke={outline} strokeWidth={sw} strokeDasharray={dashed ? "6 6" : undefined} strokeLinecap="round">
        <rect x="52" y="30" width="30" height="130" rx="15" />
        <rect x="88" y="10" width="30" height="150" rx="15" />
        <rect x="124" y="16" width="30" height="144" rx="15" />
        <rect x="160" y="40" width="28" height="124" rx="14" />
        <path d="M50 150 C 42 230, 60 320, 125 340 C 190 330, 205 250, 196 160" />
        {dashed && <path d="M50 190 C 24 176, 8 196, 18 218 L 52 262" />}
      </g>
      <path d="M72 186 C 60 230, 70 290, 110 318" stroke="#E07A8B" strokeWidth={lw} strokeLinecap="round" />
      <path d="M78 184 C 120 196, 160 200, 190 188" stroke="#7FB7E8" strokeWidth={lw} strokeLinecap="round" />
      <path d="M70 212 C 110 214, 140 224, 176 246" stroke="#9BE6C0" strokeWidth={lw} strokeLinecap="round" />
      <path d="M130 318 C 128 270, 128 230, 132 196" stroke="#D9A04A" strokeWidth={lw} strokeLinecap="round" />
    </svg>
  );
}

export const PALM_LINES = [
  { key: "life", label: "生命線", color: "#E07A8B" },
  { key: "heart", label: "感情線", color: "#7FB7E8" },
  { key: "head", label: "頭脳線", color: "#9BE6C0" },
  { key: "fate", label: "運命線", color: "#D9A04A" },
] as const;
