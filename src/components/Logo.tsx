import Link from "next/link";

export default function Logo({ className = "", href = "/#top", compact = false }: { className?: string; href?: string; compact?: boolean }) {
  return (
    <Link href={href} aria-label="MH Traveling" className={`inline-flex shrink-0 items-center ${className}`}>
      <svg aria-hidden="true" viewBox="0 0 600 264" className="block h-auto w-24 md:w-28" style={{ width: compact ? "clamp(4.5rem, 5.7vw, 5.5rem)" : undefined }}>
        <path d="M3 182 62 3h57l48 81L268 3h61l-21 73-75 26 13-34-107 77-43-67-34 104Z" fill="#f4f1e9" stroke="var(--color-signal)" strokeLinejoin="round" strokeWidth="4" />
        <path d="m300 182 50-180h61l-12 48 116-17 11-31h62l-60 180h-58l32-97-119 19-27 78Z" fill="#f4f1e9" stroke="var(--color-signal)" strokeLinejoin="round" strokeWidth="4" />
        <path d="M109 173c108-56 261-92 399-104" fill="none" stroke="var(--color-signal)" strokeLinecap="round" strokeWidth="5" />
        <text x="300" y="258" fill="var(--color-signal)" fontFamily="Arial, sans-serif" fontSize="49" fontWeight="700" letterSpacing="9" textAnchor="middle" textLength="580" lengthAdjust="spacing">TRAVELING</text>
      </svg>
      <span className="sr-only">MH Traveling</span>
    </Link>
  );
}
