import Link from "next/link";

export default function Logo({ className = "", href = "/#top", compact = false }: { className?: string; href?: string; compact?: boolean }) {
  return (
    <Link href={href} aria-label="Ayoub Trader home" className={`inline-flex shrink-0 items-center ${className}`}>
      <img src="/ayoub-trader.png" alt="Ayoub Trader" className={`block h-auto ${compact ? "w-15 md:w-20" : "w-24 md:w-28"}`} />
    </Link> 
  );
}
