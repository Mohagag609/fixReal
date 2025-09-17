-- Initialize the database
CREATE DATABASE IF NOT EXISTS accounting_db;

-- Create extensions if needed
-- CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Grant permissions
GRANT ALL PRIVILEGES ON DATABASE accounting_db TO postgres;