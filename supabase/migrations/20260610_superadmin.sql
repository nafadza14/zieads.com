-- ─────────────────────────────────────────────────────────────
-- ZieAds Superadmin Dashboard — Schema Migration
-- Created: 2026-06-10
-- ─────────────────────────────────────────────────────────────

-- ── 1. superadmin_users ──────────────────────────────────────
CREATE TABLE IF NOT EXISTS superadmin_users (
  id                    UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
  email                 VARCHAR(255) UNIQUE NOT NULL,
  name                  VARCHAR(255) NOT NULL,
  role                  TEXT         NOT NULL CHECK (role IN ('superadmin', 'admin', 'support')),
  password_hash         TEXT         NOT NULL,
  totp_secret           TEXT         DEFAULT NULL,
  totp_enabled          BOOLEAN      DEFAULT FALSE,
  current_session_token TEXT         DEFAULT NULL,
  session_expires_at    TIMESTAMPTZ  DEFAULT NULL,
  last_activity_at      TIMESTAMPTZ  DEFAULT NULL,
  last_login_at         TIMESTAMPTZ  DEFAULT NULL,
  last_login_ip         INET         DEFAULT NULL,
  is_active             BOOLEAN      DEFAULT TRUE,
  created_at            TIMESTAMPTZ  DEFAULT now()
);

-- Seed default superadmin: admin@zieads.com / asikasikjos14
INSERT INTO superadmin_users (email, name, role, password_hash)
VALUES (
  'admin@zieads.com',
  'ZieAds Superadmin',
  'superadmin',
  'a2281ded64db00fd816e1ce9b0942db1:654984746e51aa7500ac0524f5fa1ef62d8562ca1de33c4b921100e2c6e267ec0d2a66c5d6587e2256f43324cd00125f12c60703e09aca0ba5dae960736de15d'
) ON CONFLICT (email) DO NOTHING;

-- ── 2. superadmin_audit_log ──────────────────────────────────
CREATE TABLE IF NOT EXISTS superadmin_audit_log (
  id                UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
  superadmin_id     UUID         REFERENCES superadmin_users(id) ON DELETE SET NULL,
  superadmin_email  VARCHAR(255) NOT NULL,
  action            VARCHAR(100) NOT NULL, -- e.g. user.plan_changed, api_key.rotated
  entity_type       VARCHAR(50)  NOT NULL, -- e.g. user, api_key, credit, system
  entity_id         TEXT         DEFAULT NULL,
  old_value         JSONB        DEFAULT NULL,
  new_value         JSONB        DEFAULT NULL,
  ip_address        INET         NOT NULL,
  created_at        TIMESTAMPTZ  DEFAULT now()
);

-- Index for timeline queries
CREATE INDEX IF NOT EXISTS idx_superadmin_audit_log_created_at
  ON superadmin_audit_log(created_at DESC);

-- Trigger to make the audit log strictly immutable
CREATE OR REPLACE FUNCTION prevent_audit_log_modification()
RETURNS TRIGGER AS $$
BEGIN
  RAISE EXCEPTION 'Modification or deletion of audit logs is strictly prohibited.';
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_prevent_audit_log_modification ON superadmin_audit_log;
CREATE TRIGGER trg_prevent_audit_log_modification
  BEFORE UPDATE OR DELETE ON superadmin_audit_log
  FOR EACH ROW EXECUTE PROCEDURE prevent_audit_log_modification();

-- ── 3. api_keys ──────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS api_keys (
  id                  UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
  service_name        VARCHAR(100) NOT NULL,
  display_name        VARCHAR(100) NOT NULL,
  key_value_encrypted TEXT         NOT NULL,
  key_preview         VARCHAR(20)  NOT NULL,
  environment         TEXT         NOT NULL CHECK (environment IN ('production', 'staging', 'development')),
  is_active           BOOLEAN      DEFAULT TRUE,
  rotated_at          TIMESTAMPTZ  DEFAULT NULL,
  expires_at          TIMESTAMPTZ  DEFAULT NULL,
  created_at          TIMESTAMPTZ  DEFAULT now(),
  created_by          UUID         REFERENCES superadmin_users(id) ON DELETE SET NULL,
  notes               TEXT         DEFAULT NULL
);

-- ── 4. api_usage_logs ────────────────────────────────────────
CREATE TABLE IF NOT EXISTS api_usage_logs (
  id                 UUID          PRIMARY KEY DEFAULT gen_random_uuid(),
  service_name       VARCHAR(100)  NOT NULL,
  user_id            UUID          DEFAULT NULL, -- references auth.users(id) (handled dynamically on server)
  operation_id       VARCHAR(100)  DEFAULT NULL,
  model              VARCHAR(50)   DEFAULT NULL,
  input_tokens       INT           DEFAULT NULL,
  output_tokens      INT           DEFAULT NULL,
  cache_read_tokens  INT           DEFAULT NULL,
  cache_write_tokens INT           DEFAULT NULL,
  cost_usd           DECIMAL(10,6) DEFAULT NULL,
  latency_ms         INT           DEFAULT NULL,
  status             TEXT          NOT NULL CHECK (status IN ('success', 'error', 'timeout')),
  error_code         VARCHAR(100)  DEFAULT NULL,
  created_at         TIMESTAMPTZ   DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_api_usage_logs_created_at
  ON api_usage_logs(created_at DESC);

-- ── 5. system_alerts ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS system_alerts (
  id          UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
  alert_type  VARCHAR(100) NOT NULL,
  severity    TEXT         NOT NULL CHECK (severity IN ('info', 'warning', 'critical')),
  title       VARCHAR(255) NOT NULL,
  body        TEXT         NOT NULL,
  entity_type VARCHAR(50)  DEFAULT NULL,
  entity_id   TEXT         DEFAULT NULL,
  is_resolved BOOLEAN      DEFAULT FALSE,
  resolved_by UUID         REFERENCES superadmin_users(id) ON DELETE SET NULL,
  resolved_at TIMESTAMPTZ  DEFAULT NULL,
  created_at  TIMESTAMPTZ  DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_system_alerts_resolved_created
  ON system_alerts(is_resolved, created_at DESC);

-- ── 6. user_notes ────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS user_notes (
  id         UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    UUID        NOT NULL, -- references auth.users(id)
  written_by UUID        REFERENCES superadmin_users(id) ON DELETE SET NULL,
  note       TEXT        NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_user_notes_user_created
  ON user_notes(user_id, created_at DESC);
