import "server-only";

import { activities, type Activity, type ManagedActivity, withDefaultGeneralTimes } from "../activities";

export async function getPublicActivityCatalog(): Promise<Activity[]> {
  return activities.map(withDefaultGeneralTimes);
}

export async function getManagedActivityCount(): Promise<number> {
  return activities.length;
}

export async function getManagedActivityCatalog(): Promise<ManagedActivity[]> {
  return activities.map((activity, sortOrder) => ({
    id: activity.slug,
    isActive: true,
    sortOrder,
    activity: withDefaultGeneralTimes(activity),
  }));
}
