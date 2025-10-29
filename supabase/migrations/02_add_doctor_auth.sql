-- ============================================
-- ADD AUTHENTICATION TO DOCTORS
-- ============================================

-- Step 1: Add user_id column to doctors table
ALTER TABLE doctors 
ADD COLUMN user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;

-- Step 2: Create unique index
CREATE UNIQUE INDEX idx_doctors_user_id ON doctors(user_id);

-- ============================================
-- MANUAL STEPS (Do this in Supabase Dashboard):
-- ============================================
-- 1. Go to Authentication > Users
-- 2. Create new user:
--    Email: ahmad.santoso@hospital.com
--    Password: doctor123
--    
-- 3. After creating user, copy the User ID (UUID)
-- 4. Run this query to link user to doctor:
--
--    UPDATE doctors 
--    SET user_id = 'PASTE_USER_ID_HERE'
--    WHERE email = 'ahmad.santoso@hospital.com';
--
-- 5. Repeat for other doctors if needed

-- ============================================
-- ALTERNATIVE: Auto-create users via function
-- ============================================
-- Note: This requires manual intervention as Supabase
-- doesn't allow creating auth.users via SQL for security reasons
