-- Additional Analytics Tables for IELTS Admin Dashboard
-- These tables provide comprehensive user activity tracking for better insights

-- Track user sessions and engagement
CREATE TABLE public.user_sessions (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  user_id uuid,
  session_start timestamp with time zone DEFAULT now(),
  session_end timestamp with time zone,
  duration_minutes integer,
  device_type text,
  browser text,
  ip_address text,
  is_active boolean DEFAULT true,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT user_sessions_pkey PRIMARY KEY (id),
  CONSTRAINT user_sessions_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id)
);

-- Track page views and user navigation
CREATE TABLE public.user_page_views (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  user_id uuid,
  page_path text NOT NULL,
  page_title text,
  time_spent_seconds integer,
  referrer text,
  device_type text,
  browser text,
  ip_address text,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT user_page_views_pkey PRIMARY KEY (id),
  CONSTRAINT user_page_views_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id)
);

-- Track specific feature usage
CREATE TABLE public.user_feature_usage (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  user_id uuid,
  feature_name text NOT NULL, -- 'essay_writing', 'full_test', 'reading_test', 'speaking_test', 'payment', etc.
  action text NOT NULL, -- 'start', 'complete', 'cancel', 'retry', etc.
  metadata jsonb, -- Additional data like test scores, time taken, etc.
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT user_feature_usage_pkey PRIMARY KEY (id),
  CONSTRAINT user_feature_usage_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id)
);

-- Track user learning progress and milestones
CREATE TABLE public.user_progress (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  user_id uuid,
  skill_area text NOT NULL, -- 'writing', 'reading', 'speaking', 'listening'
  current_level text, -- 'beginner', 'intermediate', 'advanced'
  target_level text,
  tests_completed integer DEFAULT 0,
  average_score numeric,
  improvement_rate numeric, -- points per week
  last_activity timestamp with time zone,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT user_progress_pkey PRIMARY KEY (id),
  CONSTRAINT user_progress_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id)
);

-- Track user feedback and satisfaction
CREATE TABLE public.user_feedback (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  user_id uuid,
  feedback_type text NOT NULL, -- 'rating', 'review', 'bug_report', 'feature_request'
  rating integer, -- 1-5 scale
  feedback_text text,
  feature_related text, -- which feature this feedback is about
  is_resolved boolean DEFAULT false,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT user_feedback_pkey PRIMARY KEY (id),
  CONSTRAINT user_feedback_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id)
);

-- Track marketing attribution and user acquisition
CREATE TABLE public.user_acquisition (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  user_id uuid,
  source text, -- 'google', 'facebook', 'referral', 'direct', etc.
  medium text, -- 'organic', 'paid', 'social', 'email', etc.
  campaign text,
  referrer_url text,
  landing_page text,
  first_touch timestamp with time zone DEFAULT now(),
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT user_acquisition_pkey PRIMARY KEY (id),
  CONSTRAINT user_acquisition_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id)
);

-- Create indexes for better query performance
CREATE INDEX idx_user_sessions_user_id ON public.user_sessions(user_id);
CREATE INDEX idx_user_sessions_created_at ON public.user_sessions(created_at);
CREATE INDEX idx_user_page_views_user_id ON public.user_page_views(user_id);
CREATE INDEX idx_user_page_views_created_at ON public.user_page_views(created_at);
CREATE INDEX idx_user_feature_usage_user_id ON public.user_feature_usage(user_id);
CREATE INDEX idx_user_feature_usage_feature ON public.user_feature_usage(feature_name);
CREATE INDEX idx_user_feature_usage_created_at ON public.user_feature_usage(created_at);
CREATE INDEX idx_user_progress_user_id ON public.user_progress(user_id);
CREATE INDEX idx_user_feedback_created_at ON public.user_feedback(created_at);
CREATE INDEX idx_user_acquisition_source ON public.user_acquisition(source);
