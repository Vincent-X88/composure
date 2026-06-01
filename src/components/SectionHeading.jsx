import React from 'react';

export function SectionHeading({ eyebrow, title, body, center = false }) {
  return (
    <div className={center ? 'section-heading is-centered' : 'section-heading'}>
      <p className="section-eyebrow">{eyebrow}</p>
      <h2 className="section-title">{title}</h2>
      {body ? <p className="section-body">{body}</p> : null}
    </div>
  );
}
