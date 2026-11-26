-- Esquema de ApoyandoTec. Idempotente: se aplica en cada arranque (CREATE … IF NOT EXISTS).
-- El contenido académico (materias, temas, bancos) vive en src/data; aquí solo datos de usuarios.
-- Los nombres de columna son los mismos que usa la API (created_date, created_by_id…).

CREATE TABLE IF NOT EXISTS users (
  id                     uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email                  text NOT NULL UNIQUE,           -- ya llega en minúsculas (zod)
  password_hash          text NOT NULL,
  full_name              text NOT NULL,
  role                   text NOT NULL DEFAULT 'user',
  is_tutor               boolean NOT NULL DEFAULT false,
  subscription_status    text NOT NULL DEFAULT 'free' CHECK (subscription_status IN ('free', 'premium')),
  xp_points              integer NOT NULL DEFAULT 0,
  level                  integer NOT NULL DEFAULT 1,
  xp_today               integer NOT NULL DEFAULT 0,
  xp_today_date          date,
  xp_diagnostic_awarded  boolean NOT NULL DEFAULT false,
  streak_days            integer NOT NULL DEFAULT 0,
  best_streak            integer NOT NULL DEFAULT 0,
  streak_freezes         integer NOT NULL DEFAULT 0,
  last_active_date       date,
  active_days            text[] NOT NULL DEFAULT '{}',   -- YYYY-MM-DD (hora de Saltillo)
  frozen_days            text[] NOT NULL DEFAULT '{}',
  daily_challenge_date   date,
  diagnostics_completed  boolean NOT NULL DEFAULT false,
  diagnostic_result      jsonb,
  daily_3d_credits       integer NOT NULL DEFAULT 0,
  daily_reset_date       date,
  token_version          integer NOT NULL DEFAULT 0,
  stripe_customer_id     text,
  stripe_subscription_id text,
  stripe_event_at        bigint,
  created_date           timestamptz NOT NULL DEFAULT now(),
  updated_date           timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS users_stripe_customer_idx ON users (stripe_customer_id);

CREATE TABLE IF NOT EXISTS password_reset_tokens (
  token_hash text PRIMARY KEY,                           -- sha256: el token en claro nunca se guarda
  user_id    uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  expires_at timestamptz NOT NULL
);

CREATE TABLE IF NOT EXISTS stripe_events (
  event_id     text PRIMARY KEY,                         -- idempotencia del webhook
  processed_at timestamptz NOT NULL DEFAULT now()
);

-- Entidades: todas comparten id, autor y fechas.
CREATE TABLE IF NOT EXISTS tutor_profiles (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_by_id    uuid NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE, -- un perfil por usuario
  created_by_name  text,
  full_name        text NOT NULL,
  bio              text NOT NULL DEFAULT '',
  credential       text,
  subjects_offered text[] NOT NULL DEFAULT '{}',
  hourly_rate      numeric(8,2) NOT NULL,
  photo_url        text,
  verified         boolean NOT NULL DEFAULT false,
  sponsored        boolean NOT NULL DEFAULT false,
  total_sessions   integer NOT NULL DEFAULT 0,
  rating           double precision NOT NULL DEFAULT 0,
  created_date     timestamptz NOT NULL DEFAULT now(),
  updated_date     timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS bookings (
  id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_by_id       uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,   -- el alumno
  created_by_name     text,
  tutor_id            uuid REFERENCES tutor_profiles(id) ON DELETE SET NULL,
  tutor_name          text NOT NULL,
  subject             text NOT NULL DEFAULT '',
  date                date NOT NULL,
  hours               numeric(3,1) NOT NULL,
  total_amount        numeric(10,2) NOT NULL,
  platform_commission numeric(10,2) NOT NULL,
  status              text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed')),
  stripe_session_id   text UNIQUE,
  created_date        timestamptz NOT NULL DEFAULT now(),
  updated_date        timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS bookings_owner_idx ON bookings (created_by_id);

CREATE TABLE IF NOT EXISTS user_progress (
  id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_by_id       uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_by_name     text,
  subject_id          text NOT NULL,
  topic_id            text NOT NULL,
  exercises_completed integer NOT NULL DEFAULT 0,
  mastery_percentage  double precision NOT NULL DEFAULT 0,
  unlocked            boolean NOT NULL DEFAULT true,
  created_date        timestamptz NOT NULL DEFAULT now(),
  updated_date        timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS user_progress_owner_idx ON user_progress (created_by_id, subject_id);

CREATE TABLE IF NOT EXISTS exam_results (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_by_id   uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_by_name text,
  score_pct       double precision NOT NULL,
  correct         integer NOT NULL,
  total           integer NOT NULL CHECK (correct <= total),
  duration_sec    double precision,
  detail          jsonb,
  created_date    timestamptz NOT NULL DEFAULT now(),
  updated_date    timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS exam_results_owner_idx ON exam_results (created_by_id);

CREATE TABLE IF NOT EXISTS diagnostic_results (
  id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_by_id       uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_by_name     text,
  score_algebra       double precision NOT NULL,
  score_trig          double precision NOT NULL,
  score_geometry      double precision NOT NULL,
  score_calculus      double precision NOT NULL,
  score_physics       double precision NOT NULL,
  detected_gaps       jsonb NOT NULL,
  recommended_roadmap jsonb NOT NULL,
  correct             integer NOT NULL,
  total               integer NOT NULL,
  created_date        timestamptz NOT NULL DEFAULT now(),
  updated_date        timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS diagnostic_results_owner_idx ON diagnostic_results (created_by_id);

CREATE TABLE IF NOT EXISTS prof_insights (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_by_id   uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_by_name text,
  subject_id      text NOT NULL,
  kind            text NOT NULL CHECK (kind IN ('tip', 'plantilla')),
  title           text NOT NULL,
  body            text NOT NULL,
  professor       text NOT NULL DEFAULT '',
  created_date    timestamptz NOT NULL DEFAULT now(),
  updated_date    timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS prof_insights_subject_idx ON prof_insights (subject_id);

CREATE TABLE IF NOT EXISTS subject_eval_configs (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_by_id   uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_by_name text,
  subject_id      text NOT NULL,
  mode            text NOT NULL CHECK (mode IN ('examen', 'proyectos', 'tradicional')),
  created_date    timestamptz NOT NULL DEFAULT now(),
  updated_date    timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS subject_eval_configs_owner_idx ON subject_eval_configs (created_by_id);

CREATE TABLE IF NOT EXISTS guest_feedback (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_by_id   uuid REFERENCES users(id) ON DELETE SET NULL,
  created_by_name text,
  rating          integer NOT NULL CHECK (rating BETWEEN 1 AND 5),
  comment         text NOT NULL,
  screen_name     text NOT NULL DEFAULT '',
  created_date    timestamptz NOT NULL DEFAULT now(),
  updated_date    timestamptz NOT NULL DEFAULT now()
);
