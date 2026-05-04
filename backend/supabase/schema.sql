-- ============================================================================
-- Verstack.lk AI Code Scanner - Supabase Database Schema
-- PostgreSQL schema for users, scans, vulnerabilities, and audit logs.
-- Supports Supabase Auth, Row Level Security (RLS), and Realtime.
-- ============================================================================

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================================================
-- USERS TABLE (extends Supabase Auth)
-- Stores additional user profile data linked to Supabase Auth.
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.users (
    id              UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email           TEXT NOT NULL,
    full_name       TEXT,
    avatar_url      TEXT,
    role            TEXT NOT NULL DEFAULT 'user' CHECK (role IN ('user', 'admin', 'analyst')),
    organization    TEXT,
    scan_quota      INTEGER NOT NULL DEFAULT 100,
    scans_used      INTEGER NOT NULL DEFAULT 0,
    preferences     JSONB DEFAULT '{}'::jsonb,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    last_login_at   TIMESTAMPTZ
);

-- Trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_users_updated_at
    BEFORE UPDATE ON public.users
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- RLS policies for users table
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own profile" ON public.users
    FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON public.users
    FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Admins can view all profiles" ON public.users
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.users u 
            WHERE u.id = auth.uid() AND u.role = 'admin'
        )
    );

-- ============================================================================
-- SCANS TABLE
-- Stores scan records with metadata, results, and security scores.
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.scans (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id         UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    filename        TEXT NOT NULL DEFAULT 'untitled',
    language        TEXT NOT NULL DEFAULT 'python',
    code_hash       TEXT NOT NULL, -- SHA-256 hash of scanned code
    total_lines     INTEGER NOT NULL DEFAULT 0,
    scan_duration_ms INTEGER NOT NULL DEFAULT 0,
    security_score  INTEGER NOT NULL CHECK (security_score BETWEEN 0 AND 100),
    status          TEXT NOT NULL DEFAULT 'pending' 
                        CHECK (status IN ('queued', 'parsing', 'analyzing', 'ai_processing', 'completed', 'failed', 'cancelled')),
    summary         JSONB DEFAULT '{}'::jsonb,
    error_message   TEXT,
    ai_model_used   TEXT,
    is_deleted      BOOLEAN NOT NULL DEFAULT FALSE,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    completed_at    TIMESTAMPTZ
);

-- Indexes for common queries
CREATE INDEX IF NOT EXISTS idx_scans_user_id ON public.scans(user_id);
CREATE INDEX IF NOT EXISTS idx_scans_status ON public.scans(status);
CREATE INDEX IF NOT EXISTS idx_scans_created_at ON public.scans(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_scans_security_score ON public.scans(security_score);

-- Trigger to update scans_used counter
CREATE OR REPLACE FUNCTION increment_scan_counter()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE public.users 
    SET scans_used = scans_used + 1 
    WHERE id = NEW.user_id;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER after_scan_inserted
    AFTER INSERT ON public.scans
    FOR EACH ROW
    EXECUTE FUNCTION increment_scan_counter();

-- RLS policies for scans
ALTER TABLE public.scans ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own scans" ON public.scans
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create own scans" ON public.scans
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own scans" ON public.scans
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own scans" ON public.scans
    FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all scans" ON public.scans
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.users u 
            WHERE u.id = auth.uid() AND u.role = 'admin'
        )
    );

-- ============================================================================
-- VULNERABILITIES TABLE
-- Individual vulnerability findings linked to scan records.
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.vulnerabilities (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    scan_id         UUID NOT NULL REFERENCES public.scans(id) ON DELETE CASCADE,
    user_id         UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    title           TEXT NOT NULL,
    severity        TEXT NOT NULL CHECK (severity IN ('critical', 'high', 'medium', 'low', 'info')),
    vulnerability_type TEXT NOT NULL,
    cwe_id          TEXT,
    cwe_name        TEXT,
    line_number     INTEGER NOT NULL DEFAULT 0,
    column_number   INTEGER NOT NULL DEFAULT 0,
    description     TEXT NOT NULL,
    recommendation  TEXT NOT NULL,
    fixed_code      TEXT,
    source_snippet  TEXT,
    confidence_score DECIMAL(3,2) NOT NULL DEFAULT 0.85,
    ai_explanation  TEXT,
    ai_recommendation TEXT,
    status          TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'fixed', 'false_positive', 'accepted_risk')),
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    resolved_at     TIMESTAMPTZ
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_vulns_scan_id ON public.vulnerabilities(scan_id);
CREATE INDEX IF NOT EXISTS idx_vulns_user_id ON public.vulnerabilities(user_id);
CREATE INDEX IF NOT EXISTS idx_vulns_severity ON public.vulnerabilities(severity);
CREATE INDEX IF NOT EXISTS idx_vulns_status ON public.vulnerabilities(status);
CREATE INDEX IF NOT EXISTS idx_vulns_type ON public.vulnerabilities(vulnerability_type);

-- RLS policies
ALTER TABLE public.vulnerabilities ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own vulnerabilities" ON public.vulnerabilities
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update own vulnerabilities" ON public.vulnerabilities
    FOR UPDATE USING (auth.uid() = user_id);

