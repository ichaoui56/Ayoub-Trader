import Link from "next/link";

export default function Logo({ className = "", href = "/#top", compact = false }: { className?: string; href?: string; compact?: boolean }) {
  return (
    <Link href={href} aria-label="Ayoub Trader home" className={`inline-flex shrink-0 items-center ${className}`}>
      <img src="/ayoub-trader-2.png" alt="Ayoub Trader" className={`block h-auto ${compact ? "w-20 md:w-24" : "w-24 md:w-28"}`} />
    </Link>
  );
}
