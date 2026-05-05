import 'react-native-url-polyfill/auto'; // Required for Supabase in React Native
import { createClient } from '@supabase/supabase-js';

// ---------------------------------------------------------------------------
// Client initialisation
// Store these values in an .env file as EXPO_PUBLIC_SUPABASE_URL etc.
// ---------------------------------------------------------------------------
const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL ?? '';
const SUPABASE_ANON_KEY = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ?? '';

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  console.warn(
    '[SupabaseService] Missing env vars EXPO_PUBLIC_SUPABASE_URL / EXPO_PUBLIC_SUPABASE_ANON_KEY. ' +
    'Create a .env file at the project root.'
  );
}

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// ---------------------------------------------------------------------------
// Shared response shape
// Every function returns { data, error } so the front-end always has a
// predictable contract — no raw throws escape to the caller.
// ---------------------------------------------------------------------------
type ServiceResponse<T> = { data: T | null; error: string | null };

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------

/** Maps a numeric age into the game's three UI tiers. */
const toAgeGroup = (age: number): '5-9' | '9-14' | '14+' => {
  if (age < 9) return '5-9';
  if (age < 14) return '9-14';
  return '14+';
};

/** XP thresholds for badge evaluation (mirrors LEVEL_CONFIGS in the store). */
const XP_PER_LEVEL = 100;
const BADGE_SLUGS = {
  FIRST_STEP:     'first_step',
  KEY_KEEPER:     'key_keeper',
  DUNGEON_MASTER: 'dungeon_master',
  SPEED_CASTER:   'speed_caster',
} as const;

// ---------------------------------------------------------------------------
// AUTH
// ---------------------------------------------------------------------------

/**
 * Sign up a new player.
 *
 * COPPA note: `parentalConsent` MUST be collected via a parent/guardian
 * confirmation flow before this function is called.  The flag is stored in
 * `player_profiles.parental_consent` so it can be audited server-side.
 *
 * Validates:
 *  - email is non-empty and contains '@'
 *  - password is at least 8 characters
 *  - age is 5–17 (inclusive)
 *  - parentalConsent is true for users under 13 (COPPA requirement)
 */
export const signUpUser = async (
  email: string,
  password: string,
  age: number,
  parentalConsent: boolean,
  characterClass: 'Mage' | 'Warrior' | 'Archer' = 'Mage',
): Promise<ServiceResponse<{ userId: string }>> => {
  // --- Input validation -------------------------------------------------------
  if (!email || !email.includes('@')) {
    return { data: null, error: 'A valid email address is required.' };
  }
  if (!password || password.length < 8) {
    return { data: null, error: 'Password must be at least 8 characters.' };
  }
  if (typeof age !== 'number' || age < 5 || age > 17) {
    return { data: null, error: 'Age must be between 5 and 17.' };
  }
  if (age < 13 && !parentalConsent) {
    return { data: null, error: 'Parental consent is required for players under 13.' };
  }

  try {
    // 1. Create the Supabase Auth account
    const { data: authData, error: authError } = await supabase.auth.signUp({ email, password });
    if (authError) throw new Error(authError.message);
    if (!authData.user) throw new Error('User creation returned no user object.');

    const userId = authData.user.id;

    // 2. Provision the RPG profile row
    const { error: profileError } = await supabase
      .from('player_profiles')
      .insert({
        user_id:           userId,
        age_group:         toAgeGroup(age),
        level:             1,
        xp:                0,
        highest_level:     1,
        courses_completed: 0,
        character_class:   characterClass,
        has_premium:       false,
        parental_consent:  parentalConsent,
        created_at:        new Date().toISOString(),
      });

    if (profileError) throw new Error(profileError.message);

    return { data: { userId }, error: null };
  } catch (err: any) {
    console.error('[SupabaseService] signUpUser error:', err.message);
    return { data: null, error: err.message ?? 'An unexpected error occurred during sign-up.' };
  }
};

/**
 * Sign in an existing player with email + password.
 */
export const signInUser = async (
  email: string,
  password: string,
): Promise<ServiceResponse<{ userId: string }>> => {
  if (!email || !email.includes('@')) {
    return { data: null, error: 'A valid email address is required.' };
  }
  if (!password) {
    return { data: null, error: 'Password is required.' };
  }

  try {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw new Error(error.message);
    if (!data.user) throw new Error('Sign-in returned no user.');

    return { data: { userId: data.user.id }, error: null };
  } catch (err: any) {
    console.error('[SupabaseService] signInUser error:', err.message);
    return { data: null, error: err.message ?? 'Sign-in failed.' };
  }
};

/**
 * Sign out the currently authenticated player.
 */
