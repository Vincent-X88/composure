import React from 'react';

export function PricingCard({ plan, session = null, currentPlanId = 'free', isCurrentPlan = false }) {
  const isFreePlan = plan.id === 'free';
  const isFreeUnavailable = Boolean(session && currentPlanId !== 'free' && isFreePlan);
  const actionLabel = isCurrentPlan
    ? 'Current plan'
    : isFreeUnavailable
      ? 'Free unavailable'
      : isFreePlan && session
        ? 'Get Free'
        : plan.ctaLabel;
  const href = isFreeUnavailable ? undefined : isFreePlan && session ? '?view=checkout&plan=free' : plan.checkoutPath;

  return (
    <article className={`pricing-card ${plan.featured ? 'is-featured' : ''} ${isCurrentPlan ? 'is-current' : ''}`}>
      <div className="pricing-card-header">
        <span className={`plan-badge ${plan.badge ? '' : 'is-placeholder'}`} aria-hidden="true">
          {plan.badge ?? 'Popular'}
        </span>
        <h3>{plan.name}</h3>
        <p className="plan-description">{plan.description}</p>
      </div>

      <div className="pricing-card-body">
        <div className="price">
          {plan.price}
          <sub>/{plan.cadence ?? 'mo'}</sub>
        </div>
        {plan.displayCurrency === 'USD' && plan.checkoutCurrency === 'ZAR' && plan.localPrice ? (
          <p className="pricing-note pricing-note--inline">
            ≈ {plan.localPrice} · charged in ZAR at checkout
          </p>
        ) : null}

        <ul className="plan-features">
          {plan.features.map((feature) => (
            <li key={feature}>
              <span className="check-mark">✓</span>
              {feature}
            </li>
          ))}
        </ul>
      </div>

      {isCurrentPlan ? (
        <button className="button button-secondary" type="button" disabled>
          {actionLabel}
        </button>
      ) : isFreeUnavailable ? (
        <button className="button button-secondary" type="button" disabled>
          {actionLabel}
        </button>
      ) : (
        <a className={`button ${plan.featured ? 'button-primary' : 'button-secondary'}`} href={href}>
          {actionLabel}
        </a>
      )}
    </article>
  );
}
