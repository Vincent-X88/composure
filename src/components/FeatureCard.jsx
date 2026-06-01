import React from 'react';

export function FeatureCard({ icon, title, body }) {
  return (
    <article className="feature-card">
      <div className="feature-icon" aria-hidden="true">
        {icon}
      </div>
      <h3>{title}</h3>
      <p>{body}</p>
    </article>
  );
}
