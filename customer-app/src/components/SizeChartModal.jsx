import React, { useState, useEffect } from 'react';
import { X, Ruler, HelpCircle, Check, Info } from 'lucide-react';

/**
 * SizeChartModal — Interactive Size Guide for Dresses & Women's Apparel
 * Supports Inches & Centimeters toggle, category-specific tables, and direct size selection.
 */
const SizeChartModal = ({ isOpen, onClose, selectedSize, onSelectSize, category = 'Dresses' }) => {
  const [unit, setUnit] = useState('in'); // 'in' or 'cm'

  // Close on Escape key
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'hidden';
    }
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const isSaree = category.toLowerCase().includes('saree');

  // Size chart measurements in inches
  const dressMeasurementsInches = [
    { size: 'XS', uk: '6', us: '2', bust: '32', waist: '26', hip: '36', length: '40', shoulder: '14' },
    { size: 'S', uk: '8', us: '4', bust: '34', waist: '28', hip: '38', length: '41', shoulder: '14.5' },
    { size: 'M', uk: '10', us: '6', bust: '36', waist: '30', hip: '40', length: '42', shoulder: '15' },
    { size: 'L', uk: '12', us: '8', bust: '38', waist: '32', hip: '42', length: '43', shoulder: '15.5' },
    { size: 'XL', uk: '14', us: '10', bust: '40', waist: '34', hip: '44', length: '44', shoulder: '16' },
    { size: 'XXL', uk: '16', us: '12', bust: '42', waist: '36', hip: '46', length: '44.5', shoulder: '16.5' },
    { size: '3XL', uk: '18', us: '14', bust: '44', waist: '38', hip: '48', length: '45', shoulder: '17' }
  ];

  // Convert to cm (multiply inches by 2.54 and round)
  const toCm = (inchStr) => Math.round(parseFloat(inchStr) * 2.54).toString();

  const handleRowClick = (size) => {
    if (onSelectSize) {
      onSelectSize(size);
    }
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 9999,
        backgroundColor: 'rgba(30, 22, 40, 0.65)',
        backdropFilter: 'blur(5px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '1rem',
        animation: 'fadeIn 0.2s ease-out'
      }}
      onClick={onClose}
    >
      <div
        style={{
          backgroundColor: '#FFFFFF',
          borderRadius: '18px',
          width: '100%',
          maxWidth: '720px',
          maxHeight: '90vh',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: '0 25px 60px rgba(100, 50, 180, 0.25)',
          border: '1px solid var(--border)',
          overflow: 'hidden',
          animation: 'slideUp 0.25s cubic-bezier(0.16, 1, 0.3, 1)'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div style={{
          padding: '1.25rem 1.75rem',
          borderBottom: '1px solid var(--border)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          background: 'linear-gradient(135deg, #FAF5FF 0%, #FFFFFF 100%)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{
              width: '38px',
              height: '38px',
              borderRadius: '10px',
              backgroundColor: 'var(--purple-pale)',
              color: 'var(--purple-dark)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <Ruler size={20} />
            </div>
            <div>
              <h2 className="font-serif" style={{ fontSize: '1.4rem', fontWeight: '700', color: 'var(--dark-text)', margin: 0 }}>
                Size Guide & Measurement Chart
              </h2>
              <span style={{ fontSize: '0.8rem', color: 'var(--green-dark)', fontWeight: '600' }}>
                Tailored for Evaas {category || 'Dresses'}
              </span>
            </div>
          </div>

          <button
            onClick={onClose}
            aria-label="Close modal"
            style={{
              background: 'none',
              border: 'none',
              width: '34px',
              height: '34px',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              color: 'var(--light-text)',
              transition: 'background 0.2s'
            }}
            onMouseOver={(e) => { e.currentTarget.style.backgroundColor = '#F3EAFD'; }}
            onMouseOut={(e) => { e.currentTarget.style.backgroundColor = 'transparent'; }}
          >
            <X size={20} />
          </button>
        </div>

        {/* Modal Scrollable Body */}
        <div style={{ padding: '1.5rem 1.75rem', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          
          {/* Unit Toggle and Category Note */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
            <p style={{ fontSize: '0.85rem', color: 'var(--light-text)', margin: 0 }}>
              Click any size row to automatically select your size:
            </p>

            {/* Toggle in / cm */}
            {!isSaree && (
              <div style={{
                display: 'inline-flex',
                backgroundColor: 'var(--border-light)',
                borderRadius: '8px',
                padding: '3px',
                border: '1px solid var(--border)'
              }}>
                <button
                  type="button"
                  onClick={() => setUnit('in')}
                  style={{
                    padding: '4px 14px',
                    borderRadius: '6px',
                    fontSize: '0.8rem',
                    fontWeight: unit === 'in' ? '700' : '500',
                    border: 'none',
                    cursor: 'pointer',
                    backgroundColor: unit === 'in' ? 'var(--purple)' : 'transparent',
                    color: unit === 'in' ? '#FFFFFF' : 'var(--dark-text)',
                    transition: 'all 0.2s'
                  }}
                >
                  Inches (in)
                </button>
                <button
                  type="button"
                  onClick={() => setUnit('cm')}
                  style={{
                    padding: '4px 14px',
                    borderRadius: '6px',
                    fontSize: '0.8rem',
                    fontWeight: unit === 'cm' ? '700' : '500',
                    border: 'none',
                    cursor: 'pointer',
                    backgroundColor: unit === 'cm' ? 'var(--purple)' : 'transparent',
                    color: unit === 'cm' ? '#FFFFFF' : 'var(--dark-text)',
                    transition: 'all 0.2s'
                  }}
                >
                  Centimeters (cm)
                </button>
              </div>
            )}
          </div>

          {/* Saree Free Size Display */}
          {isSaree ? (
            <div style={{
              backgroundColor: '#FAF5FF',
              borderRadius: '12px',
              padding: '1.5rem',
              border: '1px solid var(--border)',
              display: 'flex',
              flexDirection: 'column',
              gap: '0.8rem'
            }}>
              <h3 style={{ fontSize: '1.1rem', fontWeight: '700', color: 'var(--purple-dark)' }}>Saree Dimensions & Specifications</h3>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginTop: '0.5rem' }}>
                <div style={{ backgroundColor: '#fff', padding: '12px', borderRadius: '8px', border: '1px solid var(--border)' }}>
                  <span style={{ fontSize: '0.75rem', color: 'var(--light-text)', textTransform: 'uppercase' }}>Saree Length</span>
                  <div style={{ fontSize: '1.1rem', fontWeight: '700', color: 'var(--dark-text)' }}>5.5 Meters</div>
                </div>
                <div style={{ backgroundColor: '#fff', padding: '12px', borderRadius: '8px', border: '1px solid var(--border)' }}>
                  <span style={{ fontSize: '0.75rem', color: 'var(--light-text)', textTransform: 'uppercase' }}>Blouse Piece Length</span>
                  <div style={{ fontSize: '1.1rem', fontWeight: '700', color: 'var(--dark-text)' }}>0.80 Meters (Unstitched)</div>
                </div>
                <div style={{ backgroundColor: '#fff', padding: '12px', borderRadius: '8px', border: '1px solid var(--border)' }}>
                  <span style={{ fontSize: '0.75rem', color: 'var(--light-text)', textTransform: 'uppercase' }}>Width / Height</span>
                  <div style={{ fontSize: '1.1rem', fontWeight: '700', color: 'var(--dark-text)' }}>44 Inches (112 cm)</div>
                </div>
              </div>
            </div>
          ) : (
            /* Dress & Apparel Size Table */
            <div style={{
              borderRadius: '12px',
              border: '1px solid var(--border)',
              overflow: 'hidden',
              boxShadow: 'var(--shadow-xs)'
            }}>
              <div style={{ overflowX: 'auto' }}>
                <table style={{
                  width: '100%',
                  borderCollapse: 'collapse',
                  textAlign: 'center',
                  fontSize: '0.88rem'
                }}>
                  <thead>
                    <tr style={{
                      backgroundColor: '#FAF5FF',
                      borderBottom: '2px solid var(--border)',
                      color: 'var(--purple-dark)'
                    }}>
                      <th style={{ padding: '12px 14px', fontWeight: '700' }}>Standard Size</th>
                      <th style={{ padding: '12px 14px', fontWeight: '600' }}>Bust ({unit})</th>
                      <th style={{ padding: '12px 14px', fontWeight: '600' }}>Waist ({unit})</th>
                      <th style={{ padding: '12px 14px', fontWeight: '600' }}>Hips ({unit})</th>
                      <th style={{ padding: '12px 14px', fontWeight: '600' }}>Shoulder ({unit})</th>
                      <th style={{ padding: '12px 14px', fontWeight: '600' }}>Length ({unit})</th>
                      <th style={{ padding: '12px 14px', fontWeight: '700' }}>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {dressMeasurementsInches.map((row) => {
                      const isCurrent = selectedSize === row.size;
                      const bustVal = unit === 'in' ? `${row.bust}"` : `${toCm(row.bust)} cm`;
                      const waistVal = unit === 'in' ? `${row.waist}"` : `${toCm(row.waist)} cm`;
                      const hipVal = unit === 'in' ? `${row.hip}"` : `${toCm(row.hip)} cm`;
                      const shoulderVal = unit === 'in' ? `${row.shoulder}"` : `${toCm(row.shoulder)} cm`;
                      const lengthVal = unit === 'in' ? `${row.length}"` : `${toCm(row.length)} cm`;

                      return (
                        <tr
                          key={row.size}
                          onClick={() => handleRowClick(row.size)}
                          style={{
                            borderBottom: '1px solid var(--border-light)',
                            backgroundColor: isCurrent ? 'var(--purple-pale)' : '#FFFFFF',
                            cursor: 'pointer',
                            transition: 'background 0.2s'
                          }}
                          onMouseOver={(e) => {
                            if (!isCurrent) e.currentTarget.style.backgroundColor = '#FAF5FF';
                          }}
                          onMouseOut={(e) => {
                            if (!isCurrent) e.currentTarget.style.backgroundColor = '#FFFFFF';
                          }}
                        >
                          <td style={{ padding: '12px', fontWeight: '700', color: isCurrent ? 'var(--purple-dark)' : 'var(--dark-text)' }}>
                            <span style={{
                              display: 'inline-block',
                              padding: '2px 10px',
                              borderRadius: '6px',
                              backgroundColor: isCurrent ? 'var(--purple)' : 'transparent',
                              color: isCurrent ? '#fff' : 'inherit'
                            }}>
                              {row.size}
                            </span>
                          </td>
                          <td style={{ padding: '12px', color: 'var(--body-text)' }}>{bustVal}</td>
                          <td style={{ padding: '12px', color: 'var(--body-text)' }}>{waistVal}</td>
                          <td style={{ padding: '12px', color: 'var(--body-text)' }}>{hipVal}</td>
                          <td style={{ padding: '12px', color: 'var(--body-text)' }}>{shoulderVal}</td>
                          <td style={{ padding: '12px', color: 'var(--body-text)' }}>{lengthVal}</td>
                          <td style={{ padding: '12px' }}>
                            {isCurrent ? (
                              <span style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '4px',
                                color: 'var(--green-dark)',
                                fontWeight: '700',
                                fontSize: '0.8rem'
                              }}>
                                <Check size={14} /> Selected
                              </span>
                            ) : (
                              <span style={{
                                fontSize: '0.78rem',
                                color: 'var(--purple)',
                                fontWeight: '600'
                              }}>
                                Select
                              </span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* How to Measure Instructions */}
          <div style={{
            backgroundColor: '#FAF5FF',
            borderRadius: '14px',
            padding: '1.25rem 1.5rem',
            border: '1px solid var(--border)'
          }}>
            <h4 style={{
              fontSize: '0.95rem',
              fontWeight: '700',
              color: 'var(--dark-text)',
              marginBottom: '0.75rem',
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}>
              <HelpCircle size={16} color="var(--purple-dark)" /> How to Measure Yourself Accurately
            </h4>

            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(190px, 1fr))',
              gap: '1rem',
              fontSize: '0.83rem',
              color: 'var(--light-text)',
              lineHeight: '1.5'
            }}>
              <div>
                <strong style={{ color: 'var(--dark-text)' }}>1. Bust:</strong>
                <p>Wrap the tape around the fullest part of your bust while keeping the tape parallel to the floor.</p>
              </div>
              <div>
                <strong style={{ color: 'var(--dark-text)' }}>2. Waist:</strong>
                <p>Measure around your natural waistline, where your body naturally creases when bending to one side.</p>
              </div>
              <div>
                <strong style={{ color: 'var(--dark-text)' }}>3. Hips:</strong>
                <p>Stand with feet together and measure around the widest part of your hips and rear.</p>
              </div>
              <div>
                <strong style={{ color: 'var(--dark-text)' }}>4. Length:</strong>
                <p>Measure from the highest point of your shoulder down to the garment's hemline.</p>
              </div>
            </div>
          </div>

          {/* Fit & Alteration Tip */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            backgroundColor: 'var(--green-pale)',
            color: 'var(--green-dark)',
            padding: '12px 16px',
            borderRadius: '10px',
            fontSize: '0.84rem',
            border: '1px solid rgba(74, 124, 89, 0.2)'
          }}>
            <Info size={18} style={{ flexShrink: 0 }} />
            <span>
              <strong>Evaas Fitting Tip:</strong> If you are between sizes, we recommend selecting the larger size. All Evaas stitched dresses feature a 1.5-inch inner fabric margin for custom alterations.
            </span>
          </div>

        </div>

        {/* Modal Footer */}
        <div style={{
          padding: '1rem 1.75rem',
          borderTop: '1px solid var(--border)',
          backgroundColor: '#FFFFFF',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <span style={{ fontSize: '0.85rem', color: 'var(--light-text)' }}>
            Selected Size: <strong style={{ color: 'var(--purple-dark)' }}>{selectedSize || 'None'}</strong>
          </span>
          <button
            type="button"
            className="btn btn-primary btn-sm"
            onClick={onClose}
            style={{ padding: '8px 24px' }}
          >
            Apply & Close
          </button>
        </div>

      </div>
    </div>
  );
};

export default SizeChartModal;
