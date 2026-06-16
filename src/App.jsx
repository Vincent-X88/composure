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
import { applyDisplayCurrency, getDisplayCurrency, loadPricingPlans, setDisplayCurrency } from './lib/pricing';
import { ensureCurrentSubscriptionRow, loadCurrentSubscription } from './lib/account';
import { consumeDesktopSso } from './lib/desktopSso';
import { privacyContent, termsContent } from './data/legalContent';
import {
  downloadUrl,
  faqItems,
  features,
  footerColumns,
  heroStats,
  navLinks,
  pricingPlans as fallbackPricingPlans,
  comparisonRows,
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
  const [rawPricingPlans, setRawPricingPlans] = useState(fallbackPricingPlans);
  const [displayCurrency, setDisplayCurrencyState] = useState(() => getDisplayCurrency());
  const pricingPlans = applyDisplayCurrency(rawPricingPlans, displayCurrency);

  function changeDisplayCurrency(nextCurrency) {
    setDisplayCurrency(nextCurrency);
    setDisplayCurrencyState(nextCurrency);
  }

  const searchParams = new URLSearchParams(window.location.search);
  const currentView = searchParams.get('view');
  const currentPlanId = searchParams.get('plan') ?? 'pro';
  const checkoutStatus = searchParams.get('checkout');
  const selectedPlan =
    pricingPlans.find((plan) => plan.id === currentPlanId) ??
    pricingPlans.find((plan) => plan.featured) ??
    pricingPlans[0];
  const proofPanels = [
    {
      title: 'Invisible on dock',
      body: "The app stays active but never shows an icon, so no one can tell it's running.",
      image: '/proof-dock.png',
      icon: 'dock',
      badge: 'NEW',
    },
    {
      title: 'Invisible in activity monitor',
      body: 'Runs silently in the background without leaving any trace in your Task Manager.',
      image: '/proof-activity.png',
      icon: 'activity',
      badge: null,
    },
    {
      title: 'Completely click through',
      body: "Even when you hover or click, your system won't detect Composure. No focus shifts. No flags. No traces.",
      image: '/proof-click.png',
      icon: 'click',
      badge: null,
    },
    {
      title: '100% invisible to screen-recording',
      body: 'Even if the session is recorded, Composure leaves no visible windows or overlays.',
      image: '/proof-recording.png',
      icon: 'recording',
      badge: null,
    },
  ];
  const checkoutPath = `?view=checkout&plan=${selectedPlan.id}`;
  const authSuccessPath =
    selectedPlan.id === 'free' ? '?view=success&plan=free' : checkoutPath;

  useEffect(() => {
    if (!supabase) {
      return;
    }

    let isMounted = true;

    (async () => {
      // If the desktop app sent us here with a session payload in the URL
      // fragment, hydrate Supabase with it before reading the current session
      // so the very first render already sees the signed-in user.
      await consumeDesktopSso();

      const { data } = await supabase.auth.getSession();
      if (!isMounted) {
        return;
      }

      setSession(data.session ?? null);
      setAuthReady(true);
    })();

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
          setRawPricingPlans(plans);
        }
      })
      .catch(() => {
        if (isMounted) {
          setRawPricingPlans(fallbackPricingPlans);
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
    <div className="site-shell" id="top">
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

          <div className="hero-terminal" data-reveal>
            <div className="terminal-header">
              <span className="terminal-dot terminal-dot-red" />
              <span className="terminal-dot terminal-dot-amber" />
              <span className="terminal-dot terminal-dot-green" />
              <span className="terminal-label">DESKTOP SESSION</span>
            </div>
            <div className="terminal-body">
              <div className="terminal-row">
                <div className="terminal-tag terminal-tag-muted">Prompt</div>
                <div className="terminal-message terminal-message-muted">
                  "Explain your approach to a high-traffic caching system in a concise way."
                </div>
              </div>
              <div className="terminal-row">
                <div className="terminal-tag terminal-tag-accent">Structured draft</div>
                <div className="terminal-message terminal-message-accent">
                  <strong>Start with the architecture and tradeoffs first.</strong> Mention cache
                  placement, invalidation strategy, consistency model, and how you would protect the
                  system from thundering-herd traffic spikes.
                  <span className="typing-dots" aria-hidden="true">
                    <span />
                    <span />
                    <span />
                  </span>
                </div>
              </div>
            </div>
            <div className="terminal-footer">
              <span className="status-pill">Desktop workspace</span>
              <span className="status-pill">Audio + screen input</span>
              <span className="status-pill">Plan-based access</span>
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

        <section className="content-section section-inner proof-section" id="proof">
          <SectionHeading
            eyebrow="Proof"
            title={
              <>
                Visual proof,
                <br />
                presented like a premium product
              </>
            }
            body="A cleaner, more Apple-like way to show the experience before people decide to download."
          />

          <div className="proof-matrix">
            <div className="proof-matrix-row proof-matrix-row--wide">
              {proofPanels.slice(0, 2).map((panel, index) => (
                <article
                  key={panel.title}
                  className={`proof-matrix-card proof-matrix-card--${panel.icon}`}
                  data-reveal
                  style={{ transitionDelay: `${index * 70}ms` }}
                >
                  <div className="proof-matrix-preview" aria-hidden="true">
                    <img
                      className="proof-matrix-image"
                      src={panel.image}
                      alt={panel.title}
                      loading="lazy"
                    />
                  </div>

                  <div className="proof-matrix-copy">
                    <div className="proof-matrix-icon-shell">
                      {panel.icon === 'dock' ? (
                        <svg viewBox="0 0 20 20" fill="none" aria-hidden="true">
                          <path
                            d="M6.66667 14.1673C6.55616 14.1673 6.45018 14.1234 6.37204 14.0453C6.2939 13.9671 6.25 13.8612 6.25 13.7507C6.25 13.6401 6.2939 13.5342 6.37204 13.456C6.45018 13.3779 6.55616 13.334 6.66667 13.334C6.77717 13.334 6.88315 13.3779 6.96129 13.456C7.03943 13.5342 7.08333 13.6401 7.08333 13.7507C7.08333 13.8612 7.03943 13.9671 6.96129 14.0453C6.88315 14.1234 6.77717 14.1673 6.66667 14.1673ZM10 14.1673C9.88949 14.1673 9.78351 14.1234 9.70537 14.0453C9.62723 13.9671 9.58333 13.8612 9.58333 13.7507C9.58333 13.6401 9.62723 13.5342 9.70537 13.456C9.78351 13.3779 9.88949 13.334 10 13.334C10.1105 13.334 10.2165 13.3779 10.2946 13.456C10.3728 13.5342 10.4167 13.6401 10.4167 13.7507C10.4167 13.8612 10.3728 13.9671 10.2946 14.0453C10.2165 14.1234 10.1105 14.1673 10 14.1673ZM13.3333 14.1673C13.2228 14.1673 13.1168 14.1234 13.0387 14.0453C12.9606 13.9671 12.9167 13.8612 12.9167 13.7507C12.9167 13.6401 12.9606 13.5342 13.0387 13.456C13.1168 13.3779 13.2228 13.334 13.3333 13.334C13.4438 13.334 13.5498 13.3779 13.628 13.456C13.7061 13.5342 13.75 13.6401 13.75 13.7507C13.75 13.8612 13.7061 13.9671 13.628 14.0453C13.5498 14.1234 13.4438 14.1673 13.3333 14.1673Z"
                            fill="currentColor"
                          />
                          <path
                            d="M1.66797 14.5833L3.33464 13.75M18.3346 14.5833L16.668 13.75M17.5013 17.5H2.5013C2.28029 17.5 2.06833 17.4122 1.91205 17.2559C1.75577 17.0996 1.66797 16.8877 1.66797 16.6667V3.33333C1.66797 3.11232 1.75577 2.90036 1.91205 2.74408C2.06833 2.5878 2.28029 2.5 2.5013 2.5H17.5013C17.7223 2.5 17.9343 2.5878 18.0906 2.74408C18.2468 2.90036 18.3346 3.11232 18.3346 3.33333V16.6667C18.3346 16.8877 18.2468 17.0996 18.0906 17.2559C17.9343 17.4122 17.7223 17.5 17.5013 17.5Z"
                            stroke="currentColor"
                            strokeWidth="1.49254"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />
                        </svg>
                      ) : null}
                      {panel.icon === 'activity' ? (
                        <svg viewBox="0 0 18 13" fill="none" aria-hidden="true">
                          <path
                            d="M0.746094 6.02168H3.97992L6.56699 0.746094L10.4476 11.2973L13.0347 6.02168H16.2685"
                            stroke="currentColor"
                            strokeWidth="1.49254"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />
                        </svg>
                      ) : null}
                      {panel.icon === 'click' ? (
                        <svg viewBox="0 0 20 20" fill="none" aria-hidden="true">
                          <path
                            d="M7.12698 1.42544V0.71275C7.12698 0.523733 7.20206 0.342457 7.33572 0.208801C7.46938 0.0751456 7.65065 5.86369e-05 7.83967 5.86369e-05C8.02869 5.86369e-05 8.20996 0.0751456 8.34362 0.208801C8.47727 0.342457 8.55236 0.523733 8.55236 0.71275V1.42544C8.55236 1.61446 8.47727 1.79574 8.34362 1.92939C8.20996 2.06305 8.02869 2.13813 7.83967 2.13813C7.65065 2.13813 7.46938 2.06305 7.33572 1.92939C7.20206 1.79574 7.12698 1.61446 7.12698 1.42544ZM0.71275 8.55236H1.42544C1.61446 8.55236 1.79574 8.47727 1.92939 8.34362C2.06305 8.20996 2.13813 8.02869 2.13813 7.83967C2.13813 7.65065 2.06305 7.46938 1.92939 7.33572C1.79574 7.20206 1.61446 7.12698 1.42544 7.12698H0.71275C0.523733 7.12698 0.342457 7.20206 0.208801 7.33572C0.0751456 7.46938 5.86369e-05 7.65065 5.86369e-05 7.83967C5.86369e-05 8.02869 0.0751456 8.20996 0.208801 8.34362C0.342457 8.47727 0.523733 8.55236 0.71275 8.55236ZM10.3715 2.77599C10.4553 2.81794 10.5465 2.84296 10.6399 2.84963C10.7333 2.8563 10.8272 2.84449 10.916 2.81487C11.0049 2.78524 11.087 2.7384 11.1578 2.677C11.2285 2.61561 11.2865 2.54087 11.3283 2.45706L12.041 1.03168C12.1256 0.862627 12.1395 0.666897 12.0798 0.487548C12.0201 0.308199 11.8916 0.159922 11.7225 0.0753367C11.5535 -0.00924865 11.3577 -0.0232137 11.1784 0.0365136C10.999 0.096241 10.8507 0.224768 10.7662 0.393821L10.0535 1.8192C10.0115 1.9029 9.98642 1.99406 9.97969 2.08745C9.97296 2.18084 9.98469 2.27465 10.0142 2.3635C10.0438 2.45236 10.0905 2.53452 10.1518 2.6053C10.2131 2.67607 10.2878 2.73408 10.3715 2.77599ZM1.8192 10.0535L0.393821 10.7662C0.224768 10.8507 0.096241 10.999 0.0365136 11.1784C-0.0232137 11.3577 -0.00924865 11.5535 0.0753367 11.7225C0.159922 11.8916 0.308199 12.0201 0.487548 12.0798C0.666897 12.1395 0.862627 12.1256 1.03168 12.041L2.45706 11.3283C2.54077 11.2864 2.61541 11.2285 2.67671 11.1577C2.73802 11.087 2.7848 11.0049 2.81437 10.9161C2.84394 10.8273 2.85574 10.7335 2.84908 10.6402C2.84242 10.5468 2.81743 10.4557 2.77555 10.372C2.73367 10.2882 2.67571 10.2136 2.60498 10.1523C2.53425 10.091 2.45214 10.0442 2.36334 10.0146C2.27453 9.98507 2.18077 9.97328 2.08741 9.97994C1.99405 9.9866 1.90291 10.0116 1.8192 10.0535ZM18.8249 15.6793C18.9573 15.8116 19.0623 15.9688 19.134 16.1417C19.2056 16.3147 19.2425 16.5001 19.2425 16.6873C19.2425 16.8745 19.2056 17.0599 19.134 17.2328C19.0623 17.4058 18.9573 17.5629 18.8249 17.6953L17.6953 18.8249C17.5629 18.9573 17.4058 19.0623 17.2328 19.134C17.0599 19.2056 16.8745 19.2425 16.6873 19.2425C16.5001 19.2425 16.3147 19.2056 16.1417 19.134C15.9688 19.0623 15.8116 18.9573 15.6793 18.8249L11.1091 14.2539L9.53231 18.3599C9.53231 18.3688 9.52519 18.3786 9.52073 18.3884C9.41166 18.6427 9.23018 18.8593 8.99891 19.0112C8.76763 19.1631 8.49677 19.2436 8.22007 19.2427H8.14969C7.86111 19.2305 7.58324 19.13 7.35365 18.9547C7.12406 18.7795 6.95382 18.5379 6.86595 18.2628L2.2094 4.00182C2.12947 3.75241 2.11979 3.4858 2.18144 3.23126C2.24309 2.97671 2.37368 2.74407 2.55887 2.55887C2.74407 2.37368 2.97671 2.24309 3.23126 2.18144C3.4858 2.11979 3.75241 2.12947 4.00182 2.2094L18.2628 6.86595C18.5353 6.95713 18.774 7.12857 18.9474 7.35778C19.1208 7.58699 19.2208 7.86326 19.2344 8.15034C19.248 8.43742 19.1745 8.72191 19.0235 8.96646C18.8725 9.21102 18.6511 9.40423 18.3884 9.52073L18.3599 9.53231L14.2539 11.1083L18.8249 15.6793ZM17.8174 16.6868L13.2463 12.1158C13.0818 11.9516 12.9599 11.7496 12.8914 11.5275C12.8228 11.3054 12.8096 11.0698 12.8529 10.8415C12.8962 10.6131 12.9947 10.3987 13.1398 10.2171C13.2849 10.0355 13.4723 9.89217 13.6855 9.79957L13.714 9.7871L17.8076 8.21561L3.56352 3.56352L8.21383 17.8049L9.78621 13.7069C9.78621 13.6971 9.79334 13.6873 9.79779 13.6775C9.89042 13.4644 10.0337 13.2773 10.2152 13.1322C10.3967 12.9872 10.611 12.8888 10.8392 12.8454C10.9274 12.8291 11.0168 12.8207 11.1065 12.8205C11.4841 12.8209 11.8462 12.9712 12.1131 13.2383L16.6868 17.8174L17.8174 16.6868Z"
                            fill="currentColor"
                          />
                        </svg>
                      ) : null}
                      {panel.icon === 'recording' ? (
                        <svg viewBox="0 0 21 21" fill="none" aria-hidden="true">
                          <path
                            d="M2.02051 1.3374C2.11089 1.339 2.20063 1.3592 2.2832 1.396C2.36563 1.43278 2.44042 1.48523 2.50195 1.55127H2.50098L19.0586 18.1089C19.181 18.2359 19.2487 18.4062 19.2471 18.5825C19.2453 18.7588 19.1746 18.9276 19.0498 19.0522C18.9249 19.1769 18.7556 19.2471 18.5791 19.2485C18.4029 19.2499 18.2332 19.1825 18.1064 19.0601L18.1045 19.0581L13.7871 14.7417C13.5596 15.187 13.2199 15.5664 12.7998 15.8413C12.3307 16.1483 11.7823 16.3122 11.2217 16.312H4.23047C3.46642 16.312 2.73363 16.0085 2.19336 15.4683C1.6531 14.928 1.34961 14.1952 1.34961 13.4312V7.17529C1.34965 6.50979 1.58025 5.86495 2.00195 5.3501C2.37705 4.89218 2.88286 4.56242 3.44922 4.40283L1.5498 2.50244C1.48395 2.44098 1.43124 2.36693 1.39453 2.28467C1.35774 2.20209 1.33753 2.11236 1.33594 2.02197C1.33439 1.9317 1.35095 1.84201 1.38477 1.7583C1.41862 1.67449 1.46928 1.59859 1.5332 1.53467C1.59712 1.47075 1.67302 1.42009 1.75684 1.38623C1.84055 1.35242 1.93024 1.33586 2.02051 1.3374ZM11.2217 4.29443C11.9856 4.29443 12.7185 4.5981 13.2588 5.13818C13.799 5.67836 14.1024 6.41137 14.1025 7.17529V7.31201L17.042 5.28271C17.9762 4.63686 19.2509 5.30673 19.251 6.44189V14.1616C19.251 15.0123 18.5367 15.5998 17.7871 15.5718L17.7393 15.5698L14.1514 11.9819L14.3057 11.7964L17.8066 14.2134C17.8161 14.2199 17.8274 14.2244 17.8389 14.2251C17.8501 14.2257 17.8611 14.2225 17.8711 14.2173C17.8812 14.212 17.8906 14.2046 17.8965 14.1948C17.9024 14.185 17.9053 14.1731 17.9053 14.1616V6.44189L17.8965 6.40967C17.8906 6.39986 17.8812 6.39156 17.8711 6.38623C17.8611 6.38108 17.8501 6.37878 17.8389 6.37939C17.8274 6.38008 17.8161 6.38363 17.8066 6.39014L14.1025 8.94775V11.9331L12.7568 10.5874V7.17529C12.7567 6.76844 12.5943 6.37803 12.3066 6.09033C12.0189 5.80273 11.6285 5.64111 11.2217 5.64111H7.81055L6.6709 4.50146L6.46484 4.29443H11.2217ZM4.23047 5.64111C3.82357 5.64113 3.43327 5.80266 3.14551 6.09033C2.85781 6.37803 2.6964 6.76844 2.69629 7.17529V13.4312C2.69629 13.8381 2.85773 14.2283 3.14551 14.5161C3.43329 14.8039 3.82348 14.9653 4.23047 14.9653H11.2217C11.5942 14.9653 11.9544 14.8302 12.2344 14.5845C12.4998 14.3515 12.6746 14.0341 12.7334 13.687L4.6875 5.64111H4.23047Z"
                            fill="currentColor"
                          />
                        </svg>
                      ) : null}
                    </div>

                    <div className="proof-matrix-title-row">
                      <h3>{panel.title}</h3>
                      {panel.badge ? <span className="proof-matrix-badge">{panel.badge}</span> : null}
                    </div>
                    <p>{panel.body}</p>
                  </div>
                </article>
              ))}
            </div>

            <div className="proof-matrix-row proof-matrix-row--offset">
              {proofPanels.slice(2).map((panel, index) => (
                <article
                  key={panel.title}
                  className={`proof-matrix-card proof-matrix-card--${panel.icon}`}
                  data-reveal
                  style={{ transitionDelay: `${index * 70}ms` }}
                >
                  <div className="proof-matrix-preview" aria-hidden="true">
                    <img
                      className="proof-matrix-image"
                      src={panel.image}
                      alt={panel.title}
                      loading="lazy"
                    />
                  </div>

                  <div className="proof-matrix-copy">
                    <div className="proof-matrix-icon-shell">
                      {panel.icon === 'click' ? (
                        <svg viewBox="0 0 20 20" fill="none" aria-hidden="true">
                          <path
                            d="M7.12698 1.42544V0.71275C7.12698 0.523733 7.20206 0.342457 7.33572 0.208801C7.46938 0.0751456 7.65065 5.86369e-05 7.83967 5.86369e-05C8.02869 5.86369e-05 8.20996 0.0751456 8.34362 0.208801C8.47727 0.342457 8.55236 0.523733 8.55236 0.71275V1.42544C8.55236 1.61446 8.47727 1.79574 8.34362 1.92939C8.20996 2.06305 8.02869 2.13813 7.83967 2.13813C7.65065 2.13813 7.46938 2.06305 7.33572 1.92939C7.20206 1.79574 7.12698 1.61446 7.12698 1.42544ZM0.71275 8.55236H1.42544C1.61446 8.55236 1.79574 8.47727 1.92939 8.34362C2.06305 8.20996 2.13813 8.02869 2.13813 7.83967C2.13813 7.65065 2.06305 7.46938 1.92939 7.33572C1.79574 7.20206 1.61446 7.12698 1.42544 7.12698H0.71275C0.523733 7.12698 0.342457 7.20206 0.208801 7.33572C0.0751456 7.46938 5.86369e-05 7.65065 5.86369e-05 7.83967C5.86369e-05 8.02869 0.0751456 8.20996 0.208801 8.34362C0.342457 8.47727 0.523733 8.55236 0.71275 8.55236ZM10.3715 2.77599C10.4553 2.81794 10.5465 2.84296 10.6399 2.84963C10.7333 2.8563 10.8272 2.84449 10.916 2.81487C11.0049 2.78524 11.087 2.7384 11.1578 2.677C11.2285 2.61561 11.2865 2.54087 11.3283 2.45706L12.041 1.03168C12.1256 0.862627 12.1395 0.666897 12.0798 0.487548C12.0201 0.308199 11.8916 0.159922 11.7225 0.0753367C11.5535 -0.00924865 11.3577 -0.0232137 11.1784 0.0365136C10.999 0.096241 10.8507 0.224768 10.7662 0.393821L10.0535 1.8192C10.0115 1.9029 9.98642 1.99406 9.97969 2.08745C9.97296 2.18084 9.98469 2.27465 10.0142 2.3635C10.0438 2.45236 10.0905 2.53452 10.1518 2.6053C10.2131 2.67607 10.2878 2.73408 10.3715 2.77599ZM1.8192 10.0535L0.393821 10.7662C0.224768 10.8507 0.096241 10.999 0.0365136 11.1784C-0.0232137 11.3577 -0.00924865 11.5535 0.0753367 11.7225C0.159922 11.8916 0.308199 12.0201 0.487548 12.0798C0.666897 12.1395 0.862627 12.1256 1.03168 12.041L2.45706 11.3283C2.54077 11.2864 2.61541 11.2285 2.67671 11.1577C2.73802 11.087 2.7848 11.0049 2.81437 10.9161C2.84394 10.8273 2.85574 10.7335 2.84908 10.6402C2.84242 10.5468 2.81743 10.4557 2.77555 10.372C2.73367 10.2882 2.67571 10.2136 2.60498 10.1523C2.53425 10.091 2.45214 10.0442 2.36334 10.0146C2.27453 9.98507 2.18077 9.97328 2.08741 9.97994C1.99405 9.9866 1.90291 10.0116 1.8192 10.0535ZM18.8249 15.6793C18.9573 15.8116 19.0623 15.9688 19.134 16.1417C19.2056 16.3147 19.2425 16.5001 19.2425 16.6873C19.2425 16.8745 19.2056 17.0599 19.134 17.2328C19.0623 17.4058 18.9573 17.5629 18.8249 17.6953L17.6953 18.8249C17.5629 18.9573 17.4058 19.0623 17.2328 19.134C17.0599 19.2056 16.8745 19.2425 16.6873 19.2425C16.5001 19.2425 16.3147 19.2056 16.1417 19.134C15.9688 19.0623 15.8116 18.9573 15.6793 18.8249L11.1091 14.2539L9.53231 18.3599C9.53231 18.3688 9.52519 18.3786 9.52073 18.3884C9.41166 18.6427 9.23018 18.8593 8.99891 19.0112C8.76763 19.1631 8.49677 19.2436 8.22007 19.2427H8.14969C7.86111 19.2305 7.58324 19.13 7.35365 18.9547C7.12406 18.7795 6.95382 18.5379 6.86595 18.2628L2.2094 4.00182C2.12947 3.75241 2.11979 3.4858 2.18144 3.23126C2.24309 2.97671 2.37368 2.74407 2.55887 2.55887C2.74407 2.37368 2.97671 2.24309 3.23126 2.18144C3.4858 2.11979 3.75241 2.12947 4.00182 2.2094L18.2628 6.86595C18.5353 6.95713 18.774 7.12857 18.9474 7.35778C19.1208 7.58699 19.2208 7.86326 19.2344 8.15034C19.248 8.43742 19.1745 8.72191 19.0235 8.96646C18.8725 9.21102 18.6511 9.40423 18.3884 9.52073L18.3599 9.53231L14.2539 11.1083L18.8249 15.6793ZM17.8174 16.6868L13.2463 12.1158C13.0818 11.9516 12.9599 11.7496 12.8914 11.5275C12.8228 11.3054 12.8096 11.0698 12.8529 10.8415C12.8962 10.6131 12.9947 10.3987 13.1398 10.2171C13.2849 10.0355 13.4723 9.89217 13.6855 9.79957L13.714 9.7871L17.8076 8.21561L3.56352 3.56352L8.21383 17.8049L9.78621 13.7069C9.78621 13.6971 9.79334 13.6873 9.79779 13.6775C9.89042 13.4644 10.0337 13.2773 10.2152 13.1322C10.3967 12.9872 10.611 12.8888 10.8392 12.8454C10.9274 12.8291 11.0168 12.8207 11.1065 12.8205C11.4841 12.8209 11.8462 12.9712 12.1131 13.2383L16.6868 17.8174L17.8174 16.6868Z"
                            fill="currentColor"
                          />
                        </svg>
                      ) : null}
                      {panel.icon === 'recording' ? (
                        <svg viewBox="0 0 21 21" fill="none" aria-hidden="true">
                          <path
                            d="M2.02051 1.3374C2.11089 1.339 2.20063 1.3592 2.2832 1.396C2.36563 1.43278 2.44042 1.48523 2.50195 1.55127H2.50098L19.0586 18.1089C19.181 18.2359 19.2487 18.4062 19.2471 18.5825C19.2453 18.7588 19.1746 18.9276 19.0498 19.0522C18.9249 19.1769 18.7556 19.2471 18.5791 19.2485C18.4029 19.2499 18.2332 19.1825 18.1064 19.0601L18.1045 19.0581L13.7871 14.7417C13.5596 15.187 13.2199 15.5664 12.7998 15.8413C12.3307 16.1483 11.7823 16.3122 11.2217 16.312H4.23047C3.46642 16.312 2.73363 16.0085 2.19336 15.4683C1.6531 14.928 1.34961 14.1952 1.34961 13.4312V7.17529C1.34965 6.50979 1.58025 5.86495 2.00195 5.3501C2.37705 4.89218 2.88286 4.56242 3.44922 4.40283L1.5498 2.50244C1.48395 2.44098 1.43124 2.36693 1.39453 2.28467C1.35774 2.20209 1.33753 2.11236 1.33594 2.02197C1.33439 1.9317 1.35095 1.84201 1.38477 1.7583C1.41862 1.67449 1.46928 1.59859 1.5332 1.53467C1.59712 1.47075 1.67302 1.42009 1.75684 1.38623C1.84055 1.35242 1.93024 1.33586 2.02051 1.3374ZM11.2217 4.29443C11.9856 4.29443 12.7185 4.5981 13.2588 5.13818C13.799 5.67836 14.1024 6.41137 14.1025 7.17529V7.31201L17.042 5.28271C17.9762 4.63686 19.2509 5.30673 19.251 6.44189V14.1616C19.251 15.0123 18.5367 15.5998 17.7871 15.5718L17.7393 15.5698L14.1514 11.9819L14.3057 11.7964L17.8066 14.2134C17.8161 14.2199 17.8274 14.2244 17.8389 14.2251C17.8501 14.2257 17.8611 14.2225 17.8711 14.2173C17.8812 14.212 17.8906 14.2046 17.8965 14.1948C17.9024 14.185 17.9053 14.1731 17.9053 14.1616V6.44189L17.8965 6.40967C17.8906 6.39986 17.8812 6.39156 17.8711 6.38623C17.8611 6.38108 17.8501 6.37878 17.8389 6.37939C17.8274 6.38008 17.8161 6.38363 17.8066 6.39014L14.1025 8.94775V11.9331L12.7568 10.5874V7.17529C12.7567 6.76844 12.5943 6.37803 12.3066 6.09033C12.0189 5.80273 11.6285 5.64111 11.2217 5.64111H7.81055L6.6709 4.50146L6.46484 4.29443H11.2217ZM4.23047 5.64111C3.82357 5.64113 3.43327 5.80266 3.14551 6.09033C2.85781 6.37803 2.6964 6.76844 2.69629 7.17529V13.4312C2.69629 13.8381 2.85773 14.2283 3.14551 14.5161C3.43329 14.8039 3.82348 14.9653 4.23047 14.9653H11.2217C11.5942 14.9653 11.9544 14.8302 12.2344 14.5845C12.4998 14.3515 12.6746 14.0341 12.7334 13.687L4.6875 5.64111H4.23047Z"
                            fill="currentColor"
                          />
                        </svg>
                      ) : null}
                    </div>
                    <div className="proof-matrix-title-row">
                      <h3>{panel.title}</h3>
                    </div>
                    <p>{panel.body}</p>
                  </div>
                </article>
              ))}
            </div>
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

        <section className="content-section section-inner comparison-section" id="comparison">
          <div className="comparison-header">
            <SectionHeading
              eyebrow="Comparison"
              title={
                <>
                  The proof is in
                  <br />
                  the comparison
                </>
              }
              body="Compare side by side and see why Composure stays invisible where others fail."
            />

            <div className="comparison-note">
              <img className="comparison-note-logo" src="/logo_two.png" alt="" aria-hidden="true" />
              <p>
                A cleaner undetectability matrix with Composure highlighted as the clear winner.
              </p>
            </div>
          </div>

          <div className="comparison-table-wrap" data-reveal>
            <table className="comparison-table">
              <thead>
                <tr>
                  <th className="comparison-table-feature-head">
                    <span>Undetectability features</span>
                    <small>(click to demo)</small>
                  </th>
                  <th className="is-composure">
                    <span className="comparison-brand">
                      <img src="/logo_two.png" alt="" aria-hidden="true" />
                      Composure
                    </span>
                  </th>
                  <th>UltraCode</th>
                  <th>LockedIn</th>
                  <th>AIApply</th>
                </tr>
              </thead>
              <tbody>
                {comparisonRows.map((row, index) => (
                  <tr key={row.feature} style={{ transitionDelay: `${index * 70}ms` }}>
                    <th scope="row">{row.feature}</th>
                    <td className="is-composure">
                      <span className={`comparison-mark ${row.composure ? 'is-yes' : 'is-no'}`}>
                        {row.composure ? '✓' : '✕'}
                      </span>
                    </td>
                    <td>
                      <span className={`comparison-mark ${row.notes ? 'is-yes' : 'is-no'}`}>
                        {row.notes ? '✓' : '✕'}
                      </span>
                    </td>
                    <td>
                      <span className={`comparison-mark ${row.browser ? 'is-yes' : 'is-no'}`}>
                        {row.browser ? '✓' : '✕'}
                      </span>
                    </td>
                    <td>
                      <span className={`comparison-mark ${row.generic ? 'is-yes' : 'is-no'}`}>
                        {row.generic ? '✓' : '✕'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
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

          <div className="pricing-currency-switch" role="group" aria-label="Display currency">
            <span className="pricing-currency-label">
              Showing prices in <strong>{displayCurrency}</strong>
            </span>
            <div className="pricing-currency-toggle">
              <button
                type="button"
                className={displayCurrency === 'ZAR' ? 'is-active' : ''}
                aria-pressed={displayCurrency === 'ZAR'}
                onClick={() => changeDisplayCurrency('ZAR')}
              >
                ZAR (R)
              </button>
              <button
                type="button"
                className={displayCurrency === 'USD' ? 'is-active' : ''}
                aria-pressed={displayCurrency === 'USD'}
                onClick={() => changeDisplayCurrency('USD')}
              >
                USD ($)
              </button>
            </div>
          </div>

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
