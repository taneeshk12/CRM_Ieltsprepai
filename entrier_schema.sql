-- WARNING: This schema is for context only and is not meant to be run.
-- Table order and constraints may not be valid for execution.

CREATE TABLE public.free_test_attempts (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  ip_address text NOT NULL UNIQUE,
  used_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT free_test_attempts_pkey PRIMARY KEY (id)
);
CREATE TABLE public.notification_preferences (
  user_id uuid NOT NULL,
  email_notifications boolean DEFAULT true,
  browser_notifications boolean DEFAULT true,
  promotional_notifications boolean DEFAULT true,
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT notification_preferences_pkey PRIMARY KEY (user_id),
  CONSTRAINT notification_preferences_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id)
);
CREATE TABLE public.payment_orders (
  id integer NOT NULL DEFAULT nextval('payment_orders_id_seq'::regclass),
  user_id uuid,
  order_id text NOT NULL,
  payment_id text,
  amount numeric NOT NULL,
  credits integer NOT NULL,
  status text DEFAULT 'pending'::text,
  created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
  receipt text,
  CONSTRAINT payment_orders_pkey PRIMARY KEY (id),
  CONSTRAINT payment_orders_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id)
);
CREATE TABLE public.push_subscriptions (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid,
  subscription_data jsonb NOT NULL,
  endpoint text NOT NULL,
  enabled boolean DEFAULT true,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT push_subscriptions_pkey PRIMARY KEY (id),
  CONSTRAINT push_subscriptions_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id)
);
CREATE TABLE public.referral_codes (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL UNIQUE,
  code character varying NOT NULL UNIQUE,
  created_at timestamp without time zone DEFAULT now(),
  updated_at timestamp without time zone DEFAULT now(),
  CONSTRAINT referral_codes_pkey PRIMARY KEY (id),
  CONSTRAINT referral_codes_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id)
);
CREATE TABLE public.referrals (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  referrer_id uuid NOT NULL,
  referee_id uuid NOT NULL,
  referral_code character varying NOT NULL,
  credits_awarded boolean DEFAULT false,
  created_at timestamp without time zone DEFAULT now(),
  updated_at timestamp without time zone DEFAULT now(),
  CONSTRAINT referrals_pkey PRIMARY KEY (id),
  CONSTRAINT referrals_referrer_id_fkey FOREIGN KEY (referrer_id) REFERENCES auth.users(id),
  CONSTRAINT referrals_referee_id_fkey FOREIGN KEY (referee_id) REFERENCES auth.users(id)
);
CREATE TABLE public.subscriptions (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid,
  stripe_customer_id text,
  stripe_subscription_id text,
  status text,
  price_id text,
  created_at timestamp with time zone DEFAULT now(),
  cancel_at_period_end boolean DEFAULT false,
  updated_at timestamp with time zone DEFAULT now(),
  current_period_end timestamp with time zone,
  CONSTRAINT subscriptions_pkey PRIMARY KEY (id),
  CONSTRAINT subscriptions_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id)
);
CREATE TABLE public.user_credits (
  user_id uuid NOT NULL,
  credits integer DEFAULT 2,
  CONSTRAINT user_credits_pkey PRIMARY KEY (user_id),
  CONSTRAINT user_credits_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id)
);
CREATE TABLE public.user_essays (
  id bigint GENERATED ALWAYS AS IDENTITY NOT NULL,
  user_id uuid,
  task text NOT NULL,
  question text NOT NULL,
  essay text NOT NULL,
  band text NOT NULL,
  feedback jsonb NOT NULL,
  suggestions text NOT NULL,
  corrected_essay text NOT NULL,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT user_essays_pkey PRIMARY KEY (id),
  CONSTRAINT user_essays_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id)
);
CREATE TABLE public.user_full_writing_tests (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  user_id uuid,
  task1_question text,
  task1_essay text,
  task1_band double precision,
  task1_feedback jsonb,
  task1_suggestions text,
  task1_corrected_essay text,
  task2_question text,
  task2_essay text,
  task2_band double precision,
  task2_feedback jsonb,
  task2_suggestions text,
  task2_corrected_essay text,
  overall_band double precision,
  created_at timestamp without time zone DEFAULT now(),
  CONSTRAINT user_full_writing_tests_pkey PRIMARY KEY (id),
  CONSTRAINT user_full_writing_tests_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id)
);
CREATE TABLE public.user_notifications (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid,
  title text NOT NULL,
  message text NOT NULL,
  type text NOT NULL DEFAULT 'info'::text,
  read boolean DEFAULT false,
  action_url text,
  created_at timestamp with time zone DEFAULT now(),
  expires_at timestamp with time zone,
  metadata jsonb,
  CONSTRAINT user_notifications_pkey PRIMARY KEY (id),
  CONSTRAINT user_notifications_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id)
);
CREATE TABLE public.user_payments (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  user_id uuid,
  payment_link_id text UNIQUE,
  order_id text,
  payment_id text,
  status text DEFAULT 'created'::text,
  amount numeric,
  credits_added integer DEFAULT 0,
  idempotency_key text UNIQUE,
  email text,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT user_payments_pkey PRIMARY KEY (id),
  CONSTRAINT user_payments_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id)
);
CREATE TABLE public.user_preferences (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  user_id uuid NOT NULL UNIQUE,
  has_completed_onboarding boolean DEFAULT false,
  created_at timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now()),
  CONSTRAINT user_preferences_pkey PRIMARY KEY (id),
  CONSTRAINT user_preferences_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id)
);
CREATE TABLE public.user_profiles (
  user_id uuid NOT NULL,
  name text NOT NULL,
  dob date NOT NULL,
  phone_number text NOT NULL,
  is_verified boolean DEFAULT false,
  profile_completed boolean DEFAULT false,
  created_at timestamp with time zone DEFAULT now(),
  country_code character varying DEFAULT '+91'::character varying,
  CONSTRAINT user_profiles_pkey PRIMARY KEY (user_id),
  CONSTRAINT user_profiles_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id)
);
CREATE TABLE public.user_reading (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  user_id uuid NOT NULL,
  test_type text NOT NULL,
  passage_title text,
  answers jsonb,
  results jsonb,
  score integer NOT NULL,
  total_questions integer NOT NULL,
  band double precision NOT NULL,
  feedback text,
  time_taken integer NOT NULL,
  created_at timestamp without time zone NOT NULL DEFAULT now(),
  CONSTRAINT user_reading_pkey PRIMARY KEY (id),
  CONSTRAINT user_reading_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id)
);
CREATE TABLE public.user_speaking (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  user_id uuid,
  topic text,
  part1 jsonb,
  part2 text,
  part3 jsonb,
  part1_questions jsonb,
  part2_question text,
  part3_questions jsonb,
  band double precision,
  feedback jsonb,
  suggestions text NOT NULL,
  created_at timestamp without time zone DEFAULT now(),
  CONSTRAINT user_speaking_pkey PRIMARY KEY (id),
  CONSTRAINT user_speaking_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id)
);
CREATE TABLE public.user_trials (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  user_id uuid NOT NULL UNIQUE,
  trial_start_time timestamp with time zone DEFAULT now(),
  trial_end_time timestamp with time zone NOT NULL,
  is_trial_used boolean DEFAULT false,
  CONSTRAINT user_trials_pkey PRIMARY KEY (id),
  CONSTRAINT user_trials_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id)
);
CREATE TABLE public.users (
  id uuid NOT NULL,
  email text,
  created_at timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now()),
  is_deleted boolean DEFAULT false,
  deleted_at timestamp with time zone,
  reactivated_at timestamp with time zone,
  CONSTRAINT users_pkey PRIMARY KEY (id),
  CONSTRAINT users_id_fkey FOREIGN KEY (id) REFERENCES auth.users(id)
);