import React, { useState } from 'react';
import { isSupabaseConfigured, supabase } from '../lib/supabase';

function GoogleIcon() {
  return (
    <svg className="auth-google-icon" viewBox="0 0 24 24" aria-hidden="true">
      <path
        fill="#4285F4"
        d="M21.35 11.1H12v2.98h5.35c-.23 1.34-.94 2.48-2.01 3.24v2.69h3.25c1.9-1.75 2.99-4.32 2.99-7.36 0-.68-.06-1.34-.23-1.55Z"
      />
      <path
        fill="#34A853"
        d="M12 22c2.7 0 4.96-.9 6.61-2.45l-3.25-2.69c-.9.61-2.06.97-3.36.97-2.58 0-4.77-1.74-5.55-4.08H3.05v2.78A10 10 0 0 0 12 22Z"
      />
      <path
        fill="#FBBC05"
        d="M6.45 13.75A5.98 5.98 0 0 1 6.14 12c0-.61.1-1.2.31-1.75V7.47H3.05A10 10 0 0 0 2 12c0 1.61.39 3.13 1.05 4.53l3.4-2.78Z"
      />
      <path
        fill="#EA4335"
        d="M12 5.96c1.47 0 2.79.51 3.83 1.5l2.87-2.87A9.95 9.95 0 0 0 12 2C8.09 2 4.68 4.24 3.05 7.47l3.4 2.78C7.23 7.7 9.42 5.96 12 5.96Z"
      />
    </svg>
  );
}

export function AuthForm({ planName, mode = 'signup', onSuccess }) {
  const [authMode, setAuthMode] = useState(mode);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const isSignup = authMode === 'signup';

  async function handleSubmit(event) {
    event.preventDefault();
    setMessage('');

    if (!isSupabaseConfigured) {
      setMessage('Account setup is not available right now. Please try again shortly.');
      return;
    }

    setIsSubmitting(true);

    const redirectTo = `${window.location.origin}${window.location.pathname}${window.location.search}`;
    const response = isSignup
      ? await supabase.auth.signUp({
          email,
          password,
          options: { emailRedirectTo: redirectTo },
        })
      : await supabase.auth.signInWithPassword({ email, password });

    setIsSubmitting(false);

    if (response.error) {
      setMessage(response.error.message);
      return;
    }

    if (isSignup && !response.data.session) {
      setMessage('Check your email to confirm your account, then come back to continue.');
      return;
    }

    setMessage('');
    onSuccess?.();
  }

  async function handleGoogleAuth() {
    setMessage('');

    if (!isSupabaseConfigured) {
      setMessage('Account setup is not available right now. Please try again shortly.');
      return;
    }

    setIsSubmitting(true);

    const redirectTo = `${window.location.origin}${window.location.pathname}${window.location.search}`;
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo,
      },
    });

    if (error) {
      setIsSubmitting(false);
      setMessage(error.message);
    }
  }

  return (
    <div className="auth-panel">
      <div className="auth-tabs" aria-label="Account action">
        <button
          type="button"
          className={isSignup ? 'is-active' : ''}
          onClick={() => setAuthMode('signup')}
        >
          Create account
        </button>
        <button
          type="button"
          className={!isSignup ? 'is-active' : ''}
          onClick={() => setAuthMode('signin')}
        >
          Sign in
        </button>
      </div>

      <h2>{isSignup ? 'Create your Composure account' : 'Welcome back'}</h2>
      <p>
        {planName
          ? `Use this account to continue with your ${planName} plan and app access.`
          : 'Use this account to continue with your purchase and app access.'}
      </p>

      <form className="auth-form" onSubmit={handleSubmit}>
        <label>
          Email
          <input
            type="email"
            value={email}
            autoComplete="email"
            placeholder="you@example.com"
            onChange={(event) => setEmail(event.target.value)}
            required
          />
        </label>

        <label>
          Password
          <input
            type="password"
            value={password}
            autoComplete={isSignup ? 'new-password' : 'current-password'}
            placeholder="Minimum 6 characters"
            minLength={6}
            onChange={(event) => setPassword(event.target.value)}
            required
          />
        </label>

        <button className="button button-primary" type="submit" disabled={isSubmitting}>
          {isSubmitting ? 'Working...' : isSignup ? 'Create account' : 'Sign in'}
        </button>
      </form>

      <div className="auth-divider" role="separator" aria-label="Or continue with Google">
        <span>or</span>
      </div>

      <button
        type="button"
        className="button button-secondary auth-google-button"
        disabled={isSubmitting}
        onClick={handleGoogleAuth}
      >
        {isSubmitting ? null : <GoogleIcon />}
        <span>{isSubmitting ? 'Working...' : 'Continue with Google'}</span>
      </button>

      {message ? <p className="auth-message">{message}</p> : null}
    </div>
  );
}
