const fallbackBrokerReferralUrl = "https://ilychui.vercel.app/?ref=ayoubtrader";

export function getBrokerReferralUrl() {
  try {
    const url = new URL(process.env.AYOUB_BROKER_REFERRAL_URL ?? fallbackBrokerReferralUrl);
    return url.protocol === "https:" ? url.toString() : null;
  } catch {
    return null;
  }
}