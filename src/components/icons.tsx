type P = { size?: number; className?: string; strokeWidth?: number };
const base = (size = 22) => ({
  width: size,
  height: size,
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
  "aria-hidden": true,
});

export const IBack = ({ size = 20, className, strokeWidth = 2 }: P) => (
  <svg {...base(size)} strokeWidth={strokeWidth} className={className}><path d="M15 5l-7 7 7 7" /></svg>
);
export const IMsg = ({ size, className, strokeWidth = 1.6 }: P) => (
  <svg {...base(size)} strokeWidth={strokeWidth} className={className}><path d="M4 5h16v11H9l-5 4z" /></svg>
);
export const IBag = ({ size, className, strokeWidth = 1.6 }: P) => (
  <svg {...base(size)} strokeWidth={strokeWidth} className={className}><path d="M5 8h14l-1.2 12H6.2z" /><path d="M9 8V6a3 3 0 0 1 6 0v2" /></svg>
);
export const IPalm = ({ size, className, strokeWidth = 1.6 }: P) => (
  <svg {...base(size)} strokeWidth={strokeWidth} className={className}>
    <path d="M8 13V5.5a1.5 1.5 0 0 1 3 0V12" /><path d="M11 11.5V4a1.5 1.5 0 0 1 3 0v8" /><path d="M14 12V5.5a1.5 1.5 0 0 1 3 0V14" />
    <path d="M17 10.5a1.5 1.5 0 0 1 3 0V15a7 7 0 0 1-7 7h-1a7 7 0 0 1-5.6-2.8L4 16.5a1.6 1.6 0 0 1 2.4-2.1L8 16" />
  </svg>
);
export const IUser = ({ size, className, strokeWidth = 1.6 }: P) => (
  <svg {...base(size)} strokeWidth={strokeWidth} className={className}><circle cx="12" cy="8" r="4" /><path d="M4 21a8 8 0 0 1 16 0" /></svg>
);
export const IBell = ({ size, className, strokeWidth = 1.6 }: P) => (
  <svg {...base(size)} strokeWidth={strokeWidth} className={className}><path d="M6 16V11a6 6 0 0 1 12 0v5l1.5 2h-15z" /><path d="M10 20a2 2 0 0 0 4 0" /></svg>
);
export const IStar = ({ size = 14, className, filled = true }: P & { filled?: boolean }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill={filled ? "currentColor" : "none"} stroke="currentColor" strokeWidth={1.4} strokeLinejoin="round" aria-hidden className={className}>
    <path d="M12 2l2.9 6.6 7.1.6-5.4 4.7 1.6 7L12 17.3 5.8 20.9l1.6-7L2 9.2l7.1-.6z" />
  </svg>
);
export const IVideo = ({ size, className, strokeWidth = 1.6 }: P) => (
  <svg {...base(size)} strokeWidth={strokeWidth} className={className}><rect x="3" y="6" width="13" height="12" rx="2.5" /><path d="M16 10.5l5-3v9l-5-3" /></svg>
);
export const IMic = ({ size, className, strokeWidth = 1.6 }: P) => (
  <svg {...base(size)} strokeWidth={strokeWidth} className={className}><path d="M12 3a3 3 0 0 0-3 3v6a3 3 0 0 0 6 0V6a3 3 0 0 0-3-3z" /><path d="M19 11a7 7 0 0 1-14 0" /><path d="M12 18v3" /></svg>
);
export const IMicOff = ({ size, className, strokeWidth = 1.6 }: P) => (
  <svg {...base(size)} strokeWidth={strokeWidth} className={className}><path d="M9 9v3a3 3 0 0 0 5.1 2.1M15 10V6a3 3 0 0 0-5.7-1.3" /><path d="M19 11a7 7 0 0 1-11.9 5M5 11a7 7 0 0 0 .6 2.8" /><path d="M12 18v3M3 3l18 18" /></svg>
);
export const IGift = ({ size, className, strokeWidth = 1.8 }: P) => (
  <svg {...base(size)} strokeWidth={strokeWidth} className={className}>
    <rect x="4" y="9" width="16" height="11" rx="1.5" /><path d="M12 9v11M4 13h16" />
    <path d="M12 9c-2-4-6-4-6-1.5S9 9 12 9zm0 0c2-4 6-4 6-1.5S15 9 12 9z" />
  </svg>
);
export const IEnd = ({ size = 24, className }: P) => (
  <svg {...base(size)} strokeWidth={1.8} className={className}><path d="M3 14c5-5 13-5 18 0l-2.5 2.5-3-1.5v-2.5a10 10 0 0 0-7 0V15l-3 1.5z" /></svg>
);
export const ICart = ({ size, className, strokeWidth = 1.6 }: P) => (
  <svg {...base(size)} strokeWidth={strokeWidth} className={className}><path d="M3 4h2l2.2 11h10.6L20 7H6.2" /><circle cx="9" cy="19.5" r="1.3" /><circle cx="17" cy="19.5" r="1.3" /></svg>
);
export const ISearch = ({ size = 18, className, strokeWidth = 1.8 }: P) => (
  <svg {...base(size)} strokeWidth={strokeWidth} className={className}><circle cx="11" cy="11" r="6.5" /><path d="M16 16l4 4" /></svg>
);
export const IImage = ({ size, className, strokeWidth = 1.6 }: P) => (
  <svg {...base(size)} strokeWidth={strokeWidth} className={className}><rect x="3" y="4" width="18" height="16" rx="3" /><circle cx="9" cy="10" r="2" /><path d="M21 16l-5-5-9 9" /></svg>
);
export const ICalendar = ({ size = 16, className, strokeWidth = 1.8 }: P) => (
  <svg {...base(size)} strokeWidth={strokeWidth} className={className}><rect x="3" y="5" width="18" height="16" rx="2.5" /><path d="M3 10h18M8 3v4M16 3v4" /></svg>
);
export const IClock = ({ size, className, strokeWidth = 1.6 }: P) => (
  <svg {...base(size)} strokeWidth={strokeWidth} className={className}><circle cx="12" cy="12" r="8" /><path d="M12 8v4l3 2" /></svg>
);
export const ICardPay = ({ size, className, strokeWidth = 1.6 }: P) => (
  <svg {...base(size)} strokeWidth={strokeWidth} className={className}><rect x="3" y="6" width="18" height="13" rx="2.5" /><path d="M3 10h18" /></svg>
);
export const IHeart = ({ size = 20, className, filled }: P & { filled?: boolean }) => (
  <svg {...base(size)} fill={filled ? "currentColor" : "none"} strokeWidth={1.8} className={className}><path d="M12 20s-7-4.4-7-10a4 4 0 0 1 7-2.6A4 4 0 0 1 19 10c0 5.6-7 10-7 10z" /></svg>
);
export const ISpeaker = ({ size, className, strokeWidth = 1.6 }: P) => (
  <svg {...base(size)} strokeWidth={strokeWidth} className={className}><path d="M4 9h4l5-4v14l-5-4H4z" /><path d="M16.5 8.5a5 5 0 0 1 0 7M19 6a8.5 8.5 0 0 1 0 12" /></svg>
);
export const IClose = ({ size = 18, className }: P) => (
  <svg {...base(size)} strokeWidth={2} className={className}><path d="M6 6l12 12M18 6L6 18" /></svg>
);
export const IPip = ({ size, className, strokeWidth = 1.6 }: P) => (
  <svg {...base(size)} strokeWidth={strokeWidth} className={className}><rect x="4" y="4" width="16" height="16" rx="3" /><rect x="12" y="12" width="6" height="6" rx="1.5" /></svg>
);
export const IHandCam = ({ size, className, strokeWidth = 1.6 }: P) => (
  <svg {...base(size)} strokeWidth={strokeWidth} className={className}><rect x="4" y="3" width="11" height="16" rx="2" /><path d="M15 6l4 1.2-3.2 13.3-6.5-1.6" /></svg>
);
export const ISwitch = ({ size, className, strokeWidth = 1.6 }: P) => (
  <svg {...base(size)} strokeWidth={strokeWidth} className={className}><path d="M20 12a8 8 0 0 1-14 5.3" /><path d="M4 12a8 8 0 0 1 14-5.3" /><path d="M18 3v4h-4" /><path d="M6 21v-4h4" /></svg>
);
export const ISend = ({ size = 20, className }: P) => (
  <svg {...base(size)} strokeWidth={2} className={className}><path d="M4 12l16-8-6 16-2-7z" /></svg>
);
export const IPen = ({ size = 14, className }: P) => (
  <svg {...base(size)} strokeWidth={2} className={className}><path d="M4 20h4L19 9l-4-4L4 16z" /></svg>
);
export const IInfo = ({ size = 18, className }: P) => (
  <svg {...base(size)} strokeWidth={1.8} className={className}><circle cx="12" cy="12" r="9" /><path d="M12 11v6M12 7.5v.5" /></svg>
);
export const IBank = ({ size, className }: P) => (
  <svg {...base(size)} strokeWidth={1.6} className={className}><path d="M3 10l9-6 9 6" /><path d="M5 10v8M9 10v8M15 10v8M19 10v8M3 20h18" /></svg>
);
export const IMenu = ({ size = 22, className }: P) => (
  <svg {...base(size)} strokeWidth={2} className={className}><path d="M4 7h16M4 12h16M4 17h16" /></svg>
);
