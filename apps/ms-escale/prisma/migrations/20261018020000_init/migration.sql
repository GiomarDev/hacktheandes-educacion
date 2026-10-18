-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "escale";

-- CreateEnum
CREATE TYPE "IndicatorSource" AS ENUM ('OFFICIAL', 'COMPUTED');

-- CreateEnum
CREATE TYPE "GeoLevel" AS ENUM ('NATIONAL', 'DRE', 'UGEL', 'DISTRICT', 'SCHOOL');

-- CreateTable
CREATE TABLE "indicator_definitions" (
    "id" UUID NOT NULL,
    "code" VARCHAR(50) NOT NULL,
    "name" VARCHAR(200) NOT NULL,
    "formula" TEXT NOT NULL,
    "unit" VARCHAR(20) NOT NULL,
    "source" "IndicatorSource" NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "indicator_definitions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "indicator_values" (
    "id" UUID NOT NULL,
    "indicator_id" UUID NOT NULL,
    "geo_level" "GeoLevel" NOT NULL,
    "geo_code" VARCHAR(20) NOT NULL,
    "geo_name" VARCHAR(150) NOT NULL,
    "period_label" VARCHAR(20) NOT NULL,
    "dimension" VARCHAR(30),
    "dimension_value" VARCHAR(30),
    "value" DECIMAL(12,4) NOT NULL,
    "numerator" DECIMAL(14,4),
    "denominator" DECIMAL(14,4),
    "ugel_id" UUID,
    "dre_id" UUID,
    "import_id" UUID,
    "computed_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "indicator_values_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "dataset_imports" (
    "id" UUID NOT NULL,
    "dataset" VARCHAR(50) NOT NULL,
    "name" VARCHAR(150) NOT NULL,
    "source_url" VARCHAR(500),
    "file_name" VARCHAR(200) NOT NULL,
    "checksum" CHAR(64) NOT NULL,
    "row_count" INTEGER NOT NULL,
    "imported_by" UUID NOT NULL,
    "imported_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "dataset_imports_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "school_daily_stats" (
    "id" UUID NOT NULL,
    "school_id" UUID NOT NULL,
    "ugel_id" UUID NOT NULL,
    "dre_id" UUID NOT NULL,
    "date" DATE NOT NULL,
    "enrolled" INTEGER NOT NULL,
    "present" INTEGER NOT NULL,
    "absent" INTEGER NOT NULL,
    "late" INTEGER NOT NULL,
    "sections_total" INTEGER NOT NULL,
    "sections_reported" INTEGER NOT NULL,
    "open_cases" INTEGER NOT NULL,
    "contacted_cases" INTEGER NOT NULL,
    "computed_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "school_daily_stats_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "indicator_definitions_code_key" ON "indicator_definitions"("code");

-- CreateIndex
CREATE INDEX "indicator_values_geo_level_period_label_idx" ON "indicator_values"("geo_level", "period_label");

-- CreateIndex
CREATE INDEX "indicator_values_ugel_id_idx" ON "indicator_values"("ugel_id");

-- La dimensión es nula en los valores totales: sin NULLS NOT DISTINCT se duplicarían.
-- CreateIndex
CREATE UNIQUE INDEX "indicator_values_indicator_id_geo_level_geo_code_period_lab_key" ON "indicator_values"("indicator_id", "geo_level", "geo_code", "period_label", "dimension", "dimension_value") NULLS NOT DISTINCT;

-- CreateIndex
CREATE UNIQUE INDEX "dataset_imports_checksum_key" ON "dataset_imports"("checksum");

-- CreateIndex
CREATE INDEX "school_daily_stats_ugel_id_date_idx" ON "school_daily_stats"("ugel_id", "date");

-- CreateIndex
CREATE UNIQUE INDEX "school_daily_stats_school_id_date_key" ON "school_daily_stats"("school_id", "date");

-- AddForeignKey
ALTER TABLE "indicator_values" ADD CONSTRAINT "indicator_values_indicator_id_fkey" FOREIGN KEY ("indicator_id") REFERENCES "indicator_definitions"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "indicator_values" ADD CONSTRAINT "indicator_values_import_id_fkey" FOREIGN KEY ("import_id") REFERENCES "dataset_imports"("id") ON DELETE SET NULL ON UPDATE CASCADE;


-- Catálogo de indicadores: datos de referencia, no personales.
INSERT INTO "indicator_definitions" ("id", "code", "name", "formula", "unit", "source") VALUES
  (gen_random_uuid(), 'DROPOUT_RATE_SEC_SIAGIE', 'Deserción en secundaria (SIAGIE)', 'desertores_secundaria / estudiantes_secundaria × 100 (docs/desercion_por_region_siagie_2023_2024.csv)', '%', 'OFFICIAL'),
  (gen_random_uuid(), 'DROPOUT_RATE_PRI_SIAGIE', 'Deserción en primaria (SIAGIE)', 'desertores_primaria / estudiantes_primaria × 100 (docs/desercion_por_region_siagie_2023_2024.csv)', '%', 'OFFICIAL'),
  (gen_random_uuid(), 'DROPOUT_RATE_SEC_ESCALE', 'Tasa de deserción interanual en secundaria (ESCALE)', 'TD = (M_t − (M_t ∩ M_t+1) − A5S_t − F_t) / M_t × 100 (docs/reporte_desercion_escale.md)', '%', 'OFFICIAL'),
  (gen_random_uuid(), 'ATTENDANCE_RATE', 'Asistencia diaria', '(presentes + tardanzas) / registros de asistencia diaria × 100', '%', 'COMPUTED'),
  (gen_random_uuid(), 'SILENT_SECTIONS_RATE', 'Aulas en silencio', '(secciones-día esperadas − secciones-día con pase de lista) / secciones-día esperadas × 100, días hábiles', '%', 'COMPUTED'),
  (gen_random_uuid(), 'CASES_CONTACTED_RATE', 'Casos abiertos con contacto familiar', 'casos abiertos con primer contacto / casos abiertos × 100, último día calculado del mes', '%', 'COMPUTED');
