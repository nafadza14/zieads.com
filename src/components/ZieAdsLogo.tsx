// ZieAds Logo SVG (purple rounded square with smile)
export default function ZieAdsLogo({ size = 36 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 120 120" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect x="4" y="4" width="112" height="112" rx="28" fill="#7B2FBE" />
      <path d="M35 78 C35 78, 60 95, 85 78" stroke="white" strokeWidth="7" strokeLinecap="round" fill="none" />
    </svg>
  );
}
