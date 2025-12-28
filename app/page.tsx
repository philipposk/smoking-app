import Header from './components/Header'
import AIRecommendations from './components/AIRecommendations'
import Link from 'next/link'
import { Map, Images, MessageSquare, Users, Sparkles } from 'lucide-react'

export default function Home() {
  return (
    <>
      <Header />
      <main style={{
        minHeight: 'calc(100vh - 80px)',
        padding: '3rem 2rem',
        maxWidth: '1200px',
        margin: '0 auto',
      }}>
        <section style={{
          textAlign: 'center',
          marginBottom: '4rem',
        }}>
          <h1 style={{
            fontSize: '3.5rem',
            marginBottom: '1rem',
            fontWeight: 'bold',
            background: 'linear-gradient(135deg, var(--accent), var(--accent-hover))',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
          }}>
            Welcome to Smoking App
          </h1>
          <p style={{
            fontSize: '1.5rem',
            color: 'var(--text-secondary)',
            marginBottom: '2rem',
          }}>
            Find smoking places, connect with others, and join the community
          </p>
          <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
            <Link href="/map" style={{
              padding: '1rem 2rem',
              backgroundColor: 'var(--accent)',
              color: 'white',
              borderRadius: '8px',
              fontWeight: 'bold',
            }}>
              Explore Map
            </Link>
            <Link href="/forum" style={{
              padding: '1rem 2rem',
              backgroundColor: 'var(--bg-secondary)',
              color: 'var(--text-primary)',
              borderRadius: '8px',
              border: '1px solid var(--border)',
              fontWeight: 'bold',
            }}>
              Join Forum
            </Link>
          </div>
        </section>

        <section style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
          gap: '2rem',
          marginTop: '4rem',
        }}>
          <div style={{
            padding: '2rem',
            backgroundColor: 'var(--bg-secondary)',
            borderRadius: '12px',
            border: '1px solid var(--border)',
          }}>
            <Map size={40} style={{ marginBottom: '1rem', color: 'var(--accent)' }} />
            <h3 style={{ fontSize: '1.5rem', marginBottom: '0.5rem' }}>Map View</h3>
            <p style={{ color: 'var(--text-secondary)' }}>
              Discover smoking places near you with our interactive map
            </p>
          </div>

          <div style={{
            padding: '2rem',
            backgroundColor: 'var(--bg-secondary)',
            borderRadius: '12px',
            border: '1px solid var(--border)',
          }}>
            <Images size={40} style={{ marginBottom: '1rem', color: 'var(--accent)' }} />
            <h3 style={{ fontSize: '1.5rem', marginBottom: '0.5rem' }}>Gallery</h3>
            <p style={{ color: 'var(--text-secondary)' }}>
              Save and organize your favorite smoking spots
            </p>
          </div>

          <div style={{
            padding: '2rem',
            backgroundColor: 'var(--bg-secondary)',
            borderRadius: '12px',
            border: '1px solid var(--border)',
          }}>
            <MessageSquare size={40} style={{ marginBottom: '1rem', color: 'var(--accent)' }} />
            <h3 style={{ fontSize: '1.5rem', marginBottom: '0.5rem' }}>Community Forum</h3>
            <p style={{ color: 'var(--text-secondary)' }}>
              Connect with others and share experiences
            </p>
          </div>

          <div style={{
            padding: '2rem',
            backgroundColor: 'var(--bg-secondary)',
            borderRadius: '12px',
            border: '1px solid var(--border)',
          }}>
            <Sparkles size={40} style={{ marginBottom: '1rem', color: 'var(--accent)' }} />
            <h3 style={{ fontSize: '1.5rem', marginBottom: '0.5rem' }}>AI Recommendations</h3>
            <p style={{ color: 'var(--text-secondary)' }}>
              Get personalized suggestions based on your preferences
            </p>
          </div>
        </section>

        <section style={{ marginTop: '4rem' }}>
          <AIRecommendations />
        </section>
      </main>
    </>
  )
}

