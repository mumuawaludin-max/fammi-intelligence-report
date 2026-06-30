import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = "https://hypzmczwpigkyomzgjdb.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imh5cHptY3p3cGlna3lvbXpnamRiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODI4MjU4MDgsImV4cCI6MjA5ODQwMTgwOH0.MxTMWmhfIwHZ-w4nqQnOQNji69NnjTmY1poN6-74KVk";

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
