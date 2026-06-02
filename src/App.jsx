import React, { useEffect, useState } from 'react';
import { Navbar } from './components/Navbar';
import { SectionHeading } from './components/SectionHeading';
import { FeatureCard } from './components/FeatureCard';
import { StatCard } from './components/StatCard';
import { PricingCard } from './components/PricingCard';
import { FAQItem } from './components/FAQItem';
import { CheckoutPage } from './components/CheckoutPage';
import { AuthPage } from './components/AuthPage';
import { CheckoutSuccessPage } from './components/CheckoutSuccessPage';
import { AccountPage } from './components/AccountPage';
import { LegalPage } from './components/LegalPage';
import { isSupabaseConfigured, supabase } from './lib/supabase';
import { loadPricingPlans } from './lib/pricing';
import { ensureCurrentSubscriptionRow, loadCurrentSubscription } from './lib/account';
import { privacyContent, termsContent } from './data/legalContent';
import {
  downloadUrl,
  faqItems,
  features,
  footerColumns,
  heroStats,
  navLinks,
  pricingPlans as fallbackPricingPlans,
  steps,
  testimonials,
  trustedBy,
} from './data/siteContent';

function App() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [activeFaq, setActiveFaq] = useState(0);
  const [status, setStatus] = useState(false);
  const [session, setSession] = useState(null);
  const [subscription, setSubscription] = useState(null);
  const [authReady, setAuthReady] = useState(!isSupabaseConfigured);
  const [pricingPlans, setPricingPlans] = useState(fallbackPricingPlans);

  const searchParams = new URLSearchParams(window.location.search);
  const currentView = searchParams.get('view');
  const currentPlanId = searchParams.get('plan') ?? 'pro';
  const checkoutStatus = searchParams.get('checkout');
  const selectedPlan =
    pricingPlans.find((plan) => plan.id === currentPlanId) ??
    pricingPlans.find((plan) => plan.featured) ??
    pricingPlans[0];
  const checkoutPath = `?view=checkout&plan=${selectedPlan.id}`;
  const authSuccessPath =
    selectedPlan.id === 'free' ? '?view=success&plan=free' : checkoutPath;

  useEffect(() => {
    if (!supabase) {
      return;
    }

    let isMounted = true;

    supabase.auth.getSession().then(({ data }) => {
      if (!isMounted) {
        return;
      }

      setSession(data.session ?? null);
      setAuthReady(true);
    });

    const { data: listener } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession);
      setAuthReady(true);
    });

    return () => {
      isMounted = false;
      listener.subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    if (!supabase || !session) {
      setSubscription(null);
      return;
    }

    let isMounted = true;

    (async () => {
      try {
        await ensureCurrentSubscriptionRow();
        const currentSubscription = await loadCurrentSubscription();
        if (isMounted) {
          setSubscription(currentSubscription);
        }
      } catch {
        if (isMounted) {
          setSubscription(null);
        }
      }
    })();

    return () => {
      isMounted = false;
    };
  }, [session]);

  useEffect(() => {
    if (!supabase) {
      return;
    }

    let isMounted = true;

    loadPricingPlans()
      .then((plans) => {
        if (isMounted && plans.length > 0) {
          setPricingPlans(plans);
        }
      })
      .catch(() => {
        if (isMounted) {
          setPricingPlans(fallbackPricingPlans);
        }
      });

    return () => {
      isMounted = false;
    };
  }, []);

  async function handleSignOut() {
    if (!supabase) {
      return;
    }

    await supabase.auth.signOut();
  }

  function continueAfterAuth() {
    window.location.assign(authSuccessPath);
  }

  useEffect(() => {
    if (authReady && session && currentView === 'auth') {
      window.location.replace(authSuccessPath);
    }
  }, [authReady, session, currentView, authSuccessPath]);

  useEffect(() => {
    const onScroll = () => setStatus(window.scrollY > 24);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('is-visible');
          }
        });
      },
      { threshold: 0.15, rootMargin: '0px 0px -8% 0px' },
    );

    document.querySelectorAll('[data-reveal]').forEach((element) => observer.observe(element));

    return () => observer.disconnect();
  }, []);

  if (currentView === 'checkout') {
    return (
      <div className="site-shell">
          <CheckoutPage
          plan={selectedPlan}
          downloadUrl={downloadUrl}
          session={session}
          authReady={authReady}
          currentPlanId={subscription?.plan ?? 'free'}
          onAuthSuccess={continueAfterAuth}
          checkoutStatus={checkoutStatus}
        />
      </div>
    );
  }

  if (currentView === 'auth') {
    return (
      <div className="site-shell">
        <AuthPage plan={selectedPlan} authReady={authReady} onAuthSuccess={continueAfterAuth} />
      </div>
    );
  }

  if (currentView === 'success') {
    return (
      <div className="site-shell">
        <CheckoutSuccessPage
          downloadUrl={downloadUrl}
          session={session}
          authReady={authReady}
          plan={selectedPlan}
        />
      </div>
    );
  }

  if (currentView === 'account') {
    return (
      <div className="site-shell">
        <AccountPage
          session={session}
          subscription={subscription}
          pricingPlans={pricingPlans}
          downloadUrl={downloadUrl}
          onSignOut={handleSignOut}
        />
      </div>
    );
  }

  if (currentView === 'terms') {
    return (
      <div className="site-shell">
        <LegalPage {...termsContent} />
      </div>
    );
  }

  if (currentView === 'privacy') {
    return (
      <div className="site-shell">
        <LegalPage {...privacyContent} />
      </div>
    );
  }

  return (
    <div className="site-shell site-shell--home" id="top">
      <Navbar
        downloadUrl={downloadUrl}
        links={navLinks}
        isOpen={menuOpen}
        isScrolled={status}
        onToggle={() => setMenuOpen((current) => !current)}
        onNavigate={() => setMenuOpen(false)}
        session={session}
        subscription={subscription}
        authReady={authReady}
        onSignOut={handleSignOut}
      />

      <main>
        <section className="hero section-frame">
          <div className="hero-copy" data-reveal>
            <div className="hero-badge">
              <span className="hero-badge-dot" />
              Windows desktop app
            </div>
            <h1>
              A cleaner desktop app
              <br />
              for live interview support
            </h1>
            <p className="hero-subtitle">
              Composure listens in real time and surfaces exactly what you need, so you can focus on delivering, not scrambling. Download the app, explore the workspace, and choose a plan when you are ready to move
              into payment.
            </p>

            <div className="hero-actions">
              <a className="button button-primary" href={downloadUrl} target="_blank" rel="noreferrer">
                Download for Windows
              </a>
              <a className="button button-secondary" href="#pricing">
                View Pricing
              </a>
            </div>

            <p className="hero-caption">
              Download first to get the app. Choose a plan when you want to continue with payment.
            </p>
          </div>

          <div className="hero-preview" data-reveal>
            <div className="hero-proof-card">
              <div className="hero-proof-header">
                <span className="hero-proof-title">Live proof</span>
                <span className="hero-proof-chip">Private session</span>
              </div>

              <div className="hero-proof-note">
                <span className="hero-proof-icon" aria-hidden="true">
                  🔒
                </span>
                <p>Coaching stays on your screen. The app is built to stay quiet until you need it.</p>
              </div>

              <div className="hero-proof-image-frame">
                <img
                  className="hero-proof-image"
                  src="/lookalike-proof.jpg"
                  alt="A testimonial style interview message preview"
                />
              </div>

              <div className="hero-proof-bubble hero-proof-bubble--incoming">
                <p>
                  Hey team! Got my dream job today. Composure kept me calm, structured, and ready
                  for every round.
                </p>
                <span>4:49 AM</span>
              </div>

              <div className="hero-proof-footer">
                <div className="hero-proof-logo" aria-hidden="true">
                  <img src="/composure-mark.svg" alt="" />
                </div>
                <div>
                  <strong>Composure</strong>
                  <span>Live interview support for Windows</span>
                </div>
              </div>
            </div>

            <div className="hero-preview-grid">
              <div className="preview-window preview-window--light">
                <div className="preview-window-top" aria-hidden="true">
                  <span />
                  <span />
                  <span />
                </div>
                <div className="preview-window-body">
                  <div className="preview-sidebar">
                    <div className="preview-sidebar-card is-active">Live prompt</div>
                    <div className="preview-sidebar-card">Structure</div>
                    <div className="preview-sidebar-card">Follow-up notes</div>
                    <div className="preview-sidebar-card">Plan: Pro</div>
                  </div>

                  <div className="preview-main">
                    <div className="preview-main-card preview-main-card--image">
                      <img
                        className="preview-main-image"
                        src="/lookalike-systemdesign.png"
                        alt="Composure desktop app preview"
                      />
                    </div>
                    <div className="preview-main-card">
                      <span className="preview-card-label">Current question</span>
                      <p>How would you design a caching layer for a high-traffic platform?</p>
                    </div>
                    <div className="preview-main-card is-accent">
                      <span className="preview-card-label">Suggested answer</span>
                      <p>
                        Start with the architecture, then cover cache placement, invalidation
                        strategy, and how you would protect the system from traffic spikes.
                      </p>
                    </div>
                    <div className="preview-inline-stats">
                      <div>0.8s response time</div>
                      <div>Audio + screen</div>
                      <div>Private workspace</div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="hero-quote-card">
                <p className="hero-quote-label">Why it works</p>
                <h3>Clear enough to understand at a glance, practical enough to use in a live session.</h3>
                <p>
                  Composure keeps the page airy, the calls to action obvious, and the product story visible without feeling cluttered.
                </p>
              </div>
            </div>
          </div>
        </section>

        <section className="logo-strip">
          <div className="section-inner" data-reveal>
            <p className="eyebrow">Used by candidates interviewing at</p>
            <div className="logo-row">
              {trustedBy.map((company) => (
                <span key={company} className="logo-name">
                  {company}
                </span>
              ))}
            </div>
          </div>
        </section>

        <section className="stats-grid section-inner" aria-label="Product facts">
          {heroStats.map((stat, index) => (
            <div key={stat.label} data-reveal style={{ transitionDelay: `${index * 70}ms` }}>
              <StatCard {...stat} />
            </div>
          ))}
        </section>

        <section className="content-section section-inner" id="features">
          <SectionHeading
            eyebrow="Features"
            title={
              <>
                One app, one workspace,
                <br />
                clearer interview sessions
              </>
            }
            body="A Windows desktop app, a clearer workspace, and a cleaner path from product access to plan selection."
          />

          <div className="feature-grid">
            {features.map((feature, index) => (
              <div key={feature.title} data-reveal style={{ transitionDelay: `${index * 70}ms` }}>
                <FeatureCard {...feature} />
              </div>
            ))}
          </div>
        </section>

        <section className="content-section section-inner" id="how-it-works">
          <SectionHeading
            eyebrow="How It Works"
            title="Simple path from download to payment"
            body="The user journey is now clearer: get the app first, then choose a plan, then continue to payment."
          />

          <div className="step-grid">
            {steps.map((step, index) => (
              <article
                key={step.number}
                className="step-card"
                data-reveal
                style={{ transitionDelay: `${index * 70}ms` }}
              >
                <div className="step-number">{step.number}</div>
                <h3>{step.title}</h3>
                <p>{step.body}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="content-section section-inner" id="testimonials">
          <SectionHeading
            eyebrow="Results"
            title="Real outcomes from real candidates"
          />

          <div className="testimonial-grid">
            {testimonials.map((testimonial, index) => (
              <article
                key={testimonial.name}
                className="testimonial-card"
                data-reveal
                style={{ transitionDelay: `${index * 70}ms` }}
              >
                <div className="value-kicker">{testimonial.initials}</div>
                <p className="testimonial-quote">"{testimonial.quote}"</p>
                <div className="testimonial-author">
                  <div>
                    <h3>{testimonial.name}</h3>
                    <span>{testimonial.role}</span>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </section>

        <section className="content-section section-inner" id="demo">
          <SectionHeading
            eyebrow="Demo"
            title="See it in action"
            body="Watch how the desktop app keeps the session organized and easy to follow."
          />
          <div className="demo-card fade" data-reveal>
            <div className="demo-card-icon" aria-hidden="true">
              ▶
            </div>
            <p className="demo-card-copy">Click to play demo</p>
          </div>
        </section>

        <section className="content-section section-inner" id="pricing">
          <SectionHeading
            eyebrow="Pricing"
            title="Invest in your career"
            body="One successful interview pays for the entire plan many times over."
          />

          <div className="pricing-grid">
            {pricingPlans.map((plan, index) => (
              <div key={plan.name} data-reveal style={{ transitionDelay: `${index * 70}ms` }}>
                <PricingCard
                  plan={plan}
                  session={session}
                  currentPlanId={subscription?.plan ?? 'free'}
                  isCurrentPlan={Boolean(session && subscription?.plan === plan.id && subscription?.status !== 'canceled')}
                />
              </div>
            ))}
          </div>

          
        </section>

        <section className="content-section section-inner" id="faq">
          <SectionHeading eyebrow="FAQ" title="Frequently asked questions" center />

          <div className="faq-list">
            {faqItems.map((item, index) => (
              <FAQItem
                key={item.question}
                item={item}
                isOpen={activeFaq === index}
                onToggle={() => setActiveFaq((current) => (current === index ? -1 : index))}
              />
            ))}
          </div>
        </section>

        <section className="cta-section" id="cta">
          <div className="section-inner cta-panel" data-reveal>
            <p className="eyebrow">Get Started</p>
            <h2>
              Download first.
              <br />
              Pick your plan when you are ready.
            </h2>
            <p>
              Download the app when you want the product. Choose a plan when you are ready to move
              into payment and activation.
            </p>

            <div className="hero-actions cta-actions">
              <a className="button button-primary cta-download" href={downloadUrl} target="_blank" rel="noreferrer">
                Download for Windows
              </a>
              <a className="button button-secondary cta-download" href="#pricing">
                Compare Plans
              </a>
            </div>

            <p className="cta-note">Windows installer available now. Plan selection leads into the payment step.</p>
          </div>
        </section>
      </main>

      <footer className="site-footer">
        <div className="section-inner footer-grid">
          <div className="footer-brand">
            <a className="brand" href="#top">
              <img className="brand-logo brand-logo--svg" src="/composure-mark.svg" alt="" aria-hidden="true" />
              <span className="brand-name">Composure</span>
            </a>
            <p>
              A Windows desktop app with a cleaner workspace, clearer calls to action, and a proper
              handoff from plan selection to payment.
            </p>
            <div className="footer-quick-actions">
              <a className="button button-secondary" href={downloadUrl} target="_blank" rel="noreferrer">
                Download
              </a>
              <a className="button button-secondary" href="?view=checkout&plan=pro">
                Continue to Payment
              </a>
            </div>
          </div>

          {footerColumns.map((column) => (
            <div key={column.title} className="footer-column">
              <h3>{column.title}</h3>
              <ul>
                {column.links.map((link) => (
                  <li key={link.label}>
                    <a
                      href={link.href}
                      target={link.href === downloadUrl ? '_blank' : undefined}
                      rel={link.href === downloadUrl ? 'noreferrer' : undefined}
                    >
                      {link.label}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="section-inner footer-bottom">
          <p>© 2026 Composure. All rights reserved.</p>
          <div className="footer-links">
            <a href={downloadUrl} target="_blank" rel="noreferrer">
              Download
            </a>
            <a href="#pricing">Pricing</a>
            <a href="?view=checkout&plan=pro">Checkout</a>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default App;
