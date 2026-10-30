"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { signInTransferDashboard } from "../server/transfer-actions";

export default function TransferDashboardLogin() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setError("");
    try {
      const result = await signInTransferDashboard(username, password);
      if (!result.ok) {
        setError(result.message);
        return;
      }
      router.replace("/dashboard");
      router.refresh();
    } catch (signInError) {
      setError(
        signInError instanceof Error
          ? signInError.message
          : "Something went wrong. Please try again.",
      );
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="transfer-login">
      <div className="transfer-login__panel">
        <a className="transfer-brand" href="/" aria-label="Morocco Journeys home">
          <span className="transfer-brand__mark">M</span>
          <span><strong>Morocco</strong><small>Journeys · Operations</small></span>
        </a>
        <p className="transfer-eyebrow">Private operations space</p>
        <h1>Welcome<br /><span>back.</span></h1>
        <p className="transfer-login__intro">Sign in to manage routes, private services, and incoming travel requests.</p>
        <form onSubmit={submit}>
          <label htmlFor="transfer-admin-username">Username</label>
          <input
            id="transfer-admin-username"
            type="text"
            value={username}
            autoComplete="username"
            onChange={(event) => setUsername(event.target.value)}
            required
          />
          <label htmlFor="transfer-admin-password">Password</label>
          <input
            id="transfer-admin-password"
            type="password"
            value={password}
            autoComplete="current-password"
            onChange={(event) => setPassword(event.target.value)}
            required
          />
          {error && <p className="transfer-form-error" role="alert">{error}</p>}
          <button type="submit" disabled={busy}>
            {busy ? "Signing in…" : "Enter dashboard"} <span aria-hidden="true">→</span>
          </button>
        </form>
        <a href="/" className="transfer-login__back">← Back to the website</a>
      </div>
      <div className="transfer-login__image" aria-hidden="true">
        <div>
          <span>Morocco Journeys</span>
          <p>Every arrival,<br />considered.</p>
        </div>
      </div>
    </main>
  );
}
