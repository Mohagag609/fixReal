-- Initialize database
CREATE DATABASE IF NOT EXISTS estate_management;
USE estate_management;

-- Create extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Set timezone
SET timezone = 'UTC';