-- ====================================================================
-- MIGRATION: Add Chief Coordinator & Academic Coordinator Roles
-- ====================================================================
-- Run this script in your Supabase SQL Editor (Dashboard -> SQL Editor -> New Query)
-- to add the new enum values to your existing PostgreSQL user_role type.

ALTER TYPE public.user_role ADD VALUE IF NOT EXISTS 'chief_coordinator';
ALTER TYPE public.user_role ADD VALUE IF NOT EXISTS 'academic_coordinator';
