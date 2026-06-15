import React, { useEffect, useState } from 'react';
import { PricingCard } from './PricingCard';
import { FAQItem } from './FAQItem';
import { faqItems } from '../data/siteContent';

/**
 * PricingPage — accessible via ?view=pricing
 *
 * Uses only your existing CSS classes / design tokens — no extra stylesheet needed.
 *
 * Wire into App.jsx (3 changes):
 *
 *   1. import { PricingPage } from './components/PricingPage';
 *
 *   2. Add view guard BEFORE the checkout guard:
 *      if (currentView === 'pricing') {
 *        return (
 *          <div className="site-shell">
 *            <PricingPage
 *              session={session}
 *              subscription={subscription}
 *              pricingPlans={pricingPlans}
 *              authReady={authReady}
 *              onSignOut={handleSignOut}
 *            />
 *          </div>
 *        );
 *      }
 *
 *   3. C# desktop redirect:
 *      FileName = "https://composure.fikronix.co.za/?view=pricing&source=desktop"
 */
export function PricingPage({ session, subscription, pricingPlans, authReady, onSignOut }) {
  const searchParams = new URLSearchParams(window.location.search);
  const fromDesktop = searchParams.get('source') === 'desktop';
  const [activeFaq, setActiveFaq] = useState(-1);

  // Mirror the scroll-reveal observer from App.jsx
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) entry.target.classList.add('is-visible');
        });
      },
      { threshold: 0.12, rootMargin: '0px 0px -8% 0px' },
    );
    document.querySelectorAll('[data-reveal]').forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, []);

  return (
    <>
      {/* ── Nav — matches your existing navbar pill style ── */}
      <nav className="navbar">
        <a className="brand" href="/">
          <img
            className="brand-logo brand-logo--svg"
            src="/composure-mark.svg"
            alt=""
            aria-hidden="true"
          />
          <span className="brand-name">Composure</span>
        </a>

        <div className="nav-links">
          <a className="nav-link" href="/#features">Features</a>
          <a className="nav-link" href="/#how-it-works">How it works</a>
          <a className="nav-link" href="/#faq">FAQ</a>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          {authReady && session ? (
            <>
              <a className="button button-secondary nav-button" href="?view=account"
                style={{ padding: '0.52rem 1rem', fontSize: '0.9rem' }}>
                My Account
              </a>
              <button
                className="nav-auth-button"
                onClick={onSignOut}
              >
                Sign out
              </button>
            </>
          ) : (
            <a className="button button-secondary nav-button" href="?view=auth&plan=pro"
              style={{ padding: '0.52rem 1rem', fontSize: '0.9rem' }}>
              Sign in
            </a>
          )}
        </div>
      </nav>

      <main>
        {/* ── Desktop-source banner ── */}
        {fromDesktop && (
          <div
            data-reveal
            style={{
              width: 'min(680px, calc(100% - 2rem))',
              margin: '2rem auto 0',
              display: 'flex',
              alignItems: 'center',
              gap: '0.75rem',
              padding: '0.875rem 1.25rem',
              border: '1px solid rgba(143, 247, 196, 0.22)',
              borderRadius: '14px',
              background: 'rgba(143, 247, 196, 0.06)',
            }}
          >
            <span className="hero-badge-dot" />
            <p style={{ margin: 0, fontSize: '0.9rem', color: 'var(--text)', lineHeight: 1.55 }}>
              You&rsquo;re one step away from unlocking Composure Pro on your desktop app.{' '}
              {session
                ? 'Select a plan below to continue.'
                : 'Sign in or create an account to get started.'}
            </p>
          </div>
        )}

        {/* ── Hero heading ── */}
        <section className="content-section section-inner" style={{ paddingBottom: '1.5rem' }}>
          <div data-reveal style={{ maxWidth: '52rem', margin: '0 auto', textAlign: 'center' }}>
            <p className="eyebrow">Pricing</p>
            <h1
              style={{
                margin: '0.5rem 0 0',
                fontFamily: "'Space Grotesk', 'Inter', sans-serif",
                fontSize: 'clamp(2.8rem, 6vw, 4.8rem)',
                lineHeight: 0.95,
                letterSpacing: '-0.085em',
              }}
            >
              Invest in your career.
              <br />
              <span style={{ color: 'var(--accent)' }}>One interview pays for it all.</span>
            </h1>
            <p
              style={{
                maxWidth: '36rem',
                margin: '1.4rem auto 0',
                color: 'var(--muted)',
                fontSize: '1.04rem',
                lineHeight: 1.75,
              }}
            >
              Download the app free. Choose a plan when you&rsquo;re ready to unlock full access
              and move through to payment.
            </p>
          </div>
        </section>

        {/* ── Plans grid ── */}
        <section className="section-inner" style={{ paddingBottom: '2rem' }}>
          {!authReady ? (
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '1rem',
                padding: '4rem 0',
                color: 'var(--muted)',
              }}
            >
              {/* Reuse your existing spin keyframe */}
              <span
                style={{
                  display: 'block',
                  width: '28px',
                  height: '28px',
                  border: '2px solid var(--panel-border)',
                  borderTopColor: 'var(--accent)',
                  borderRadius: '50%',
                  animation: 'spin 0.75s linear infinite',
                }}
              />
              <p style={{ margin: 0 }}>Loading your plan details…</p>
            </div>
          ) : (
            <div className="pricing-grid">
              {pricingPlans.map((plan, index) => (
                <div
                  key={plan.name}
                  data-reveal
                  style={{ transitionDelay: `${index * 80}ms` }}
                >
                  <PricingCard
                    plan={plan}
                    session={session}
                    currentPlanId={subscription?.plan ?? 'free'}
                    isCurrentPlan={Boolean(
                      session &&
                        subscription?.plan === plan.id &&
                        subscription?.status !== 'canceled',
                    )}
                  />
                </div>
              ))}
            </div>
          )}

          {/* Active subscription status */}
          {authReady && session && subscription && (
            <p
              data-reveal
              style={{
                marginTop: '1.5rem',
                textAlign: 'center',
                fontSize: '0.875rem',
                color: 'var(--muted)',
              }}
            >
              You&rsquo;re on the <strong style={{ color: 'var(--text)' }}>{subscription.plan ?? 'free'}</strong> plan
              {subscription.status === 'canceled' ? ' (canceled — access until period end)' : ''}.{' '}
              <a href="?view=account" style={{ color: 'var(--accent)', fontWeight: 700 }}>
                Manage your account →
              </a>
            </p>
          )}
        </section>

        {/* ── Trust strip — reuses stat-card pattern ── */}
        <section className="section-inner" style={{ paddingBottom: 'var(--section-gap)' }}>
          <div
            data-reveal
            className="stats-grid"
            style={{ gridTemplateColumns: 'repeat(3, minmax(0, 1fr))' }}
          >
            {[
              { icon: '🔒', title: 'Secure checkout', body: 'Payments via Stripe. We never store card details.' },
              { icon: '⚡', title: 'Instant activation', body: 'Your desktop app unlocks the moment payment confirms.' },
              { icon: '🎯', title: 'Real ROI', body: 'One successful interview pays for any plan many times over.' },
            ].map((item, i) => (
              <div
                key={item.title}
                className="stat-card"
                data-reveal
                style={{ transitionDelay: `${i * 70}ms`, textAlign: 'left', gap: '0.5rem' }}
              >
                <div className="feature-icon" style={{ marginBottom: '0.75rem' }}>
                  {item.icon}
                </div>
                <strong
                  style={{
                    fontFamily: "'Space Grotesk', 'Inter', sans-serif",
                    fontSize: '1rem',
                    letterSpacing: '-0.03em',
                  }}
                >
                  {item.title}
                </strong>
                <p style={{ margin: 0, fontSize: '0.88rem', color: 'var(--muted)', lineHeight: 1.6 }}>
                  {item.body}
                </p>
              </div>
            ))}
          </div>
        </section>

        {/* ── FAQ ── */}
        <section className="content-section section-inner" id="faq">
          <div className="section-heading is-centered" data-reveal>
            <p className="eyebrow">FAQ</p>
            <h2 className="section-title">Common questions about plans</h2>
          </div>

          <div className="faq-list">
            {faqItems.map((item, index) => (
              <FAQItem
                key={item.question}
                item={item}
                isOpen={activeFaq === index}
                onToggle={() =>
                  setActiveFaq((current) => (current === index ? -1 : index))
                }
              />
            ))}
          </div>
        </section>

        {/* ── Bottom CTA — reuses your cta-section / cta-panel classes ── */}
        <section className="cta-section">
          <div className="section-inner">
            <div className="cta-panel" data-reveal>
              <p className="eyebrow">Get Started</p>
              <h2>
                Download first.
                <br />
                Pick your plan when you&rsquo;re ready.
              </h2>
              <p>
                The app is free to explore. Choose a plan when you want to unlock full access and
                activate your desktop workspace.
              </p>
              <div className="hero-actions cta-actions">
                <a className="button button-primary" href="/">
                  Back to home
                </a>
                {!session && (
                  <a className="button button-secondary" href="?view=auth&plan=pro">
                    Create account
                  </a>
                )}
              </div>
              <p className="cta-note">
                Windows installer available now. Plan selection leads into the payment step.
              </p>
            </div>
          </div>
        </section>
      </main>

      {/* ── Footer — minimal, matches your footer-bottom bar ── */}
      <footer className="site-footer">
        <div className="section-inner footer-bottom" style={{ marginTop: 0, paddingTop: '1.5rem' }}>
          <p>© 2026 Composure. All rights reserved.</p>
          <div className="footer-links">
            <a href="?view=terms">Terms</a>
            <a href="?view=privacy">Privacy</a>
            <a href="/">Home</a>
            <a href="/#faq">FAQ</a>
          </div>
        </div>
      </footer>
    </>
  );
}