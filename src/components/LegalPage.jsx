import React from 'react';

function renderSectionContent(section) {
  return (
    <>
      {section.paragraphs?.map((paragraph) => (
        <p key={paragraph}>{paragraph}</p>
      ))}

      {section.bullets?.length ? (
        <ul>
          {section.bullets.map((bullet) => (
            <li key={bullet}>{bullet}</li>
          ))}
        </ul>
      ) : null}
    </>
  );
}

export function LegalPage({ title, subtitle, effectiveDate, sections }) {
  return (
    <main className="legal-page">
      <div className="section-inner legal-layout">
        <div className="checkout-topbar">
          <a className="back-link" href="/">
            Back to homepage
          </a>
          <a className="button button-secondary" href="/?view=checkout&plan=pro">
            View pricing
          </a>
        </div>

        <section className="legal-hero">
          <p className="eyebrow">Legal</p>
          <h1>{title}</h1>
          <p>{subtitle}</p>

          <div className="legal-meta">
            <span>Effective {effectiveDate}</span>
            <span>Composure by Fikronix</span>
          </div>
        </section>

        <section className="legal-card">
          {sections.map((section) => (
            <article key={section.heading} className="legal-section">
              <h2>{section.heading}</h2>
              {renderSectionContent(section)}
            </article>
          ))}
        </section>
      </div>
    </main>
  );
}
