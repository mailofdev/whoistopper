export function Mark({ className = "h-8 w-8" }: { className?: string }) {
  return (
    <svg viewBox="0 0 64 64" className={className} aria-hidden="true">
      <rect width="64" height="64" rx="16" fill="var(--brand)" />
      <rect x="14" y="38" width="8" height="12" rx="2" fill="var(--on-brand)" />
      <rect x="28" y="28" width="8" height="22" rx="2" fill="var(--on-brand)" />
      <rect x="42" y="16" width="8" height="34" rx="2" fill="var(--on-brand)" />
    </svg>
  );
}
