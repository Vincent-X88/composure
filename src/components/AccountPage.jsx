import React, { useState } from 'react';
import { PricingCard } from './PricingCard';
import { openCustomerPortal } from '../lib/billing';
import { AuthForm } from './AuthForm';

function formatDate(value) {
  if (!value) {
    return 'No renewal date';
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return 'No renewal date';
  }

  return new Intl.DateTimeFormat('en-ZA', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(date);
}

export function AccountPage({ session, subscription, pricingPlans, downloadUrl, onSignOut }) {
  const [billingError, setBillingError] = useState('');
  const [isOpeningBilling, setIsOpeningBilling] = useState(false);
  const currentPlanId = subscription?.plan ?? 'free';
  const currentPlan = pricingPlans.find((plan) => plan.id === currentPlanId) ?? pricingPlans[0];
  const nextDue = currentPlanId === 'pro' ? formatDate(subscription?.current_period_end) : 'No renewal';
  const statusLabel = subscription?.status ?? 'trialing';
  const isPro = currentPlanId === 'pro';
  const canManageBilling = isPro && Boolean(subscription?.paystack_subscription_code);

  async function handleManageBilling() {
    setBillingError('');
    setIsOpeningBilling(true);

    try {
      await openCustomerPortal();
    } catch (error) {
      setBillingError(error.message);
      setIsOpeningBilling(false);
    }
  }

  if (!session) {
    return (
      <main className="auth-page">
        <div className="section-inner auth-layout">
          <a className="back-link" href="/">
            Back to homepage
          </a>

          <section className="auth-hero">
            <p className="eyebrow">Account</p>
            <h1>Sign in to view your account</h1>
            <p>Your current plan, renewal date, and plan changes will appear here after you sign in.</p>
          </section>

          <AuthForm mode="signin" />
        </div>
      </main>
    );
  }

  return (
    <main className="checkout-page">
      <div className="section-inner checkout-shell">
        <div className="checkout-topbar">
          <a className="back-link" href="/">
            Back to homepage
          </a>
        </div>

        <section className="checkout-main checkout-result account-hero">
          <div className="success-mark" aria-hidden="true">
            <span />
          </div>
          <p className="section-eyebrow">Your account</p>
          <h1 className="checkout-title">Manage your Composure plan</h1>
          <p className="checkout-copy">
            See your active plan, next payment date, and switch to another plan when you’re ready.
          </p>

          <div className="success-highlights">
            <div className="success-highlight">
              <span className="success-highlight-label">Current plan</span>
              <strong>{currentPlan?.name ?? 'Free'}</strong>
            </div>
            <div className="success-highlight">
              <span className="success-highlight-label">Next payment</span>
              <strong>{nextDue}</strong>
            </div>
            <div className="success-highlight">
              <span className="success-highlight-label">Status</span>
              <strong>{statusLabel}</strong>
            </div>
          </div>

          <div className="hero-actions" id="billing">
            {canManageBilling ? (
              <button className="button button-secondary" type="button" disabled={isOpeningBilling} onClick={handleManageBilling}>
                {isOpeningBilling ? 'Opening billing...' : 'Manage or cancel subscription'}
              </button>
            ) : null}
          </div>

          <p className="checkout-note">
            {currentPlanId === 'premium'
              ? 'Premium is a one-time purchase, so there is no recurring renewal date.'
              : currentPlanId === 'pro'
                ? 'Your Pro plan renews automatically unless you change it.'
                : 'You are currently on the free plan.'}
          </p>

          <div className="success-footer">
            <span>
              {isPro && !subscription?.paystack_subscription_code
                ? 'Billing management will appear once your subscription code is available.'
                : isPro
                  ? 'You can manage or cancel your Pro subscription from the billing page.'
                  : 'Choose another plan below if you want to upgrade or change your billing cycle.'}
            </span>
          </div>

          {billingError ? <p className="checkout-error">{billingError}</p> : null}
        </section>

        <section className="content-section account-plans" id="pricing">
          <div className="section-heading">
            <p className="eyebrow">Change plan</p>
            <h2 className="section-title">Switch whenever you want</h2>
            <p className="section-body">
              Your current plan is marked below. The active one is disabled so you can’t subscribe to it again.
            </p>
          </div>

          <div className="pricing-grid">
            {pricingPlans.map((plan) => (
              <PricingCard
                key={plan.id}
                plan={plan}
                session={session}
                currentPlanId={currentPlanId}
                isCurrentPlan={plan.id === currentPlanId}
              />
            ))}
          </div>
        </section>
      </div>
    </main>
  );
}
