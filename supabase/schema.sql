-- Schema for Courier Tracker MVP

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. Profiles (Merchants / Drivers)
CREATE TABLE profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT UNIQUE NOT NULL,
    full_name TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Work Sessions
-- Status enum
CREATE TYPE session_status AS ENUM ('active', 'completed');

CREATE TABLE work_sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    start_time TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    end_time TIMESTAMP WITH TIME ZONE,
    total_distance DOUBLE PRECISION DEFAULT 0.0,
    idle_time INTEGER DEFAULT 0, -- in seconds
    status session_status DEFAULT 'active',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Trips 
-- Status enum for Trips as requested by the user
CREATE TYPE trip_status AS ENUM ('pending', 'in_progress', 'completed', 'cancelled');

CREATE TABLE trips (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    session_id UUID NOT NULL REFERENCES work_sessions(id) ON DELETE CASCADE,
    start_location GEOGRAPHY(Point, 4326),
    end_location GEOGRAPHY(Point, 4326),
    distance DOUBLE PRECISION DEFAULT 0.0, -- in meters
    duration INTEGER, -- in seconds
    status trip_status DEFAULT 'pending',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. Locations (Raw/Filtered Tracking Data)
CREATE TABLE locations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    session_id UUID NOT NULL REFERENCES work_sessions(id) ON DELETE CASCADE,
    latitude DOUBLE PRECISION NOT NULL,
    longitude DOUBLE PRECISION NOT NULL,
    accuracy DOUBLE PRECISION,
    altitude DOUBLE PRECISION,
    speed DOUBLE PRECISION,
    timestamp TIMESTAMP WITH TIME ZONE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX idx_work_sessions_user_id ON work_sessions(user_id);
CREATE INDEX idx_trips_session_id ON trips(session_id);
CREATE INDEX idx_locations_session_id ON locations(session_id);
