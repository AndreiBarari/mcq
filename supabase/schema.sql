-- =============================================================================
-- Medieval Code Quest — Supabase Database Schema
-- Run this in your Supabase SQL Editor (Dashboard → SQL Editor → New Query)
-- =============================================================================

-- -----------------------------------------------------------------------------
-- 1. PLAYER PROFILES
--    One row per authenticated user. Stores RPG progress & age metadata.
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.player_profiles (
  user_id          UUID        PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  age_group        TEXT        NOT NULL CHECK (age_group IN ('5-9', '9-14', '14+')),
  level            INTEGER     NOT NULL DEFAULT 1 CHECK (level >= 1 AND level <= 10),
  xp               INTEGER     NOT NULL DEFAULT 0 CHECK (xp >= 0),
  highest_level    INTEGER     NOT NULL DEFAULT 1 CHECK (highest_level >= 1 AND highest_level <= 10),
  courses_completed INTEGER    NOT NULL DEFAULT 0 CHECK (courses_completed >= 0),
  character_class  TEXT        NOT NULL DEFAULT 'Mage' CHECK (character_class IN ('Mage', 'Warrior', 'Archer')),
  has_premium      BOOLEAN     NOT NULL DEFAULT FALSE,
  -- COPPA: parental consent flag — must be TRUE before gameplay is permitted
  parental_consent BOOLEAN     NOT NULL DEFAULT FALSE,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  last_played_at   TIMESTAMPTZ
);

-- Index for fast single-user look-ups (used by fetchPlayerProgress)
CREATE INDEX IF NOT EXISTS idx_player_profiles_user_id ON public.player_profiles(user_id);

-- -----------------------------------------------------------------------------
-- 2. LEVEL COMPLETIONS
--    Append-only audit log: each time a player beats a level we record the
--    attempt so we can compute per-level high-scores and attempt counts.
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.level_completions (
  id          BIGSERIAL   PRIMARY KEY,
  user_id     UUID        NOT NULL REFERENCES public.player_profiles(user_id) ON DELETE CASCADE,
  level_id    INTEGER     NOT NULL CHECK (level_id >= 1 AND level_id <= 9),
  steps_used  INTEGER     NOT NULL CHECK (steps_used >= 0),   -- number of commands the kid submitted
  xp_earned   INTEGER     NOT NULL CHECK (xp_earned >= 0),
  completed_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index for fast per-user level queries
CREATE INDEX IF NOT EXISTS idx_level_completions_user_level
  ON public.level_completions(user_id, level_id);

-- -----------------------------------------------------------------------------
-- 3. BADGES
--    Reference table of all achievable badges (seeded below).
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.badges (
  id          SERIAL      PRIMARY KEY,
  slug        TEXT        UNIQUE NOT NULL,   -- e.g. 'first_step', 'dungeon_master'
  name        TEXT        NOT NULL,
  description TEXT        NOT NULL,
  icon_key    TEXT        NOT NULL           -- maps to an asset name in the RN app
);

-- Seed badges
INSERT INTO public.badges (slug, name, description, icon_key) VALUES
  ('first_step',     'First Step',       'Complete your very first level!',       'badge_first_step'),
  ('path_finder',    'Path Finder',      'Complete 3 levels without a hint.',      'badge_path_finder'),
  ('key_keeper',     'Key Keeper',       'Collect a key and unlock a door.',       'badge_key_keeper'),
  ('no_wrong_turns', 'No Wrong Turns',   'Beat a level using the fewest steps.',   'badge_no_wrong_turns'),
  ('dungeon_master', 'Dungeon Master',   'Complete all 9 levels!',                 'badge_dungeon_master'),
  ('speed_caster',   'Speed Caster',     'Complete a level in under 5 commands.',  'badge_speed_caster')
ON CONFLICT (slug) DO NOTHING;

-- -----------------------------------------------------------------------------
-- 4. PLAYER BADGES  (junction table)
--    Records which badges each player has unlocked and when.
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.player_badges (
  user_id    UUID        NOT NULL REFERENCES public.player_profiles(user_id) ON DELETE CASCADE,
  badge_id   INTEGER     NOT NULL REFERENCES public.badges(id) ON DELETE CASCADE,
  unlocked_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (user_id, badge_id)
);

-- =============================================================================
-- ROW LEVEL SECURITY (RLS)
-- Players can only read/write their OWN data. No cross-player visibility.
-- =============================================================================

ALTER TABLE public.player_profiles   ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.level_completions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.player_badges     ENABLE ROW LEVEL SECURITY;
-- badges is a public reference table — no RLS needed, allow SELECT for all

-- player_profiles policies
CREATE POLICY "Players read own profile"
  ON public.player_profiles FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Players update own profile"
  ON public.player_profiles FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Players insert own profile"
  ON public.player_profiles FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- level_completions policies
CREATE POLICY "Players read own completions"
  ON public.level_completions FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Players insert own completions"
  ON public.level_completions FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- player_badges policies
CREATE POLICY "Players read own badges"
  ON public.player_badges FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Players insert own badges"
  ON public.player_badges FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Public read access on the badges reference table
GRANT SELECT ON public.badges TO anon, authenticated;
