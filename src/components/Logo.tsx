import Link from "next/link";

export default function Logo({ className = "", href = "/#top", compact = false }: { className?: string; href?: string; compact?: boolean }) {
  return (
    <Link href={href} aria-label="MH Traveling" className={`inline-flex shrink-0 items-center ${className}`}>
      <img src="/hotel-building-svgrepo-com.png" alt="MH Traveling" className={`block h-auto ${compact ? "w-20 md:w-24" : "w-24 md:w-28"}`} />
    </Link>
  );
}
