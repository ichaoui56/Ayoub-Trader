CREATE TYPE "CoachingMeetingMode" AS ENUM ('ONLINE', 'IN_PERSON');
ALTER TABLE "CoachingBooking" ADD COLUMN "meetingMode" "CoachingMeetingMode" NOT NULL DEFAULT 'ONLINE';
ALTER TABLE "CoachingBooking" ADD COLUMN "meetingCity" TEXT;