// Lightweight email sender. Uses Resend if RESEND_API_KEY is set;
// otherwise logs the message to stdout for local dev.

interface SendOpts {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

const FROM = process.env.EMAIL_FROM ?? 'Smoking <noreply@smoking.example>';

export async function sendEmail({ to, subject, html, text }: SendOpts): Promise<void> {
  const key = process.env.RESEND_API_KEY;
  if (!key) {
    // Dev fallback: log to stdout so the developer can copy the link by hand.
    console.log('\n[email:DEV] -----------------------------');
    console.log(`To:      ${to}`);
    console.log(`From:    ${FROM}`);
    console.log(`Subject: ${subject}`);
    console.log(text ?? html.replace(/<[^>]+>/g, ''));
    console.log('---------------------------------------------\n');
    return;
  }

  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${key}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ from: FROM, to, subject, html, text }),
  });

  if (!res.ok) {
    const err = await res.text().catch(() => '');
    throw new Error(`Resend ${res.status}: ${err}`);
  }
}
