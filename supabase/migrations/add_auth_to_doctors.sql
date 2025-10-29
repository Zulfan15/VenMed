-- Add user_id column to doctors table to link with Supabase Auth
ALTER TABLE doctors 
ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;

-- Create unique index on user_id
CREATE UNIQUE INDEX IF NOT EXISTS idx_doctors_user_id ON doctors(user_id);

-- Update existing doctors with email to create auth users
-- Note: This should be done manually or via Supabase dashboard for existing doctors
