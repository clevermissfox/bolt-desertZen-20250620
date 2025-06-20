/*
  # Fix Authentication and Profile Creation

  1. Database Functions
    - Create improved handle_new_user function with better error handling
    - Create handle_user_email_confirmed function for email confirmation flow
    - Create utility function to create missing profiles for existing users

  2. Triggers
    - Set up trigger for new user creation
    - Set up trigger for email confirmation
    - Ensure triggers work for both immediate and delayed profile creation

  3. Security
    - Enable RLS on profiles table
    - Create comprehensive policies for authenticated users, service role, and anon users
    - Ensure proper access control for all scenarios

  4. Indexes
    - Create necessary indexes for performance
    - Ensure efficient querying of profiles

  5. Data Migration
    - Run function to create any missing profiles for existing users
*/

-- Drop existing trigger and function to recreate them
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP TRIGGER IF EXISTS on_auth_user_email_confirmed ON auth.users;
DROP FUNCTION IF EXISTS handle_new_user();
DROP FUNCTION IF EXISTS handle_user_email_confirmed();

-- Create improved function to handle new user signup
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  user_name TEXT;
BEGIN
  -- Extract name from metadata or use email prefix
  user_name := COALESCE(
    NEW.raw_user_meta_data->>'name',
    NEW.raw_user_meta_data->>'full_name',
    split_part(NEW.email, '@', 1),
    'User'
  );

  -- Insert profile with comprehensive error handling
  INSERT INTO public.profiles (id, email, name, created_at, updated_at)
  VALUES (
    NEW.id,
    NEW.email,
    user_name,
    now(),
    now()
  )
  ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    name = COALESCE(EXCLUDED.name, profiles.name),
    updated_at = now();
  
  -- Log successful profile creation
  RAISE NOTICE 'Profile created for user: % with email: % and name: %', NEW.id, NEW.email, user_name;
  
  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    -- Log the error but don't fail the user creation
    RAISE WARNING 'Failed to create profile for user % (email: %): %', NEW.id, NEW.email, SQLERRM;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to handle email confirmation
CREATE OR REPLACE FUNCTION handle_user_email_confirmed()
RETURNS TRIGGER AS $$
DECLARE
  user_name TEXT;
BEGIN
  -- Only proceed if email was just confirmed
  IF OLD.email_confirmed_at IS NULL AND NEW.email_confirmed_at IS NOT NULL THEN
    -- Check if profile already exists
    IF NOT EXISTS (SELECT 1 FROM public.profiles WHERE id = NEW.id) THEN
      -- Extract name from metadata or use email prefix
      user_name := COALESCE(
        NEW.raw_user_meta_data->>'name',
        NEW.raw_user_meta_data->>'full_name',
        split_part(NEW.email, '@', 1),
        'User'
      );

      -- Insert profile
      INSERT INTO public.profiles (id, email, name, created_at, updated_at)
      VALUES (
        NEW.id,
        NEW.email,
        user_name,
        now(),
        now()
      );
      
      RAISE NOTICE 'Profile created on email confirmation for user: %', NEW.id;
    END IF;
  END IF;
  
  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    RAISE WARNING 'Failed to create profile on email confirmation for user %: %', NEW.id, SQLERRM;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for new user creation (works for both confirmed and unconfirmed users)
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW 
  WHEN (NEW.email IS NOT NULL)
  EXECUTE FUNCTION handle_new_user();

-- Create trigger for email confirmation (backup for cases where profile wasn't created initially)
CREATE TRIGGER on_auth_user_email_confirmed
  AFTER UPDATE ON auth.users
  FOR EACH ROW 
  EXECUTE FUNCTION handle_user_email_confirmed();

-- Ensure RLS is enabled on profiles
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Drop all existing policies to recreate them cleanly
DROP POLICY IF EXISTS "Users can read own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON profiles;
DROP POLICY IF EXISTS "Service role can manage profiles" ON profiles;
DROP POLICY IF EXISTS "Allow profile creation during signup" ON profiles;

-- Create comprehensive RLS policies
CREATE POLICY "Users can read own profile"
  ON profiles FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can insert own profile"
  ON profiles FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

-- Allow service role full access (needed for triggers and admin operations)
CREATE POLICY "Service role can manage profiles"
  ON profiles FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Allow anon role to insert profiles (for signup flow)
CREATE POLICY "Allow profile creation during signup"
  ON profiles FOR INSERT
  TO anon
  WITH CHECK (true);

-- Ensure proper indexes exist
CREATE INDEX IF NOT EXISTS idx_profiles_id ON profiles(id);
CREATE INDEX IF NOT EXISTS idx_profiles_email ON profiles(email);

-- Create function to manually create missing profiles for existing users
CREATE OR REPLACE FUNCTION create_missing_profiles()
RETURNS INTEGER AS $$
DECLARE
  missing_count INTEGER := 0;
  user_record RECORD;
  user_name TEXT;
BEGIN
  -- Find users without profiles
  FOR user_record IN 
    SELECT u.id, u.email, u.raw_user_meta_data
    FROM auth.users u
    LEFT JOIN public.profiles p ON u.id = p.id
    WHERE p.id IS NULL AND u.email IS NOT NULL
  LOOP
    -- Extract name from metadata or use email prefix
    user_name := COALESCE(
      user_record.raw_user_meta_data->>'name',
      user_record.raw_user_meta_data->>'full_name',
      split_part(user_record.email, '@', 1),
      'User'
    );

    -- Create missing profile
    INSERT INTO public.profiles (id, email, name, created_at, updated_at)
    VALUES (
      user_record.id,
      user_record.email,
      user_name,
      now(),
      now()
    )
    ON CONFLICT (id) DO NOTHING;
    
    missing_count := missing_count + 1;
    RAISE NOTICE 'Created missing profile for user: % with name: %', user_record.id, user_name;
  END LOOP;
  
  RETURN missing_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Run the function to create any missing profiles
SELECT create_missing_profiles();