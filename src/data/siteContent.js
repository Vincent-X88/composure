export const navLinks = [
  { label: 'Features', href: '#features' },
  { label: 'How It Works', href: '#how-it-works' },
  { label: 'Pricing', href: '#pricing' },
  { label: 'FAQ', href: '#faq' },
];

export const downloadUrl =
  'https://github.com/Vincent-X88/stealth-desktop/releases/download/interview-assistant/Stealth-AI-setup.exe';

export const heroStats = [
  { value: '11,300', label: 'Candidates coached' },
  { value: '97%', label: 'Interview Success rate' },
  { value: '0.8', label: 'Average response time' },
  { value: '50K+', label: 'Questions coached through' },
];

export const trustedBy = ['Google', 'Meta', 'Amazon', 'Takealot', 'Microsoft', 'Netflix'];

export const features = [
  {
    icon: '🖥️',
    title: 'Distraction-Free Display',
    body: 'A clean private overlay visible only to you. Stays out of your way so you can stay present in the conversation.',
  },
  {
    icon: '⚡',
    title: 'Real-Time AI Guidance',
    body: 'Multi-model AI generates expert-level coaching in under 1 second. Context-aware and tailored to the role.',
  },
  {
    icon: '🎤',
    title: 'Automatic Question Capture',
    body: 'Listens to your interview audio and reads your screen. No manual input, it just works.',
  },
  {
    icon: '🧠',
    title: 'All Interview Formats',
    body: 'Behavioral, system design, coding, product, and case interviews, each with a specialized AI model.',
  },
  {
    icon: '🔒',
    title: 'Completely Private',
    body: 'Runs locally on your device. Your sessions, questions, and answers stay entirely yours.',
  },
  {
    icon: '🎯',
    title: 'Full Conversation Memory',
    body: 'Remembers everything said so far. Follow-up coaching builds naturally on what came before.',
  },
];

export const steps = [
  {
    number: '1',
    title: 'Install & Launch',
    body: 'Download Composure, open your interview platform, and activate your coaching overlay with a single hotkey.',
  },
  {
    number: '2',
    title: 'AI Listens',
    body: 'Composure captures interview questions from audio or screen in real time. No typing needed from you.',
  },
  {
    number: '3',
    title: 'You Deliver',
    body: 'Coaching guidance appears privately in your overlay. Read, think, and answer with total confidence.',
  },
];

export const testimonials = [
  {
    quote:
      'Got an offer from Google L4. The system design coaching was incredibly accurate. I knew exactly what to say for every question.',
    name: 'Alex K.',
    role: 'Software Engineer → Google L4',
    initials: 'AK',
  },
  {
    quote:
      'Struggled with nerves in every interview before this. Having real-time guidance gave me the confidence to actually show what I know.',
    name: 'Sarah R.',
    role: 'PM Candidate → Meta',
    initials: 'SR',
  },
  {
    quote:
      'The live coaching kept me calm and structured throughout. Landed the role and genuinely felt like I performed at my best.',
    name: 'James M.',
    role: 'SDE II → Amazon',
    initials: 'JM',
  },
];

export const pricingPlans = [
  {
    id: 'free',
    name: 'Free',
    ctaLabel: 'Start Free',
    description: 'For trying Composure before upgrading.',
    price: '$0',
    cadence: 'forever',
    checkoutPath: '?view=auth&plan=free',
    badge: null,
    featured: false,
    features: [
      '5 coaching sessions/day',
      'Screen capture mode',
      'Core question coverage',
      'Single-device access',
      'Email support',
    ],
  },
  {
    id: 'pro',
    name: 'Pro',
    ctaLabel: 'Choose Pro',
    description: 'For heavy usage, deeper prep, and premium support.',
    price: 'R248',
    cadence: 'mo',
    checkoutPath: '?view=checkout&plan=pro',
    badge: 'Most Popular',
    featured: true,
    features: [
      'Everything in Free',
      'Dedicated performance tier',
      'Custom prep packs',
      'Advanced coaching workflows',
      'Unlimited devices',
      'Priority 1:1 support',
    ],
  },
  {
    id: 'premium',
    name: 'Premium',
    ctaLabel: 'Choose Premium',
    description: 'Lifetime access for serious candidates who want one payment and permanent activation.',
    price: 'R745',
    cadence: 'lifetime',
    checkoutPath: '?view=checkout&plan=premium',
    badge: 'Lifetime',
    featured: false,
    features: [
      'Everything in Pro',
      'Lifetime Composure access',
      'No monthly subscription',
      'Unlimited devices',
      'All future premium updates',
      'Priority lifetime support',
    ],
  },
];

export const paymentMethods = [
  {
    id: 'card',
    name: 'Card',
    description: 'Pay with a local or international debit or credit card.',
  },
  {
    id: 'bank-transfer',
    name: 'Bank Transfer',
    description: 'Use supported Paystack bank transfer options where available.',
  },
  {
    id: 'eft',
    name: 'EFT',
    description: 'Pay with supported EFT methods in South Africa.',
  },
  {
    id: 'capitec-pay',
    name: 'Capitec Pay',
    description: 'Use Capitec Pay when it is enabled on your Paystack account.',
  },
];

export const faqItems = [
  {
    question: 'Can I download the app before choosing a plan?',
    answer:
      'Yes. The homepage download CTA can take people straight to the Windows installer, while pricing stays focused on plan selection and payment.',
  },
  {
    question: 'Does it work during live video interviews',
    answer:
      'Yes — Composure runs privately alongside any video conferencing platform including Zoom, Google Meet, and Microsoft Teams. The overlay is visible only on your display and does not interfere with your call.',
  },
  {
    question: 'How fast is the AI coaching?',
    answer:
      'Average response time is 0.8 seconds from question capture to guidance appearing. Our AI pipeline is optimized for speed so you always have what you need before the silence becomes awkward.',
  },
  {
    question: 'What interview types does it support?',
    answer:
      'Composure covers behavioral interviews, technical coding rounds, system design, product management, consulting case interviews, and more. Each format uses a specialized AI model trained for that context.',
  },
  {
    question: 'Does it work on Mac and Windows?',
    answer:
      'Composure is only available for Windows 10/11 right now.',
  },
];

export const footerColumns = [
  {
    title: 'Product',
    links: [
      { label: 'Download', href: downloadUrl },
      { label: 'Features', href: '#features' },
      { label: 'Pricing', href: '#pricing' },
      { label: 'How It Works', href: '#how-it-works' },
    ],
  },
  {
    title: 'Explore',
    links: [
      { label: 'Product Preview', href: '#demo' },
      { label: 'FAQ', href: '#faq' },
      { label: 'Checkout Step', href: '?view=checkout&plan=pro' },
    ],
  },
  {
    title: 'Actions',
    links: [
      { label: 'Choose a Plan', href: '#pricing' },
      { label: 'Download for Windows', href: downloadUrl },
      { label: 'Continue to Payment', href: '?view=checkout&plan=pro' },
    ],
  },
  {
    title: 'Legal',
    links: [
      { label: 'Terms of Service', href: '?view=terms' },
      { label: 'Privacy Policy', href: '?view=privacy' },
    ],
  },
];
