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

-- 5. Route Events (Semantic markers for actions)
CREATE TYPE route_event_type AS ENUM ('pickup', 'dropoff', 'waiting', 'pause', 'resume');

CREATE TABLE route_events (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    session_id UUID NOT NULL REFERENCES work_sessions(id) ON DELETE CASCADE,
    event_type route_event_type NOT NULL,
    latitude DOUBLE PRECISION NOT NULL,
    longitude DOUBLE PRECISION NOT NULL,
    metadata JSONB,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Index for session and time-based analysis
CREATE INDEX idx_route_events_session_id ON route_events(session_id);
CREATE INDEX idx_route_events_created_at ON route_events(created_at);

-- 6. Tracking Sessions (Granular tracking lifecycle)
CREATE TABLE tracking_sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    started_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    ended_at TIMESTAMP WITH TIME ZONE,
    status TEXT DEFAULT 'active'
);

CREATE INDEX idx_tracking_sessions_user_id ON tracking_sessions(user_id);

-- 7. Route Segments (Future segmentation engine)
CREATE TABLE route_segments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    session_id UUID NOT NULL REFERENCES tracking_sessions(id) ON DELETE CASCADE,
    segment_type TEXT NOT NULL,
    started_at TIMESTAMP WITH TIME ZONE,
    ended_at TIMESTAMP WITH TIME ZONE,
    distance_km DOUBLE PRECISION,
    duration_seconds INTEGER,
    metadata JSONB
);

CREATE INDEX idx_route_segments_session_id ON route_segments(session_id);

-- 8. Analytics Sessions (Future analytics engine)
CREATE TABLE analytics_sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    session_id UUID NOT NULL REFERENCES tracking_sessions(id) ON DELETE CASCADE,
    metrics_json JSONB,
    generated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_analytics_sessions_session_id ON analytics_sessions(session_id);
