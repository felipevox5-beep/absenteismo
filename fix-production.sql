-- 🛠️ SCRIPT DE CORREÇÃO PARA PRODUÇÃO
-- Execute este script no Adminer (SQL command) no seu banco de dados de produção.

-- 1. Criar tabelas fundamentais se não existirem
CREATE TABLE IF NOT EXISTS "cids" (
    "id" SERIAL PRIMARY KEY,
    "code" VARCHAR(10) UNIQUE NOT NULL,
    "description" VARCHAR(255),
    "active" BOOLEAN DEFAULT true,
    "created_at" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS "recurrence_alerts" (
    "id" SERIAL PRIMARY KEY,
    "employee_id" INTEGER NOT NULL,
    "cid" VARCHAR(20),
    "occurrence_count" INTEGER DEFAULT 0,
    "first_occurrence" DATE,
    "last_occurrence" DATE,
    "status" VARCHAR(50) DEFAULT 'ativo',
    "notes" TEXT,
    "created_at" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 2. Criar tabela de Logs de Auditoria
CREATE TABLE IF NOT EXISTS "audit_logs" (
    "id" BIGSERIAL NOT NULL,
    "user_id" INTEGER,
    "action" VARCHAR(100) NOT NULL,
    "table_name" VARCHAR(100),
    "record_id" INTEGER,
    "old_values" JSONB,
    "new_values" JSONB,
    "ip_address" VARCHAR(50),
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "audit_logs_pkey" PRIMARY KEY ("id")
);

-- 3. Adicionar colunas faltantes na tabela 'absences'
DO $$ 
BEGIN 
    -- time
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='absences' AND column_name='time') THEN
        ALTER TABLE "absences" ADD COLUMN "time" VARCHAR(10);
    END IF;
    -- status
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='absences' AND column_name='status') THEN
        ALTER TABLE "absences" ADD COLUMN "status" VARCHAR(50) DEFAULT 'registrado';
    END IF;
    -- cid_id
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='absences' AND column_name='cid_id') THEN
        ALTER TABLE "absences" ADD COLUMN "cid_id" INTEGER;
    END IF;
    -- created_by
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='absences' AND column_name='created_by') THEN
        ALTER TABLE "absences" ADD COLUMN "created_by" INTEGER;
    END IF;
    -- atestado_file_path
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='absences' AND column_name='atestado_file_path') THEN
        ALTER TABLE "absences" ADD COLUMN "atestado_file_path" VARCHAR(500);
    END IF;
    -- atestado_data
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='absences' AND column_name='atestado_data') THEN
        ALTER TABLE "absences" ADD COLUMN "atestado_data" BYTEA;
    END IF;
    -- end_date
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='absences' AND column_name='end_date') THEN
        ALTER TABLE "absences" ADD COLUMN "end_date" DATE;
    END IF;
    -- duration_days
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='absences' AND column_name='duration_days') THEN
        ALTER TABLE "absences" ADD COLUMN "duration_days" INTEGER;
    END IF;
END $$;

-- 4. Criar índices de performance
CREATE INDEX IF NOT EXISTS "audit_logs_user_id_idx" ON "audit_logs"("user_id");
CREATE INDEX IF NOT EXISTS "audit_logs_table_name_idx" ON "audit_logs"("table_name");
CREATE INDEX IF NOT EXISTS "audit_logs_timestamp_idx" ON "audit_logs"("timestamp");
CREATE INDEX IF NOT EXISTS "absences_employee_id_idx" ON "absences"("employee_id");
CREATE INDEX IF NOT EXISTS "absences_cid_idx" ON "absences"("cid");

-- 5. Adicionar Foreign Key para usuários (se a tabela system_users existir)
DO $$ 
BEGIN 
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name='system_users') THEN
        IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name='audit_logs_user_id_fkey') THEN
            ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_user_id_fkey" 
            FOREIGN KEY ("user_id") REFERENCES "system_users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
        END IF;
    END IF;
END $$;

-- ✅ Script finalizado.
