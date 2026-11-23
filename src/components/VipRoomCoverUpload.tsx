"use client";

import { useRef, useState, type ChangeEvent, type DragEvent } from "react";
import { ImageUp, Trash2 } from "lucide-react";

export default function VipRoomCoverUpload({ initialImage = "" }: { initialImage?: string }) {
  const [image, setImage] = useState(initialImage);
  const [pending, setPending] = useState(false);
  const [message, setMessage] = useState("");
  const [dragging, setDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  async function upload(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;
    setMessage("");
    if (!["image/png", "image/webp", "image/jpeg"].includes(file.type) || file.size > 100_000) {
      setMessage("Choose a compressed PNG, JPG or WebP image up to 100 KB.");
      event.target.value = "";
      return;
    }
    setPending(true);
    try {
      const body = new FormData();
      body.append("file", file, file.name);
      const response = await fetch("/api/files", { method: "POST", body, credentials: "same-origin" });
      const result: unknown = await response.json();
      if (!response.ok) {
        const error = typeof result === "object" && result !== null && "error" in result && typeof result.error === "string" ? result.error : "Image upload failed.";
        throw new Error(error);
      }
      if (typeof result !== "string" || !/^https:\/\//i.test(result)) throw new Error("Image storage returned an invalid URL.");
      setImage(result);
      setMessage("Cover image uploaded.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Image upload failed.");
    } finally {
      setPending(false);
      event.target.value = "";
    }
  }

  async function uploadFile(file: File) {
    setMessage("");
    if (!["image/png", "image/webp", "image/jpeg"].includes(file.type) || file.size > 100_000) {
      setMessage("Choose a compressed PNG, JPG or WebP image up to 100 KB.");
      return;
    }
    setPending(true);
    try {
      const body = new FormData();
      body.append("file", file, file.name);
      const response = await fetch("/api/files", { method: "POST", body, credentials: "same-origin" });
      const result: unknown = await response.json();
      if (!response.ok) {
        const error = typeof result === "object" && result !== null && "error" in result && typeof result.error === "string" ? result.error : "Image upload failed.";
        throw new Error(error);
      }
      if (typeof result !== "string" || !/^https:\/\//i.test(result)) throw new Error("Image storage returned an invalid URL.");
      setImage(result);
      setMessage("Cover image uploaded.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Image upload failed.");
    } finally {
      setPending(false);
    }
  }

  function handleDrop(event: DragEvent<HTMLDivElement>) {
    event.preventDefault();
    setDragging(false);
    const file = event.dataTransfer.files?.[0];
    if (file) void uploadFile(file);
  }

  return <div className="room-cover-uploader">
    <input type="hidden" name="coverImage" value={image} readOnly />
    <div
      className={`room-cover-dropzone ${dragging ? "is-dragging" : ""} ${image ? "has-image" : ""}`}
      onDragEnter={(event) => { event.preventDefault(); setDragging(true); }}
      onDragOver={(event) => { event.preventDefault(); setDragging(true); }}
      onDragLeave={(event) => { event.preventDefault(); setDragging(false); }}
      onDrop={handleDrop}
    >
      {image ? <div className="room-cover-preview" style={{ backgroundImage: `url("${image.replaceAll('"', '%22')}")` }} aria-label="Current room cover image" /> : <div className="room-cover-placeholder"><ImageUp size={22} /><strong>Drop a cover image here</strong><span>or choose a file</span></div>}
      <div className="room-cover-actions">
        <button type="button" className="room-cover-upload-button" onClick={() => inputRef.current?.click()} disabled={pending}><ImageUp size={14} />{pending ? "Uploading…" : image ? "Replace image" : "Choose image"}</button>
        {image && <button type="button" className="room-cover-remove-button" onClick={() => { setImage(""); setMessage("Cover removed."); }} disabled={pending}><Trash2 size={14} />Remove</button>}
      </div>
    </div>
    <input ref={inputRef} className="sr-only" type="file" accept="image/png,image/webp,image/jpeg" onChange={(event) => void upload(event)} disabled={pending} />
    <p className="room-cover-message" role="status">{message || "PNG, JPG or WebP · up to 100 KB · recommended 1600 × 700"}</p>
  </div>;
}