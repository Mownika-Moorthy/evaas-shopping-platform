import React, { useState, useEffect } from 'react';
import { Trash2, Star, MessageSquare } from 'lucide-react';
import { getAllReviewsAdmin, deleteReviewAdmin } from '../services/orderService';
import { getImageUrl } from '../config';

const ReviewsTab = ({ showToast, confirmDialog, backendUrl }) => {
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);

  const loadReviews = async () => {
    setLoading(true);
    try { setReviews(await getAllReviewsAdmin()); }
    catch { showToast('Failed to load reviews', 'error'); }
    finally { setLoading(false); }
  };

  useEffect(() => { loadReviews(); }, []);

  const handleDelete = (rev) => {
    confirmDialog(
      'Delete Review?',
      'This will permanently remove the review.',
      async () => {
        try {
          await deleteReviewAdmin(rev._id);
          showToast('Review deleted', 'success');
          loadReviews();
        } catch { showToast('Failed to delete review', 'error'); }
      }, 'Delete'
    );
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      <div>
        <h2 style={{ fontSize: '1.3rem', fontWeight: '700', color: '#1f2937' }}>Review Moderation</h2>
        <p style={{ fontSize: '0.85rem', color: '#6b7280', marginTop: '2px' }}>{reviews.length} total reviews</p>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '4rem', color: '#b76e79' }}>Loading reviews...</div>
      ) : reviews.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '4rem', color: '#9ca3af' }}>
          <MessageSquare size={40} style={{ marginBottom: '12px', opacity: 0.3 }} /><div>No reviews yet.</div>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {reviews.map(rev => (
            <div key={rev._id} style={{
              backgroundColor: '#fff', borderRadius: '12px', padding: '1.25rem',
              border: '1px solid #f3f4f6', boxShadow: '0 1px 4px rgba(0,0,0,0.05)',
              display: 'flex', gap: '1rem', alignItems: 'flex-start'
            }}>
              {/* Product image */}
              <div style={{ width: '50px', height: '60px', borderRadius: '8px', overflow: 'hidden', backgroundColor: '#f3f4f6', flexShrink: 0 }}>
                {rev.productId?.images?.[0]
                  ? <img src={getImageUrl(rev.productId.images[0])} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  : null
                }
              </div>

              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '8px' }}>
                  <div>
                    <div style={{ fontWeight: '700', color: '#1f2937', fontSize: '0.9rem' }}>{rev.productId?.name || 'Unknown Product'}</div>
                    <div style={{ fontSize: '0.78rem', color: '#6b7280', marginTop: '2px' }}>by {rev.userId?.name || 'Anonymous'} · {new Date(rev.createdAt).toLocaleDateString('en-IN')}</div>
                  </div>
                  <button onClick={() => handleDelete(rev)} style={{
                    padding: '6px 10px', borderRadius: '7px', backgroundColor: '#fee2e2',
                    border: 'none', cursor: 'pointer', color: '#dc2626'
                  }}><Trash2 size={13} /></button>
                </div>

                {/* Stars */}
                <div style={{ display: 'flex', gap: '2px', marginTop: '8px' }}>
                  {[1,2,3,4,5].map(s => (
                    <Star key={s} size={13} fill={s <= rev.rating ? '#f59e0b' : 'none'} color={s <= rev.rating ? '#f59e0b' : '#d1d5db'} />
                  ))}
                </div>

                {rev.comment && (
                  <p style={{ marginTop: '8px', fontSize: '0.84rem', color: '#374151', lineHeight: '1.5' }}>{rev.comment}</p>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ReviewsTab;
