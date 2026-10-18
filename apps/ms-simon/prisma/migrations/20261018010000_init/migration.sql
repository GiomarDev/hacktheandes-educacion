-- F2: tablas propias del servicio; sin FK entre schemas.
CREATE TYPE "ReportType" AS ENUM ('MONTHLY_FOLLOWUP', 'BIMESTER_ATTENDANCE', 'ATTENTION_GOAL', 'DROPOUT_JUSTIFICATION');
CREATE TYPE "ReportStatus" AS ENUM ('DRAFT', 'SUBMITTED', 'REVIEWED', 'OBSERVED');
CREATE TYPE "PlanStatus" AS ENUM ('DRAFT', 'ACTIVE', 'ARCHIVED');
CREATE TYPE "GeneratedBy" AS ENUM ('HUMAN', 'AI_ASSISTED');
CREATE TYPE "VisitStatus" AS ENUM ('SCHEDULED', 'DONE', 'FEEDBACK_GIVEN');

CREATE TABLE "self_reports" (
  "id" UUID NOT NULL,
  "school_id" UUID NOT NULL,
  "period_id" UUID,
  "year" SMALLINT NOT NULL,
  "type" "ReportType" NOT NULL,
  "month" SMALLINT,
  "payload" JSONB NOT NULL,
  "status" "ReportStatus" NOT NULL DEFAULT 'DRAFT',
  "revision" INTEGER NOT NULL DEFAULT 1,
  "dedupe_key" CHAR(64) NOT NULL,
  "generated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "submitted_by_user_id" UUID,
  "submitted_at" TIMESTAMPTZ(6),
  "reviewed_by_user_id" UUID,
  "reviewed_at" TIMESTAMPTZ(6),
  "review_notes" TEXT,
  "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMPTZ(6) NOT NULL,
  CONSTRAINT "self_reports_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "self_reports_dedupe_key_key" ON "self_reports"("dedupe_key");
CREATE INDEX "self_reports_school_id_year_status_idx" ON "self_reports"("school_id", "year", "status");

CREATE TABLE "support_plans" (
  "id" UUID NOT NULL,
  "student_id" UUID NOT NULL,
  "school_id" UUID NOT NULL,
  "year" SMALLINT NOT NULL,
  "tutor_user_id" UUID NOT NULL,
  "status" "PlanStatus" NOT NULL DEFAULT 'DRAFT',
  "barriers" TEXT NOT NULL,
  "diagnosis" TEXT,
  "strengths" TEXT,
  "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMPTZ(6) NOT NULL,
  CONSTRAINT "support_plans_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "support_plans_student_id_year_key" ON "support_plans"("student_id", "year");
CREATE INDEX "support_plans_school_id_year_idx" ON "support_plans"("school_id", "year");

CREATE TABLE "support_plan_versions" (
  "id" UUID NOT NULL,
  "plan_id" UUID NOT NULL,
  "period_id" UUID NOT NULL,
  "version" SMALLINT NOT NULL,
  "goals" JSONB NOT NULL,
  "adjustments" JSONB NOT NULL,
  "strategies" JSONB NOT NULL,
  "progress_notes" TEXT,
  "generated_by" "GeneratedBy" NOT NULL DEFAULT 'HUMAN',
  "ai_model" VARCHAR(60),
  "approved_by_user_id" UUID,
  "approved_at" TIMESTAMPTZ(6),
  "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMPTZ(6) NOT NULL,
  CONSTRAINT "support_plan_versions_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "support_plan_versions_plan_id_period_id_key" ON "support_plan_versions"("plan_id", "period_id");
CREATE UNIQUE INDEX "support_plan_versions_plan_id_version_key" ON "support_plan_versions"("plan_id", "version");

CREATE TABLE "monitoring_visits" (
  "id" UUID NOT NULL,
  "school_id" UUID NOT NULL,
  "section_id" UUID NOT NULL,
  "observer_user_id" UUID NOT NULL,
  "observed_teacher_user_id" UUID NOT NULL,
  "visited_at" TIMESTAMPTZ(6) NOT NULL,
  "protocol_version" VARCHAR(20) NOT NULL,
  "observations" TEXT NOT NULL DEFAULT '',
  "feedback" TEXT NOT NULL DEFAULT '',
  "improvement_commitment" TEXT NOT NULL DEFAULT '',
  "status" "VisitStatus" NOT NULL DEFAULT 'SCHEDULED',
  "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMPTZ(6) NOT NULL,
  CONSTRAINT "monitoring_visits_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "monitoring_visits_school_id_status_idx" ON "monitoring_visits"("school_id", "status");

CREATE TABLE "audit_logs" (
  "id" UUID NOT NULL,
  "user_id" UUID NOT NULL,
  "action" VARCHAR(60) NOT NULL,
  "entity_id" UUID NOT NULL,
  "metadata" JSONB NOT NULL DEFAULT '{}'::jsonb,
  "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMPTZ(6) NOT NULL,
  CONSTRAINT "audit_logs_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "audit_logs_entity_id_created_at_idx" ON "audit_logs"("entity_id", "created_at");
ALTER TABLE "support_plan_versions" ADD CONSTRAINT "support_plan_versions_plan_id_fkey" FOREIGN KEY ("plan_id") REFERENCES "support_plans"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
