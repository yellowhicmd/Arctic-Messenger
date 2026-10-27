CREATE TABLE IF NOT EXISTS messages (
    id TEXT PRIMARY KEY,
    sender_id TEXT NOT NULL
        REFERENCES accounts(arctic_id) ON DELETE CASCADE,
    recipient_id TEXT NOT NULL
        REFERENCES accounts(arctic_id) ON DELETE CASCADE,
    client_message_id TEXT NOT NULL,
    ciphertext TEXT NOT NULL,
    created_at INTEGER NOT NULL,

    UNIQUE(sender_id, client_message_id),
    CHECK(sender_id <> recipient_id),
    CHECK(length(ciphertext) BETWEEN 1 AND 16000)
);

CREATE INDEX IF NOT EXISTS messages_recipient_time_idx
    ON messages(recipient_id, created_at, id);

CREATE INDEX IF NOT EXISTS messages_sender_time_idx
    ON messages(sender_id, created_at, id);
