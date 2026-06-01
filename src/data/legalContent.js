export const legalContactEmail = 'support@fikronix.co.za';

export const termsContent = {
  title: 'Terms of Service',
  subtitle:
    'These terms explain how Composure works, what users can expect from the app, and the rules that apply when you create an account or make a purchase.',
  effectiveDate: 'June 1, 2026',
  sections: [
    {
      heading: '1. Acceptance of these terms',
      paragraphs: [
        'By accessing the Composure website, creating an account, downloading the app, or purchasing a plan, you agree to these Terms of Service and our Privacy Policy.',
        'If you do not agree with these terms, do not use the service.',
      ],
    },
    {
      heading: '2. What Composure is',
      paragraphs: [
        'Composure is a desktop software product that provides AI-assisted interview coaching, account access, and plan-based features for Windows users.',
        'The service may include free access, a monthly Pro subscription, and a one-time Premium purchase, depending on the plan you choose.',
      ],
    },
    {
      heading: '3. Eligibility and accounts',
      paragraphs: [
        'You must be able to enter into a binding contract where you live in order to use paid features.',
        'You are responsible for the accuracy of your account information and for keeping your login credentials secure.',
        'If you sign in with Google or another supported provider, you authorize us to create or link an account for you using the information that provider shares with us.',
      ],
    },
    {
      heading: '4. Plans, billing, and renewals',
      paragraphs: [
        'Prices are shown on the website and may be displayed in your local currency or in ZAR at checkout.',
        'Pro is billed as a recurring monthly subscription unless you cancel it through the billing page or the hosted payment provider flow.',
        'Premium is a one-time purchase and does not renew automatically.',
        'Payment processing is handled by Paystack. We do not store your full card details on our servers.',
      ],
      bullets: [
        'Free: no recurring charge.',
        'Pro: monthly recurring subscription.',
        'Premium: one-time lifetime purchase.',
      ],
    },
    {
      heading: '5. License to use the software',
      paragraphs: [
        'When your account is active, we grant you a limited, personal, non-exclusive, non-transferable license to use Composure for your own professional interview preparation.',
        'You may not resell, sublicense, copy, modify, reverse engineer, or attempt to extract source code from the software except where applicable law allows it.',
      ],
    },
    {
      heading: '6. Acceptable use',
      paragraphs: [
        'You agree not to use Composure to break the law, interfere with the service, abuse the platform, or attempt to bypass plan limits and access controls.',
      ],
      bullets: [
        'Do not share accounts.',
        'Do not try to bypass billing or plan restrictions.',
        'Do not use the service in a way that harms other users or the platform.',
      ],
    },
    {
      heading: '7. Intellectual property',
      paragraphs: [
        'Composure, its design, branding, and content are owned by Fikronix or its licensors and are protected by intellectual property laws.',
        'Feedback you send us may be used by us to improve the product without compensation to you.',
      ],
    },
    {
      heading: '8. Availability and changes',
      paragraphs: [
        'We try to keep the service available and reliable, but we do not guarantee uninterrupted access.',
        'We may update, change, suspend, or discontinue features at any time as we improve the product or respond to operational needs.',
      ],
    },
    {
      heading: '9. Refunds, cancellation, and termination',
      paragraphs: [
        'You can cancel Pro through the billing management flow linked in your account.',
        'Premium purchases do not renew automatically.',
        'If you believe a charge was made in error, contact us at the support address below and we will review the request.',
        'We may suspend or terminate access if we reasonably believe these terms have been violated or if required to protect the service or other users.',
      ],
    },
    {
      heading: '10. Disclaimer and limitation of liability',
      paragraphs: [
        'Composure is provided on an as-is and as-available basis to the fullest extent permitted by law.',
        'To the extent permitted by law, we are not liable for indirect, incidental, special, consequential, or punitive damages arising from your use of the service.',
      ],
    },
    {
      heading: '11. Changes to these terms',
      paragraphs: [
        'We may update these terms from time to time. When we do, we will update the effective date on this page.',
      ],
    },
    {
      heading: '12. Contact',
      paragraphs: [
        `If you have any questions about these terms, email us at ${legalContactEmail}.`,
      ],
    },
  ],
};