-- ============================================================================
-- AUDIT LOGS TABLE
-- Comprehensive audit trail for compliance and security monitoring.
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.audit_logs (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id         UUID REFERENCES public.users(id) ON DELETE SET NULL,
    action          TEXT NOT NULL,
    resource_type   TEXT NOT NULL,
    resource_id     UUID,
    ip_address      INET,
    user_agent      TEXT,
    details         JSONB DEFAULT '{}'::jsonb,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_audit_user_id ON public.audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_action ON public.audit_logs(action);
CREATE INDEX IF NOT EXISTS idx_audit_created_at ON public.audit_logs(created_at DESC);

-- RLS policies
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own audit logs" ON public.audit_logs
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all audit logs" ON public.audit_logs
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.users u 
            WHERE u.id = auth.uid() AND u.role = 'admin'
        )
    );

-- ============================================================================
-- REPORTS TABLE
-- Generated security reports stored for download.
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.reports (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id         UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    scan_id         UUID NOT NULL REFERENCES public.scans(id) ON DELETE CASCADE,
    report_type     TEXT NOT NULL CHECK (report_type IN ('pdf', 'json', 'sarif', 'html')),
    storage_path    TEXT NOT NULL, -- Supabase Storage path
    file_size_bytes INTEGER NOT NULL DEFAULT 0,
    generated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    expires_at      TIMESTAMPTZ,
    is_deleted      BOOLEAN NOT NULL DEFAULT FALSE
);

-- RLS
ALTER TABLE public.reports ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own reports" ON public.reports
    FOR SELECT USING (auth.uid() = user_id);

-- ============================================================================
-- REALTIME SETUP
-- Enable Supabase Realtime for live scan progress updates.
-- ============================================================================

-- Add tables to realtime publication
BEGIN;
    -- Remove the tables if they already exist to avoid errors
    DROP PUBLICATION IF EXISTS supabase_realtime;
    CREATE PUBLICATION supabase_realtime;
    
    -- Add scan progress table for realtime updates
    ALTER TABLE public.scans REPLICA IDENTITY FULL;
    ALTER TABLE public.vulnerabilities REPLICA IDENTITY FULL;
    
    -- Add tables to the publication
    ALTER PUBLICATION supabase_realtime ADD TABLE public.scans;
    ALTER PUBLICATION supabase_realtime ADD TABLE public.vulnerabilities;
COMMIT;

-- ============================================================================
-- FUNCTIONS & TRIGGERS
-- ============================================================================

-- Function to broadcast scan progress via realtime
CREATE OR REPLACE FUNCTION broadcast_scan_progress()
RETURNS TRIGGER AS $$
BEGIN
    PERFORM pg_notify(
        'scan_progress:' || NEW.id::text,
        json_build_object(
            'scan_id', NEW.id,
            'status', NEW.status,
            'progress', CASE 
                WHEN NEW.status = 'queued' THEN 0
                WHEN NEW.status = 'parsing' THEN 20
                WHEN NEW.status = 'analyzing' THEN 50
                WHEN NEW.status = 'ai_processing' THEN 80
                WHEN NEW.status = 'completed' THEN 100
                WHEN NEW.status = 'failed' THEN -1
                ELSE 0
            END,
            'security_score', NEW.security_score,
            'timestamp', NOW()
        )::text
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER scan_progress_broadcast
    AFTER UPDATE OF status ON public.scans
    FOR EACH ROW
    EXECUTE FUNCTION broadcast_scan_progress();

-- Function to clean up old soft-deleted scans
CREATE OR REPLACE FUNCTION cleanup_deleted_scans()
RETURNS void AS $$
BEGIN
    UPDATE public.scans 
    SET status = 'cancelled'
    WHERE is_deleted = TRUE 
      AND status NOT IN ('completed', 'failed', 'cancelled')
      AND created_at < NOW() - INTERVAL '24 hours';
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- VIEWS
-- ============================================================================

-- Security dashboard view
CREATE OR REPLACE VIEW public.security_dashboard AS
SELECT 
    u.id AS user_id,
    u.email,
    COUNT(DISTINCT s.id) AS total_scans,
    COUNT(DISTINCT v.id) AS total_vulnerabilities,
    COUNT(DISTINCT CASE WHEN v.severity = 'critical' THEN v.id END) AS critical_count,
    COUNT(DISTINCT CASE WHEN v.severity = 'high' THEN v.id END) AS high_count,
    AVG(s.security_score) AS avg_security_score,
    MAX(s.created_at) AS last_scan_at
FROM public.users u
LEFT JOIN public.scans s ON u.id = s.user_id AND s.status = 'completed'
LEFT JOIN public.vulnerabilities v ON s.id = v.scan_id AND v.status = 'open'
GROUP BY u.id, u.email;

-- Recent activity view
CREATE OR REPLACE VIEW public.recent_activity AS
SELECT 
    s.id AS scan_id,
    s.user_id,
    s.filename,
    s.language,
    s.security_score,
    s.status,
    s.created_at,
    COUNT(v.id) AS vulnerability_count
FROM public.scans s
LEFT JOIN public.vulnerabilities v ON s.id = v.scan_id
WHERE s.is_deleted = FALSE
GROUP BY s.id
ORDER BY s.created_at DESC;

-- ============================================================================
-- SEED DATA (Optional)
-- ============================================================================

-- Insert default admin user (update UUID after creating via Supabase Auth)
-- INSERT INTO public.users (id, email, full_name, role, scan_quota)
-- VALUES ('00000000-0000-0000-0000-000000000000', 'admin@verstack.lk', 'System Admin', 'admin', 999999);
