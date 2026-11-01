import { NextResponse, type NextRequest } from "next/server";
import { AuthenticationError } from "pinata";
import { getDashboardUser } from "../../../src/server/dashboard-auth";
import { pinata } from "../../../src/lib/utils/pinata";

export const runtime = "nodejs";

const MAX_IMAGE_BYTES = 100_000;
const MAX_REQUEST_BYTES = 150_000;

function isWebp(bytes: Uint8Array) {
  return bytes.length >= 12 &&
    String.fromCharCode(...bytes.subarray(0, 4)) === "RIFF" &&
    String.fromCharCode(...bytes.subarray(8, 12)) === "WEBP";
}

function isPng(bytes: Uint8Array) {
  const signature = [137, 80, 78, 71, 13, 10, 26, 10];
  return bytes.length >= signature.length && signature.every((byte, index) => bytes[index] === byte);
}

export async function POST(request: NextRequest) {
  const origin = request.headers.get("origin");
  const host = request.headers.get("x-forwarded-host") ?? request.headers.get("host");
  const fetchSite = request.headers.get("sec-fetch-site");
  let originHost: string | null = null;
  try {
    originHost = origin ? new URL(origin).host : null;
  } catch {
    return NextResponse.json({ error: "The upload request origin is invalid." }, { status: 403 });
  }
  if (
    fetchSite === "cross-site" ||
    (originHost && host && originHost.toLowerCase() !== host.toLowerCase())
  ) {
    return NextResponse.json({ error: "Cross-origin uploads are not allowed." }, { status: 403 });
  }

  const user = await getDashboardUser(request);
  if (!user) {
    return NextResponse.json(
      { error: "Your dashboard session is missing or expired. Sign out and sign back in to upload images." },
      { status: 401 },
    );
  }
  if (user.role !== "ADMIN") {
    return NextResponse.json(
      { error: "Only an administrator can upload site images." },
      { status: 403 },
    );
  }

  const contentLength = Number(request.headers.get("content-length"));
  if (Number.isFinite(contentLength) && contentLength > MAX_REQUEST_BYTES) {
    return NextResponse.json({ error: "The compressed image must be 100 KB or smaller." }, { status: 413 });
  }

  let file: FormDataEntryValue | null;
  try {
    file = (await request.formData()).get("file");
  } catch {
    return NextResponse.json({ error: "The image upload form is invalid." }, { status: 400 });
  }

  if (!(file instanceof File) || !["image/webp", "image/png"].includes(file.type)) {
    return NextResponse.json({ error: "Upload a compressed PNG or WebP image." }, { status: 400 });
  }
  if (file.size === 0 || file.size > MAX_IMAGE_BYTES) {
    return NextResponse.json({ error: "The compressed image must be 100 KB or smaller." }, { status: 413 });
  }

  const imageBytes = new Uint8Array(await file.arrayBuffer());
  if (!(file.type === "image/webp" ? isWebp(imageBytes) : isPng(imageBytes))) {
    return NextResponse.json({ error: "The uploaded file does not match its PNG or WebP format." }, { status: 400 });
  }

  if (!process.env.PINATA_JWT && !process.env.JWT) {
    console.error("[api/files] Pinata JWT is not configured.");
    return NextResponse.json(
      { error: "Image storage is not configured. Set PINATA_JWT on the server." },
      { status: 503 },
    );
  }
  if (!process.env.NEXT_PUBLIC_GATEWAY_URL && !process.env.PINATA_GATEWAY_URL) {
    console.error("[api/files] Pinata gateway is not configured.");
    return NextResponse.json(
      { error: "Image storage is not configured. Set NEXT_PUBLIC_GATEWAY_URL." },
      { status: 503 },
    );
  }

  try {
    const uploadFile = new File([imageBytes], file.name || (file.type === "image/png" ? "image.png" : "image.webp"), { type: file.type });
    const { cid } = await pinata.upload.public.file(uploadFile);
    const url = await pinata.gateways.public.convert(cid);

    return NextResponse.json(url, {
      status: 200,
      headers: {
        "Cache-Control": "public, max-age=31536000, immutable",
      },
    });
  } catch (error) {
    if (error instanceof AuthenticationError) {
      console.error("[api/files] Pinata rejected the configured upload credentials.");
      return NextResponse.json(
        {
          error: "Pinata rejected PINATA_JWT. Create a JWT with file-upload permission, update the server environment, then restart or redeploy.",
        },
        { status: 503 },
      );
    }
    console.error("[api/files] Upload error:", error);
    return NextResponse.json(
      { error: "Image upload failed. Check Pinata storage access and try again." },
      { status: 502 },
    );
  }
}
