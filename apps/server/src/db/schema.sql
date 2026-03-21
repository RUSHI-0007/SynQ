-- ============================================================
-- SYNQ: Consensus Merge Engine — Supabase SQL Schema
-- Run this in your Supabase SQL Editor
-- ============================================================

-- Enable UUID generation
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ─────────────────────────────────────────────────────────────
-- Table: merge_requests
-- One row = one proposed merge for a project
-- ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS merge_requests (
  id              UUID          PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id      TEXT          NOT NULL,
  author_id       TEXT          NOT NULL,       -- Clerk user ID of proposer
  commit_message  TEXT          NOT NULL DEFAULT 'Consensus merge 🚀',
  diff_payload    TEXT          NOT NULL,       -- Full file contents or unified diff
  files_changed   TEXT[]        NOT NULL DEFAULT '{}',
  status          TEXT          NOT NULL DEFAULT 'pending'
                    CHECK (status IN ('pending', 'accepted', 'merged', 'rejected', 'failed')),
  github_owner    TEXT,                         -- GitHub repo owner
  github_repo     TEXT,                         -- GitHub repo name
  merged_sha      TEXT,                         -- Commit SHA after successful push
  created_at      TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);

-- Auto-update updated_at on every row change
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER merge_requests_updated_at
  BEFORE UPDATE ON merge_requests
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ─────────────────────────────────────────────────────────────
-- Table: merge_votes
-- One row = one user's vote on a merge request
-- UNIQUE(request_id, user_id) lets users change their vote via upsert
-- ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS merge_votes (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  request_id  UUID        NOT NULL REFERENCES merge_requests(id) ON DELETE CASCADE,
  user_id     TEXT        NOT NULL,             -- Clerk user ID of voter
  decision    TEXT        NOT NULL
                CHECK (decision IN ('approve', 'reject')),
  voted_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT merge_votes_unique_voter UNIQUE (request_id, user_id)
);

-- ─────────────────────────────────────────────────────────────
-- Table: project_teammates
-- Used by the consensus check to know "how many members total"
-- ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS project_teammates (
  project_id  TEXT        NOT NULL,
  user_id     TEXT        NOT NULL,
  role        TEXT        NOT NULL DEFAULT 'member' CHECK (role IN ('owner', 'member')),
  joined_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  PRIMARY KEY (project_id, user_id)
);

-- ─────────────────────────────────────────────────────────────
-- Table: container_snapshots
-- Records every successful workspace backup to Supabase Storage
-- ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS container_snapshots (
  id            UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id    TEXT        NOT NULL,
  container_id  TEXT        NOT NULL,
  storage_path  TEXT        NOT NULL,           -- e.g. project_backups/{projectId}/{timestamp}.tar.gz
  size_bytes    BIGINT,
  reason        TEXT        NOT NULL DEFAULT 'idle_shutdown'
                  CHECK (reason IN ('idle_shutdown', 'manual', 'pre_merge')),
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for hot query paths
CREATE INDEX IF NOT EXISTS idx_merge_requests_project ON merge_requests(project_id);
CREATE INDEX IF NOT EXISTS idx_merge_requests_status  ON merge_requests(status);
CREATE INDEX IF NOT EXISTS idx_merge_votes_request    ON merge_votes(request_id);
CREATE INDEX IF NOT EXISTS idx_snapshots_project      ON container_snapshots(project_id);

-- ─────────────────────────────────────────────────────────────
-- Storage bucket (run once via Supabase Client or Dashboard)
-- ─────────────────────────────────────────────────────────────
-- INSERT INTO storage.buckets (id, name, public)
-- VALUES ('project_backups', 'project_backups', false)
-- ON CONFLICT (id) DO NOTHING;
