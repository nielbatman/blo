import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://xkpbjripquvlemydwrtz.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhrcGJqcmlwcXV2bGVteWR3cnR6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjIyMjg2MTcsImV4cCI6MjA3NzgwNDYxN30.zZHHZsMhSCdGnTl2dO8fjUeIRUQ6F1KeoIRObhSOPKM';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export type BlotterEntry = {
  id?: number;
  blotter_entry: string;
  first_name: string;
  last_name: string;
  case_type: string;
  date: string;
  created_at?: string;
};
