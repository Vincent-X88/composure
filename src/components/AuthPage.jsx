import React from 'react';
import { AuthForm } from './AuthForm';

export function AuthPage({ plan, authReady = true, onAuthSuccess }) {
  const isFreePlan = plan?.id === 'free';

  return (
    <main className="auth-page">
      <div className="section-inner auth-layout">
        <a className="back-link" href="/">
          Back to homepage
        </a>

        <section className="auth-hero">
          <p className="eyebrow">Account</p>
          <h1>{isFreePlan ? 'Create your free account' : 'Sign in to continue'}</h1>
          <p>
            {isFreePlan
              ? 'Create your account to start using Composure and unlock the free plan.'
              : 'Sign in so your purchase stays linked to your account and you can continue securely.'}
          </p>
        </section>

        {!authReady ? (
          <div className="auth-panel auth-panel--loading">
            <p className="section-eyebrow">Loading account</p>
            <h2>Checking your sign-in status</h2>
            <p>One moment while we load your account.</p>
          </div>
        ) : (
          <AuthForm planName={plan?.name} onSuccess={onAuthSuccess} />
        )}
      </div>
    </main>
  );
}
