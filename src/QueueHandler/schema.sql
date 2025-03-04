CREATE TABLE IF NOT EXISTS pending
(
    id        TEXT PRIMARY KEY,
    timestamp INTEGER NOT NULL,
    data      TEXT    NOT NULL
);

CREATE TABLE IF NOT EXISTS errors
(
    id        TEXT PRIMARY KEY,
    timestamp INTEGER NOT NULL,
    data      TEXT    NOT NULL,
    reason    TEXT    NOT NULL
);

CREATE TABLE IF NOT EXISTS system
(
    name        TEXT PRIMARY KEY,
    data_number INTEGER NULL,
    data_text   TEXT    NULL
);

CREATE INDEX pending_timestamp_index ON pending (timestamp);
CREATE INDEX errors_timestamp_index ON errors (timestamp);

INSERT INTO system (name, data_number, data_text)
VALUES ('last_scheduled_rowid', 0, null);
INSERT INTO system (name, data_number, data_text)
VALUES ('last_processed_rowid', 0, null);
