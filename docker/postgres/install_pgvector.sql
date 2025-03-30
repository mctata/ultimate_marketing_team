-- SQL Script to install pgvector extension
CREATE EXTENSION IF NOT EXISTS vector;

-- Verify installation with a simple test
DO $$
BEGIN
    -- Create a test table
    CREATE TABLE IF NOT EXISTS vector_test (
        id SERIAL PRIMARY KEY,
        embedding vector(3)
    );
    
    -- Insert a test vector
    INSERT INTO vector_test (embedding) VALUES ('[1,2,3]');
    
    -- Clean up
    DROP TABLE vector_test;
    
    RAISE NOTICE 'pgvector extension successfully installed and tested';
EXCEPTION WHEN OTHERS THEN
    RAISE EXCEPTION 'Error testing pgvector extension: %', SQLERRM;
END$$;
