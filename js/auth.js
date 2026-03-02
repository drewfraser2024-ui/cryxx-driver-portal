// ===== Authentication Module =====
const Auth = {
  currentUser: null,

  buildCurrentUser(user, profile = null) {
    const fallbackName = user?.user_metadata?.name || user?.email?.split('@')[0] || 'User';
    const fallbackRole = user?.user_metadata?.role || 'driver';
    return {
      id: user?.id || null,
      email: user?.email || null,
      name: profile?.name || fallbackName,
      role: profile?.role || fallbackRole
    };
  },

  isProfileMissingError(error) {
    if (!error) return false;
    if (error.code === 'PGRST116') return true;
    const message = String(error.message || '').toLowerCase();
    return message.includes('no rows');
  },

  isDuplicateProfileError(error) {
    if (!error) return false;
    if (error.code === '23505') return true;
    const message = String(error.message || '').toLowerCase();
    return message.includes('duplicate') || message.includes('already exists');
  },

  async init() {
    if (supabaseClient) {
      const { data: { session } } = await supabaseClient.auth.getSession();
      if (session) {
        const { data: profile, error: profileError } = await supabaseClient
          .from('profiles')
          .select('*')
          .eq('id', session.user.id)
          .single();

        if (profileError && !this.isProfileMissingError(profileError)) {
          console.error('Profile lookup failed:', profileError);
        }

        this.currentUser = this.buildCurrentUser(session.user, profile);
        return true;
      }
    }
    return false;
  },

  async login(email, password) {
    const { data, error } = await supabaseClient.auth.signInWithPassword({ email, password });
    if (error) throw error;

    const { data: profile, error: profileError } = await supabaseClient
      .from('profiles')
      .select('*')
      .eq('id', data.user.id)
      .single();

    if (profileError && !this.isProfileMissingError(profileError)) {
      console.error('Profile lookup failed:', profileError);
    }

    this.currentUser = this.buildCurrentUser(data.user, profile);
    return this.currentUser;
  },

  async register(name, email, password, role) {
    const { data, error } = await supabaseClient.auth.signUp({
      email,
      password,
      options: {
        data: { name, role }
      }
    });
    if (error) throw error;

    // If email confirmation is disabled, user is immediately available
    // If email confirmation is enabled, data.user exists but session may be null
    if (!data.user) throw new Error('Registration failed');

    // Auto sign-in after registration if session exists
    if (data.session) {
      // Create profile
      const { error: profileError } = await supabaseClient.from('profiles').insert({
        id: data.user.id,
        name,
        email,
        role
      });
      if (profileError && !this.isDuplicateProfileError(profileError)) throw profileError;

      this.currentUser = this.buildCurrentUser(data.user, { name, role });
      return this.currentUser;
    } else {
      // Email confirmation required - try to sign in anyway
      // (Supabase may auto-confirm if configured)
      try {
        const { data: signInData, error: signInError } = await supabaseClient.auth.signInWithPassword({ email, password });
        if (signInError) {
          throw new Error('Account created! Please check your email to confirm, then log in.');
        }
        // Create profile after sign-in
        const { error: profileError } = await supabaseClient.from('profiles').insert({
          id: signInData.user.id,
          name,
          email,
          role
        });
        if (profileError && !this.isDuplicateProfileError(profileError)) throw profileError;

        this.currentUser = this.buildCurrentUser(signInData.user, { name, role });
        return this.currentUser;
      } catch (e) {
        throw e;
      }
    }
  },

  async logout() {
    await supabaseClient.auth.signOut();
    this.currentUser = null;
  },

  isAdmin() {
    return this.currentUser?.role === 'admin';
  },

  getUserId() {
    return this.currentUser?.id;
  },

  getUserName() {
    return this.currentUser?.name || 'User';
  }
};