export const privacyContent = {
  title: 'Privacy Policy',
  subtitle:
    'This policy explains what information Composure collects, how we use it, who we share it with, and the choices you have over your data.',
  effectiveDate: 'June 1, 2026',
  sections: [
    {
      heading: '1. Who we are',
      paragraphs: [
        'Composure is operated by Fikronix. This privacy policy applies to the Composure website, the desktop application, account features, and related billing and support flows.',
      ],
    },
    {
      heading: '2. Information we collect',
      paragraphs: [
        'We collect the information needed to create accounts, deliver the product, process payments, and support users.',
      ],
      bullets: [
        'Account information such as name, email address, and authentication details.',
        'Google sign-in information if you choose to sign in with Google, such as your profile name, email address, and profile image, depending on the permissions you grant.',
        'Billing and subscription details such as plan type, subscription status, payment reference, and subscription code.',
        'Support messages and communications you send to us.',
        'Device, browser, and usage information needed for security, troubleshooting, and service improvement.',
      ],
    },
    {
      heading: '3. How we use your information',
      bullets: [
        'Create and manage your account.',
        'Authenticate you when you sign in.',
        'Process Pro subscriptions and Premium purchases.',
        'Show your current plan, renewal date, and billing status.',
        'Provide customer support and respond to requests.',
        'Protect the platform against abuse, fraud, and unauthorized access.',
        'Improve the website and app experience.',
      ],
    },
    {
      heading: '4. How we share information',
      paragraphs: [
        'We only share information with service providers that help us operate Composure or where disclosure is required by law.',
      ],
      bullets: [
        'Supabase for authentication, database storage, and backend functions.',
        'Paystack for payment processing, subscription billing, and payment verification.',
        'Google when you choose to sign in with Google.',
        'Hosting and infrastructure providers that deliver the website and protect it from abuse.',
      ],
    },
    {
      heading: '5. Payments',
      paragraphs: [
        'Payments are processed by Paystack. Card and payment credentials are handled by Paystack and are not stored on our servers.',
        'We may store payment status, plan information, subscription codes, and transaction references so we can manage your access and support billing requests.',
      ],
    },
    {
      heading: '6. Cookies and local storage',
      paragraphs: [
        'Composure uses browser storage and related session technologies to keep you signed in and to maintain your experience across page loads.',
        'Third-party providers such as Google, Supabase, and Paystack may use cookies or similar technologies as part of their own services.',
      ],
    },
    {
      heading: '7. Data retention',
      paragraphs: [
        'We keep personal information only for as long as needed to provide the service, meet legal obligations, resolve disputes, and enforce our agreements.',
        'If you delete your account or ask us to remove your data, we will delete or anonymize it unless we are required to keep it for legal, tax, fraud-prevention, or accounting reasons.',
      ],
    },
    {
      heading: '8. Your choices and rights',
      paragraphs: [
        'Depending on where you live, you may have rights to access, correct, delete, or restrict the processing of your personal information.',
        'You can also request help with account data, billing records, or deletion by contacting us at the address below.',
      ],
    },
    {
      heading: '9. Security',
      paragraphs: [
        'We use reasonable technical and organizational measures to protect your information, but no online system can be guaranteed to be completely secure.',
      ],
    },
    {
      heading: '10. Children',
      paragraphs: [
        'Composure is not intended for children under 13, and we do not knowingly collect personal information from children under 13.',
      ],
    },
    {
      heading: '11. Changes to this policy',
      paragraphs: [
        'We may update this policy from time to time. When we do, we will update the effective date on this page.',
      ],
    },
    {
      heading: '12. Contact us',
      paragraphs: [
        `If you have any questions about this privacy policy or your data, email us at ${legalContactEmail}.`,
      ],
    },
  ],
};
