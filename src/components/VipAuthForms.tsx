"use client";

import { useActionState, useState } from "react";
import { ArrowRight, Eye, EyeOff, KeyRound, MailCheck, UserRound } from "lucide-react";
import { registerVipClient, signInVipClient, type VipAuthActionState } from "../server/vip-actions";

const emptyState: VipAuthActionState = { success: false, message: "" };
const inputClass = "auth-input";

export default function VipAuthForms() {
  const [registerMode, setRegisterMode] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [loginState, loginAction, loginPending] = useActionState(signInVipClient, emptyState);
  const [registerState, registerAction, registerPending] = useActionState(registerVipClient, emptyState);
  const state = registerMode ? registerState : loginState;
  const pending = registerMode ? registerPending : loginPending;

  return (
    <div className="auth-form-wrap">
      <p className="auth-kicker"><span /> ADMIN & CLIENT ACCESS</p>
      <h1>{registerMode ? "Create your account" : "Welcome back"}</h1>
      <p className="auth-description">{registerMode ? "Set up a client account to access your private trading area." : "Sign in to your trading account or admin workspace."}</p>

      <form action={registerMode ? registerAction : loginAction} className="auth-form">
        {registerMode && <label>Full name<input className={inputClass} name="name" autoComplete="name" maxLength={120} required /></label>}
        {registerMode && <label>Phone number<input className={inputClass} name="phone" type="tel" autoComplete="tel" placeholder="+212 …" maxLength={40} required /></label>}
        {registerMode ? (
          <>
            <label>Username<input className={inputClass} name="username" autoComplete="username" minLength={3} maxLength={30} required /></label>
            <label>Email address<input className={inputClass} name="email" type="email" autoComplete="email" maxLength={254} required /></label>
          </>
        ) : (
          <label>Email or username<input className={inputClass} name="identifier" autoComplete="username" maxLength={254} required /></label>
        )}
        <label>Password<div className="auth-password-wrap"><input className={inputClass} name="password" type={showPassword ? "text" : "password"} autoComplete={registerMode ? "new-password" : "current-password"} minLength={registerMode ? 10 : 1} maxLength={128} required /><button className="auth-password-toggle" type="button" onClick={() => setShowPassword((value) => !value)} aria-label={showPassword ? "Hide password" : "Show password"}>{showPassword ? <EyeOff size={17} /> : <Eye size={17} />}</button></div>{registerMode && <span className="auth-hint">At least 10 characters.</span>}</label>
        {!registerMode && <label className="auth-remember"><input type="checkbox" name="remember" disabled /><span>Remember me</span><span className="auth-remember-note">Session duration is managed securely.</span></label>}
        {state.message && <p className={`auth-alert ${state.success ? "is-success" : "is-error"}`} role={state.success ? "status" : "alert"}>{state.message}</p>}
        <button className="auth-submit" type="submit" disabled={pending}>
          <span>{pending ? "Please wait…" : registerMode ? "Create client account" : "Sign in"}</span><ArrowRight size={17} aria-hidden="true" />
        </button>
      </form>

      <button className="auth-mode-toggle" type="button" onClick={() => setRegisterMode((current) => !current)}>
        {registerMode ? "Already registered? Sign in" : "New client? Create an account"}
      </button>
      <div className="auth-assurances">
        <span><MailCheck size={15} /> Verified client email</span>
        <span><KeyRound size={15} /> Protected sessions</span>
      </div>
      <p className="auth-footnote"><UserRound size={14} /> Client access is separate from administrator permissions.</p>
    </div>
  );
}