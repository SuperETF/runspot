-- Enable PostGIS extension for geographic data
CREATE EXTENSION IF NOT EXISTS postgis;

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create custom types
CREATE TYPE difficulty_level AS ENUM ('easy', 'medium', 'hard');
CREATE TYPE course_type AS ENUM ('park', 'hangang', 'urban', 'mountain', 'track');

-- Users table (extends auth.users)
CREATE TABLE users (
    id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    profile_image TEXT,
    total_distance DECIMAL(10,2) DEFAULT 0,
    total_runs INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Courses table
CREATE TABLE courses (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    gps_route JSONB NOT NULL, -- Array of {lat, lng} coordinates
    distance DECIMAL(10,2) NOT NULL CHECK (distance > 0),
    duration INTEGER NOT NULL CHECK (duration > 0), -- in minutes
    difficulty difficulty_level NOT NULL,
    course_type course_type NOT NULL,
    area VARCHAR(100) NOT NULL,
    images TEXT[] DEFAULT '{}',
    facilities JSONB DEFAULT '{}', -- {toilet: [{lat, lng, name}], convenience_store: [...], ...}
    created_by UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
    is_verified BOOLEAN DEFAULT FALSE,
    view_count INTEGER DEFAULT 0,
    rating_avg DECIMAL(3,2) DEFAULT 0 CHECK (rating_avg >= 0 AND rating_avg <= 5),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Running logs table
CREATE TABLE running_logs (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
    course_id UUID REFERENCES courses(id) ON DELETE CASCADE NOT NULL,
    distance DECIMAL(10,2) NOT NULL CHECK (distance > 0),
    duration INTEGER NOT NULL CHECK (duration > 0), -- in seconds
    avg_speed DECIMAL(5,2) NOT NULL CHECK (avg_speed > 0), -- km/h
    calories INTEGER NOT NULL CHECK (calories > 0),
    gps_path JSONB NOT NULL, -- Array of {lat, lng, timestamp}
    completed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Reviews table
CREATE TABLE reviews (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
    course_id UUID REFERENCES courses(id) ON DELETE CASCADE NOT NULL,
    rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
    comment TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, course_id) -- One review per user per course
);

-- Bookmarks table
CREATE TABLE bookmarks (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
    course_id UUID REFERENCES courses(id) ON DELETE CASCADE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, course_id) -- One bookmark per user per course
);

-- Create indexes for better performance
CREATE INDEX idx_courses_area ON courses(area);
CREATE INDEX idx_courses_course_type ON courses(course_type);
CREATE INDEX idx_courses_difficulty ON courses(difficulty);
CREATE INDEX idx_courses_is_verified ON courses(is_verified);
CREATE INDEX idx_courses_rating_avg ON courses(rating_avg DESC);
CREATE INDEX idx_courses_view_count ON courses(view_count DESC);
CREATE INDEX idx_courses_created_at ON courses(created_at DESC);

CREATE INDEX idx_running_logs_user_id ON running_logs(user_id);
CREATE INDEX idx_running_logs_course_id ON running_logs(course_id);
CREATE INDEX idx_running_logs_completed_at ON running_logs(completed_at DESC);

CREATE INDEX idx_reviews_course_id ON reviews(course_id);
CREATE INDEX idx_reviews_rating ON reviews(rating);
CREATE INDEX idx_reviews_created_at ON reviews(created_at DESC);

CREATE INDEX idx_bookmarks_user_id ON bookmarks(user_id);
CREATE INDEX idx_bookmarks_course_id ON bookmarks(course_id);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Add trigger to courses table
CREATE TRIGGER update_courses_updated_at 
    BEFORE UPDATE ON courses 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Function to update course rating average
CREATE OR REPLACE FUNCTION update_course_rating_avg()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE courses 
    SET rating_avg = (
        SELECT COALESCE(AVG(rating), 0)
        FROM reviews 
        WHERE course_id = COALESCE(NEW.course_id, OLD.course_id)
    )
    WHERE id = COALESCE(NEW.course_id, OLD.course_id);
    
    RETURN COALESCE(NEW, OLD);
END;
$$ language 'plpgsql';

-- Add triggers for rating average updates
CREATE TRIGGER update_rating_avg_on_insert
    AFTER INSERT ON reviews
    FOR EACH ROW
    EXECUTE FUNCTION update_course_rating_avg();

CREATE TRIGGER update_rating_avg_on_update
    AFTER UPDATE ON reviews
    FOR EACH ROW
    EXECUTE FUNCTION update_course_rating_avg();

CREATE TRIGGER update_rating_avg_on_delete
    AFTER DELETE ON reviews
    FOR EACH ROW
    EXECUTE FUNCTION update_course_rating_avg();

-- Function to increment view count
CREATE OR REPLACE FUNCTION increment_view_count(course_uuid UUID)
RETURNS VOID AS $$
BEGIN
    UPDATE courses 
    SET view_count = view_count + 1 
    WHERE id = course_uuid;
END;
$$ language 'plpgsql';

-- Function to update user statistics
CREATE OR REPLACE FUNCTION update_user_stats()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE users 
    SET 
        total_distance = (
            SELECT COALESCE(SUM(distance), 0)
            FROM running_logs 
            WHERE user_id = NEW.user_id
        ),
        total_runs = (
            SELECT COUNT(*)
            FROM running_logs 
            WHERE user_id = NEW.user_id
        )
    WHERE id = NEW.user_id;
    
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Add trigger for user stats updates
CREATE TRIGGER update_user_stats_on_run
    AFTER INSERT ON running_logs
    FOR EACH ROW
    EXECUTE FUNCTION update_user_stats();
