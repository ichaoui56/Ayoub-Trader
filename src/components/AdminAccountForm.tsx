"use client";

import { useState } from "react";
import { Check, Eye, EyeOff, KeyRound, Save } from "lucide-react";
import { updateAdminAccount, verifyAdminCurrentPassword } from "../server/admin-actions";

export default function AdminAccountForm({ username: initialUsername, email: initialEmail }: { username: string; email: string | null }) {
  const [username, setUsername] = useState(initialUsername);
  const [email, setEmail] = useState(initialEmail ?? "");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const [visible, setVisible] = useState(false);
  const [verified, setVerified] = useState(false);
  const [pending, setPending] = useState(false);
  const [notice, setNotice] = useState("");
  const [error, setError] = useState(false);

  async function verifyPassword() {
    setPending(true); setNotice(""); setError(false);
    try {
      const result = await verifyAdminCurrentPassword(currentPassword);
      setVerified(result.valid);
      if (!result.valid) { setError(true); setNotice("Current password did not match."); }
      else setNotice("Current password verified.");
    } catch (reason) { setVerified(false); setError(true); setNotice(reason instanceof Error ? reason.message : "Could not verify the current password."); }
    finally { setPending(false); }
  }

  async function save() {
    setPending(true); setNotice(""); setError(false);
    try {
      const result = await updateAdminAccount({ username, email, currentPassword, newPassword, confirmation });
      setUsername(result.username); setEmail(result.email ?? ""); setCurrentPassword(""); setNewPassword(""); setConfirmation(""); setVerified(false); setNotice("Account updated.");
    } catch (reason) { setError(true); setNotice(reason instanceof Error ? reason.message : "Could not update the account."); }
    finally { setPending(false); }
  }

  return <form className="admin-account-form" action={save}>
    <label>Username<input value={username} onChange={(event) => { setUsername(event.target.value); setVerified(false); }} autoComplete="username" maxLength={100} required /></label>
    <label>Email<input value={email} onChange={(event) => { setEmail(event.target.value); setVerified(false); }} type="email" autoComplete="email" maxLength={254} /></label>
    <label>Current password<span className="admin-secret-field"><input value={currentPassword} onChange={(event) => { setCurrentPassword(event.target.value); setVerified(false); }} type={visible ? "text" : "password"} autoComplete="current-password" maxLength={512} required /><button type="button" onClick={() => setVisible((value) => !value)} aria-label={visible ? "Hide password" : "Show password"}>{visible ? <EyeOff size={16} /> : <Eye size={16} />}</button></span></label>
    <button className="admin-secondary-button" type="button" onClick={() => void verifyPassword()} disabled={pending || !currentPassword}><KeyRound size={15} />{verified ? "Verified" : "Verify current password"}</button>
    <div className="admin-account-form-divider"><span>Change password</span><small>Leave both fields empty to keep it unchanged.</small></div>
    <label>New password<input value={newPassword} onChange={(event) => setNewPassword(event.target.value)} type={visible ? "text" : "password"} autoComplete="new-password" minLength={12} maxLength={128} /></label>
    <label>Confirm new password<input value={confirmation} onChange={(event) => setConfirmation(event.target.value)} type={visible ? "text" : "password"} autoComplete="new-password" maxLength={128} /></label>
    {notice && <p className={`admin-form-message ${error ? "is-error" : "is-success"}`} role="status">{notice}</p>}
    <button className="dash-primary-button" type="submit" disabled={pending || !verified || Boolean(newPassword && newPassword !== confirmation)}><Save size={15} />Save account <Check size={14} /></button>
  </form>;
}