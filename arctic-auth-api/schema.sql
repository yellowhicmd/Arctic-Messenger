
CREATE TABLE IF NOT EXISTS accounts (
    arctic_id TEXT PRIMARY KEY,
    nickname TEXT NOT NULL,
    password_salt TEXT NOT NULL,
    password_hash TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending'
        CHECK (status IN ('pending', 'active', 'suspended')),
    setup_token_hash TEXT,
    created_at INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS sessions (
    token_hash TEXT PRIMARY KEY,
    arctic_id TEXT NOT NULL REFERENCES accounts(arctic_id)
        ON DELETE CASCADE,
    expires_at INTEGER NOT NULL,
    created_at INTEGER NOT NULL
);

CREATE INDEX IF NOT EXISTS sessions_account_idx
    ON sessions(arctic_id);

CREATE INDEX IF NOT EXISTS sessions_expiry_idx
    ON sessions(expires_at);
