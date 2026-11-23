"use client";

import { useState } from "react";
import { Download } from "lucide-react";
import { getPrivateRoomProof } from "../server/vip-actions";

export default function DownloadPrivateRoomProof({ id }: { id: string }) {
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");

  async function download() {
    setPending(true);
    setError("");
    try {
      const proof = await getPrivateRoomProof(id);
      const raw = atob(proof.bytes);
      const bytes = Uint8Array.from(raw, (character) => character.charCodeAt(0));
      const url = URL.createObjectURL(new Blob([bytes], { type: proof.mime }));
      const link = document.createElement("a");
      link.href = url;
      link.download = proof.filename;
      link.click();
      URL.revokeObjectURL(url);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Proof download failed.");
    } finally {
      setPending(false);
    }
  }

  return <span className="inline-flex flex-col items-start"><button className="inline-flex min-h-9 items-center gap-1 font-semibold text-signal underline underline-offset-4 disabled:opacity-50" type="button" onClick={() => void download()} disabled={pending}><Download size={13} />{pending ? "Loading proof…" : "Download private proof"}</button>{error && <span className="text-[10px] text-red-800" role="alert">{error}</span>}</span>;
}