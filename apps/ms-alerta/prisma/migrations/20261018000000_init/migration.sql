-- F2: tablas propias del servicio; sin FK entre schemas.
CREATE TYPE "RuleType" AS ENUM ('ABSENCES_IN_WINDOW', 'CONSECUTIVE_ABSENCES', 'LATE_COUNT', 'SECTION_SILENT', 'GRADE_WITHOUT_ATTENDANCE', 'LEFT_WITHOUT_EXIT', 'ATTENTION_GOAL_GAP');
CREATE TYPE "Severity" AS ENUM ('LOW', 'MEDIUM', 'HIGH');
CREATE TYPE "AlertType" AS ENUM ('ABSENCE_PATTERN', 'SECTION_SILENT', 'ACCESS_ENTRY', 'ACCESS_EXIT', 'GRADE_WITHOUT_ATTENDANCE', 'LEFT_WITHOUT_EXIT', 'ATTENTION_GOAL_GAP');
CREATE TYPE "AlertStatus" AS ENUM ('OPEN', 'ACKNOWLEDGED', 'RESOLVED', 'DISMISSED');
CREATE TYPE "CaseStatus" AS ENUM ('OPEN', 'CONTACTING', 'CONTACTED', 'REFERRED', 'CLOSED_RETURNED', 'CLOSED_TRANSFERRED', 'CLOSED_DROPPED_OUT');
CREATE TYPE "Role" AS ENUM ('MINEDU_ADMIN', 'DRE_SPECIALIST', 'UGEL_SPECIALIST', 'DIRECTOR', 'SECRETARY', 'TUTOR', 'TEACHER', 'AUXILIAR', 'PSYCHOLOGIST');
CREATE TYPE "ReasonCategory" AS ENUM ('HEALTH', 'WORK', 'MOVING', 'ECONOMIC', 'BULLYING', 'FAMILY', 'ACADEMIC', 'MIGRATION', 'OTHER');
CREATE TYPE "ActionType" AS ENUM ('NOTE', 'MESSAGE_DRAFTED', 'MESSAGE_SENT', 'CALL', 'MEETING', 'ESCALATED', 'REFERRAL_PSYCHOLOGIST', 'REFERRAL_DEMUNA', 'REFERRAL_CEM', 'REFERRAL_JUNTOS', 'STATUS_CHANGE');
CREATE TYPE "RecipientType" AS ENUM ('GUARDIAN', 'USER');
CREATE TYPE "Channel" AS ENUM ('WHATSAPP', 'SMS', 'EMAIL', 'IN_APP');
CREATE TYPE "NotificationStatus" AS ENUM ('QUEUED', 'SENT', 'DELIVERED', 'READ', 'FAILED');

