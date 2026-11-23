"use server";

import { CoachingMeetingMode, CoachingPackage, CoachingSlotKind, ManualPaymentService, Prisma } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { buildCoachingSchedule, COACHING_PLANS, timeToMinute, type CoachingPlanCode, type TradingActionState } from "../trading";
import { getVipClient } from "./vip-auth";
import { prisma } from "./prisma";

function value(formData: FormData, key: string, label: string, maxLength: number) {
  const raw = formData.get(key);
  if (typeof raw !== "string") throw new Error(`${label} is required.`);
  const result = raw.trim();
  if (!result || result.length > maxLength) throw new Error(`${label} is invalid.`);
  return result;
}

function todayInMorocco() {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "Africa/Casablanca", year: "numeric", month: "2-digit", day: "2-digit" }).format(new Date());
}

export async function createCustomerCoachingBooking(_state: TradingActionState, formData: FormData): Promise<TradingActionState> {
  const client = await getVipClient();
  if (!client) return { success: false, message: "Sign in to schedule an appointment." };
  try {
    const packageCode = value(formData, "package", "Coaching plan", 20) as CoachingPlanCode;
    if (!(packageCode in COACHING_PLANS)) throw new Error("Choose a valid coaching plan.");
    const plan = COACHING_PLANS[packageCode];
    const startDate = value(formData, "startDate", "Starting date", 10);
    const schedule = buildCoachingSchedule(startDate, packageCode);
    if (startDate < todayInMorocco()) throw new Error("Choose today or a future starting date.");
    const startTime = value(formData, "startTime", "Daily start time", 5);
    const startMinute = timeToMinute(startTime);
    if (startMinute + plan.durationMinutes > 1440) throw new Error("Choose an earlier time so the session ends on the same day.");
    const meetingModeInput = value(formData, "meetingMode", "Meeting format", 20);
    if (!Object.values(CoachingMeetingMode).includes(meetingModeInput as CoachingMeetingMode)) throw new Error("Choose a valid meeting format.");
    const meetingMode = meetingModeInput as CoachingMeetingMode;
    if (meetingMode === CoachingMeetingMode.IN_PERSON && packageCode !== "PREMIUM") throw new Error("In-person meetings are available with the Premium plan.");
    const meetingCity = meetingMode === CoachingMeetingMode.IN_PERSON ? value(formData, "meetingCity", "Meeting city", 100) : null;

    const booking = await prisma.coachingBooking.create({
      data: {
        customerId: client.id,
        package: packageCode as CoachingPackage,
        meetingMode,
        meetingCity,
        priceDh: plan.priceDh,
        startDate: new Date(`${schedule.startDate}T00:00:00.000Z`),
        endDate: new Date(`${schedule.endDate}T00:00:00.000Z`),
        dailyStartMinute: startMinute,
        durationMinutes: plan.durationMinutes,
        expectedSessions: schedule.dates.length,
        remainingSessions: schedule.dates.length,
        sessions: {
          create: schedule.dates.map((date) => {
            const sessionDate = new Date(`${date}T00:00:00.000Z`);
            return {
              date: sessionDate,
              startMinute,
              durationMinutes: plan.durationMinutes,
              timeSlots: {
                create: Array.from({ length: plan.durationMinutes / 15 }, (_, index) => ({
                  date: sessionDate,
                  quarter: startMinute / 15 + index,
                  kind: CoachingSlotKind.RESERVED,
                })),
              },
            };
          }),
        },
        payments: {
          create: {
            customerId: client.id,
            service: ManualPaymentService.COACHING,
            amount: plan.priceDh,
            currency: "MAD",
            note: "Coaching subscription; payment handled outside the website.",
          },
        },
      },
      select: { id: true },
    });
    revalidatePath("/app/appointments");
    revalidatePath("/dashboard/meetings");
    revalidatePath("/dashboard/sessions");
    return { success: true, reference: booking.id, message: `${schedule.dates.length} recurring sessions requested. Payment and final confirmation remain manual.` };
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      return { success: false, message: "One or more selected dates are already reserved. Choose another start time." };
    }
    return { success: false, message: error instanceof Error ? error.message : "The recurring schedule could not be saved." };
  }
}