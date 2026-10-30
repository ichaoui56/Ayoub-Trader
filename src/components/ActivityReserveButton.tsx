"use client";

import type { Activity } from "../activities";
import { useActivityReservations } from "./ActivityReservations";
import { useLocale } from "./LocaleProvider";

type ActivityReserveButtonProps = {
  activity: Activity;
  className: string;
  children: React.ReactNode;
};

export default function ActivityReserveButton({
  activity,
  className,
  children,
}: ActivityReserveButtonProps) {
  const { openReservation } = useActivityReservations();
  const { t } = useLocale();

  return (
    <button
      type="button"
      className={className}
      onClick={() => openReservation(activity)}
      aria-label={`${t("Add")} ${activity.title} ${t("to your reservation")}`}
    >
      {children}
    </button>
  );
}
