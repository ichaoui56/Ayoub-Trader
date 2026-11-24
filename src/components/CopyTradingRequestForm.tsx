"use client";

import { useActionState } from "react";
import { submitCopyTradingRequest, type CopyTradingRequestState } from "../server/vip-actions";

const initialState: CopyTradingRequestState = { success: false, message: "" };

export default function CopyTradingRequestForm() {
  const [state, action, pending] = useActionState(submitCopyTradingRequest, initialState);

  return (
    <form action={action} className="client-copy-form">
      <div className="client-copy-fields">
        <label>Broker name<input name="brokerName" maxLength={120} required placeholder="Broker or platform" /></label>
        <label>Trading login<input name="brokerLogin" maxLength={120} required placeholder="Your MT4/MT5 login" /></label>
        <label>Trading password<input name="brokerPassword" type="password" maxLength={256} required placeholder="Account password" /></label>
        <label>Trading server<input name="serverName" maxLength={120} required placeholder="Server name" /></label>
        <label>Server IP<input name="serverIp" maxLength={80} required placeholder="203.0.113.10" /></label>
      </div>
      <p className="client-copy-security">Credentials are encrypted and hidden after submission. They are accessible only to the authorized administrator for review.</p>
      <button className="client-copy-submit" type="submit" disabled={pending}>{pending ? "Submitting…" : "Submit copy-trading request"}</button>
      {state.message && <p className={state.success ? "client-copy-success" : "client-copy-error"} role={state.success ? "status" : "alert"}>{state.message}</p>}
    </form>
  );
}
