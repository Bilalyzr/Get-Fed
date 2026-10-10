// ---------------------------------------------------------------------------
// Food Worth Saving brand mark — a sprout rising from a bowl, drawn as a
// crisp SVG with a green→lime gradient. Works at 16px favicon up to hero size.
// ---------------------------------------------------------------------------

export function Logo({
  size = 36,
  className = "",
  withWordmark = false,
}: {
  size?: number;
  className?: string;
  withWordmark?: boolean;
}) {
  return (
    <span className={`inline-flex items-center gap-2.5 ${className}`}>
      <svg
        width={size}
        height={size}
        viewBox="0 0 48 48"
        fill="none"
        aria-hidden
        className="shrink-0 drop-shadow-sm"
      >
        <defs>
          <linearGradient id="fws-logo-bg" x1="4" y1="2" x2="44" y2="46" gradientUnits="userSpaceOnUse">
            <stop stopColor="#052e16" />
            <stop offset="0.5" stopColor="#166534" />
            <stop offset="1" stopColor="#15803d" />
          </linearGradient>
          <linearGradient id="fws-logo-leaf" x1="16" y1="8" x2="34" y2="30" gradientUnits="userSpaceOnUse">
            <stop stopColor="#d9f99d" />
            <stop offset="1" stopColor="#4ade80" />
          </linearGradient>
          <linearGradient id="fws-logo-bowl" x1="10" y1="28" x2="38" y2="42" gradientUnits="userSpaceOnUse">
            <stop stopColor="#ffffff" />
            <stop offset="1" stopColor="#bbf7d0" />
          </linearGradient>
        </defs>

        {/* Rounded app-icon tile */}
        <rect x="1.5" y="1.5" width="45" height="45" rx="12.5" fill="url(#fws-logo-bg)" />
        <rect
          x="1.5"
          y="1.5"
          width="45"
          height="45"
          rx="12.5"
          stroke="rgba(255,255,255,0.22)"
          strokeWidth="1.4"
        />

        {/* Sprout stem */}
        <path
          d="M24 30.5V19"
          stroke="url(#fws-logo-leaf)"
          strokeWidth="2.4"
          strokeLinecap="round"
        />
        {/* Left leaf */}
        <path
          d="M24 21.5c0-4.2-2.6-7.2-6.8-7.9-.5 4.4 2.1 7.6 6.8 7.9Z"
          fill="url(#fws-logo-leaf)"
        />
        {/* Right leaf */}
        <path
          d="M24 18.4c0-3.4 2.3-5.9 5.9-6.4.4 3.6-1.8 6.1-5.9 6.4Z"
          fill="url(#fws-logo-leaf)"
          opacity="0.85"
        />

        {/* Bowl */}
        <path
          d="M10.5 30.5h27c0 5.8-4.2 9.8-9 10.4-1.5.2-7.5.2-9 0-4.8-.6-9-4.6-9-10.4Z"
          fill="url(#fws-logo-bowl)"
        />
        {/* Bowl steam/arc accent */}
        <path
          d="M13 27.5c1.6-1.6 4-1.6 5.6 0M29.4 27.5c1.6-1.6 4-1.6 5.6 0"
          stroke="#bbf7d0"
          strokeWidth="1.7"
          strokeLinecap="round"
          opacity="0.9"
        />
      </svg>

      {withWordmark && (
        <span className="flex flex-col leading-none">
          <span className="text-sm font-extrabold tracking-tight text-stone-900 dark:text-white">
            Food Worth Saving
          </span>
          <span className="mt-0.5 text-[10px] font-medium uppercase tracking-[0.14em] text-green-700/80">
            Real-time surplus coordination
          </span>
        </span>
      )}
    </span>
  );
}
