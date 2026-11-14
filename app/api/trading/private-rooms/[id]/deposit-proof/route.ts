import { getActiveAdmin } from "../../../../../../src/server/dashboard-auth";
import { prisma } from "../../../../../../src/server/prisma";

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const admin = await getActiveAdmin(request);
  if (!admin) return new Response("Unauthorized", { status: 401, headers: { "Cache-Control": "no-store" } });
  if (!process.env.DATABASE_URL) return new Response("Storage unavailable", { status: 503, headers: { "Cache-Control": "no-store" } });

  const { id } = await params;
  if (!/^[a-zA-Z0-9_-]{1,40}$/.test(id)) return new Response("Not found", { status: 404, headers: { "Cache-Control": "no-store" } });
  const proof = await prisma.privateRoomRequest.findUnique({
    where: { id },
    select: { depositProof: true, depositProofMime: true, depositProofName: true },
  });
  if (!proof?.depositProof || !proof.depositProofMime) return new Response("Not found", { status: 404, headers: { "Cache-Control": "no-store" } });
  const filename = (proof.depositProofName ?? "deposit-proof").replace(/[^a-zA-Z0-9._-]/g, "_");
  return new Response(new Uint8Array(proof.depositProof), {
    headers: {
      "Cache-Control": "private, no-store",
      "Content-Type": proof.depositProofMime,
      "Content-Disposition": `attachment; filename="${filename}"`,
      "X-Content-Type-Options": "nosniff",
    },
  });
}