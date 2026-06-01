import SmokingApp from './components/SmokingApp';

// Age gating happens in middleware.ts (server-side redirect to /age-gate).
// No client wrapper needed here — by the time this renders, the cookie is set.
export default function Home() {
  return <SmokingApp />;
}
