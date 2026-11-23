import type { Metadata } from "next";
import Link from "next/link";
import { BadgeCheck, CircleX } from "lucide-react";
import { verifyVipEmailToken } from "../../../../server/vip-auth";

export const metadata: Metadata = { title: "Verify email | VIP Private Rooms", robots: { index: false, follow: false } };

export default async function VerifyVipEmailPage({ searchParams }: { searchParams: Promise<{ token?: string }> }) {
  const { token } = await searchParams;
  const verified = token ? await verifyVipEmailToken(token) : false;
  return (
    <main className="grid min-h-screen place-items-center bg-[#101812] px-5 py-12 text-white">
      <section className="w-full max-w-md border border-white/10 bg-white/[0.04] p-7 sm:p-9">
        {verified ? <BadgeCheck className="text-[#c7b47e]" size={30} /> : <CircleX className="text-red-300" size={30} />}
        <h1 className="mt-6 font-display text-4xl font-extrabold uppercase">{verified ? "Email verified" : "Link unavailable"}</h1>
        <p className="mt-3 text-sm leading-6 text-white/60">{verified ? "Your client account is ready. Sign in to continue to your VIP area." : "This verification link is invalid, expired, or has already been used. Register again or contact support."}</p>
        <Link className="mt-7 inline-flex min-h-12 items-center bg-[#b8a46e] px-5 text-sm font-bold text-[#10130f]" href="/vip/login">{verified ? "Continue to sign in" : "Return to sign in"}</Link>
      </section>
    </main>
  );
}