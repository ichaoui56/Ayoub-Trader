export const COACHING_PLANS = {
  STARTER: {
    name: "Starter",
    priceDh: 1500,
    durationMinutes: 60,
    cadence: "WEEKDAYS",
    days: [1, 2, 3, 4, 5],
    benefits: ["VIP group included", "Online video sessions"],
  },
  ADVANCED: {
    name: "Advanced",
    priceDh: 2500,
    durationMinutes: 120,
    cadence: "WEEKDAYS",
    days: [1, 2, 3, 4, 5],
    benefits: ["VIP group included", "100% broker deposit bonus", "Online video sessions"],
  },
  PREMIUM: {
    name: "Premium",
    priceDh: 5000,
    durationMinutes: 180,
    cadence: "DAILY",
    days: [0, 1, 2, 3, 4, 5, 6],
    benefits: ["VIP group included", "Fundamental analysis", "Priority financial news", "In-person meetings in your city", "Online video sessions"],
  },
} as const;

export type CoachingPlanCode = keyof typeof COACHING_PLANS;

export type TradingActionState = {
  success: boolean;
  message: string;
  reference?: string;
  whatsappUrl?: string;
};

export const EMPTY_TRADING_ACTION_STATE: TradingActionState = {
  success: false,
  message: "",
};

export function isValidDateString(value: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const parsed = new Date(`${value}T00:00:00.000Z`);
  return !Number.isNaN(parsed.getTime()) && parsed.toISOString().slice(0, 10) === value;
}

function formatUtcDate(date: Date) {
  return date.toISOString().slice(0, 10);
}

export function buildCoachingSchedule(startDate: string, planCode: CoachingPlanCode) {
  if (!isValidDateString(startDate)) throw new Error("Choose a valid coaching start date.");
  const plan = COACHING_PLANS[planCode];
  const [year, month, day] = startDate.split("-").map(Number);
  const monthIndex = month - 1 + 1;
  const endYear = year + Math.floor(monthIndex / 12);
  const endMonth = monthIndex % 12;
  const finalDay = new Date(Date.UTC(endYear, endMonth + 1, 0)).getUTCDate();
  const endDate = formatUtcDate(new Date(Date.UTC(endYear, endMonth, Math.min(day, finalDay))));
  const start = new Date(`${startDate}T00:00:00.000Z`);
  const end = new Date(`${endDate}T00:00:00.000Z`);
  const dates: string[] = [];

  for (const cursor = new Date(start); cursor < end; cursor.setUTCDate(cursor.getUTCDate() + 1)) {
    if (plan.days.some((scheduledDay) => scheduledDay === cursor.getUTCDay())) dates.push(formatUtcDate(cursor));
  }

  if (!dates.length) throw new Error("No coaching sessions fall within that month. Choose another start date.");
  return { startDate, endDate, dates, plan };
}

export function timeToMinute(value: string) {
  const match = /^(?:([01]\d|2[0-3])):([0-5]\d)$/.exec(value);
  if (!match) throw new Error("Choose a valid daily start time.");
  const minute = Number(match[1]) * 60 + Number(match[2]);
  if (minute % 15 !== 0) throw new Error("Choose a start time on a 15-minute interval.");
  return minute;
}

export function minuteToTime(value: number) {
  return `${String(Math.floor(value / 60)).padStart(2, "0")}:${String(value % 60).padStart(2, "0")}`;
}

export function formatMoneyDh(value: number) {
  return `${new Intl.NumberFormat("en-US").format(value)} DH`;
}