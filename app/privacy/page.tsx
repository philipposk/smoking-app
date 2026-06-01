import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Privacy Policy — Smoking',
  description: 'How Smoking handles your data.',
};

const LAST_UPDATED = '2026-05-25';

export default function PrivacyPage() {
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
        Privacy · last updated {LAST_UPDATED}
      </div>
      <h1 style={{ fontFamily: 'var(--serif)', fontSize: 44, lineHeight: 1.05, letterSpacing: '-0.01em', marginBottom: 24 }}>
        Privacy Policy
      </h1>

      <p>
        We are <strong>Smoking</strong>, a directory of public places where smoking is socially or
        legally permitted. We are not a vendor and we do not sell tobacco, nicotine, or cannabis
        products. This document explains what we collect and why.
      </p>

      <h2>What we collect</h2>
      <ul>
        <li>
          <strong>Account data</strong>: username, email, bcrypt-hashed password. Required to sign
          in, post in the forum, save favorites, and submit merchant claims.
        </li>
        <li>
          <strong>Content you submit</strong>: places you add, reviews, forum posts and replies,
          merchant claim forms. Public by default; you can delete it from your account.
        </li>
        <li>
          <strong>Session cookies</strong>: a single HTTP-only cookie (<code>sb_session</code>)
          links your browser to your account. Also one cookie (<code>age_ok</code>) recording that
          you confirmed you are of legal smoking age.
        </li>
        <li>
          <strong>Technical logs</strong>: IP address and request metadata, retained up to 30 days
          for security and abuse prevention. We do not run third-party advertising trackers.
        </li>
      </ul>

      <h2>What we do not collect</h2>
      <ul>
        <li>Location data, unless you press &ldquo;near me&rdquo; — then we use your browser&rsquo;s
          geolocation in-memory only and never store it.</li>
        <li>Payment information.</li>
        <li>Health data.</li>
      </ul>

      <h2>Lawful basis (GDPR)</h2>
      <p>
        We process account data on the basis of <em>contract</em> (you signed up). We process
        security logs on the basis of <em>legitimate interest</em> (preventing abuse). We process
        the age confirmation on the basis of <em>legal obligation</em> (jurisdictional age limits
        on tobacco-related services).
      </p>

      <h2>Third parties</h2>
      <ul>
        <li><strong>Supabase</strong> hosts our database in the EU. Data Processing Addendum signed.</li>
        <li><strong>Vercel</strong> hosts the web app. CDN logs ephemeral.</li>
        <li><strong>OpenAI / Groq</strong> power the optional AI assistant. Your chat input is sent
          to them only when you use the assistant; we send no identifiers.</li>
        <li><strong>OpenStreetMap contributors</strong> license place data under ODbL. Attribution
          is shown on the map.</li>
      </ul>

      <h2>Your rights</h2>
      <p>
        You can export, correct, or delete your account at any time by emailing
        <a href="mailto:privacy@smoking.example"> privacy@smoking.example</a>. We delete within 30
        days. You can also complain to your national data protection authority.
      </p>

      <h2>Children</h2>
      <p>
        This service is not for anyone below the legal smoking age in their jurisdiction.
        Accounts found to belong to minors are deleted on sight.
      </p>

      <h2>Changes</h2>
      <p>
        Material changes are announced on the home screen with a 30-day notice before they take
        effect.
      </p>
    </main>
  );
}
