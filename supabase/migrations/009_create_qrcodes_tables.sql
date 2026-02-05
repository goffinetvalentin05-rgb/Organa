-- Migration: Create QR Codes and Registrations tables
-- Description: Tables for managing event QR codes and registrations for clubs

-- Table: qrcodes
-- Stores QR codes created by clubs for events
CREATE TABLE IF NOT EXISTS qrcodes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    event_type VARCHAR(50) NOT NULL DEFAULT 'other',
    event_date DATE,
    code VARCHAR(50) UNIQUE NOT NULL,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table: registrations
-- Stores registrations for QR code events
CREATE TABLE IF NOT EXISTS registrations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    qrcode_id UUID NOT NULL REFERENCES qrcodes(id) ON DELETE CASCADE,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    email VARCHAR(255) NOT NULL,
    phone VARCHAR(50),
    comment TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_qrcodes_user_id ON qrcodes(user_id);
CREATE INDEX IF NOT EXISTS idx_qrcodes_code ON qrcodes(code);
CREATE INDEX IF NOT EXISTS idx_registrations_qrcode_id ON registrations(qrcode_id);
CREATE INDEX IF NOT EXISTS idx_registrations_email ON registrations(email);

-- Enable RLS
ALTER TABLE qrcodes ENABLE ROW LEVEL SECURITY;
ALTER TABLE registrations ENABLE ROW LEVEL SECURITY;

-- RLS Policies for qrcodes
-- Users can only see their own QR codes
CREATE POLICY "Users can view own qrcodes"
    ON qrcodes FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can create own qrcodes"
    ON qrcodes FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own qrcodes"
    ON qrcodes FOR UPDATE
    USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own qrcodes"
    ON qrcodes FOR DELETE
    USING (auth.uid() = user_id);

-- RLS Policies for registrations
-- Users can view registrations for their own QR codes
CREATE POLICY "Users can view registrations for own qrcodes"
    ON registrations FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM qrcodes
            WHERE qrcodes.id = registrations.qrcode_id
            AND qrcodes.user_id = auth.uid()
        )
    );

-- Anyone can create a registration (public form)
CREATE POLICY "Anyone can create registrations"
    ON registrations FOR INSERT
    WITH CHECK (true);

-- Users can delete registrations for their own QR codes
CREATE POLICY "Users can delete registrations for own qrcodes"
    ON registrations FOR DELETE
    USING (
        EXISTS (
            SELECT 1 FROM qrcodes
            WHERE qrcodes.id = registrations.qrcode_id
            AND qrcodes.user_id = auth.uid()
        )
    );

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_qrcodes_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-update updated_at
DROP TRIGGER IF EXISTS trigger_qrcodes_updated_at ON qrcodes;
CREATE TRIGGER trigger_qrcodes_updated_at
    BEFORE UPDATE ON qrcodes
    FOR EACH ROW
    EXECUTE FUNCTION update_qrcodes_updated_at();