export const signOutUser = async (): Promise<ServiceResponse<null>> => {
  try {
    const { error } = await supabase.auth.signOut();
    if (error) throw new Error(error.message);
    return { data: null, error: null };
  } catch (err: any) {
    console.error('[SupabaseService] signOutUser error:', err.message);
    return { data: null, error: err.message ?? 'Sign-out failed.' };
  }
};

/**
 * Returns the currently active Supabase session, or null if not authenticated.
 * Useful for restoring session state on app launch.
 */
export const getCurrentSession = async () => {
  const { data: { session } } = await supabase.auth.getSession();
  return session;
};

// ---------------------------------------------------------------------------
// PLAYER PROGRESS
// ---------------------------------------------------------------------------

export type PlayerProfile = {
  level:             number;
  xp:                number;
  highestLevel:      number;
  coursesCompleted:  number;
  ageGroup:          string;
  characterClass:    string;
  hasPremium:        boolean;
  parentalConsent:   boolean;
};

/**
 * Fetches the full RPG profile for a user (called on login to hydrate the store).
 */
export const fetchPlayerProgress = async (
  userId: string,
): Promise<ServiceResponse<PlayerProfile>> => {
  if (!userId) return { data: null, error: 'userId is required.' };

  try {
    const { data, error } = await supabase
      .from('player_profiles')
      .select('level, xp, highest_level, courses_completed, age_group, character_class, has_premium, parental_consent')
      .eq('user_id', userId)
      .single();

    if (error) throw new Error(error.message);

    return {
      data: {
        level:            data.level,
        xp:               data.xp,
        highestLevel:     data.highest_level,
        coursesCompleted: data.courses_completed,
        ageGroup:         data.age_group,
        characterClass:   data.character_class,
        hasPremium:       data.has_premium,
        parentalConsent:  data.parental_consent,
      },
      error: null,
    };
  } catch (err: any) {
    console.error('[SupabaseService] fetchPlayerProgress error:', err.message);
    return { data: null, error: err.message ?? 'Failed to fetch progress.' };
  }
};

/**
 * Persists the player's RPG progress after a level completion.
 * Uses upsert so it is safe to call even if the profile row is out of sync.
 *
 * Validates: level 1–10, xp >= 0, coursesCompleted >= 0.
 */
export const savePlayerProgress = async (
  userId:           string,
  level:            number,
  xp:               number,
  highestLevel:     number,
  coursesCompleted: number,
): Promise<ServiceResponse<null>> => {
  if (!userId) return { data: null, error: 'userId is required.' };
  if (level < 1 || level > 10) return { data: null, error: 'level must be between 1 and 10.' };
  if (xp < 0) return { data: null, error: 'xp cannot be negative.' };
  if (highestLevel < 1 || highestLevel > 10) return { data: null, error: 'highestLevel must be between 1 and 10.' };
  if (coursesCompleted < 0) return { data: null, error: 'coursesCompleted cannot be negative.' };

  try {
    const { error } = await supabase
      .from('player_profiles')
      .upsert({
        user_id:           userId,
        level,
        xp,
        highest_level:     highestLevel,
        courses_completed: coursesCompleted,
        last_played_at:    new Date().toISOString(),
      }, { onConflict: 'user_id' });

    if (error) throw new Error(error.message);
    return { data: null, error: null };
  } catch (err: any) {
    console.error('[SupabaseService] savePlayerProgress error:', err.message);
    return { data: null, error: err.message ?? 'Failed to save progress.' };
  }
};

// ---------------------------------------------------------------------------
// LEVEL COMPLETIONS  (append-only audit log)
// ---------------------------------------------------------------------------

/**
 * Records a successful level run and evaluates badge unlocks.
 * Call this from the game store immediately after `levelComplete` is set true.
 *
 * Returns the list of newly unlocked badge slugs (may be empty).
 */
export const recordLevelCompletion = async (
  userId:    string,
  levelId:   number,
  stepsUsed: number,
  xpEarned:  number,
): Promise<ServiceResponse<{ newBadges: string[] }>> => {
  if (!userId) return { data: null, error: 'userId is required.' };
  if (levelId < 1 || levelId > 9) return { data: null, error: 'levelId must be between 1 and 9.' };
  if (stepsUsed < 0) return { data: null, error: 'stepsUsed cannot be negative.' };
  if (xpEarned < 0) return { data: null, error: 'xpEarned cannot be negative.' };

  try {
    // 1. Append completion record
    const { error: insertError } = await supabase
      .from('level_completions')
      .insert({
        user_id:      userId,
        level_id:     levelId,
        steps_used:   stepsUsed,
        xp_earned:    xpEarned,
        completed_at: new Date().toISOString(),
      });

    if (insertError) throw new Error(insertError.message);

    // 2. Evaluate badges
    const newBadges = await evaluateBadges(userId, levelId, stepsUsed);

    return { data: { newBadges }, error: null };
  } catch (err: any) {
    console.error('[SupabaseService] recordLevelCompletion error:', err.message);
    return { data: null, error: err.message ?? 'Failed to record level completion.' };
  }
};

