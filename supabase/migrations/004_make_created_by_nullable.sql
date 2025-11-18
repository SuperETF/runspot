-- Make created_by nullable for admin uploads
ALTER TABLE courses ALTER COLUMN created_by DROP NOT NULL;

-- Update RLS policy to allow null created_by for admin operations
DROP POLICY IF EXISTS "Authenticated users can create courses" ON courses;

-- New policy that allows null created_by (for admin/system uploads)
CREATE POLICY "Users and admins can create courses" ON courses
    FOR INSERT WITH CHECK (
        auth.uid() = created_by OR created_by IS NULL
    );
