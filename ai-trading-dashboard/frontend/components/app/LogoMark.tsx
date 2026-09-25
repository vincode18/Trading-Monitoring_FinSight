export function LogoMark({ size = 24 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-label="FinSight">
      <rect width="24" height="24" rx="6" fill="#161B22" />
      <rect x="7" y="9" width="3" height="8" rx="1" fill="#00E676" />
      <line x1="8.5" y1="6" x2="8.5" y2="9" stroke="#00E676" strokeWidth="1.5" />
      <line x1="8.5" y1="17" x2="8.5" y2="19" stroke="#00E676" strokeWidth="1.5" />
      <rect x="14" y="6" width="3" height="6" rx="1" fill="#00E676" opacity="0.6" />
      <line x1="15.5" y1="4" x2="15.5" y2="6" stroke="#00E676" strokeWidth="1.5" opacity="0.6" />
      <line x1="15.5" y1="12" x2="15.5" y2="14" stroke="#00E676" strokeWidth="1.5" opacity="0.6" />
    </svg>
  );
}
