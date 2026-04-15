-- Developer dashboard — GitHub-auth'd per-app env var management.
--
-- `app_owners` is populated from manifest.owners[] during /v1/sync. The
-- dashboard cross-checks (github_login) at read/write time so only listed
-- owners can manage a given app's env vars.
--
-- `app_env_vars` stores AES-256-GCM encrypted values scoped to (app_id, name).
-- Values are decrypted only inside handleAppProxy at request time and injected
-- into the single targeted app handler via an internal header; they never
-- land in the Worker's global env binding.
--
-- `dev_sessions` backs HttpOnly cookie sessions issued after GitHub OAuth.

CREATE TABLE IF NOT EXISTS app_owners (
  app_id       TEXT NOT NULL,
  github_login TEXT NOT NULL,
  added_at     INTEGER NOT NULL,
  PRIMARY KEY (app_id, github_login),
  FOREIGN KEY (app_id) REFERENCES apps(id) ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS idx_app_owners_login ON app_owners(github_login);

CREATE TABLE IF NOT EXISTS dev_sessions (
  id             TEXT PRIMARY KEY,
  github_user_id INTEGER NOT NULL,
  github_login   TEXT NOT NULL,
  created_at     INTEGER NOT NULL,
  expires_at     INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_dev_sessions_user ON dev_sessions(github_user_id);
CREATE INDEX IF NOT EXISTS idx_dev_sessions_expires ON dev_sessions(expires_at);

CREATE TABLE IF NOT EXISTS app_env_vars (
  app_id          TEXT NOT NULL,
  name            TEXT NOT NULL,
  value_encrypted TEXT NOT NULL,
  created_at      INTEGER NOT NULL,
  updated_at      INTEGER NOT NULL,
  updated_by      TEXT NOT NULL,
  PRIMARY KEY (app_id, name),
  FOREIGN KEY (app_id) REFERENCES apps(id) ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS idx_app_env_vars_app ON app_env_vars(app_id);
