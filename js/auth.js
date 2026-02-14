// ===== Authentication Module =====
const Auth = {
  currentUser: null,

  async init() {
    if (supabaseClient) {
      const { data: { session } } = await supabaseClient.auth.getSession();
      if (session) {
        const { data: profile } = await supabaseClient
          .from('profiles')
          .select('*')
          .eq('id', session.user.id)
          .single();
        if (profile) {
          this.currentUser = {
            id: session.user.id,
            email: session.user.email,
            name: profile.name,
            role: profile.role
          };
          return true;
        }
      }
    }
    return false;
  },

  async login(email, password) {
    const { data, error } = await supabaseClient.auth.signInWithPassword({ email, password });
    if (error) throw error;

    const { data: profile } = await supabaseClient
      .from('profiles')
      .select('*')
      .eq('id', data.user.id)
      .single();

    this.currentUser = {
      id: data.user.id,
      email: data.user.email,
      name: profile?.name || email.split('@')[0],
      role: profile?.role || 'driver'
    };
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
      if (profileError) throw profileError;

      this.currentUser = {
        id: data.user.id,
        email,
        name,
        role
      };
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
        if (profileError && !profileError.message.includes('duplicate')) throw profileError;

        this.currentUser = {
          id: signInData.user.id,
          email,
          name,
          role
        };
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
