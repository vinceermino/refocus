ALTER TABLE "profiles" ADD COLUMN "profile_note" VARCHAR(300) NOT NULL DEFAULT '';

CREATE TABLE "group_study_notes" (
    "id" UUID NOT NULL,
    "author_id" UUID NOT NULL,
    "group_study_id" UUID NOT NULL,
    "content" VARCHAR(500) NOT NULL,
    "visibility" TEXT NOT NULL DEFAULT 'personal',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "group_study_notes_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "group_study_notes_content_check" CHECK (length(btrim("content")) > 0),
    CONSTRAINT "group_study_notes_visibility_check" CHECK ("visibility" IN ('personal', 'group')),
    CONSTRAINT "group_study_notes_author_id_fkey" FOREIGN KEY ("author_id") REFERENCES "profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "group_study_notes_group_study_id_fkey" FOREIGN KEY ("group_study_id") REFERENCES "rooms"("id") ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE INDEX "group_study_notes_group_study_id_created_at_idx" ON "group_study_notes"("group_study_id", "created_at");
CREATE INDEX "group_study_notes_author_id_created_at_idx" ON "group_study_notes"("author_id", "created_at");

-- Match the application's server-only Prisma access model, including databases
-- whose default privileges automatically expose new tables to the Data API.
ALTER TABLE "group_study_notes" ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON "group_study_notes" FROM PUBLIC;
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'anon') THEN
    REVOKE ALL ON "group_study_notes" FROM anon;
  END IF;
  IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'authenticated') THEN
    REVOKE ALL ON "group_study_notes" FROM authenticated;
  END IF;
END $$;
