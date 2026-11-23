"use client";

import { useState } from "react";
import { Download, FileText } from "lucide-react";
import { getVipRoomAttachment } from "../server/vip-actions";

export default function VipAttachmentDownload({ id, filename, mimeType }: { id: string; filename: string; mimeType: string }) {
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");

  async function download() {
    setPending(true);
    setError("");
    try {
      const attachment = await getVipRoomAttachment(id);
      const raw = atob(attachment.bytes);
      const bytes = Uint8Array.from(raw, (character) => character.charCodeAt(0));
      const url = URL.createObjectURL(new Blob([bytes], { type: attachment.mimeType }));
      const link = document.createElement("a");
      link.href = url;
      link.download = attachment.filename;
      link.click();
      window.setTimeout(() => URL.revokeObjectURL(url), 1000);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Download failed.");
    } finally {
      setPending(false);
    }
  }

  return <span className="inline-flex flex-col"><button className="inline-flex min-h-10 items-center gap-2 border border-[#172019]/10 px-3 text-xs font-semibold transition hover:bg-[#f4f5f1] disabled:opacity-50" type="button" onClick={() => void download()} disabled={pending}><span aria-hidden="true">{mimeType === "application/pdf" ? <FileText size={14} /> : <Download size={14} />}</span><span>{pending ? "Preparing…" : filename}</span></button>{error && <span className="mt-1 text-[10px] text-red-800" role="alert">{error}</span>}</span>;
}