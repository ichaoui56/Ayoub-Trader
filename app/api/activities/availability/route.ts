import { getConfirmedActivityTimes } from "../../../../src/server/activity-reservations";

function isCalendarDate(value: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const parsed = new Date(`${value}T00:00:00.000Z`);
  return !Number.isNaN(parsed.getTime()) && parsed.toISOString().slice(0, 10) === value;
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  const activitySlug = url.searchParams.get("slug") ?? "";
  const date = url.searchParams.get("date") ?? "";
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(activitySlug) || !isCalendarDate(date)) {
    return Response.json({ error: "Choose a valid activity and date." }, { status: 400 });
  }

  const bookedTimes = await getConfirmedActivityTimes(activitySlug, date);
  return Response.json(
    { bookedTimes },
    { headers: { "Cache-Control": "no-store, max-age=0" } },
  );
}
