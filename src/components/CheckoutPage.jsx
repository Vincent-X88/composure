import React, { useState } from 'react';
import { startCheckout } from '../lib/billing';
import { AuthForm } from './AuthForm';
import { activateFreePlan } from '../lib/account';

export function CheckoutPage({
  plan,
  downloadUrl,
  session,
  authReady = true,
  currentPlanId,
  onAuthSuccess,
  checkoutStatus,
}) {
  const [error, setError] = useState('');
  const [isRedirecting, setIsRedirecting] = useState(false);
  const isFreePlan = plan?.id === 'free';
  const isCurrentPlan = Boolean(session && currentPlanId === plan.id);
  const isFreeUnavailable = Boolean(isFreePlan && session && currentPlanId !== 'free');

  async function handleCheckout() {
    if (isFreePlan) {
      if (isFreeUnavailable) {
        setError('Free is only available for new accounts. Use billing to cancel your paid plan first.');
        return;
      }

      if (!session) {
        window.location.assign('?view=auth&plan=free');
        return;
      }

      setError('');
      setIsRedirecting(true);

      try {
        await activateFreePlan();
        window.location.assign('?view=account');
      } catch (freePlanError) {
        setError(freePlanError.message);
        setIsRedirecting(false);
      }
      return;
    }

    setError('');
    setIsRedirecting(true);

    try {
      await startCheckout(plan.id);
    } catch (checkoutError) {
      setError(checkoutError.message);
      setIsRedirecting(false);
    }
  }

  return (
    <main className="checkout-page">
      <div className="section-inner checkout-shell">
        <div className="checkout-topbar">
          <a className="back-link" href="/">
            Back to homepage
          </a>
          <a className="button button-secondary" href={downloadUrl} target="_blank" rel="noreferrer">
            Download for Windows
          </a>
        </div>

        {checkoutStatus === 'cancelled' ? (
          <div className="checkout-alert">
            Checkout was cancelled. You can try again whenever you’re ready.
          </div>
        ) : null}

        {isCurrentPlan ? (
          <div className="checkout-alert checkout-alert--neutral">
            You already have the {plan.name} plan. Choose a different plan below if you want to change it.
          </div>
        ) : null}

        <div className="checkout-grid">
          <section className="checkout-main">
            <p className="section-eyebrow">Secure checkout</p>
            <h1 className="checkout-title">Complete your {plan.name} purchase</h1>
            <p className="checkout-copy">
              {isFreePlan
                ? 'Create your account to activate the free plan and start using Composure.'
                : 'Finish your purchase securely, then return to download Composure and get started.'}
            </p>

            {!authReady ? (
              <div className="checkout-alert checkout-alert--neutral">
                Checking your account status...
              </div>
            ) : !session ? (
              <AuthForm planName={plan.name} onSuccess={onAuthSuccess} />
            ) : null}

            <div className="checkout-action">
              <button
                type="button"
                className="button button-primary"
        disabled={
          !authReady ||
          (isFreePlan ? isFreeUnavailable || isRedirecting : !session || isRedirecting || isCurrentPlan)
        }
        onClick={handleCheckout}
      >
        {isFreePlan
                  ? isFreeUnavailable
                    ? 'Free unavailable'
                    : session
                      ? 'Activate free plan'
                      : 'Create free account'
                  : isCurrentPlan
                    ? 'Current plan'
                    : isRedirecting
                      ? 'Opening checkout...'
                      : 'Continue to secure checkout'}
              </button>
              <p className="checkout-note">
                {isFreePlan
                  ? isFreeUnavailable
                    ? 'Free is available only for new accounts.'
                    : session
                      ? 'Your free plan will be activated on your account.'
                      : 'Create your account to activate the free plan.'
                  : isCurrentPlan
                  ? 'This plan is already active on your account.'
                  : session
                  ? 'You will be taken to a secure payment page to complete your order.'
                  : 'Create an account or sign in to continue with this purchase.'}
              </p>
              {error ? <p className="checkout-error">{error}</p> : null}
            </div>
          </section>

          <aside className="checkout-sidebar">
            <div className="checkout-summary">
              <p className="summary-label">Your plan</p>
              <h2>{plan.name}</h2>
              <div className="summary-price">
                {plan.price}
                <sub>/{plan.cadence ?? 'mo'}</sub>
              </div>
              {plan.displayCurrency === 'USD' && plan.checkoutCurrency === 'ZAR' && plan.localPrice ? (
                <p className="pricing-note pricing-note--inline">
                  Your card will be charged <strong>{plan.localPrice}</strong> in ZAR. Your bank
                  handles the conversion at checkout.
                </p>
              ) : null}
              <p className="summary-description">{plan.description}</p>
              <ul className="summary-features">
                {plan.features.map((feature) => (
                  <li key={feature}>{feature}</li>
                ))}
              </ul>
            </div>

            <div className="download-panel">
              <p className="summary-label">Get started</p>
              <h3>Download the Windows app</h3>
              <p>
                You can download the app now and come back whenever you’re ready.
              </p>
              <a className="button button-secondary" href={downloadUrl} target="_blank" rel="noreferrer">
                Download for Windows
              </a>
            </div>
          </aside>
        </div>
      </div>
    </main>
  );
}
