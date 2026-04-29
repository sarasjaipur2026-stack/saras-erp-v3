-- Extensions used across v3
-- pg_trgm: GIN trigram indexes for sub-50ms search on customers/products
-- uuid-ossp: gen_random_uuid() (Postgres 13+ has it natively but extension is harmless)
-- citext: case-insensitive text for emails

CREATE EXTENSION IF NOT EXISTS pg_trgm;
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS citext;