// ---------------------------------------------------------------------------
// BADGES
// ---------------------------------------------------------------------------

/**
 * Returns all badges the player has already unlocked.
 */
export const fetchPlayerBadges = async (
  userId: string,
): Promise<ServiceResponse<{ slug: string; name: string; iconKey: string; unlockedAt: string }[]>> => {
  if (!userId) return { data: null, error: 'userId is required.' };

  try {
    const { data, error } = await supabase
      .from('player_badges')
      .select('unlocked_at, badges(slug, name, icon_key)')
      .eq('user_id', userId)
      .order('unlocked_at', { ascending: false });

    if (error) throw new Error(error.message);

    const mapped = (data ?? []).map((row: any) => ({
      slug:       row.badges.slug,
      name:       row.badges.name,
      iconKey:    row.badges.icon_key,
      unlockedAt: row.unlocked_at,
    }));

    return { data: mapped, error: null };
  } catch (err: any) {
    console.error('[SupabaseService] fetchPlayerBadges error:', err.message);
    return { data: null, error: err.message ?? 'Failed to fetch badges.' };
  }
};

// ---------------------------------------------------------------------------
// Internal: Badge evaluation logic
// ---------------------------------------------------------------------------

/**
 * Checks which badges the player qualifies for after a level completion,
 * inserts any that are new, and returns the slugs of newly unlocked ones.
 *
 * Badge rules:
 *  first_step     — Complete any level for the first time
 *  key_keeper     — Complete a level that has a key (levels 6–9)
 *  speed_caster   — Complete a level in ≤ 5 commands
 *  dungeon_master — Complete all 9 levels at least once
 */
const evaluateBadges = async (
  userId:    string,
  levelId:   number,
  stepsUsed: number,
): Promise<string[]> => {
  const newBadges: string[] = [];

  try {
    // Fetch badge reference IDs we might need
    const { data: allBadges, error: badgeRefErr } = await supabase
      .from('badges')
      .select('id, slug');
    if (badgeRefErr || !allBadges) return [];

    const badgeIdMap: Record<string, number> = {};
    allBadges.forEach((b: any) => { badgeIdMap[b.slug] = b.id; });

    // Fetch already-unlocked badge IDs to avoid duplicates
    const { data: existing } = await supabase
      .from('player_badges')
      .select('badge_id')
      .eq('user_id', userId);
    const alreadyUnlocked = new Set((existing ?? []).map((r: any) => r.badge_id));

    const toUnlock: number[] = [];

    const maybeMark = (slug: string) => {
      const id = badgeIdMap[slug];
      if (id !== undefined && !alreadyUnlocked.has(id)) {
        toUnlock.push(id);
        newBadges.push(slug);
        alreadyUnlocked.add(id); // prevent duplicate in same run
      }
    };

    // Rule: first_step — awarded on the first completion of *any* level
    const { count: totalCompletions } = await supabase
      .from('level_completions')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', userId);
    if ((totalCompletions ?? 0) <= 1) maybeMark(BADGE_SLUGS.FIRST_STEP);

    // Rule: key_keeper — levels 6-9 have a key mechanic
    if (levelId >= 6) maybeMark(BADGE_SLUGS.KEY_KEEPER);

    // Rule: speed_caster — complete a level in ≤ 5 steps
    if (stepsUsed <= 5) maybeMark(BADGE_SLUGS.SPEED_CASTER);

    // Rule: dungeon_master — at least one completion of each level 1-9
    const { data: completedLevels } = await supabase
      .from('level_completions')
      .select('level_id')
      .eq('user_id', userId);
    const uniqueLevels = new Set((completedLevels ?? []).map((r: any) => r.level_id));
    const allNineDone = [1,2,3,4,5,6,7,8,9].every(l => uniqueLevels.has(l));
    if (allNineDone) maybeMark(BADGE_SLUGS.DUNGEON_MASTER);

    // Insert all newly earned badges in a single batch
    if (toUnlock.length > 0) {
      const rows = toUnlock.map(badge_id => ({
        user_id:     userId,
        badge_id,
        unlocked_at: new Date().toISOString(),
      }));
      await supabase.from('player_badges').insert(rows);
    }
  } catch (err: any) {
    console.error('[SupabaseService] evaluateBadges error:', err.message);
  }

  return newBadges;
};
