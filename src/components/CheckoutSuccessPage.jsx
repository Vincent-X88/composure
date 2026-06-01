import React, { useState } from 'react';
import { openCustomerPortal } from '../lib/billing';

export function CheckoutSuccessPage({ downloadUrl, session, authReady = true, plan }) {
  const [billingError, setBillingError] = useState('');
  const [isOpeningPortal, setIsOpeningPortal] = useState(false);
  const canManageBilling = Boolean(session);
  const isFreePlan = plan?.id === 'free';
  const isProPlan = plan?.id === 'pro';
  const isPremiumPlan = plan?.id === 'premium';
  const canManageSubscription = canManageBilling && isProPlan;

  async function handleManageBilling() {
    setBillingError('');
    setIsOpeningPortal(true);

    try {
      await openCustomerPortal();
    } catch (error) {
      setBillingError(error.message);
      setIsOpeningPortal(false);
    }
  }

  return (
    <main className="checkout-page">
      <div className="section-inner checkout-shell">
        <div className="checkout-topbar">
          <a className="back-link" href="/">
            Back to homepage
          </a>
          <a className="button button-secondary" href={session ? '?view=account' : '/'}>
            {session ? 'Go to account' : 'Home'}
          </a>
        </div>

        <section className="checkout-main checkout-result">
          <div className="success-mark" aria-hidden="true">
            <span />
          </div>
          <p className="section-eyebrow">{isFreePlan ? 'Account ready' : 'Purchase complete'}</p>
          <h1 className="checkout-title">{isFreePlan ? 'Your Composure account is ready' : 'You are all set'}</h1>
          <p className="checkout-copy">
            {!authReady
              ? 'We are setting up your account. One moment while we confirm your plan.'
              : isFreePlan
                ? 'Your account is ready. Download the app and use your free plan whenever you want.'
              : isProPlan
                ? 'Your Pro plan is active. Download the app and manage your subscription anytime.'
                : 'Your Premium purchase is complete. Download the app and enjoy lifetime access.'}
          </p>

          <div className="success-highlights">
            <div className="success-highlight">
              <span className="success-highlight-label">Status</span>
              <strong>{!authReady ? 'Setting up' : isFreePlan ? 'Ready' : 'Active'}</strong>
            </div>
            <div className="success-highlight">
              <span className="success-highlight-label">Plan</span>
              <strong>{plan?.name}</strong>
            </div>
            <div className="success-highlight">
              <span className="success-highlight-label">Access</span>
              <strong>{!authReady ? 'Loading' : isPremiumPlan ? 'Lifetime' : 'Managed'}</strong>
            </div>
          </div>

          <div className="hero-actions">
            <a className="button button-primary" href={downloadUrl} target="_blank" rel="noreferrer">
              Download for Windows
            </a>
            <a className="button button-secondary" href="/">
              Back to homepage
            </a>
            {canManageSubscription ? (
              <button
                className="button button-secondary"
                type="button"
                disabled={isOpeningPortal}
                onClick={handleManageBilling}
              >
                {isOpeningPortal ? 'Opening billing...' : 'Manage or cancel subscription'}
              </button>
            ) : isPremiumPlan ? (
              <a className="button button-secondary" href="/">
                Back to homepage
              </a>
            ) : (
              <a className="button button-secondary" href={session ? '?view=account' : '?view=auth'}>
                {session ? 'Go to account' : 'Sign in'}
              </a>
            )}
          </div>

          <p className="checkout-note">
            {!authReady
              ? 'Your account is being prepared. Please wait a moment.'
              : isProPlan
              ? 'You can update your plan from the billing page whenever needed.'
              : isPremiumPlan
                ? 'Your purchase does not renew automatically.'
                : 'Your free plan is linked to your account and ready to use.'}
          </p>

          <div className="success-footer">
            <span>{isPremiumPlan ? 'Lifetime access unlocked' : 'Your account is ready to use'}</span>
          </div>

          {billingError ? <p className="checkout-error">{billingError}</p> : null}
        </section>
      </div>
    </main>
  );
}
