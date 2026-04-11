-- ============================================================
-- SIGO — Sistema Integrado de Gestão Orçamentária de Projetos
-- Migration 001: Initial Schema
-- ============================================================

-- ── Categories ──────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS categories (
  id   uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name varchar(100) NOT NULL UNIQUE
);

INSERT INTO categories (name) VALUES
  ('Serviços'),
  ('Software'),
  ('Hardware'),
  ('Consultoria'),
  ('Infraestrutura'),
  ('Outros')
ON CONFLICT (name) DO NOTHING;

-- ── Projects ─────────────────────────────────────────────────
CREATE TYPE project_status AS ENUM ('Ativo', 'Pausado', 'Concluído');

CREATE TABLE IF NOT EXISTS projects (
  id                     uuid            PRIMARY KEY DEFAULT gen_random_uuid(),
  name                   varchar(200)    NOT NULL,
  status                 project_status  NOT NULL DEFAULT 'Ativo',
  total_approved_budget  numeric(15,2)   NOT NULL CHECK (total_approved_budget > 0),
  execution_percentage   smallint        NOT NULL DEFAULT 0 CHECK (execution_percentage BETWEEN 0 AND 100),
  start_date             date            NOT NULL,
  end_date               date            NOT NULL,
  created_at             timestamptz     NOT NULL DEFAULT now(),
  CONSTRAINT end_after_start CHECK (end_date > start_date)
);

-- ── Expenses ─────────────────────────────────────────────────
CREATE TYPE expense_status AS ENUM ('Previsto', 'Pago');

CREATE TABLE IF NOT EXISTS expenses (
  id           uuid            PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id   uuid            NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  category_id  uuid            NOT NULL REFERENCES categories(id),
  po_number    varchar(50)     NOT NULL,
  amount       numeric(15,2)   NOT NULL CHECK (amount > 0),
  expense_date date            NOT NULL,
  status       expense_status  NOT NULL DEFAULT 'Previsto',
  created_at   timestamptz     NOT NULL DEFAULT now()
);

-- Index for common query patterns
CREATE INDEX IF NOT EXISTS idx_expenses_project_id ON expenses(project_id);
CREATE INDEX IF NOT EXISTS idx_expenses_expense_date ON expenses(expense_date);
CREATE INDEX IF NOT EXISTS idx_expenses_status ON expenses(status);

-- ── Stakeholders (V2 — UI not exposed in V1) ─────────────────
CREATE TABLE IF NOT EXISTS stakeholders (
  id         uuid         PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid         NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  name       varchar(200) NOT NULL,
  role       varchar(100),
  created_at timestamptz  NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_stakeholders_project_id ON stakeholders(project_id);
