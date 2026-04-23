-- =====================================================
-- RESETAR BANCO - USE APENAS SE NECESSÁRIO
-- =====================================================
-- ⚠️ CUIDADO: Este script vai DELETAR TUDO do banco
-- Use APENAS se estiver com erro crítico e quiser recomeçar

-- Execute no Adminer: SQL command
-- 1. Selecione o banco db_absenteismo
-- 2. Cole este script
-- 3. Execute

-- =====================================================
-- PASSO 1: DROPAR VIEWS (importante para Prisma)
-- =====================================================

DROP VIEW IF EXISTS vw_absences_by_period CASCADE;
DROP VIEW IF EXISTS vw_recurrence_detection CASCADE;
DROP VIEW IF EXISTS vw_absence_report CASCADE;

-- =====================================================
-- PASSO 2: DROPAR TRIGGERS
-- =====================================================

DROP TRIGGER IF EXISTS check_cid_recurrence_trigger ON absences;
DROP TRIGGER IF EXISTS update_employee_statistics_trigger ON absences;

-- =====================================================
-- PASSO 3: DROPAR FUNÇÕES
-- =====================================================

DROP FUNCTION IF EXISTS check_cid_recurrence();
DROP FUNCTION IF EXISTS update_employee_statistics();

-- =====================================================
-- PASSO 4: DROPAR TODAS AS TABELAS COM CASCADE
-- =====================================================

DROP TABLE IF EXISTS audit_logs CASCADE;
DROP TABLE IF EXISTS system_config CASCADE;
DROP TABLE IF EXISTS system_users CASCADE;
DROP TABLE IF EXISTS recurrence_alerts CASCADE;
DROP TABLE IF EXISTS monthly_absence_report CASCADE;
DROP TABLE IF EXISTS employee_statistics CASCADE;
DROP TABLE IF EXISTS absence_history CASCADE;
DROP TABLE IF EXISTS absences CASCADE;
DROP TABLE IF EXISTS cids CASCADE;
DROP TABLE IF EXISTS absence_types CASCADE;
DROP TABLE IF EXISTS employees CASCADE;
DROP TABLE IF EXISTS sectors CASCADE;

-- =====================================================
-- PASSO 5: DROPAR EXTENSÕES
-- =====================================================

DROP EXTENSION IF EXISTS "uuid-ossp";
DROP EXTENSION IF EXISTS "pgcrypto";

-- =====================================================
-- RESULTADO
-- =====================================================
-- Se chegou até aqui sem erro: ✅ Banco limpo com sucesso

-- Próximo passo: Execute database.sql para recriar tudo
