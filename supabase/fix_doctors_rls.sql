-- Fix RLS Policy for Doctors Table
-- This allows anon key to read doctors for the prescription form

-- Drop existing restrictive policy
DROP POLICY IF EXISTS doctors_select_own ON doctors;

-- Create new policy that allows reading all doctors (for form)
CREATE POLICY doctors_select_all ON doctors
    FOR SELECT
    USING (true); -- Allow all to read

-- Keep insert/update restricted to authenticated users or service role
CREATE POLICY doctors_insert_service ON doctors
    FOR INSERT
    WITH CHECK (auth.role() = 'service_role' OR auth.role() = 'authenticated');

CREATE POLICY doctors_update_service ON doctors
    FOR UPDATE
    USING (auth.role() = 'service_role' OR auth.role() = 'authenticated');
