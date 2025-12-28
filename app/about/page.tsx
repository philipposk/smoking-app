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
            Smoking App is created by a team of smoking enthusiasts who want to build a community 
            around shared interests and passions. We&apos;re committed to providing a safe and respectful 
            environment for users to connect and share their experiences.
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
              <h3 style={{ fontSize: '1.25rem', marginBottom: '0.5rem' }}>Community First</h3>
              <p style={{ color: 'var(--text-secondary)' }}>
                We believe in building connections and fostering a positive community experience.
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
              <h3 style={{ fontSize: '1.25rem', marginBottom: '0.5rem' }}>Passion Driven</h3>
              <p style={{ color: 'var(--text-secondary)' }}>
                Created by enthusiasts, for enthusiasts. We understand what you&apos;re looking for.
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
              <h3 style={{ fontSize: '1.25rem', marginBottom: '0.5rem' }}>Safe & Respectful</h3>
              <p style={{ color: 'var(--text-secondary)' }}>
                We maintain a safe environment with age restrictions (18+) and respect for all users.
              </p>
            </div>
          </div>
        </div>
      </main>
    </>
  )
}

