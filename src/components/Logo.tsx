import Link from "next/link";

export default function Logo({ className = "", href = "/#top" }: { className?: string; href?: string }) {
  return (
    <Link href={href} className={`inline-flex items-center gap-2.5 font-display text-sm font-bold uppercase leading-none tracking-[0.12em] ${className}`}>
      <svg aria-hidden="true" viewBox="0 0 32 32" className="h-7 w-7 text-signal">
        <path d="M16 2.5 19 10l7.5-3-3 7.5 7.5 3-7.5 3 3 7.5-7.5-3-3 7.5-3-7.5-7.5 3 3-7.5L1 17.5l7.5-3-3-7.5 7.5 3L16 2.5Z" fill="none" stroke="currentColor" strokeWidth="1.6" />
        <circle cx="16" cy="17.5" r="3" fill="currentColor" />
      </svg>
      <span>Morocco<br />Journeys</span>
    </Link>
  );
}
