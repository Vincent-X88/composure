import React from 'react';

export function StatCard({ value, label }) {
  return (
    <article className="stat-card">
      <strong className="stat-value">{value}</strong>
      <span className="stat-label">{label}</span>
    </article>
  );
}
