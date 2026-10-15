export function Mark({ className = "h-8 w-8" }: { className?: string }) {
  return (
    <svg viewBox="0 0 64 64" className={className} aria-hidden="true">
      <rect width="64" height="64" rx="16" fill="#D4145A" />
      <rect x="13" y="37" width="9" height="14" rx="2.5" fill="#FFFFFF" />
      <rect x="27.5" y="26" width="9" height="25" rx="2.5" fill="#FFFFFF" />
      <rect x="42" y="16" width="9" height="35" rx="2.5" fill="#FFFFFF" />
      <path d="M46.5 5 L56 20 H37 Z" fill="#F0B429" />
    </svg>
  );
}
