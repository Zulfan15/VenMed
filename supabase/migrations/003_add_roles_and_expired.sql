-- ============================================
-- MIGRATION: Add Roles and Expired Date
-- ============================================

-- 1. Add role column to doctors table
-- Roles: 'admin', 'doctor', 'operator'
ALTER TABLE doctors 
ADD COLUMN IF NOT EXISTS role VARCHAR(20) DEFAULT 'doctor' 
CHECK (role IN ('admin', 'doctor', 'operator'));

-- 2. Add expired_at column to medicines table
ALTER TABLE medicines 
ADD COLUMN IF NOT EXISTS expired_at DATE;

-- 3. Add low_stock_alert column to medicines (for stock alerts)
ALTER TABLE medicines 
ADD COLUMN IF NOT EXISTS low_stock_alert BOOLEAN DEFAULT FALSE;

-- 4. Create index for expired medicines
CREATE INDEX IF NOT EXISTS idx_medicines_expired ON medicines(expired_at);
CREATE INDEX IF NOT EXISTS idx_doctors_role ON doctors(role);

-- 5. Update RLS policies for admin access
-- Allow authenticated users to read doctors (needed for login)
DROP POLICY IF EXISTS doctors_select_own ON doctors;
DROP POLICY IF EXISTS doctors_select_all ON doctors;
CREATE POLICY doctors_select_by_email ON doctors
    FOR SELECT
    USING (true);  -- Allow all selects for login to work

-- Admin can modify all doctors
DROP POLICY IF EXISTS doctors_update_own ON doctors;
CREATE POLICY doctors_update_all ON doctors
    FOR UPDATE
    USING (
        auth.role() = 'service_role'
        OR auth.uid()::TEXT = id::TEXT
        OR EXISTS (
            SELECT 1 FROM doctors d 
            WHERE d.user_id = auth.uid() 
            AND d.role = 'admin'
        )
    );

-- Admin can insert doctors
DROP POLICY IF EXISTS doctors_insert_own ON doctors;
CREATE POLICY doctors_insert_all ON doctors
    FOR INSERT
    WITH CHECK (
        auth.role() = 'service_role'
        OR EXISTS (
            SELECT 1 FROM doctors d 
            WHERE d.user_id = auth.uid() 
            AND d.role = 'admin'
        )
    );

-- Admin can delete doctors
CREATE POLICY doctors_delete_admin ON doctors
    FOR DELETE
    USING (
        auth.role() = 'service_role'
        OR EXISTS (
            SELECT 1 FROM doctors d 
            WHERE d.user_id = auth.uid() 
            AND d.role = 'admin'
        )
    );

-- 6. Update medicines policies for admin/operator
DROP POLICY IF EXISTS medicines_select_active ON medicines;
DROP POLICY IF EXISTS medicines_modify_service ON medicines;

CREATE POLICY medicines_select_all ON medicines
    FOR SELECT
    USING (
        is_active = TRUE 
        OR auth.role() = 'service_role'
        OR EXISTS (
            SELECT 1 FROM doctors d 
            WHERE d.user_id = auth.uid() 
            AND d.role IN ('admin', 'operator')
        )
    );

CREATE POLICY medicines_modify_admin ON medicines
    FOR ALL
    USING (
        auth.role() = 'service_role'
        OR EXISTS (
            SELECT 1 FROM doctors d 
            WHERE d.user_id = auth.uid() 
            AND d.role IN ('admin', 'operator')
        )
    );

-- 7. Create view for low stock medicines
CREATE OR REPLACE VIEW low_stock_medicines AS
SELECT 
    id,
    name,
    generic_name,
    strength,
    stock_quantity,
    min_stock_level,
    expired_at,
    CASE 
        WHEN expired_at IS NOT NULL AND expired_at <= CURRENT_DATE THEN 'expired'
        WHEN expired_at IS NOT NULL AND expired_at <= CURRENT_DATE + INTERVAL '30 days' THEN 'expiring_soon'
        WHEN stock_quantity <= min_stock_level THEN 'low_stock'
        ELSE 'ok'
    END as status
FROM medicines
WHERE is_active = TRUE
AND (
    stock_quantity <= min_stock_level 
    OR (expired_at IS NOT NULL AND expired_at <= CURRENT_DATE + INTERVAL '30 days')
);

-- 8. Create function to check medicine validity before dispense
CREATE OR REPLACE FUNCTION check_medicine_validity(medicine_uuid UUID)
RETURNS TABLE(is_valid BOOLEAN, message TEXT) AS $$
DECLARE
    med RECORD;
BEGIN
    SELECT * INTO med FROM medicines WHERE id = medicine_uuid;
    
    IF NOT FOUND THEN
        RETURN QUERY SELECT FALSE, 'Obat tidak ditemukan';
        RETURN;
    END IF;
    
    IF med.is_active = FALSE THEN
        RETURN QUERY SELECT FALSE, 'Obat sudah tidak aktif';
        RETURN;
    END IF;
    
    IF med.expired_at IS NOT NULL AND med.expired_at <= CURRENT_DATE THEN
        RETURN QUERY SELECT FALSE, 'Obat sudah kadaluarsa';
        RETURN;
    END IF;
    
    IF med.stock_quantity <= 0 THEN
        RETURN QUERY SELECT FALSE, 'Stok obat habis';
        RETURN;
    END IF;
    
    RETURN QUERY SELECT TRUE, 'OK';
END;
$$ LANGUAGE plpgsql;

-- 9. Update sample data - set one doctor as admin
UPDATE doctors SET role = 'admin' WHERE email = 'ahmad.santoso@clinic.com';

-- 10. Add sample expired_at dates to medicines
UPDATE medicines SET expired_at = CURRENT_DATE + INTERVAL '6 months' WHERE name = 'Paracetamol';
UPDATE medicines SET expired_at = CURRENT_DATE + INTERVAL '3 months' WHERE name = 'Amoxicillin';
UPDATE medicines SET expired_at = CURRENT_DATE + INTERVAL '12 months' WHERE name = 'Ibuprofen';
UPDATE medicines SET expired_at = CURRENT_DATE + INTERVAL '9 months' WHERE name = 'Cetirizine';
UPDATE medicines SET expired_at = CURRENT_DATE + INTERVAL '4 months' WHERE name = 'Omeprazole';
UPDATE medicines SET expired_at = CURRENT_DATE + INTERVAL '8 months' WHERE name = 'Metformin';
UPDATE medicines SET expired_at = CURRENT_DATE + INTERVAL '18 months' WHERE name = 'Vitamin C';

-- ============================================
-- COMPLETION MESSAGE
-- ============================================
DO $$
BEGIN
    RAISE NOTICE '✅ Migration 003 completed!';
    RAISE NOTICE '📋 Added: role column to doctors, expired_at to medicines';
    RAISE NOTICE '🔒 Updated RLS policies for admin/operator access';
    RAISE NOTICE '📊 Created low_stock_medicines view';
END $$;
