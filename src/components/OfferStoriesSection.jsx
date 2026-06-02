import React, { useState } from 'react';
import { offerStories } from '../data/siteContent';

export function OfferStoriesSection() {
  const [expanded, setExpanded] = useState(false);
  const visibleStories = expanded ? offerStories : offerStories.slice(0, 3);

  return (
    <section className="results-section" id="offers">
      <div className="section-inner results-shell">
        <div className="results-heading">
          <p className="results-eyebrow">
            <span className="results-eyebrow-dot" />
            Proven results
          </p>
          <h2>10,000+ candidates cracked job offers by using Composure</h2>
        </div>

        <div className="results-grid" data-reveal>
          {visibleStories.map((story, index) => (
            <article
              key={story.title}
              className="results-card"
              style={{ transitionDelay: `${index * 70}ms` }}
            >
              <div className="results-image-slot" aria-hidden="true">
                <div className="results-image-placeholder">
                  <span>Add screenshot here</span>
                  <small>Drop your image into this slot</small>
                </div>
              </div>

              <div className="results-card-body">
                <div className="results-brand-row">
                  <div className="results-logo-slot" aria-hidden="true">
                    <span>Add logo</span>
                  </div>
                  <div className="results-brand-copy">
                    <strong>{story.brand}</strong>
                    <span>{story.metric}</span>
                  </div>
                </div>

                <p>{story.title}</p>

                <a className="results-link" href="#pricing">
                  View offer
                </a>
              </div>
            </article>
          ))}
        </div>

        <div className="results-footer">
          <button
            type="button"
            className="results-toggle"
            onClick={() => setExpanded((current) => !current)}
            aria-expanded={expanded}
          >
            <span className="results-toggle-icon" aria-hidden="true">
              {expanded ? '−' : '⌄'}
            </span>
            <span>{expanded ? 'Show less' : 'View more'}</span>
          </button>
        </div>
      </div>
    </section>
  );
}
