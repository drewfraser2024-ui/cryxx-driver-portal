// ===== Supabase Configuration =====
const SUPABASE_URL = 'https://iljabdupmfheyvcydzpp.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlsamFiZHVwbWZoZXl2Y3lkenBwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzEwMTIzMDksImV4cCI6MjA4NjU4ODMwOX0.E5L7pYQUCmlUJGvBpoRgUEPM5k4RqPtbUF2fx3lxWZY';

let supabaseClient = null;

function initSupabase() {
  try {
    supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
    console.log('Supabase connected successfully');
    return supabaseClient;
  } catch (err) {
    console.error('Supabase init failed, using localStorage fallback:', err);
    return null;
  }
}

// ===== Database Abstraction Layer =====
const DB = {
  async insert(table, record) {
    if (supabaseClient) {
      const { data, error } = await supabaseClient.from(table).insert(record).select();
      if (error) throw error;
      return data[0];
    }
    throw new Error('Database not connected');
  },

  async select(table, filters = {}) {
    if (supabaseClient) {
      let query = supabaseClient.from(table).select('*');
      for (const [key, value] of Object.entries(filters)) {
        query = query.eq(key, value);
      }
      const { data, error } = await query.order('created_at', { ascending: false });
      if (error) throw error;
      return data;
    }
    throw new Error('Database not connected');
  },

  async update(table, id, updates) {
    if (supabaseClient) {
      const { data, error } = await supabaseClient.from(table).update(updates).eq('id', id).select();
      if (error) throw error;
      return data[0];
    }
    throw new Error('Database not connected');
  },

  async delete(table, id) {
    if (supabaseClient) {
      const { error } = await supabaseClient.from(table).delete().eq('id', id);
      if (error) throw error;
      return true;
    }
    throw new Error('Database not connected');
  },

  async count(table, filters = {}) {
    if (supabaseClient) {
      let query = supabaseClient.from(table).select('*', { count: 'exact', head: true });
      for (const [key, value] of Object.entries(filters)) {
        query = query.eq(key, value);
      }
      const { count, error } = await query;
      if (error) throw error;
      return count;
    }
    throw new Error('Database not connected');
  }
};
