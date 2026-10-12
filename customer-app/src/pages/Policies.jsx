import React, { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { RotateCcw, CreditCard, Truck, Shield, FileText } from 'lucide-react';

const policies = [
  {
    id: 'return',
    icon: RotateCcw,
    title: 'Return Policy',
    content: [
      'We accept returns within 7 days of delivery for items that are unused, unwashed, and in their original packaging with all tags intact.',
      'To initiate a return, contact us at evaaswomenswear008@gmail.com or call +91 63743 40846 with your order ID and reason for return.',
      'Items purchased during sale or on discount are not eligible for return unless they are defective or damaged.',
      'Once your return is received and inspected, we will notify you of the approval or rejection of your return.',
    ],
  },
  {
    id: 'refund',
    icon: CreditCard,
    title: 'Refund Policy',
    content: [
      'Approved refunds will be processed within 5–7 business days to the original payment method.',
      'All orders are processed through secure online payment methods (UPI, Cards, Net Banking). Refunds will be credited directly to the original payment source.',
      'Shipping charges are non-refundable unless the return is due to our error (wrong or defective item).',
      "If you haven't received a refund after 7 business days, please check with your bank before contacting us.",
    ],
  },
  {
    id: 'shipping',
    icon: Truck,
    title: 'Shipping Policy',
    content: [
      'We ship across India. Orders are typically processed within 1–2 business days of placement.',
      'Standard delivery takes 5–7 business days. Delivery timelines may vary based on location and courier availability.',
      'Free shipping is available on all orders. No minimum order value required.',
      'Once your order is shipped, you will receive a tracking ID via email or SMS to track your delivery.',
    ],
  },
  {
    id: 'privacy',
    icon: Shield,
    title: 'Privacy Policy',
    content: [
      'We collect personal information such as your name, email, phone number, and address solely to process your orders and provide customer support.',
      'Your data is never sold or shared with third parties except for payment processing (Razorpay) and order delivery purposes.',
      'We use industry-standard security measures to protect your personal information.',
      'By using our website, you consent to the collection and use of your information as described in this policy.',
    ],
  },
  {
    id: 'terms',
    icon: FileText,
    title: 'Terms & Conditions',
    content: [
      "By accessing or placing an order on Evaas Women's Wear, you agree to be bound by these terms and conditions.",
      'All product images are for representation purposes. Slight variations in colour may occur due to photography lighting and screen settings.',
      'We reserve the right to cancel or refuse any order at our discretion, including cases of suspected fraud.',
      "Evaas Women's Wear is not liable for delays in delivery caused by courier partners or circumstances beyond our control.",
    ],
  },
];

const Policies = () => {
  const { hash } = useLocation();

  useEffect(() => {
    if (hash) {
      const el = document.querySelector(hash);
      if (el) setTimeout(() => el.scrollIntoView({ behavior: 'smooth', block: 'start' }), 100);
    } else {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }, [hash]);

  return (
    <div className="container" style={{ paddingTop: '2.5rem', paddingBottom: '3rem' }}>
      {/* Header */}
      <div style={{ textAlign: 'center', marginBottom: '3rem' }}>
        <h1 className="font-serif" style={{ fontSize: '2.4rem', fontWeight: '700', marginBottom: '0.75rem' }}>
          Our Policies
        </h1>
        <p style={{ color: 'var(--light-text)', maxWidth: '560px', margin: '0 auto', fontSize: '0.97rem' }}>
          Everything you need to know about returns, refunds, shipping, privacy, and our terms of service.
        </p>
      </div>

      {/* Quick Nav Chips */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.6rem', justifyContent: 'center', marginBottom: '3rem' }}>
        {policies.map((p) => (
          <a
            key={p.id}
            href={`#${p.id}`}
            style={{
              padding: '0.45rem 1.1rem',
              borderRadius: 'var(--radius-full)',
              background: 'var(--purple-pale)',
              color: 'var(--purple-dark)',
              fontSize: '0.85rem',
              fontWeight: '600',
              transition: 'var(--transition)',
              border: '1.5px solid var(--purple-light)',
              textDecoration: 'none',
            }}
            onMouseOver={(e) => { e.currentTarget.style.background = 'var(--purple)'; e.currentTarget.style.color = '#fff'; }}
            onMouseOut={(e) => { e.currentTarget.style.background = 'var(--purple-pale)'; e.currentTarget.style.color = 'var(--purple-dark)'; }}
          >
            {p.title}
          </a>
        ))}
      </div>

      {/* Policy Sections */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
        {policies.map((p) => {
          const Icon = p.icon;
          return (
            <div key={p.id} id={p.id} className="card" style={{ padding: '2rem', scrollMarginTop: '100px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem', marginBottom: '1.25rem' }}>
                <div style={{
                  width: '48px', height: '48px', borderRadius: 'var(--radius-sm)',
                  background: 'var(--purple-pale)', color: 'var(--purple)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                }}>
                  <Icon size={22} />
                </div>
                <h2 className="font-serif" style={{ fontSize: '1.55rem', fontWeight: '600', color: 'var(--dark-text)' }}>
                  {p.title}
                </h2>
              </div>
              <ul style={{ listStyle: 'none', padding: 0, display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {p.content.map((point, i) => (
                  <li key={i} style={{ display: 'flex', gap: '0.75rem', alignItems: 'flex-start', fontSize: '0.95rem', color: 'var(--body-text)', lineHeight: '1.75' }}>
                    <span style={{ marginTop: '8px', width: '7px', height: '7px', borderRadius: '50%', background: 'var(--purple)', flexShrink: 0 }} />
                    {point}
                  </li>
                ))}
              </ul>
            </div>
          );
        })}
      </div>

      {/* Contact CTA */}
      <div style={{
        marginTop: '3rem', textAlign: 'center',
        background: 'var(--purple-pale)', borderRadius: 'var(--radius-lg)',
        padding: '2.5rem 1.5rem', border: '1px solid var(--purple-light)'
      }}>
        <h3 className="font-serif" style={{ fontSize: '1.5rem', marginBottom: '0.5rem' }}>Still have questions?</h3>
        <p style={{ color: 'var(--light-text)', marginBottom: '1.25rem', fontSize: '0.95rem' }}>
          Our support team is happy to help you with any queries.
        </p>
        <a href="mailto:evaaswomenswear008@gmail.com" className="btn btn-primary" style={{ padding: '0.75rem 2rem' }}>
          Contact Us
        </a>
      </div>
    </div>
  );
};

export default Policies;
