-- CreateTable
CREATE TABLE "queue_entries" (
    "id" BIGSERIAL NOT NULL,
    "guest_key" CHAR(64) NOT NULL,
    "display_name" VARCHAR(24) NOT NULL,
    "business_date" DATE NOT NULL,
    "joined_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "queue_entries_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "daily_archive" (
    "business_date" DATE NOT NULL,
    "position" SMALLINT NOT NULL,
    "display_name" VARCHAR(24) NOT NULL,
    "joined_at" TIMESTAMPTZ(3) NOT NULL,
    "archived_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "daily_archive_pkey" PRIMARY KEY ("business_date","position")
);

-- CreateTable
CREATE TABLE "shared_timer" (
    "id" INTEGER NOT NULL DEFAULT 1,
    "version" INTEGER NOT NULL DEFAULT 0,
    "label" VARCHAR(24),
    "duration_ms" INTEGER,
    "started_at" TIMESTAMPTZ(3),
    "deadline" TIMESTAMPTZ(3),
    "updated_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "shared_timer_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "rate_limits" (
    "key" VARCHAR(120) NOT NULL,
    "window_start" TIMESTAMPTZ(3) NOT NULL,
    "hits" INTEGER NOT NULL DEFAULT 1,

    CONSTRAINT "rate_limits_pkey" PRIMARY KEY ("key","window_start")
);

-- CreateIndex
CREATE INDEX "queue_entries_business_date_joined_at_id_idx" ON "queue_entries"("business_date", "joined_at", "id");

-- CreateIndex
CREATE UNIQUE INDEX "queue_entries_guest_key_business_date_key" ON "queue_entries"("guest_key", "business_date");

-- CreateIndex
CREATE INDEX "rate_limits_window_start_idx" ON "rate_limits"("window_start");

-- Rules Prisma's schema language cannot express. The application validates the same things; these make
-- the database refuse bad rows whatever writes to it.
ALTER TABLE "queue_entries"
  ADD CONSTRAINT "queue_entries_guest_key_hex" CHECK ("guest_key" ~ '^[0-9a-f]{64}$'),
  ADD CONSTRAINT "queue_entries_display_name_length" CHECK (char_length("display_name") BETWEEN 2 AND 24);

ALTER TABLE "daily_archive"
  ADD CONSTRAINT "daily_archive_position_range" CHECK ("position" BETWEEN 1 AND 5);

-- The shared timer is exactly one row. Idle means label, duration, start and deadline are all null;
-- running or ready means all four are set and the deadline is the start plus the duration.
ALTER TABLE "shared_timer"
  ADD CONSTRAINT "shared_timer_single_row" CHECK ("id" = 1),
  ADD CONSTRAINT "shared_timer_duration_range" CHECK ("duration_ms" BETWEEN 1000 AND 3600000),
  ADD CONSTRAINT "shared_timer_consistent" CHECK (
    ("label" IS NULL AND "duration_ms" IS NULL AND "started_at" IS NULL AND "deadline" IS NULL)
    OR ("label" IS NOT NULL AND "duration_ms" IS NOT NULL AND "started_at" IS NOT NULL
        AND "deadline" = "started_at" + "duration_ms" * INTERVAL '1 millisecond')
  );
INSERT INTO "shared_timer" ("id") VALUES (1) ON CONFLICT DO NOTHING;
