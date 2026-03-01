-- ===== CryXxx Driver Portal - Supabase Schema =====
-- Run this in the Supabase SQL Editor to set up your database tables.

-- Profiles table (extends Supabase auth.users)
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'driver' CHECK (role IN ('driver', 'admin')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Vacation Requests
CREATE TABLE vacation_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  user_name TEXT NOT NULL,
  type TEXT NOT NULL,
  urgency TEXT DEFAULT 'normal',
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  reason TEXT,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'denied')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Contact Messages
CREATE TABLE contact_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  user_name TEXT NOT NULL,
  category TEXT NOT NULL,
  subject TEXT NOT NULL,
  message TEXT NOT NULL,
  priority TEXT DEFAULT 'medium',
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'denied')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Payroll Issues
CREATE TABLE payroll_issues (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  user_name TEXT NOT NULL,
  pay_period TEXT NOT NULL,
  issue_type TEXT NOT NULL,
  expected_amount NUMERIC,
  received_amount NUMERIC,
  details TEXT NOT NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'denied')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Uniform Requests
CREATE TABLE uniform_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  user_name TEXT NOT NULL,
  items TEXT NOT NULL,
  shirt_size TEXT,
  pant_size TEXT,
  shoe_size TEXT,
  notes TEXT,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'denied')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Truck Loading Suggestions
CREATE TABLE loading_suggestions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  user_name TEXT NOT NULL,
  truck_id TEXT NOT NULL,
  route TEXT,
  suggestion TEXT NOT NULL,
  priority TEXT DEFAULT 'suggestion',
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'denied')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Trip Inspections (Pre/Post Trip Photos)
CREATE TABLE trip_inspections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  user_name TEXT NOT NULL,
  trip_type TEXT NOT NULL CHECK (trip_type IN ('pre-trip', 'post-trip')),
  trip_date DATE NOT NULL,
  vehicle_id TEXT NOT NULL,
  mileage TEXT,
  checklist TEXT,
  photo_urls TEXT,
  notes TEXT,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'denied')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Accident Reports
CREATE TABLE accident_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  user_name TEXT NOT NULL,
  report_date DATE NOT NULL,
  incident_time TIME NOT NULL,
  location TEXT NOT NULL,
  vehicle_id TEXT NOT NULL,
  description TEXT NOT NULL,
  injuries BOOLEAN DEFAULT false,
  injuries_description TEXT,
  damage_level TEXT CHECK (damage_level IN ('minor', 'moderate', 'severe')),
  photo_urls TEXT,
  witness_info TEXT,
  police_report_number TEXT,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'denied')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Schedule Entries
CREATE TABLE schedule_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  driver_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  driver_name TEXT NOT NULL,
  date DATE NOT NULL,
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  route TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ===== Row Level Security (RLS) =====
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE vacation_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE contact_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE payroll_issues ENABLE ROW LEVEL SECURITY;
ALTER TABLE uniform_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE loading_suggestions ENABLE ROW LEVEL SECURITY;
ALTER TABLE trip_inspections ENABLE ROW LEVEL SECURITY;
ALTER TABLE accident_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE schedule_entries ENABLE ROW LEVEL SECURITY;

-- Profiles: users can read own, admins can read all
CREATE POLICY "Users can view own profile" ON profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Users can insert own profile" ON profiles FOR INSERT WITH CHECK (auth.uid() = id);

-- Generic policies for submission tables (drivers see own, admins see all)
-- Vacation Requests
CREATE POLICY "Drivers see own vacation requests" ON vacation_requests FOR SELECT USING (auth.uid() = user_id OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));
CREATE POLICY "Drivers create own vacation requests" ON vacation_requests FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Admins can update vacation requests" ON vacation_requests FOR UPDATE USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));

-- Contact Messages
CREATE POLICY "Drivers see own contact messages" ON contact_messages FOR SELECT USING (auth.uid() = user_id OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));
CREATE POLICY "Drivers create own contact messages" ON contact_messages FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Admins can update contact messages" ON contact_messages FOR UPDATE USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));

-- Payroll Issues
CREATE POLICY "Drivers see own payroll issues" ON payroll_issues FOR SELECT USING (auth.uid() = user_id OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));
CREATE POLICY "Drivers create own payroll issues" ON payroll_issues FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Admins can update payroll issues" ON payroll_issues FOR UPDATE USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));

-- Uniform Requests
CREATE POLICY "Drivers see own uniform requests" ON uniform_requests FOR SELECT USING (auth.uid() = user_id OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));
CREATE POLICY "Drivers create own uniform requests" ON uniform_requests FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Admins can update uniform requests" ON uniform_requests FOR UPDATE USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));

-- Loading Suggestions
CREATE POLICY "Drivers see own loading suggestions" ON loading_suggestions FOR SELECT USING (auth.uid() = user_id OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));
CREATE POLICY "Drivers create own loading suggestions" ON loading_suggestions FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Admins can update loading suggestions" ON loading_suggestions FOR UPDATE USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));

-- Trip Inspections
CREATE POLICY "Drivers see own trip inspections" ON trip_inspections FOR SELECT USING (auth.uid() = user_id OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));
CREATE POLICY "Drivers create own trip inspections" ON trip_inspections FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Admins can update trip inspections" ON trip_inspections FOR UPDATE USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));

-- Accident Reports
CREATE POLICY "Drivers see own accident reports" ON accident_reports FOR SELECT USING (auth.uid() = user_id OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));
CREATE POLICY "Drivers create own accident reports" ON accident_reports FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Admins can update accident reports" ON accident_reports FOR UPDATE USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));

-- Schedule Entries
CREATE POLICY "All users see schedule entries" ON schedule_entries FOR SELECT USING (true);
CREATE POLICY "Admins create schedule entries" ON schedule_entries FOR INSERT WITH CHECK (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));
CREATE POLICY "Admins update schedule entries" ON schedule_entries FOR UPDATE USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));
CREATE POLICY "Admins delete schedule entries" ON schedule_entries FOR DELETE USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));
