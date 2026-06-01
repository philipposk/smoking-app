import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Terms of Service — Smoking',
  description: 'Rules of the road for using Smoking.',
};

const LAST_UPDATED = '2026-05-25';

export default function TermsPage() {
  return (
    <main className="wrap" style={{ maxWidth: 720, padding: '64px 24px', lineHeight: 1.6 }}>
      <a href="/" style={{ fontSize: 13, opacity: 0.7 }}>← Back</a>
      <div
        style={{
          fontFamily: 'var(--mono)',
          fontSize: 11,
          letterSpacing: '0.18em',
          textTransform: 'uppercase',
          color: 'var(--muted)',
          marginTop: 24,
          marginBottom: 12,
        }}
      >
        Terms · last updated {LAST_UPDATED}
      </div>
      <h1 style={{ fontFamily: 'var(--serif)', fontSize: 44, lineHeight: 1.05, letterSpacing: '-0.01em', marginBottom: 24 }}>
        Terms of Service
      </h1>

      <h2>1. Who can use Smoking</h2>
      <p>
        You must be at or above the legal smoking age in your jurisdiction. By using the service,
        you confirm you are. Misrepresenting your age is grounds for immediate, permanent removal.
      </p>

      <h2>2. What Smoking is</h2>
      <p>
        A community-edited directory of places where smoking is socially or legally permitted.
        Listings are informational. We do not warrant that any listed venue currently permits
        smoking — laws and house rules change. Always check on arrival.
      </p>

      <h2>3. What Smoking is not</h2>
      <ul>
        <li>A retailer. We do not sell tobacco, nicotine, or cannabis products.</li>
        <li>A recommendation. Smoking carries health risks; we take no position on whether you
          should smoke. See <a href="https://www.who.int/news-room/fact-sheets/detail/tobacco">WHO
          guidance</a>.</li>
        <li>Legal advice. Local laws on tobacco, vaping, and cannabis differ. You are responsible
          for knowing them where you are.</li>
      </ul>

      <h2>4. User content</h2>
      <p>
        When you submit a place, review, photo, or forum post, you grant Smoking a worldwide,
        royalty-free license to display, store, and moderate it. You keep your copyright. We can
        remove anything that violates these terms or applicable law.
      </p>

      <h2>5. Prohibited content</h2>
      <ul>
        <li>Sale offers for tobacco, nicotine, or cannabis products.</li>
        <li>Anything aimed at minors.</li>
        <li>Content that glamorises smoking to anyone under the legal age.</li>
        <li>Doxxing, harassment, hate speech, illegal content.</li>
        <li>Spam, automated mass submissions, fake merchant claims.</li>
      </ul>

      <h2>6. Merchant claims</h2>
      <p>
        Submitting a merchant claim does not transfer ownership of a listing. We review claims and
        may grant edit rights at our discretion. Fraudulent claims lead to account termination.
      </p>

      <h2>7. Availability</h2>
      <p>
        Provided as-is, with no uptime guarantee. We can change, suspend, or end the service at
        any time. Your data is exportable on request (see Privacy Policy).
      </p>

      <h2>8. Liability</h2>
      <p>
        To the maximum extent permitted by law, Smoking is not liable for any loss, damage, or
        legal consequence arising from your use of the service or reliance on its information.
      </p>

      <h2>9. Changes</h2>
      <p>
        We will post material changes here with a 30-day notice. Continued use after that period
        means you accept the new terms.
      </p>

      <h2>10. Contact</h2>
      <p>
        <a href="mailto:hello@smoking.example">hello@smoking.example</a>
      </p>
    </main>
  );
}
