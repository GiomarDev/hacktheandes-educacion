-- CreateEnum
CREATE TYPE "EducationLevel" AS ENUM ('INITIAL', 'PRIMARY', 'SECONDARY');

-- CreateEnum
CREATE TYPE "Management" AS ENUM ('PUBLIC', 'PRIVATE', 'PUBLIC_BY_AGREEMENT');

-- CreateEnum
CREATE TYPE "Area" AS ENUM ('URBAN', 'RURAL');

-- CreateEnum
CREATE TYPE "DocumentType" AS ENUM ('DNI', 'CE', 'PASSPORT');

-- CreateEnum
CREATE TYPE "Sex" AS ENUM ('F', 'M');

-- CreateEnum
CREATE TYPE "Channel" AS ENUM ('WHATSAPP', 'SMS', 'CALL');

-- CreateEnum
CREATE TYPE "GuardianRelationship" AS ENUM ('MOTHER', 'FATHER', 'GRANDPARENT', 'SIBLING', 'OTHER');

-- CreateEnum
CREATE TYPE "PeriodType" AS ENUM ('BIMESTER', 'TRIMESTER');

-- CreateEnum
CREATE TYPE "Shift" AS ENUM ('MORNING', 'AFTERNOON');

-- CreateEnum
CREATE TYPE "EnrollmentStatus" AS ENUM ('ENROLLED', 'TRANSFERRED_OUT', 'WITHDRAWN', 'COMPLETED', 'DECEASED');

-- CreateEnum
CREATE TYPE "FinalResult" AS ENUM ('PROMOTED', 'PERMANENCE', 'RECOVERY_PENDING');

-- CreateEnum
CREATE TYPE "AttendanceStatus" AS ENUM ('PRESENT', 'ABSENT', 'LATE', 'JUSTIFIED', 'LEFT_EARLY');

-- CreateEnum
CREATE TYPE "AttendanceSource" AS ENUM ('MANUAL', 'QR', 'PHOTO_OCR', 'IMPORT');

-- CreateEnum
CREATE TYPE "AccessType" AS ENUM ('ENTRY', 'EXIT');

-- CreateEnum
CREATE TYPE "AccessMethod" AS ENUM ('QR', 'CARD', 'MANUAL');

-- CreateEnum
CREATE TYPE "LiteralGrade" AS ENUM ('AD', 'A', 'B', 'C');

