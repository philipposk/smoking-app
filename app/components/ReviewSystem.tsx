'use client'

import { useState } from 'react'
import { Star, MessageSquare } from 'lucide-react'

interface Review {
  id: string
  userId: string
  userName: string
  rating: number
  comment: string
  date: string
}

interface ReviewSystemProps {
  placeId: string
  placeName: string
  currentRating?: number
  reviews?: Review[]
}

export default function ReviewSystem({ placeId, placeName, currentRating, reviews = [] }: ReviewSystemProps) {
  const [showForm, setShowForm] = useState(false)
  const [rating, setRating] = useState(0)
  const [comment, setComment] = useState('')
  const [submittedReviews, setSubmittedReviews] = useState<Review[]>(reviews)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    // In a real app, this would call an API
    const newReview: Review = {
      id: Date.now().toString(),
      userId: 'current-user',
      userName: 'paparopapari',
      rating,
      comment,
      date: new Date().toISOString(),
    }

    setSubmittedReviews([...submittedReviews, newReview])
    setRating(0)
    setComment('')
    setShowForm(false)
  }

  const averageRating = submittedReviews.length > 0
    ? submittedReviews.reduce((sum, r) => sum + r.rating, 0) / submittedReviews.length
    : currentRating || 0

  return (
    <div style={{
      backgroundColor: 'var(--bg-secondary)',
      borderRadius: '12px',
      border: '1px solid var(--border)',
      padding: '1.5rem',
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
        <div>
          <h3 style={{ fontSize: '1.25rem', marginBottom: '0.5rem' }}>Reviews</h3>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <div style={{ display: 'flex', gap: '0.25rem' }}>
              {[1, 2, 3, 4, 5].map((star) => (
                <Star
                  key={star}
                  size={20}
                  fill={star <= averageRating ? 'var(--accent)' : 'none'}
                  style={{ color: star <= averageRating ? 'var(--accent)' : 'var(--text-secondary)' }}
                />
              ))}
            </div>
            <span style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
              {averageRating.toFixed(1)} ({submittedReviews.length} reviews)
            </span>
          </div>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            padding: '0.5rem 1rem',
            fontSize: '0.9rem',
          }}
        >
          <MessageSquare size={18} />
          Add Review
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} style={{
          marginBottom: '1.5rem',
          padding: '1rem',
          backgroundColor: 'var(--bg-primary)',
          borderRadius: '8px',
          border: '1px solid var(--border)',
        }}>
          <div style={{ marginBottom: '1rem' }}>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem' }}>
              Rating
            </label>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onClick={() => setRating(star)}
                  style={{
                    background: 'transparent',
                    border: 'none',
                    cursor: 'pointer',
                    padding: 0,
                  }}
                >
                  <Star
                    size={24}
                    fill={star <= rating ? 'var(--accent)' : 'none'}
                    style={{ color: star <= rating ? 'var(--accent)' : 'var(--text-secondary)' }}
                  />
                </button>
              ))}
            </div>
          </div>
          <div style={{ marginBottom: '1rem' }}>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem' }}>
              Comment
            </label>
            <textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Share your experience..."
              rows={3}
              style={{ width: '100%', resize: 'vertical' }}
            />
          </div>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <button type="submit" style={{ flex: 1 }}>
              Submit Review
            </button>
            <button
              type="button"
              onClick={() => {
                setShowForm(false)
                setRating(0)
                setComment('')
              }}
              style={{
                flex: 1,
                background: 'var(--bg-secondary)',
                color: 'var(--text-primary)',
                border: '1px solid var(--border)',
              }}
            >
              Cancel
            </button>
          </div>
        </form>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        {submittedReviews.length === 0 ? (
          <p style={{ color: 'var(--text-secondary)', textAlign: 'center', padding: '2rem' }}>
            No reviews yet. Be the first to review!
          </p>
        ) : (
          submittedReviews.map((review) => (
            <div
              key={review.id}
              style={{
                padding: '1rem',
                backgroundColor: 'var(--bg-primary)',
                borderRadius: '8px',
                border: '1px solid var(--border)',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <strong>{review.userName}</strong>
                  <div style={{ display: 'flex', gap: '0.25rem' }}>
                    {[1, 2, 3, 4, 5].map((star) => (
                      <Star
                        key={star}
                        size={14}
                        fill={star <= review.rating ? 'var(--accent)' : 'none'}
                        style={{ color: star <= review.rating ? 'var(--accent)' : 'var(--text-secondary)' }}
                      />
                    ))}
                  </div>
                </div>
                <span style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
                  {new Date(review.date).toLocaleDateString()}
                </span>
              </div>
              {review.comment && (
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', margin: 0 }}>
                  {review.comment}
                </p>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  )
}

