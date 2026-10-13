import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Sparkles } from 'lucide-react';
import { getActiveCategories } from '../services/categoryService';
import { API_URL } from '../config';

const Categories = () => {
  const [categoriesList, setCategoriesList] = useState([]);
  const [loading, setLoading] = useState(true);

  const fallbackMap = {
    'Sarees': {
      description: 'Handwoven silk, banarasi, chanderi, and organza drape elegance.',
      image: 'https://images.unsplash.com/photo-1610030469983-98e550d6193c?auto=format&fit=crop&q=80&w=600'
    },
    'Kurtis': {
      description: 'Comfortable daily wear and chic embroidered festive kurtis.',
      image: 'https://images.unsplash.com/photo-1608748010899-18f300247112?auto=format&fit=crop&q=80&w=600'
    },
    'Salwars': {
      description: 'Classic anarkalis, palazzo suits, and tailored salwar kameez sets.',
      image: 'https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?auto=format&fit=crop&q=80&w=600'
    },
    'Tops': {
      description: 'Casual, formal, and party tops tailored with modern silhouettes.',
      image: 'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?auto=format&fit=crop&q=80&w=600'
    },
    'Leggings': {
      description: 'Four-way stretch premium cotton & churidar leggings in vibrant shades.',
      image: 'https://images.unsplash.com/photo-1506152983158-b4a74a01c721?auto=format&fit=crop&q=80&w=600'
    },
    'Nightwear': {
      description: 'Ultra-soft loungewear sets, nighties, and satin sleepwear.',
      image: 'https://images.unsplash.com/photo-1562572159-4ebcd318f4dd?auto=format&fit=crop&q=80&w=600'
    },
    'Ethnic Wear': {
      description: 'Grand lehengas, fusion gowns, and celebratory ethnic ensembles.',
      image: 'https://images.unsplash.com/photo-1595777457583-95e059d581b8?auto=format&fit=crop&q=80&w=600'
    },
    'Western Wear': {
      description: 'Dresses, blazers, and chic contemporary coordinates.',
      image: 'https://images.unsplash.com/photo-1539109136881-3be0616acf4b?auto=format&fit=crop&q=80&w=600'
    }
  };

  useEffect(() => {
    let isMounted = true;
    const fetchCats = async () => {
      try {
        const data = await getActiveCategories();
        if (isMounted) {
          const mapped = (data || []).map(cat => {
            const fallback = fallbackMap[cat.name] || {};
            return {
              name: cat.name,
              description: cat.description || fallback.description || 'Exclusive curated collection from Evaas.',
              image: cat.image ? (cat.image.startsWith('http') ? cat.image : `${API_URL}${cat.image}`) : (fallback.image || 'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?auto=format&fit=crop&q=80&w=600')
            };
          });
          setCategoriesList(mapped);
        }
      } catch (err) {
        console.error('Error fetching categories:', err);
      } finally {
        if (isMounted) setLoading(false);
      }
    };
    fetchCats();
    return () => { isMounted = false; };
  }, []);

  return (
    <div className="container" style={{ paddingTop: '2.5rem', display: 'flex', flexDirection: 'column', gap: '2.5rem' }}>
      <div style={{ textAlign: 'center', maxWidth: '700px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', alignSelf: 'center', backgroundColor: 'var(--rose-gold-light)', padding: '4px 14px', borderRadius: '20px', color: 'var(--rose-gold-dark)', fontSize: '0.8rem', fontWeight: '700' }}>
          <Sparkles size={14} /> CURATED APPAREL
        </div>
        <h1 className="font-serif" style={{ fontSize: '2.4rem', fontWeight: '700' }}>Explore All Collections</h1>
        <p style={{ color: 'var(--light-text)', fontSize: '1rem' }}>
          Discover the complete Evaas collection across our signature women's ethnic and contemporary wear categories.
        </p>
      </div>

      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
        gap: '2rem'
      }}>
        {categoriesList.map((cat) => (
          <Link
            key={cat.name}
            to={`/products?category=${encodeURIComponent(cat.name)}`}
            className="card"
            style={{
              display: 'flex',
              flexDirection: 'column',
              overflow: 'hidden',
              textDecoration: 'none',
              transition: 'var(--transition-smooth)'
            }}
          >
            <div style={{ position: 'relative', width: '100%', height: '240px', overflow: 'hidden' }}>
              <img
                src={cat.image}
                alt={cat.name}
                style={{
                  width: '100%',
                  height: '100%',
                  objectFit: 'cover',
                  transition: 'transform 0.4s ease'
                }}
                onMouseOver={(e) => { e.currentTarget.style.transform = 'scale(1.08)'; }}
                onMouseOut={(e) => { e.currentTarget.style.transform = 'scale(1)'; }}
              />
              <div style={{
                position: 'absolute',
                inset: 0,
                background: 'linear-gradient(to top, rgba(0,0,0,0.5) 0%, transparent 60%)'
              }} />
              <div style={{
                position: 'absolute',
                bottom: '15px',
                left: '20px',
                right: '20px',
                color: 'white'
              }}>
                <h3 style={{ fontSize: '1.4rem', fontWeight: '700', color: 'white' }}>{cat.name}</h3>
              </div>
            </div>

            <div style={{ padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '0.75rem', flexGrow: 1 }}>
              <p style={{ color: 'var(--light-text)', fontSize: '0.88rem', lineHeight: '1.5', flexGrow: 1 }}>
                {cat.description}
              </p>
              <div style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                color: 'var(--rose-gold-dark)',
                fontWeight: '700',
                fontSize: '0.9rem'
              }}>
                Shop {cat.name} <ArrowRight size={16} />
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
};

export default Categories;
