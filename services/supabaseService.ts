import 'react-native-url-polyfill/auto'; // Required for Supabase in React Native
import { createClient } from '@supabase/supabase-js';

// TODO: Replace with your actual Supabase project URL and anon key, 
// preferably stored in an .env file as EXPO_PUBLIC_SUPABASE_URL
const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL || 'YOUR_SUPABASE_URL';
const SUPABASE_ANON_KEY = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || 'YOUR_SUPABASE_ANON_KEY';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

/**
 * Helper to map age into your predefined game UI categories
 */
const determineAgeGroup = (age) => {
  if (age < 9) return '5-9';
  if (age < 14) return '9-14';
  return '14+';
};

/**
 * Registers a new player and provisions an initial RPG attributes row.
 */
export const signUpUser = async (email, password, age) => {
  try {
    // 1. Authenticate / Create user via Supabase Auth
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password,
    });

    if (authError) throw authError;

    // 2. Provision initial RPG profile if sign up was fully successful
    if (authData?.user) {
      const { error: profileError } = await supabase
        .from('player_profiles')
        .insert([
          {
            user_id: authData.user.id,
            age_group: determineAgeGroup(age),
            level: 1,
            xp: 0,
            courses_completed: 0,
            character_class: 'Mage', // Default class
            created_at: new Date().toISOString()
          }
        ]);

      if (profileError) {
        console.error('Failed to create initial player metrics:', profileError);
        throw profileError;
      }
    }

    return { data: authData, error: null };
  } catch (err) {
    console.error('Signup Error:', err.message);
    return { data: null, error: err };
  }
};

/**
 * Saves RPG progress incrementally whenever a kid finishes a lesson sequence.
 * Uses upsert to cleanly merge updates.
 */
export const savePlayerProgress = async (userId, level, xp, coursesCompleted) => {
  try {
    const { data, error } = await supabase
      .from('player_profiles')
      .upsert({
        user_id: userId,
        level: level,
        xp: xp,
        courses_completed: coursesCompleted,
        last_played_at: new Date().toISOString(),
      }, {
        onConflict: 'user_id' // Resolves duplicates safely 
      })
      .select();

    if (error) throw error;

    return { data, error: null };
  } catch (err) {
    console.error('Save Progress Error:', err.message);
    return { data: null, error: err };
  }
};

/**
 * Fetches the raw RPG stats (usually dispatched immediately to Zustand on login).
 */
export const fetchPlayerProgress = async (userId) => {
  try {
    const { data, error } = await supabase
      .from('player_profiles')
      .select('level, xp, courses_completed, age_group, character_class')
      .eq('user_id', userId)
      .single();

    if (error) throw error;

    return { data, error: null };
  } catch (err) {
    console.error('Fetch Progress Error:', err.message);
    return { data: null, error: err };
  }
};
