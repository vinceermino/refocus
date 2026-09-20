BEGIN;

-- AlterTable
ALTER TABLE "rooms" ADD COLUMN     "description" TEXT NOT NULL DEFAULT '',
ADD COLUMN     "tags" TEXT[] DEFAULT ARRAY[]::TEXT[];

-- AlterTable
ALTER TABLE "room_members" ADD COLUMN     "last_seen_at" TIMESTAMP(3),
ADD COLUMN     "status" TEXT NOT NULL DEFAULT 'active';

-- CreateTable
CREATE TABLE "daily_stats" (
    "profile_id" UUID NOT NULL,
    "day" DATE NOT NULL,
    "goal_minutes" INTEGER NOT NULL DEFAULT 120,
    "focus_seconds" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "daily_stats_pkey" PRIMARY KEY ("profile_id","day")
);

-- CreateIndex
CREATE INDEX "rooms_is_public_created_at_idx" ON "rooms"("is_public", "created_at");

-- CreateIndex
CREATE INDEX "room_members_profile_id_status_idx" ON "room_members"("profile_id", "status");

-- CreateIndex
CREATE INDEX "room_members_room_id_status_last_seen_at_idx" ON "room_members"("room_id", "status", "last_seen_at");

-- CreateIndex
CREATE INDEX "timers_room_id_status_idx" ON "timers"("room_id", "status");

-- CreateIndex
CREATE INDEX "timer_sessions_profile_id_created_at_idx" ON "timer_sessions"("profile_id", "created_at");

-- AddForeignKey
ALTER TABLE "daily_stats" ADD CONSTRAINT "daily_stats_profile_id_fkey" FOREIGN KEY ("profile_id") REFERENCES "profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Preserve study history when a room or timer is deleted.
ALTER TABLE "timer_sessions" DROP CONSTRAINT "timer_sessions_timer_id_fkey";
ALTER TABLE "timer_sessions" ADD CONSTRAINT "timer_sessions_timer_id_fkey"
  FOREIGN KEY ("timer_id") REFERENCES "timers"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- Historical sessions use their original recording day, now explicitly UTC.
-- There were no configurable goals before this migration; use 120 minutes.
INSERT INTO "daily_stats" ("profile_id", "day", "goal_minutes", "focus_seconds")
SELECT "profile_id", "created_at"::date, 120, GREATEST(0, SUM("duration"))::integer
FROM "timer_sessions" GROUP BY "profile_id", "created_at"::date;

-- Repair legacy owners who left their own room, and normalize owner roles.
UPDATE "room_members" m SET role = 'member' FROM "rooms" r
WHERE m.room_id = r.id AND m.role = 'owner' AND m.profile_id <> r.owner_id;
INSERT INTO "room_members" (id, room_id, profile_id, role, status, joined_at)
SELECT gen_random_uuid(), id, owner_id, 'owner', 'active', CURRENT_TIMESTAMP FROM "rooms"
ON CONFLICT (room_id, profile_id) DO UPDATE SET role = 'owner', status = 'active';

ALTER TABLE "daily_stats" ADD CONSTRAINT "daily_stats_goal_check" CHECK (goal_minutes BETWEEN 1 AND 480),
  ADD CONSTRAINT "daily_stats_focus_check" CHECK (focus_seconds >= 0);
ALTER TABLE "room_members" ADD CONSTRAINT "room_members_role_check" CHECK (role IN ('owner', 'admin', 'member')),
  ADD CONSTRAINT "room_members_status_check" CHECK (status IN ('active', 'pending', 'kicked', 'banned'));
CREATE UNIQUE INDEX "room_members_one_owner_idx" ON "room_members" (room_id) WHERE role = 'owner';

-- These tables are accessed only by authenticated, authorized server actions
-- through Prisma. No direct browser Data API grants or policies are needed.
ALTER TABLE "daily_stats" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "profiles" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "rooms" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "room_members" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "timers" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "timer_sessions" ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON "daily_stats", "profiles", "rooms", "room_members", "timers", "timer_sessions" FROM PUBLIC;
DO $$
DECLARE api_role text;
BEGIN
  FOREACH api_role IN ARRAY ARRAY['anon', 'authenticated'] LOOP
    IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = api_role) THEN
      EXECUTE format('REVOKE ALL ON daily_stats, profiles, rooms, room_members, timers, timer_sessions FROM %I', api_role);
    END IF;
  END LOOP;
END $$;

COMMIT;
