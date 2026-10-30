"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { updateMyDashboardAccount, verifyMyCurrentDashboardPassword } from "../server/transfer-actions";
import type { TransferDashboardUser } from "../transfers/types";

function PasswordEye({ visible, onClick }: { visible: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      className="dashboard-account__password-eye"
      onClick={onClick}
      aria-label={visible ? "Hide password" : "Show password"}
      aria-pressed={visible}
      title={visible ? "Hide password" : "Show password"}
    >
      <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <path d="M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7S2 12 2 12Z" />
        <circle cx="12" cy="12" r="3" />
        {!visible && <path d="m4 4 16 16" />}
      </svg>
    </button>
  );
}

export default function DashboardAccountSettings({
  username: initialUsername,
  role,
}: Pick<TransferDashboardUser, "username" | "role">) {
  const router = useRouter();
  const [username, setUsername] = useState(initialUsername);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [passwordConfirmation, setPasswordConfirmation] = useState("");
  const [verifiedPassword, setVerifiedPassword] = useState("");
  const [currentPasswordVisible, setCurrentPasswordVisible] = useState(false);
  const [newPasswordVisible, setNewPasswordVisible] = useState(false);
  const [confirmationVisible, setConfirmationVisible] = useState(false);
  const [checkingPassword, setCheckingPassword] = useState(false);
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const passwordIsVerified = Boolean(currentPassword && currentPassword === verifiedPassword);
  const hasPasswordChange = Boolean(newPassword || passwordConfirmation);
  const passwordsMatch = Boolean(newPassword && newPassword === passwordConfirmation);
  const passwordMismatch = Boolean(passwordConfirmation && newPassword !== passwordConfirmation);

  async function verifyCurrentPassword() {
    if (!currentPassword || checkingPassword) return;
    setCheckingPassword(true);
    setVerifiedPassword("");
    setNotice(null);
    try {
      const result = await verifyMyCurrentDashboardPassword(currentPassword);
      if (result.valid) {
        setVerifiedPassword(currentPassword);
        setNotice({ type: "success", text: "Current password confirmed. You can save your account changes." });
      } else {
        setNotice({ type: "error", text: "That current password is not correct." });
      }
    } catch (error) {
      setNotice({ type: "error", text: error instanceof Error ? error.message : "Could not verify the current password." });
    } finally {
      setCheckingPassword(false);
    }
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (busy || !passwordIsVerified || (hasPasswordChange && (!passwordsMatch || newPassword.length < 8))) return;
    setBusy(true);
    setNotice(null);
    try {
      const result = await updateMyDashboardAccount(username, currentPassword, newPassword, passwordConfirmation);
      setUsername(result.username);
      setCurrentPassword("");
      setNewPassword("");
      setPasswordConfirmation("");
      setVerifiedPassword("");
      setNotice({ type: "success", text: "Account settings updated." });
      router.refresh();
    } catch (error) {
      setNotice({ type: "error", text: error instanceof Error ? error.message : "Could not update your account." });
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="dashboard-account" aria-labelledby="dashboard-account-title">
      <header className="dashboard-account__intro">
        <div>
          <p className="transfer-eyebrow">Personal access</p>
          <h2 id="dashboard-account-title">Your dashboard account</h2>
          <p>Update your sign-in name or replace your password. Confirm every change with your current password.</p>
        </div>
        <span className="dashboard-account__monogram" aria-hidden="true">{username.slice(0, 2).toUpperCase()}</span>
      </header>

      <div className="dashboard-account__layout">
        <aside className="dashboard-account__identity" aria-label="Account information">
          <p className="transfer-eyebrow">Account information</p>
          <dl>
            <div><dt>Username</dt><dd>{username}</dd></div>
            <div><dt>Access level</dt><dd>{role === "ADMIN" ? "Administrator" : "Staff"}</dd></div>
            <div><dt>Status</dt><dd><span className="dashboard-account__active"><i aria-hidden="true" />Active</span></dd></div>
          </dl>
          <p className="dashboard-account__note">Your role is managed by an administrator and cannot be changed here.</p>
        </aside>

        <form className="dashboard-account__form" onSubmit={submit}>
          <div className="dashboard-account__form-heading">
            <div><p className="transfer-eyebrow">Sign-in details</p><h3>Login and password</h3></div>
            <span aria-hidden="true">⌁</span>
          </div>
          <label>Username
            <input value={username} onChange={(event) => setUsername(event.target.value)} minLength={3} maxLength={100} autoComplete="username" required />
            <small>Use 3 or more letters, numbers, dots, underscores, or hyphens.</small>
          </label>
          <div className="dashboard-account__divider"><span>Password</span><small>Leave both new-password fields blank to keep your current password.</small></div>
          <label>Current password
            <span className="dashboard-account__password-control">
              <input type={currentPasswordVisible ? "text" : "password"} value={currentPassword} onChange={(event) => {
                setCurrentPassword(event.target.value);
                setVerifiedPassword("");
                setNotice(null);
              }} autoComplete="current-password" maxLength={512} required />
              <PasswordEye visible={currentPasswordVisible} onClick={() => setCurrentPasswordVisible((visible) => !visible)} />
            </span>
          </label>
          <div className="dashboard-account__verify-row">
            <button type="button" className={`dashboard-account__verify${passwordIsVerified ? " is-verified" : ""}`} onClick={() => void verifyCurrentPassword()} disabled={!currentPassword || checkingPassword || busy}>
              <span aria-hidden="true">{checkingPassword ? "…" : passwordIsVerified ? "✓" : "↗"}</span>
              {checkingPassword ? "Checking…" : passwordIsVerified ? "Current password verified" : "Verify current password"}
            </button>
            <small>Required before changes can be saved.</small>
          </div>
          <div className="dashboard-account__password-grid">
            <label>New password
              <span className="dashboard-account__password-control">
                <input type={newPasswordVisible ? "text" : "password"} value={newPassword} onChange={(event) => setNewPassword(event.target.value)} autoComplete="new-password" minLength={8} maxLength={512} />
                <PasswordEye visible={newPasswordVisible} onClick={() => setNewPasswordVisible((visible) => !visible)} />
              </span>
              <small>At least 8 characters.</small>
            </label>
            <label>Confirm new password
              <span className="dashboard-account__password-control">
                <input type={confirmationVisible ? "text" : "password"} value={passwordConfirmation} onChange={(event) => setPasswordConfirmation(event.target.value)} autoComplete="new-password" maxLength={512} />
                <PasswordEye visible={confirmationVisible} onClick={() => setConfirmationVisible((visible) => !visible)} />
              </span>
            </label>
          </div>
          {hasPasswordChange && (
            <p className={`dashboard-account__match${passwordsMatch && newPassword.length >= 8 ? " is-match" : passwordMismatch ? " is-mismatch" : ""}`} aria-live="polite">
              {passwordsMatch && newPassword.length >= 8
                ? "Passwords match."
                : passwordMismatch
                  ? "Passwords do not match."
                  : newPassword.length < 8
                    ? `Use at least 8 characters (${newPassword.length}/8).`
                    : "Enter the same password again to confirm."}
            </p>
          )}
          {notice && <p className={`transfer-notice transfer-notice--${notice.type}`} role="status">{notice.text}</p>}
          <footer className="dashboard-account__actions">
            <p>Your password is securely hashed and never displayed after saving.</p>
            <button type="submit" disabled={busy || checkingPassword || !passwordIsVerified || (hasPasswordChange && (!passwordsMatch || newPassword.length < 8))}>{busy ? "Saving…" : "Save account changes"}<span aria-hidden="true">→</span></button>
          </footer>
        </form>
      </div>
    </section>
  );
}