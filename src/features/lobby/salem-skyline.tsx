/** Silhueta de Salem à noite: só no celular, onde o título precisa de chão. */
export function SalemSkyline({ className = "" }: Readonly<{ className?: string }>) {
  return (
    <svg viewBox="0 0 390 120" preserveAspectRatio="xMidYMax slice" aria-hidden="true" className={className}>
      <mask id="salem-moon">
        <rect width="390" height="120" fill="white" />
        <circle cx="315" cy="29" r="14" fill="black" />
      </mask>
      <circle cx="308" cy="34" r="15" fill="#f6dfb5" opacity="0.9" mask="url(#salem-moon)" />
      <path
        fill="#0e0f12"
        d="M0 120V84l22-18 22 18v-6h14V64l9-10 9 10v14l20-16 20 16v-8l16-14 16 14v14h10V52l7-6V22l3-6 3 6v24l7 6v32l18-14 18 14V70l22-18 22 18v-4h12l14-12 14 12v18h10V76l16-13 16 13v-6l20-17 20 17v12h14l12-10 12 10v-4l18-15 18 15v38z"
      />
      <g fill="#c18b2f">
        <rect x="30" y="92" width="5" height="7" rx="1" opacity="0.85" />
        <rect x="104" y="88" width="5" height="7" rx="1" opacity="0.6" />
        <rect x="167" y="68" width="4" height="8" rx="2" opacity="0.9" />
        <rect x="232" y="86" width="5" height="7" rx="1" opacity="0.7" />
        <rect x="318" y="94" width="5" height="7" rx="1" opacity="0.8" />
      </g>
    </svg>
  );
}
