import type { Metadata } from 'next';
import dynamic from 'next/dynamic';

export const metadata: Metadata = {
  title: 'Map — Smoking',
  description: 'Interactive map of tobacco shops, benches, and smoking areas worldwide.',
};

// Heavy MapLibre bundle — skip SSR.
const FullMapView = dynamic(() => import('@/app/components/FullMapView'), {
  ssr: false,
  loading: () => (
    <div style={{
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      height: '100vh', fontFamily: 'var(--sans)', color: 'var(--muted)',
    }}>
      Loading map…
    </div>
  ),
});

export default function MapPage() {
  return <FullMapView />;
}
