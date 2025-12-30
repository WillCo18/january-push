-- Dummy Data Generator for January Push App
-- Run this in Lovable's Supabase SQL Editor

-- Step 1: Create dummy auth users (with encrypted passwords)
INSERT INTO auth.users (
  id,
  instance_id,
  email,
  encrypted_password,
  email_confirmed_at,
  created_at,
  updated_at,
  raw_app_meta_data,
  raw_user_meta_data,
  aud,
  role
) VALUES
  (gen_random_uuid(), '00000000-0000-0000-0000-000000000000', 'alice@test.com', crypt('password123', gen_salt('bf')), NOW(), NOW(), NOW(), '{"provider":"email","providers":["email"]}', '{}', 'authenticated', 'authenticated'),
  (gen_random_uuid(), '00000000-0000-0000-0000-000000000000', 'bob@test.com', crypt('password123', gen_salt('bf')), NOW(), NOW(), NOW(), '{"provider":"email","providers":["email"]}', '{}', 'authenticated', 'authenticated'),
  (gen_random_uuid(), '00000000-0000-0000-0000-000000000000', 'charlie@test.com', crypt('password123', gen_salt('bf')), NOW(), NOW(), NOW(), '{"provider":"email","providers":["email"]}', '{}', 'authenticated', 'authenticated'),
  (gen_random_uuid(), '00000000-0000-0000-0000-000000000000', 'diana@test.com', crypt('password123', gen_salt('bf')), NOW(), NOW(), NOW(), '{"provider":"email","providers":["email"]}', '{}', 'authenticated', 'authenticated'),
  (gen_random_uuid(), '00000000-0000-0000-0000-000000000000', 'emma@test.com', crypt('password123', gen_salt('bf')), NOW(), NOW(), NOW(), '{"provider":"email","providers":["email"]}', '{}', 'authenticated', 'authenticated');

-- Step 2: Create profiles for dummy users
INSERT INTO profiles (id, nickname)
SELECT id,
  CASE
    WHEN email = 'alice@test.com' THEN 'Alice'
    WHEN email = 'bob@test.com' THEN 'Bob'
    WHEN email = 'charlie@test.com' THEN 'Charlie'
    WHEN email = 'diana@test.com' THEN 'Diana'
    WHEN email = 'emma@test.com' THEN 'Emma'
  END
FROM auth.users
WHERE email IN ('alice@test.com', 'bob@test.com', 'charlie@test.com', 'diana@test.com', 'emma@test.com');

-- Step 3: Create "Group 1"
WITH new_group AS (
  INSERT INTO groups (name, invite_code, admin_id)
  SELECT 'Group 1', 'DEMO1234', id
  FROM auth.users
  WHERE email = 'alice@test.com'
  RETURNING id
)

-- Step 4: Add all users to Group 1
INSERT INTO group_memberships (user_id, group_id)
SELECT u.id, g.id
FROM auth.users u
CROSS JOIN new_group g
WHERE u.email IN ('alice@test.com', 'bob@test.com', 'charlie@test.com', 'diana@test.com', 'emma@test.com');

-- Step 5: Generate 4 days of activity logs (random reps between 0-100)
DO $$
DECLARE
  user_record RECORD;
  day_offset INT;
  reps INT;
BEGIN
  FOR user_record IN
    SELECT id FROM auth.users
    WHERE email IN ('alice@test.com', 'bob@test.com', 'charlie@test.com', 'diana@test.com', 'emma@test.com')
  LOOP
    FOR day_offset IN 0..3 LOOP
      -- Random reps between 50 and 120
      reps := 50 + floor(random() * 71)::int;

      INSERT INTO activity_logs (user_id, log_date, reps)
      VALUES (
        user_record.id,
        CURRENT_DATE - day_offset,
        reps
      );
    END LOOP;
  END LOOP;
END $$;

-- Verification queries
SELECT COUNT(*) as user_count FROM auth.users WHERE email LIKE '%@test.com';
SELECT COUNT(*) as profile_count FROM profiles WHERE nickname IN ('Alice', 'Bob', 'Charlie', 'Diana', 'Emma');
SELECT name, invite_code FROM groups WHERE name = 'Group 1';
SELECT COUNT(*) as membership_count FROM group_memberships;
SELECT COUNT(*) as activity_count FROM activity_logs;
