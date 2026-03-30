CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Table to track file uploads (ideal for bulk upload tracking)
CREATE TABLE IF NOT EXISTS play_log_uploads (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    original_file_name text NOT NULL,
    status text NOT NULL DEFAULT 'Pending', -- Pending, Success, Failed
    error_message text,
    uploaded_at TIMESTAMPTZ DEFAULT NOW()
);

-- Main table to store parsed XML play items
CREATE TABLE IF NOT EXISTS play_log_details (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    machine_id text DEFAULT '',
    source_file_name text NOT NULL,
    media_name text NOT NULL,
    play_result text NOT NULL,
    start_time TIMESTAMPTZ,
    end_time TIMESTAMPTZ,
    duration_text text,
    uploaded_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for lightning-fast querying and filtering
CREATE INDEX IF NOT EXISTS idx_play_log_details_media_name ON play_log_details(media_name);
CREATE INDEX IF NOT EXISTS idx_play_log_details_start_time ON play_log_details(start_time);
CREATE INDEX IF NOT EXISTS idx_play_log_details_play_result ON play_log_details(play_result);

-- Enable RLS (Row Level Security) if you plan restricting API keys later, 
-- but for now allow public access since we will protect access from Next.js server side.
ALTER TABLE play_log_uploads ENABLE ROW LEVEL SECURITY;
ALTER TABLE play_log_details ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all access" ON play_log_uploads FOR ALL USING (true);
CREATE POLICY "Allow all access" ON play_log_details FOR ALL USING (true);