-- CreateTable
CREATE TABLE "dres" (
    "id" UUID NOT NULL,
    "code" VARCHAR(10) NOT NULL,
    "name" VARCHAR(150) NOT NULL,
    "department" VARCHAR(60) NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "dres_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ugels" (
    "id" UUID NOT NULL,
    "code" VARCHAR(10) NOT NULL,
    "name" VARCHAR(150) NOT NULL,
    "dre_id" UUID NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "ugels_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "schools" (
    "id" UUID NOT NULL,
    "modular_code" CHAR(7) NOT NULL,
    "local_code" VARCHAR(10),
    "name" VARCHAR(200) NOT NULL,
    "level" "EducationLevel" NOT NULL,
    "management" "Management" NOT NULL,
    "area" "Area" NOT NULL,
    "ugel_id" UUID NOT NULL,
    "ubigeo" CHAR(6) NOT NULL,
    "department" VARCHAR(60) NOT NULL,
    "province" VARCHAR(60) NOT NULL,
    "district" VARCHAR(60) NOT NULL,
    "address" VARCHAR(250),
    "attention_goal" INTEGER NOT NULL,
    "has_psychologist" BOOLEAN NOT NULL,
    "director_has_teaching_load" BOOLEAN NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "schools_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "audit_logs" (
    "id" UUID NOT NULL,
    "user_id" UUID,
    "action" VARCHAR(60) NOT NULL,
    "entity" VARCHAR(60) NOT NULL,
    "entity_id" UUID,
    "metadata" JSONB NOT NULL DEFAULT '{}',
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "audit_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "academic_periods" (
    "id" UUID NOT NULL,
    "school_id" UUID NOT NULL,
    "year" SMALLINT NOT NULL,
    "type" "PeriodType" NOT NULL,
    "number" SMALLINT NOT NULL,
    "start_date" DATE NOT NULL,
    "end_date" DATE NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "academic_periods_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sections" (
    "id" UUID NOT NULL,
    "school_id" UUID NOT NULL,
    "year" SMALLINT NOT NULL,
    "grade" SMALLINT NOT NULL,
    "name" VARCHAR(5) NOT NULL,
    "shift" "Shift" NOT NULL,
    "tutor_user_id" UUID NOT NULL,
    "auxiliar_user_id" UUID,
    "capacity" SMALLINT NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "sections_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "curricular_areas" (
    "id" UUID NOT NULL,
    "code" VARCHAR(20) NOT NULL,
    "name" VARCHAR(100) NOT NULL,
    "level" "EducationLevel" NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "curricular_areas_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "competencies" (
    "id" UUID NOT NULL,
    "area_id" UUID NOT NULL,
    "code" VARCHAR(20) NOT NULL,
    "name" VARCHAR(250) NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "competencies_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "teaching_assignments" (
    "id" UUID NOT NULL,
    "section_id" UUID NOT NULL,
    "area_id" UUID NOT NULL,
    "teacher_user_id" UUID NOT NULL,
    "weekly_hours" SMALLINT NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "teaching_assignments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "students" (
    "id" UUID NOT NULL,
    "student_code" VARCHAR(20) NOT NULL,
    "document_type" "DocumentType" NOT NULL,
    "document_number" VARCHAR(15) NOT NULL,
    "first_name" VARCHAR(100) NOT NULL,
    "paternal_last_name" VARCHAR(100) NOT NULL,
    "maternal_last_name" VARCHAR(100) NOT NULL,
    "birth_date" DATE NOT NULL,
    "sex" "Sex" NOT NULL,
    "mother_tongue" VARCHAR(50),
    "has_special_needs" BOOLEAN NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "students_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "guardians" (
    "id" UUID NOT NULL,
    "document_type" "DocumentType" NOT NULL,
    "document_number" VARCHAR(15) NOT NULL,
    "first_name" VARCHAR(100) NOT NULL,
    "last_name" VARCHAR(100) NOT NULL,
    "phone" VARCHAR(20) NOT NULL,
    "whatsapp_opt_in" BOOLEAN NOT NULL,
    "opt_in_at" TIMESTAMPTZ(6),
    "preferred_channel" "Channel" NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "guardians_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "student_guardians" (
    "student_id" UUID NOT NULL,
    "guardian_id" UUID NOT NULL,
    "relationship" "GuardianRelationship" NOT NULL,
    "is_primary" BOOLEAN NOT NULL,
    "receives_alerts" BOOLEAN NOT NULL,

    CONSTRAINT "student_guardians_pkey" PRIMARY KEY ("student_id","guardian_id")
);

-- CreateTable
CREATE TABLE "enrollments" (
    "id" UUID NOT NULL,
    "student_id" UUID NOT NULL,
    "section_id" UUID NOT NULL,
    "year" SMALLINT NOT NULL,
    "status" "EnrollmentStatus" NOT NULL DEFAULT 'ENROLLED',
    "status_reason" VARCHAR(250),
    "status_changed_at" TIMESTAMPTZ(6),
    "enrolled_at" DATE NOT NULL,
    "is_permanence" BOOLEAN NOT NULL DEFAULT false,
    "final_result" "FinalResult",
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "enrollments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "class_sessions" (
    "id" UUID NOT NULL,
    "section_id" UUID NOT NULL,
    "area_id" UUID,
    "teacher_user_id" UUID NOT NULL,
    "date" DATE NOT NULL,
    "period_number" SMALLINT NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "class_sessions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "attendance_records" (
    "id" UUID NOT NULL,
    "enrollment_id" UUID NOT NULL,
    "date" DATE NOT NULL,
    "class_session_id" UUID,
    "status" "AttendanceStatus" NOT NULL,
    "source" "AttendanceSource" NOT NULL,
    "justification" VARCHAR(250),
    "recorded_by_user_id" UUID NOT NULL,
    "recorded_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "attendance_records_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "qr_credentials" (
    "id" UUID NOT NULL,
    "student_id" UUID NOT NULL,
    "token_hash" VARCHAR(255) NOT NULL,
    "issued_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "revoked_at" TIMESTAMPTZ(6),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "qr_credentials_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "access_events" (
    "id" UUID NOT NULL,
    "student_id" UUID NOT NULL,
    "school_id" UUID NOT NULL,
    "type" "AccessType" NOT NULL,
    "method" "AccessMethod" NOT NULL,
    "occurred_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "device_id" VARCHAR(50),
    "recorded_by_user_id" UUID,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "access_events_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "grade_entries" (
    "id" UUID NOT NULL,
    "enrollment_id" UUID NOT NULL,
    "competency_id" UUID NOT NULL,
    "period_id" UUID NOT NULL,
    "column_number" SMALLINT NOT NULL,
    "value" "LiteralGrade",
    "is_compensatory" BOOLEAN NOT NULL DEFAULT false,
    "recorded_by_user_id" UUID NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "grade_entries_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "period_grades" (
    "id" UUID NOT NULL,
    "enrollment_id" UUID NOT NULL,
    "competency_id" UUID NOT NULL,
    "period_id" UUID NOT NULL,
    "value" "LiteralGrade",
    "calculation_method" VARCHAR(30) NOT NULL,
    "attendance_rate" DECIMAL(5,2) NOT NULL,
    "calculated_at" TIMESTAMPTZ(6) NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "period_grades_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "dres_code_key" ON "dres"("code");

-- CreateIndex
CREATE UNIQUE INDEX "ugels_code_key" ON "ugels"("code");

-- CreateIndex
CREATE UNIQUE INDEX "schools_modular_code_key" ON "schools"("modular_code");

-- CreateIndex
CREATE INDEX "schools_ugel_id_idx" ON "schools"("ugel_id");

-- CreateIndex
CREATE INDEX "audit_logs_entity_entity_id_idx" ON "audit_logs"("entity", "entity_id");

-- CreateIndex
CREATE UNIQUE INDEX "academic_periods_school_id_year_type_number_key" ON "academic_periods"("school_id", "year", "type", "number");

-- CreateIndex
CREATE UNIQUE INDEX "sections_school_id_year_grade_name_shift_key" ON "sections"("school_id", "year", "grade", "name", "shift");

-- CreateIndex
CREATE UNIQUE INDEX "curricular_areas_code_key" ON "curricular_areas"("code");

-- CreateIndex
CREATE UNIQUE INDEX "competencies_area_id_code_key" ON "competencies"("area_id", "code");

-- CreateIndex
CREATE UNIQUE INDEX "teaching_assignments_section_id_area_id_teacher_user_id_key" ON "teaching_assignments"("section_id", "area_id", "teacher_user_id");

-- CreateIndex
CREATE UNIQUE INDEX "students_student_code_key" ON "students"("student_code");

-- CreateIndex
CREATE UNIQUE INDEX "students_document_type_document_number_key" ON "students"("document_type", "document_number");

-- CreateIndex
CREATE UNIQUE INDEX "guardians_document_type_document_number_key" ON "guardians"("document_type", "document_number");

-- CreateIndex
CREATE INDEX "enrollments_section_id_idx" ON "enrollments"("section_id");

-- CreateIndex
CREATE UNIQUE INDEX "enrollments_student_id_year_key" ON "enrollments"("student_id", "year");

-- CreateIndex
CREATE UNIQUE INDEX "class_sessions_section_id_date_period_number_key" ON "class_sessions"("section_id", "date", "period_number");

-- CreateIndex
CREATE UNIQUE INDEX "attendance_records_enrollment_id_date_class_session_id_key" ON "attendance_records"("enrollment_id", "date", "class_session_id") NULLS NOT DISTINCT;

-- CreateIndex
CREATE UNIQUE INDEX "qr_credentials_token_hash_key" ON "qr_credentials"("token_hash");

-- CreateIndex
CREATE INDEX "access_events_school_id_occurred_at_idx" ON "access_events"("school_id", "occurred_at");

-- CreateIndex
CREATE UNIQUE INDEX "grade_entries_enrollment_id_competency_id_period_id_column__key" ON "grade_entries"("enrollment_id", "competency_id", "period_id", "column_number");

-- CreateIndex
CREATE UNIQUE INDEX "period_grades_enrollment_id_competency_id_period_id_key" ON "period_grades"("enrollment_id", "competency_id", "period_id");

-- AddForeignKey
ALTER TABLE "ugels" ADD CONSTRAINT "ugels_dre_id_fkey" FOREIGN KEY ("dre_id") REFERENCES "dres"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "schools" ADD CONSTRAINT "schools_ugel_id_fkey" FOREIGN KEY ("ugel_id") REFERENCES "ugels"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "academic_periods" ADD CONSTRAINT "academic_periods_school_id_fkey" FOREIGN KEY ("school_id") REFERENCES "schools"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sections" ADD CONSTRAINT "sections_school_id_fkey" FOREIGN KEY ("school_id") REFERENCES "schools"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "competencies" ADD CONSTRAINT "competencies_area_id_fkey" FOREIGN KEY ("area_id") REFERENCES "curricular_areas"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "teaching_assignments" ADD CONSTRAINT "teaching_assignments_section_id_fkey" FOREIGN KEY ("section_id") REFERENCES "sections"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "teaching_assignments" ADD CONSTRAINT "teaching_assignments_area_id_fkey" FOREIGN KEY ("area_id") REFERENCES "curricular_areas"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "student_guardians" ADD CONSTRAINT "student_guardians_student_id_fkey" FOREIGN KEY ("student_id") REFERENCES "students"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "student_guardians" ADD CONSTRAINT "student_guardians_guardian_id_fkey" FOREIGN KEY ("guardian_id") REFERENCES "guardians"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "enrollments" ADD CONSTRAINT "enrollments_student_id_fkey" FOREIGN KEY ("student_id") REFERENCES "students"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "enrollments" ADD CONSTRAINT "enrollments_section_id_fkey" FOREIGN KEY ("section_id") REFERENCES "sections"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "class_sessions" ADD CONSTRAINT "class_sessions_section_id_fkey" FOREIGN KEY ("section_id") REFERENCES "sections"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "class_sessions" ADD CONSTRAINT "class_sessions_area_id_fkey" FOREIGN KEY ("area_id") REFERENCES "curricular_areas"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "attendance_records" ADD CONSTRAINT "attendance_records_enrollment_id_fkey" FOREIGN KEY ("enrollment_id") REFERENCES "enrollments"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "attendance_records" ADD CONSTRAINT "attendance_records_class_session_id_fkey" FOREIGN KEY ("class_session_id") REFERENCES "class_sessions"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "qr_credentials" ADD CONSTRAINT "qr_credentials_student_id_fkey" FOREIGN KEY ("student_id") REFERENCES "students"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "access_events" ADD CONSTRAINT "access_events_student_id_fkey" FOREIGN KEY ("student_id") REFERENCES "students"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "access_events" ADD CONSTRAINT "access_events_school_id_fkey" FOREIGN KEY ("school_id") REFERENCES "schools"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "grade_entries" ADD CONSTRAINT "grade_entries_enrollment_id_fkey" FOREIGN KEY ("enrollment_id") REFERENCES "enrollments"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "grade_entries" ADD CONSTRAINT "grade_entries_competency_id_fkey" FOREIGN KEY ("competency_id") REFERENCES "competencies"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "grade_entries" ADD CONSTRAINT "grade_entries_period_id_fkey" FOREIGN KEY ("period_id") REFERENCES "academic_periods"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "period_grades" ADD CONSTRAINT "period_grades_enrollment_id_fkey" FOREIGN KEY ("enrollment_id") REFERENCES "enrollments"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "period_grades" ADD CONSTRAINT "period_grades_competency_id_fkey" FOREIGN KEY ("competency_id") REFERENCES "competencies"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "period_grades" ADD CONSTRAINT "period_grades_period_id_fkey" FOREIGN KEY ("period_id") REFERENCES "academic_periods"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
