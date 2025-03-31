-- SQL Script to install pgvector extension
-- Note: This requires the pgvector extension to be installed on the PostgreSQL server
-- If this fails, run the fix_pgvector.sh script to compile and install the extension

-- Try to create the extension
DO $$
BEGIN
    -- Create extension if it exists
    CREATE EXTENSION IF NOT EXISTS vector;
    
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
EXCEPTION 
    WHEN OTHERS THEN
        -- Just log the error but don't fail
        RAISE NOTICE 'Could not initialize pgvector: %. Run fix_pgvector.sh to install manually.', SQLERRM;
END$$;
