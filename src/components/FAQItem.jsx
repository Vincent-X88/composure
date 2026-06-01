import React from 'react';

export function FAQItem({ item, isOpen, onToggle }) {
  return (
    <article className={`faq-item ${isOpen ? 'is-open' : ''}`}>
      <button type="button" className="faq-question" onClick={onToggle} aria-expanded={isOpen}>
        <span>{item.question}</span>
        <span className="faq-icon" aria-hidden="true">
          {isOpen ? '−' : '+'}
        </span>
      </button>
      <div className="faq-answer">
        <p>{item.answer}</p>
      </div>
    </article>
  );
}
