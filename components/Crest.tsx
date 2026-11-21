export function Crest({ className = "h-8 w-8" }: { className?: string }) {
  return (
    <svg viewBox="0 0 64 64" className={className} role="img" aria-label="Crest" fill="none">
      <defs>
        <linearGradient id="crest-gold" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#f4e3a0" />
          <stop offset="1" stopColor="#c9a227" />
        </linearGradient>
      </defs>
      <path d="M8 46 L12 20 L24 32 L32 14 L40 32 L52 20 L56 46 Z" fill="url(#crest-gold)" stroke="#856614" strokeWidth="1.5" strokeLinejoin="round" />
      <rect x="8" y="46" width="48" height="8" rx="2" fill="url(#crest-gold)" stroke="#856614" strokeWidth="1.5" />
      <circle cx="12" cy="18" r="3" fill="#f4e3a0" stroke="#856614" strokeWidth="1" />
      <circle cx="32" cy="12" r="3.5" fill="#f4e3a0" stroke="#856614" strokeWidth="1" />
      <circle cx="52" cy="18" r="3" fill="#f4e3a0" stroke="#856614" strokeWidth="1" />
      <circle cx="20" cy="50" r="1.6" fill="#5c2baa" />
      <circle cx="32" cy="50" r="1.6" fill="#5c2baa" />
      <circle cx="44" cy="50" r="1.6" fill="#5c2baa" />
    </svg>
  );
}
