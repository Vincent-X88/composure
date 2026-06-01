import React, { useEffect, useRef, useState } from 'react';

export function Navbar({
  links,
  isOpen,
  isScrolled,
  onToggle,
  onNavigate,
  downloadUrl,
  session,
  subscription,
  authReady,
  onSignOut,
}) {
  const userEmail = session?.user?.email;
  const userInitial = userEmail?.slice(0, 1).toUpperCase() ?? 'A';
  const accountPlan = subscription?.plan ?? 'free';
  const canManageBilling = accountPlan === 'pro' && Boolean(subscription?.paystack_subscription_code);
  const [accountMenuOpen, setAccountMenuOpen] = useState(false);
  const accountMenuRef = useRef(null);

  useEffect(() => {
    function handleOutsideClick(event) {
      if (accountMenuRef.current && !accountMenuRef.current.contains(event.target)) {
        setAccountMenuOpen(false);
      }
    }

    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, []);

  return (
    <header className={`navbar ${isScrolled ? 'is-scrolled' : ''}`}>
      <a className="brand" href="#top" aria-label="Composure home">
        <img className="brand-logo brand-logo--svg" src="/composure-mark.svg" alt="" aria-hidden="true" />
        <span className="brand-name">Composure</span>
      </a>

      <nav className={`nav-links ${isOpen ? 'is-open' : ''}`} aria-label="Primary">
        {links.map((link) => (
          <a key={link.href} href={link.href} className="nav-link" onClick={onNavigate}>
            {link.label}
          </a>
        ))}
        <a className="button button-primary nav-button" href={downloadUrl} target="_blank" rel="noreferrer" onClick={onNavigate}>
          Download
        </a>
        {authReady && userEmail ? (
          <div className="nav-account-wrap" ref={accountMenuRef}>
            <button
              type="button"
              className="nav-account-button"
              onClick={() => setAccountMenuOpen((current) => !current)}
              aria-haspopup="menu"
              aria-expanded={accountMenuOpen}
            >
              <span className="nav-account-avatar" aria-hidden="true">
                {userInitial}
              </span>
              <span className="nav-account-copy">
                <strong>Account</strong>
                <small>{accountPlan}</small>
              </span>
            </button>

            {accountMenuOpen ? (
              <div className="nav-account-menu" role="menu">
                <a href="?view=account" onClick={onNavigate}>
                  Account
                </a>
                <a href="?view=account#pricing" onClick={onNavigate}>
                  Change plan
                </a>
                {canManageBilling ? (
                  <a href="?view=account#billing" onClick={onNavigate}>
                    Manage or cancel subscription
                  </a>
                ) : null}
                <button
                  type="button"
                  onClick={() => {
                    setAccountMenuOpen(false);
                    onSignOut?.();
                  }}
                >
                  Sign out
                </button>
              </div>
            ) : null}
          </div>
        ) : (
          <a className="nav-auth-button" href="?view=auth" onClick={onNavigate}>
            Sign in
          </a>
        )}
      </nav>

      <button
        type="button"
        className={`menu-button ${isOpen ? 'is-active' : ''}`}
        aria-label="Toggle navigation menu"
        aria-expanded={isOpen}
        onClick={onToggle}
      >
        <span />
        <span />
        <span />
      </button>
    </header>
  );
}
