'use client'

import { useState } from 'react'
import { Building2, X } from 'lucide-react'

interface MerchantClaimFormProps {
  placeId: string
  placeName: string
  onClose: () => void
  onSuccess: () => void
}

export default function MerchantClaimForm({ placeId, placeName, onClose, onSuccess }: MerchantClaimFormProps) {
  const [formData, setFormData] = useState({
    merchantName: '',
    merchantEmail: '',
    businessLicense: '',
    proofOfOwnership: '',
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      const response = await fetch('/api/places/claim', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          placeId,
          ...formData,
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to submit claim')
      }

      onSuccess()
      onClose()
    } catch (err: any) {
      setError(err.message || 'Failed to submit claim')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000,
      padding: '2rem',
    }}>
      <div style={{
        backgroundColor: 'var(--bg-primary)',
        borderRadius: '12px',
        border: '1px solid var(--border)',
        padding: '2rem',
        maxWidth: '500px',
        width: '100%',
        maxHeight: '90vh',
        overflowY: 'auto',
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Building2 size={24} style={{ color: 'var(--accent)' }} />
            <h2 style={{ fontSize: '1.5rem' }}>Claim Business</h2>
          </div>
          <button
            onClick={onClose}
            style={{
              background: 'transparent',
              border: 'none',
              cursor: 'pointer',
              color: 'var(--text-secondary)',
              padding: '0.5rem',
            }}
          >
            <X size={24} />
          </button>
        </div>

        <p style={{ color: 'var(--text-secondary)', marginBottom: '1.5rem' }}>
          Claim <strong>{placeName}</strong> to manage and improve your listing.
        </p>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem' }}>
              Business/Merchant Name *
            </label>
            <input
              type="text"
              required
              value={formData.merchantName}
              onChange={(e) => setFormData({ ...formData, merchantName: e.target.value })}
              placeholder="Your business name"
              style={{ width: '100%' }}
            />
          </div>

          <div>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem' }}>
              Email *
            </label>
            <input
              type="email"
              required
              value={formData.merchantEmail}
              onChange={(e) => setFormData({ ...formData, merchantEmail: e.target.value })}
              placeholder="your@email.com"
              style={{ width: '100%' }}
            />
          </div>

          <div>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem' }}>
              Business License Number (Optional)
            </label>
            <input
              type="text"
              value={formData.businessLicense}
              onChange={(e) => setFormData({ ...formData, businessLicense: e.target.value })}
              placeholder="License number if applicable"
              style={{ width: '100%' }}
            />
          </div>

          <div>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem' }}>
              Proof of Ownership (Optional)
            </label>
            <textarea
              value={formData.proofOfOwnership}
              onChange={(e) => setFormData({ ...formData, proofOfOwnership: e.target.value })}
              placeholder="Any additional information to verify ownership..."
              rows={3}
              style={{ width: '100%', resize: 'vertical' }}
            />
          </div>

          {error && (
            <div style={{
              padding: '1rem',
              backgroundColor: 'rgba(255, 0, 0, 0.1)',
              border: '1px solid rgba(255, 0, 0, 0.3)',
              borderRadius: '8px',
              color: '#ff4444',
              fontSize: '0.9rem',
            }}>
              {error}
            </div>
          )}

          <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
            <button
              type="button"
              onClick={onClose}
              style={{
                flex: 1,
                background: 'var(--bg-secondary)',
                color: 'var(--text-primary)',
                border: '1px solid var(--border)',
              }}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              style={{ flex: 1, opacity: loading ? 0.6 : 1 }}
            >
              {loading ? 'Submitting...' : 'Submit Claim'}
            </button>
          </div>
        </form>

        <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginTop: '1rem', fontStyle: 'italic' }}>
          After submission, you will receive a verification email to confirm ownership.
        </p>
      </div>
    </div>
  )
}

