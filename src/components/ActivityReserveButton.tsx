"use client";

import type { Activity } from "../activities";
import { useActivityReservations } from "./ActivityReservations";

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

  return (
    <button
      type="button"
      className={className}
      onClick={() => openReservation(activity)}
      aria-label={`Add ${activity.title} to your reservation`}
    >
      {children}
    </button>
  );
}
