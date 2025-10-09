-- Enable Row Level Security on all tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE running_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE bookmarks ENABLE ROW LEVEL SECURITY;

-- Users table policies
-- Users can read their own profile and other users' basic info
CREATE POLICY "Users can view all profiles" ON users
    FOR SELECT USING (true);

-- Users can update their own profile
CREATE POLICY "Users can update own profile" ON users
    FOR UPDATE USING (auth.uid() = id);

-- Users can insert their own profile (triggered by auth signup)
CREATE POLICY "Users can insert own profile" ON users
    FOR INSERT WITH CHECK (auth.uid() = id);

-- Courses table policies
-- Anyone can view verified courses
CREATE POLICY "Anyone can view verified courses" ON courses
    FOR SELECT USING (is_verified = true);

-- Authenticated users can view all courses (including unverified)
CREATE POLICY "Authenticated users can view all courses" ON courses
    FOR SELECT USING (auth.role() = 'authenticated');

-- Users can create courses
CREATE POLICY "Authenticated users can create courses" ON courses
    FOR INSERT WITH CHECK (auth.uid() = created_by);

-- Users can update their own courses
CREATE POLICY "Users can update own courses" ON courses
    FOR UPDATE USING (auth.uid() = created_by);

-- Users can delete their own courses
CREATE POLICY "Users can delete own courses" ON courses
    FOR DELETE USING (auth.uid() = created_by);

-- Running logs table policies
-- Users can view their own running logs
CREATE POLICY "Users can view own running logs" ON running_logs
    FOR SELECT USING (auth.uid() = user_id);

-- Users can create their own running logs
CREATE POLICY "Users can create own running logs" ON running_logs
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Users can update their own running logs
CREATE POLICY "Users can update own running logs" ON running_logs
    FOR UPDATE USING (auth.uid() = user_id);

-- Users can delete their own running logs
CREATE POLICY "Users can delete own running logs" ON running_logs
    FOR DELETE USING (auth.uid() = user_id);

-- Reviews table policies
-- Anyone can view reviews
CREATE POLICY "Anyone can view reviews" ON reviews
    FOR SELECT USING (true);

-- Authenticated users can create reviews
CREATE POLICY "Authenticated users can create reviews" ON reviews
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Users can update their own reviews
CREATE POLICY "Users can update own reviews" ON reviews
    FOR UPDATE USING (auth.uid() = user_id);

-- Users can delete their own reviews
CREATE POLICY "Users can delete own reviews" ON reviews
    FOR DELETE USING (auth.uid() = user_id);

-- Bookmarks table policies
-- Users can view their own bookmarks
CREATE POLICY "Users can view own bookmarks" ON bookmarks
    FOR SELECT USING (auth.uid() = user_id);

-- Users can create their own bookmarks
CREATE POLICY "Users can create own bookmarks" ON bookmarks
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Users can delete their own bookmarks
CREATE POLICY "Users can delete own bookmarks" ON bookmarks
    FOR DELETE USING (auth.uid() = user_id);

-- Create a function to handle new user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.users (id, name, profile_image)
    VALUES (
        NEW.id,
        COALESCE(NEW.raw_user_meta_data->>'name', NEW.email),
        NEW.raw_user_meta_data->>'avatar_url'
    );
    RETURN NEW;
END;
$$ language 'plpgsql' security definer;

-- Create trigger for new user signup
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
