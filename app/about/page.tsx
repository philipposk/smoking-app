import Header from '../components/Header'
import { Users, Heart, Shield } from 'lucide-react'

export default function AboutPage() {
  return (
    <>
      <Header />
      <main style={{
        minHeight: 'calc(100vh - 80px)',
        padding: '2rem',
        maxWidth: '800px',
        margin: '0 auto',
      }}>
        <h1 style={{ fontSize: '2.5rem', marginBottom: '2rem' }}>About</h1>
        
        <div style={{
          backgroundColor: 'var(--bg-secondary)',
          borderRadius: '12px',
          border: '1px solid var(--border)',
          padding: '2rem',
          marginBottom: '2rem',
        }}>
          <p style={{ fontSize: '1.1rem', lineHeight: '1.8', marginBottom: '1.5rem' }}>
            Smoking App is a community-driven platform designed to help smokers find the best places 
            to enjoy a smoke and discover essential shops for all their needs. Whether you&apos;re looking 
            for tobacco, filters, lighters, rolling papers, or specialized smoking accessories, our app 
            connects you with the right places in your area.
          </p>
          <p style={{ fontSize: '1.1rem', lineHeight: '1.8', marginBottom: '1.5rem' }}>
            <strong>Community-Powered:</strong> Our platform thrives on community contributions. Users can 
            add new smoking spots, review locations, share tips about hidden gems (like unlocked rooftops, 
            shaded areas with no wind, or quiet cafes), and help others discover the best places. Merchants 
            can also claim and improve their shop listings, ensuring accurate information for customers.
          </p>
          <p style={{ fontSize: '1.1rem', lineHeight: '1.8', marginBottom: '1.5rem' }}>
            <strong>Comprehensive Coverage:</strong> We track various types of locations including smoking 
            cafes, tobacco shops, kiosks (periptero), convenience stores (7-Eleven), marijuana dispensaries, 
            social clubs, and unique smoking spots. Our database is regularly updated with new locations 
            and removes closed or inaccessible places (including those with no trespassing signs).
          </p>
          <p style={{ fontSize: '1.1rem', lineHeight: '1.8', marginBottom: '1.5rem' }}>
            <strong>Global & Local:</strong> Whether you&apos;re in Athens, Thailand, or anywhere else, 
            finding what you need shouldn&apos;t require asking locals. Our app aggregates data from Google 
            Maps and community contributions to help you find everything from big rolling papers to the perfect 
            smoking spot, no matter where you are in the world.
          </p>
        </div>

        <div style={{
          display: 'grid',
          gap: '1.5rem',
        }}>
          <div style={{
            backgroundColor: 'var(--bg-secondary)',
            borderRadius: '12px',
            border: '1px solid var(--border)',
            padding: '1.5rem',
            display: 'flex',
            gap: '1rem',
          }}>
            <Users size={32} style={{ color: 'var(--accent)' }} />
            <div>
              <h3 style={{ fontSize: '1.25rem', marginBottom: '0.5rem' }}>Community Contributions</h3>
              <p style={{ color: 'var(--text-secondary)' }}>
                Add new spots, review locations, share hidden gems. Your contributions help the entire community discover the best places.
              </p>
            </div>
          </div>

          <div style={{
            backgroundColor: 'var(--bg-secondary)',
            borderRadius: '12px',
            border: '1px solid var(--border)',
            padding: '1.5rem',
            display: 'flex',
            gap: '1rem',
          }}>
            <Heart size={32} style={{ color: 'var(--accent)' }} />
            <div>
              <h3 style={{ fontSize: '1.25rem', marginBottom: '0.5rem' }}>Merchant Features</h3>
              <p style={{ color: 'var(--text-secondary)' }}>
                Shop owners can claim and improve their listings, ensuring accurate information and better visibility for customers.
              </p>
            </div>
          </div>

          <div style={{
            backgroundColor: 'var(--bg-secondary)',
            borderRadius: '12px',
            border: '1px solid var(--border)',
            padding: '1.5rem',
            display: 'flex',
            gap: '1rem',
          }}>
            <Shield size={32} style={{ color: 'var(--accent)' }} />
            <div>
              <h3 style={{ fontSize: '1.25rem', marginBottom: '0.5rem' }}>Auto-Updates & Verification</h3>
              <p style={{ color: 'var(--text-secondary)' }}>
                Our system automatically updates from Google Maps, removes closed/inaccessible places, and verifies location accessibility (including no trespassing areas).
              </p>
            </div>
          </div>
        </div>
      </main>
    </>
  )
}

