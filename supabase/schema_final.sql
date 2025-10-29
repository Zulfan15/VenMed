-- ============================================
-- SMART MEDICAL VENDING MACHINE DATABASE SCHEMA
-- Tablet-Only Medicine System
-- ============================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- TABLE: doctors
-- ============================================
CREATE TABLE IF NOT EXISTS doctors (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    license_number VARCHAR(100) UNIQUE NOT NULL,
    email VARCHAR(255) UNIQUE,
    phone VARCHAR(20),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ============================================
-- TABLE: medicines (TABLET ONLY)
-- ============================================
CREATE TABLE IF NOT EXISTS medicines (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    generic_name VARCHAR(255),
    form VARCHAR(50) NOT NULL DEFAULT 'tablet' CHECK (form = 'tablet'), -- Only tablets allowed
    strength VARCHAR(50) NOT NULL, -- e.g., "500mg", "10mg"
    manufacturer VARCHAR(255),
    stock_quantity INTEGER NOT NULL DEFAULT 0 CHECK (stock_quantity >= 0),
    min_stock_level INTEGER DEFAULT 10,
    price_per_unit DECIMAL(10, 2),
    description TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create index for medicine search
CREATE INDEX idx_medicines_name ON medicines(name);
CREATE INDEX idx_medicines_active ON medicines(is_active);

-- ============================================
-- TABLE: prescriptions
-- ============================================
CREATE TABLE IF NOT EXISTS prescriptions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    doctor_id UUID NOT NULL REFERENCES doctors(id) ON DELETE CASCADE,
    patient_name VARCHAR(255), -- Optional, can be anonymous
    patient_age INTEGER,
    patient_gender VARCHAR(10),
    diagnosis TEXT,
    notes TEXT,
    status VARCHAR(20) NOT NULL DEFAULT 'issued' CHECK (status IN ('issued', 'dispensed', 'expired', 'cancelled')),
    issued_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    expires_at TIMESTAMP WITH TIME ZONE DEFAULT (CURRENT_TIMESTAMP + INTERVAL '30 days'),
    dispensed_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes
CREATE INDEX idx_prescriptions_doctor ON prescriptions(doctor_id);
CREATE INDEX idx_prescriptions_status ON prescriptions(status);
CREATE INDEX idx_prescriptions_issued_at ON prescriptions(issued_at);

-- ============================================
-- TABLE: prescription_items
-- ============================================
CREATE TABLE IF NOT EXISTS prescription_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    prescription_id UUID NOT NULL REFERENCES prescriptions(id) ON DELETE CASCADE,
    medicine_id UUID NOT NULL REFERENCES medicines(id) ON DELETE RESTRICT,
    dosage VARCHAR(100) NOT NULL, -- e.g., "1 tablet", "500mg"
    frequency VARCHAR(100) NOT NULL, -- e.g., "3 times a day", "setiap 8 jam"
    duration_days INTEGER NOT NULL CHECK (duration_days > 0),
    total_quantity INTEGER NOT NULL CHECK (total_quantity > 0), -- Auto calculated
    instructions TEXT, -- e.g., "Setelah makan", "Sebelum tidur"
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes
CREATE INDEX idx_prescription_items_prescription ON prescription_items(prescription_id);
CREATE INDEX idx_prescription_items_medicine ON prescription_items(medicine_id);

-- ============================================
-- TABLE: qr_tokens (One-time use QR codes)
-- ============================================
CREATE TABLE IF NOT EXISTS qr_tokens (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    prescription_id UUID NOT NULL REFERENCES prescriptions(id) ON DELETE CASCADE,
    token VARCHAR(255) UNIQUE NOT NULL, -- The actual QR code value
    is_valid BOOLEAN DEFAULT TRUE,
    used_at TIMESTAMP WITH TIME ZONE,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes
CREATE INDEX idx_qr_tokens_token ON qr_tokens(token);
CREATE INDEX idx_qr_tokens_prescription ON qr_tokens(prescription_id);
CREATE INDEX idx_qr_tokens_valid ON qr_tokens(is_valid);

-- ============================================
-- TABLE: vending_transactions (Optional - for tracking)
-- ============================================
CREATE TABLE IF NOT EXISTS vending_transactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    prescription_id UUID NOT NULL REFERENCES prescriptions(id) ON DELETE CASCADE,
    qr_token_id UUID NOT NULL REFERENCES qr_tokens(id) ON DELETE CASCADE,
    status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'failed')),
    error_message TEXT,
    dispensed_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes
CREATE INDEX idx_vending_transactions_prescription ON vending_transactions(prescription_id);
CREATE INDEX idx_vending_transactions_status ON vending_transactions(status);

-- ============================================
-- FUNCTIONS & TRIGGERS
-- ============================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply triggers to tables with updated_at
CREATE TRIGGER update_doctors_updated_at
    BEFORE UPDATE ON doctors
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_medicines_updated_at
    BEFORE UPDATE ON medicines
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_prescriptions_updated_at
    BEFORE UPDATE ON prescriptions
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Function to calculate total quantity for prescription items
CREATE OR REPLACE FUNCTION calculate_total_quantity()
RETURNS TRIGGER AS $$
BEGIN
    -- Extract numeric value from dosage (e.g., "2 tablet" -> 2)
    -- This is a simplified version, adjust based on your dosage format
    NEW.total_quantity := COALESCE(
        (REGEXP_MATCH(NEW.frequency, '(\d+)'))[1]::INTEGER * NEW.duration_days,
        NEW.duration_days
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER calculate_prescription_item_quantity
    BEFORE INSERT OR UPDATE ON prescription_items
    FOR EACH ROW
    EXECUTE FUNCTION calculate_total_quantity();

-- ============================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================

-- Enable RLS on all tables
ALTER TABLE doctors ENABLE ROW LEVEL SECURITY;
ALTER TABLE medicines ENABLE ROW LEVEL SECURITY;
ALTER TABLE prescriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE prescription_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE qr_tokens ENABLE ROW LEVEL SECURITY;
ALTER TABLE vending_transactions ENABLE ROW LEVEL SECURITY;

-- Policy for doctors: Doctors can only see their own data
CREATE POLICY doctors_select_own ON doctors
    FOR SELECT
    USING (auth.uid()::TEXT = id::TEXT OR auth.role() = 'service_role');

CREATE POLICY doctors_insert_own ON doctors
    FOR INSERT
    WITH CHECK (auth.uid()::TEXT = id::TEXT OR auth.role() = 'service_role');

CREATE POLICY doctors_update_own ON doctors
    FOR UPDATE
    USING (auth.uid()::TEXT = id::TEXT OR auth.role() = 'service_role');

-- Policy for medicines: Public read for active medicines, service role can modify
CREATE POLICY medicines_select_active ON medicines
    FOR SELECT
    USING (is_active = TRUE OR auth.role() = 'service_role');

CREATE POLICY medicines_modify_service ON medicines
    FOR ALL
    USING (auth.role() = 'service_role');

-- Policy for prescriptions: Doctors can see their own prescriptions
CREATE POLICY prescriptions_select_own ON prescriptions
    FOR SELECT
    USING (auth.uid()::TEXT = doctor_id::TEXT OR auth.role() = 'service_role');

CREATE POLICY prescriptions_insert_own ON prescriptions
    FOR INSERT
    WITH CHECK (auth.uid()::TEXT = doctor_id::TEXT OR auth.role() = 'service_role');

CREATE POLICY prescriptions_update_own ON prescriptions
    FOR UPDATE
    USING (auth.uid()::TEXT = doctor_id::TEXT OR auth.role() = 'service_role');

-- Policy for prescription_items: Accessible through prescription
CREATE POLICY prescription_items_access ON prescription_items
    FOR ALL
    USING (auth.role() = 'service_role' OR 
           EXISTS (SELECT 1 FROM prescriptions 
                   WHERE prescriptions.id = prescription_items.prescription_id 
                   AND prescriptions.doctor_id::TEXT = auth.uid()::TEXT));

-- Policy for qr_tokens: Service role only for security
CREATE POLICY qr_tokens_service_only ON qr_tokens
    FOR ALL
    USING (auth.role() = 'service_role');

-- Policy for vending_transactions: Service role only
CREATE POLICY vending_transactions_service_only ON vending_transactions
    FOR ALL
    USING (auth.role() = 'service_role');

-- ============================================
-- SAMPLE DATA (for testing)
-- ============================================

-- Insert sample doctor
INSERT INTO doctors (id, name, license_number, email, phone) VALUES
(uuid_generate_v4(), 'Dr. Ahmad Santoso', 'DOC-2024-001', 'ahmad.santoso@clinic.com', '+62812345678'),
(uuid_generate_v4(), 'Dr. Siti Nurhaliza', 'DOC-2024-002', 'siti.nurhaliza@hospital.com', '+62887654321');

-- Insert sample medicines (tablets only)
INSERT INTO medicines (name, generic_name, form, strength, manufacturer, stock_quantity, price_per_unit, description) VALUES
('Paracetamol', 'Acetaminophen', 'tablet', '500mg', 'PT. Kimia Farma', 1000, 500.00, 'Pereda nyeri dan penurun demam'),
('Amoxicillin', 'Amoxicillin', 'tablet', '500mg', 'PT. Kalbe Farma', 500, 2500.00, 'Antibiotik untuk infeksi bakteri'),
('Ibuprofen', 'Ibuprofen', 'tablet', '400mg', 'PT. Dexa Medica', 800, 1500.00, 'Anti-inflamasi dan pereda nyeri'),
('Cetirizine', 'Cetirizine HCl', 'tablet', '10mg', 'PT. Tempo Scan', 600, 1000.00, 'Antihistamin untuk alergi'),
('Omeprazole', 'Omeprazole', 'tablet', '20mg', 'PT. Sanbe Farma', 400, 3000.00, 'Penghambat asam lambung'),
('Metformin', 'Metformin HCl', 'tablet', '500mg', 'PT. Indofarma', 750, 1200.00, 'Obat diabetes tipe 2'),
('Vitamin C', 'Ascorbic Acid', 'tablet', '1000mg', 'PT. Kalbe Farma', 1200, 800.00, 'Suplemen vitamin C');

-- ============================================
-- VIEWS (for easier querying)
-- ============================================

-- View for prescription with doctor and patient info
CREATE OR REPLACE VIEW prescription_details AS
SELECT 
    p.id,
    p.patient_name,
    p.patient_age,
    p.diagnosis,
    p.status,
    p.issued_at,
    p.expires_at,
    d.name AS doctor_name,
    d.license_number AS doctor_license,
    COUNT(pi.id) AS total_items
FROM prescriptions p
JOIN doctors d ON p.doctor_id = d.id
LEFT JOIN prescription_items pi ON p.id = pi.prescription_id
GROUP BY p.id, d.name, d.license_number;

-- View for prescription items with medicine details
CREATE OR REPLACE VIEW prescription_items_detailed AS
SELECT 
    pi.id,
    pi.prescription_id,
    m.name AS medicine_name,
    m.generic_name,
    m.strength,
    pi.dosage,
    pi.frequency,
    pi.duration_days,
    pi.total_quantity,
    pi.instructions
FROM prescription_items pi
JOIN medicines m ON pi.medicine_id = m.id;

-- ============================================
-- COMPLETION MESSAGE
-- ============================================
DO $$
BEGIN
    RAISE NOTICE '✅ Smart Medical Vending Machine Database Schema Created Successfully!';
    RAISE NOTICE '📋 Tables: doctors, medicines, prescriptions, prescription_items, qr_tokens, vending_transactions';
    RAISE NOTICE '🔒 RLS enabled on all tables';
    RAISE NOTICE '💊 Only TABLET form medicines are allowed';
END $$;
