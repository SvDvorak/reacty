--------------------------------------------------------------------------------
-- Up
--------------------------------------------------------------------------------

CREATE TABLE Score (
  emoji TEXT,
  userId TEXT,
  username TEXT NOT NULL,
  points INTEGER NOT NULL,
  PRIMARY KEY(emoji, userId)
);

CREATE TABLE Setting (
  setting TEXT PRIMARY KEY,
  value TEXT
);

--------------------------------------------------------------------------------
-- Down
--------------------------------------------------------------------------------

DROP TABLE Score;
DROP TABLE Setting;