CREATE TABLE "risk_rules" (
  "id" UUID NOT NULL,
  "code" VARCHAR(40) NOT NULL,
  "type" "RuleType" NOT NULL,
  "params" JSONB NOT NULL,
  "severity" "Severity" NOT NULL,
  "school_id" UUID,
  "is_active" BOOLEAN NOT NULL DEFAULT true,
  "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMPTZ(6) NOT NULL,
  CONSTRAINT "risk_rules_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "risk_rules_code_key" ON "risk_rules"("code");

CREATE TABLE "alerts" (
  "id" UUID NOT NULL,
  "rule_id" UUID,
  "type" "AlertType" NOT NULL,
  "severity" "Severity" NOT NULL,
  "school_id" UUID NOT NULL,
  "section_id" UUID,
  "student_id" UUID,
  "status" "AlertStatus" NOT NULL DEFAULT 'OPEN',
  "data" JSONB NOT NULL DEFAULT '{}'::jsonb,
  "detected_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "case_id" UUID,
  "dedupe_key" VARCHAR(120) NOT NULL,
  "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMPTZ(6) NOT NULL,
  CONSTRAINT "alerts_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "alerts_dedupe_key_key" ON "alerts"("dedupe_key");
CREATE INDEX "alerts_school_id_status_idx" ON "alerts"("school_id", "status");

CREATE TABLE "cases" (
  "id" UUID NOT NULL,
  "student_id" UUID NOT NULL,
  "school_id" UUID NOT NULL,
  "section_id" UUID NOT NULL,
  "status" "CaseStatus" NOT NULL DEFAULT 'OPEN',
  "owner_user_id" UUID NOT NULL,
  "owner_role" "Role" NOT NULL,
  "escalation_level" SMALLINT NOT NULL DEFAULT 0,
  "due_at" TIMESTAMPTZ(6) NOT NULL,
  "opened_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "first_contact_at" TIMESTAMPTZ(6),
  "closed_at" TIMESTAMPTZ(6),
  "close_reason" VARCHAR(250),
  "reason_category" "ReasonCategory",
  "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMPTZ(6) NOT NULL,
  CONSTRAINT "cases_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "cases_school_id_status_idx" ON "cases"("school_id", "status");
CREATE INDEX "cases_status_due_at_idx" ON "cases"("status", "due_at");

CREATE TABLE "case_actions" (
  "id" UUID NOT NULL,
  "case_id" UUID NOT NULL,
  "type" "ActionType" NOT NULL,
  "performed_by_user_id" UUID,
  "notes" TEXT,
  "metadata" JSONB NOT NULL DEFAULT '{}'::jsonb,
  "performed_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMPTZ(6) NOT NULL,
  CONSTRAINT "case_actions_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "case_actions_case_id_performed_at_idx" ON "case_actions"("case_id", "performed_at");

CREATE TABLE "notifications" (
  "id" UUID NOT NULL,
  "recipient_type" "RecipientType" NOT NULL,
  "guardian_id" UUID,
  "user_id" UUID,
  "channel" "Channel" NOT NULL,
  "template_code" VARCHAR(50) NOT NULL,
  "body" TEXT NOT NULL,
  "status" "NotificationStatus" NOT NULL DEFAULT 'QUEUED',
  "provider" VARCHAR(30) NOT NULL DEFAULT 'console',
  "provider_message_id" VARCHAR(100),
  "alert_id" UUID,
  "case_id" UUID,
  "dedupe_key" VARCHAR(150) NOT NULL,
  "sent_at" TIMESTAMPTZ(6),
  "delivered_at" TIMESTAMPTZ(6),
  "error" TEXT,
  "attempts" INTEGER NOT NULL DEFAULT 0,
  "next_attempt_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "locked_until" TIMESTAMPTZ(6),
  "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMPTZ(6) NOT NULL,
  CONSTRAINT "notifications_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "notifications_provider_message_id_key" ON "notifications"("provider_message_id");
CREATE UNIQUE INDEX "notifications_dedupe_key_key" ON "notifications"("dedupe_key");
CREATE INDEX "notifications_status_next_attempt_at_idx" ON "notifications"("status", "next_attempt_at");

CREATE TABLE "guardian_responses" (
  "id" UUID NOT NULL,
  "provider_event_id" UUID NOT NULL,
  "notification_id" UUID NOT NULL,
  "case_id" UUID,
  "raw_text" TEXT NOT NULL,
  "classified_reason" "ReasonCategory",
  "classification_confidence" DECIMAL(3, 2),
  "received_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMPTZ(6) NOT NULL,
  CONSTRAINT "guardian_responses_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "guardian_responses_provider_event_id_key" ON "guardian_responses"("provider_event_id");

CREATE TABLE "inbox_events" (
  "id" UUID NOT NULL,
  "type" VARCHAR(40) NOT NULL,
  "resource_id" UUID NOT NULL,
  "date" CHAR(10) NOT NULL,
  "processed_at" TIMESTAMPTZ(6),
  "attempts" INTEGER NOT NULL DEFAULT 0,
  "next_attempt_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "locked_until" TIMESTAMPTZ(6),
  "error" TEXT,
  "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMPTZ(6) NOT NULL,
  CONSTRAINT "inbox_events_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "inbox_events_processed_at_next_attempt_at_idx" ON "inbox_events"("processed_at", "next_attempt_at");
ALTER TABLE "alerts" ADD CONSTRAINT "alerts_rule_id_fkey" FOREIGN KEY ("rule_id") REFERENCES "risk_rules"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "alerts" ADD CONSTRAINT "alerts_case_id_fkey" FOREIGN KEY ("case_id") REFERENCES "cases"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "case_actions" ADD CONSTRAINT "case_actions_case_id_fkey" FOREIGN KEY ("case_id") REFERENCES "cases"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_alert_id_fkey" FOREIGN KEY ("alert_id") REFERENCES "alerts"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_case_id_fkey" FOREIGN KEY ("case_id") REFERENCES "cases"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "guardian_responses" ADD CONSTRAINT "guardian_responses_notification_id_fkey" FOREIGN KEY ("notification_id") REFERENCES "notifications"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "guardian_responses" ADD CONSTRAINT "guardian_responses_case_id_fkey" FOREIGN KEY ("case_id") REFERENCES "cases"("id") ON DELETE SET NULL ON UPDATE CASCADE;

CREATE UNIQUE INDEX "cases_one_open_per_student_school" ON "cases"("student_id", "school_id") WHERE "closed_at" IS NULL;
ALTER TABLE "notifications" ADD CONSTRAINT "notification_exactly_one_recipient" CHECK (("recipient_type" = 'GUARDIAN' AND "guardian_id" IS NOT NULL AND "user_id" IS NULL) OR ("recipient_type" = 'USER' AND "user_id" IS NOT NULL AND "guardian_id" IS NULL));
