-- F2: tablas propias del servicio; sin FK entre schemas.

CREATE TABLE "outbox_events" (
  "id" UUID NOT NULL,
  "type" VARCHAR(40) NOT NULL,
  "resource_id" UUID NOT NULL,
  "date" CHAR(10) NOT NULL,
  "delivered_at" TIMESTAMPTZ(6),
  "attempts" INTEGER NOT NULL DEFAULT 0,
  "next_attempt_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "locked_until" TIMESTAMPTZ(6),
  "error" TEXT,
  "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMPTZ(6) NOT NULL,
  CONSTRAINT "outbox_events_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "outbox_events_delivered_at_next_attempt_at_idx" ON "outbox_events"("delivered_at", "next_attempt_at");
