-- Extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- Timezone
SET timezone = 'Asia/Ho_Chi_Minh';
ALTER DATABASE multi_jira SET timezone TO 'Asia/Ho_Chi_Minh';
