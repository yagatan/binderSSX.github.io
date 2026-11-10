CREATE TABLE licenses (device TEXT PRIMARY KEY, license TEXT NOT NULL UNIQUE);
--> statement-breakpoint
CREATE TABLE topics (id INTEGER PRIMARY KEY, title TEXT NOT NULL, nick TEXT NOT NULL, body TEXT NOT NULL, created INTEGER NOT NULL);
--> statement-breakpoint
CREATE TABLE replies (id INTEGER PRIMARY KEY, topic INTEGER NOT NULL REFERENCES topics(id), nick TEXT NOT NULL, body TEXT NOT NULL, created INTEGER NOT NULL);
--> statement-breakpoint
CREATE INDEX replies_topic ON replies(topic,id);
--> statement-breakpoint
CREATE TABLE cooldown (actor TEXT PRIMARY KEY, until_ms INTEGER NOT NULL);
