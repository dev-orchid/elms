-- Remove super_admin role, add partner role
-- Update any existing super_admin users to admin first
UPDATE profiles SET role = 'admin' WHERE role = 'super_admin';

-- Replace the CHECK constraint
ALTER TABLE profiles DROP CONSTRAINT IF EXISTS profiles_role_check;
ALTER TABLE profiles ADD CONSTRAINT profiles_role_check
CHECK (role IN ('learner', 'instructor', 'admin', 'partner'));
