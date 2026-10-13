import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Sparkles, TrendingUp, ShieldCheck, Heart, Tag, Clock } from 'lucide-react';
import { getProducts } from '../services/productService';
import { getActiveCategories } from '../services/categoryService';
import ProductCard from '../components/ProductCard';
import { useFestival } from '../context/FestivalContext';
import heroImage from '../assets/images/image.png';
import { API_URL } from '../config';

const Home = () => {
  const [featuredProducts, setFeaturedProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const { activeSale } = useFestival();

  const categoryImageMap = {
    'Sarees': 'https://images.unsplash.com/photo-1610030469983-98e550d6193c?auto=format&fit=crop&q=80&w=250',
    'Kurtis': 'https://images.unsplash.com/photo-1608748010899-18f300247112?auto=format&fit=crop&q=80&w=250',
    'Salwars': 'https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?auto=format&fit=crop&q=80&w=250',
    'Tops': 'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?auto=format&fit=crop&q=80&w=250',
    'Leggings': 'https://images.unsplash.com/photo-1506152983158-b4a74a01c721?auto=format&fit=crop&q=80&w=250',
    'Nightwear': 'https://images.unsplash.com/photo-1562572159-4ebcd318f4dd?auto=format&fit=crop&q=80&w=250',
    'Ethnic Wear': 'https://images.unsplash.com/photo-1595777457583-95e059d581b8?auto=format&fit=crop&q=80&w=250',
    'Western Wear': 'https://images.unsplash.com/photo-1539109136881-3be0616acf4b?auto=format&fit=crop&q=80&w=250'
  };

  useEffect(() => {
    let isMounted = true;
    const fetchData = async () => {
      try {
        const [prodData, catData] = await Promise.all([
          getProducts(),
          getActiveCategories()
        ]);
        if (isMounted) {
          setFeaturedProducts(Array.isArray(prodData) ? prodData.slice(0, 4) : []);

          const mappedCats = (catData || []).map(cat => ({
            name: cat.name,
            image: cat.image ? (cat.image.startsWith('http') ? cat.image : `${API_URL}${cat.image}`) : (categoryImageMap[cat.name] || 'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?auto=format&fit=crop&q=80&w=250')
          }));
          setCategories(mappedCats);
        }
      } catch (err) {
        console.error('Error fetching home data:', err);
      } finally {
        if (isMounted) setLoading(false);
      }
    };
    fetchData();
    return () => { isMounted = false; };
  }, []);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '4rem' }}>

      {/* 1. Elegant Hero Banner Section */}
      <section style={{
        position: 'relative',
        background: activeSale
          ? `linear-gradient(135deg, #FFF9FA 0%, ${activeSale.theme?.primaryColor || '#D86B80'}18 60%, ${activeSale.theme?.secondaryColor || '#7EAD76'}20 100%)`
          : 'linear-gradient(135deg, #FFF9FA 0%, #FCECEE 55%, #EDF7EC 100%)',
        padding: '5rem 0',
        overflow: 'hidden'
      }}>
        {/* Animated background shape elements */}
        <div style={{
          position: 'absolute',
          top: '-10%',
          right: '-5%',
          width: '500px',
          height: '500px',
          borderRadius: '50%',
          background: activeSale
            ? `radial-gradient(circle, ${activeSale.theme?.primaryColor || '#D86B80'}25 0%, rgba(255, 255, 255, 0) 70%)`
            : 'radial-gradient(circle, rgba(126, 173, 118, 0.22) 0%, rgba(255, 255, 255, 0) 70%)',
          zIndex: 1
        }} />
        <div style={{
          position: 'absolute',
          bottom: '-12%',
          left: '-4%',
          width: '450px',
          height: '450px',
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(216, 107, 128, 0.14) 0%, rgba(255, 255, 255, 0) 70%)',
          zIndex: 1
        }} />

        <div className="container" style={{
          position: 'relative',
          zIndex: 2,
          display: 'grid',
          gridTemplateColumns: '1.2fr 0.8fr',
          gap: '2rem',
          alignItems: 'center'
        }}>
          {/* Hero text */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            <div style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              backgroundColor: 'white',
              padding: '6px 14px',
              borderRadius: '50px',
              boxShadow: 'var(--shadow-sm)',
              alignSelf: 'flex-start',
              border: activeSale ? `1px solid ${activeSale.theme?.primaryColor || '#D86B80'}40` : 'none'
            }}>
              <Sparkles size={14} color={activeSale?.theme?.primaryColor || 'var(--rose-gold)'} />
              <span style={{
                fontSize: '0.75rem',
                fontWeight: '700',
                color: activeSale?.theme?.primaryColor || 'var(--rose-gold-dark)',
                textTransform: 'uppercase',
                letterSpacing: '1px'
              }}>
                {activeSale ? `${activeSale.theme?.emoji || '🎉'} ${activeSale.name} Live` : 'New Season Collection'}
              </span>
            </div>

            <h1 className="font-serif fade-in" style={{ fontSize: '3.5rem', lineHeight: '1.15', fontWeight: '700', color: 'var(--dark-text)' }}>
              {activeSale ? (
                <>
                  {activeSale.theme?.bannerText || `${activeSale.name}!`} <br />
                  <span style={{
                    color: activeSale.theme?.primaryColor || 'var(--rose-gold-dark)',
                    borderBottom: `3px solid ${activeSale.theme?.accentColor || 'var(--primary-pink)'}`
                  }}>
                    Special Offers
                  </span>
                </>
              ) : (
                <>
                  Elegance in Every <br />
                  <span style={{ color: 'var(--rose-gold-dark)', borderBottom: '3px solid var(--primary-pink)' }}>Thread</span>
                </>
              )}
            </h1>

            <p style={{ color: 'var(--light-text)', fontSize: '1.1rem', maxWidth: '550px', lineHeight: '1.7' }}>
              {activeSale?.theme?.bannerSubText || "Discover Evaas's exquisite collections. From traditional sarees and ethnic suits to contemporary western apparel, find the perfect attire for every occasion."}
            </p>

            <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem', flexWrap: 'wrap' }}>
              <Link
                to="/products"
                className="btn btn-primary"
                style={{
                  padding: '0.9rem 2.2rem',
                  backgroundColor: activeSale?.theme?.primaryColor || undefined,
                  borderColor: activeSale?.theme?.primaryColor || undefined
                }}
              >
                Shop {activeSale ? 'Sale Now' : 'Collection'} <ArrowRight size={18} />
              </Link>
            </div>
          </div>

          {/* Hero Visual Image */}
          <div style={{ display: 'none', justifyContent: 'center' }} className="desktop-hero-img">
            <div style={{
              position: 'relative',
              width: '320px',
              height: '420px',
              borderRadius: 'var(--border-radius-lg)',
              overflow: 'hidden',
              boxShadow: 'var(--shadow-lg)',
              border: '6px solid white'
            }}>
              <img
                src={heroImage}
                alt="Evaas Womenswear"
                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
              />
            </div>
          </div>
        </div>
      </section>

      {/* 2. Active Festival Spotlight Card (if live) */}
      {activeSale && (
        <section className="container">
          <div style={{
            background: `linear-gradient(135deg, ${activeSale.theme?.primaryColor || '#D86B80'}, ${activeSale.theme?.accentColor || '#FF6B00'})`,
            borderRadius: '20px',
            padding: '2.5rem',
            color: '#fff',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '1.5rem',
            boxShadow: `0 10px 30px ${activeSale.theme?.primaryColor || '#D86B80'}40`
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
              <div style={{
                fontSize: '3rem',
                backgroundColor: 'rgba(255,255,255,0.2)',
                borderRadius: '50%',
                width: '80px',
                height: '80px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0
              }}>
                {activeSale.theme?.emoji || '🎉'}
              </div>
              <div>
                <span style={{
                  backgroundColor: 'rgba(255,255,255,0.25)',
                  padding: '4px 12px',
                  borderRadius: '20px',
                  fontSize: '0.78rem',
                  fontWeight: '800',
                  textTransform: 'uppercase',
                  letterSpacing: '1px'
                }}>
                  Active Sale
                </span>
                <h2 style={{ fontSize: '1.8rem', fontWeight: '800', margin: '6px 0 2px', color: '#fff' }}>
                  {activeSale.name}
                </h2>
                <p style={{ opacity: 0.9, fontSize: '0.95rem', margin: 0 }}>
                  {activeSale.theme?.bannerSubText || `Get ${activeSale.discountValue}${activeSale.discountType === 'percentage' ? '%' : '₹'} off on select collections`}
                </p>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
              <div style={{
                backgroundColor: 'rgba(255,255,255,0.2)',
                backdropFilter: 'blur(10px)',
                padding: '12px 20px',
                borderRadius: '12px',
                textAlign: 'center',
                border: '1px solid rgba(255,255,255,0.3)'
              }}>
                <div style={{ fontSize: '1.4rem', fontWeight: '900' }}>
                  {activeSale.discountValue}{activeSale.discountType === 'percentage' ? '%' : '₹'} OFF
                </div>
                <div style={{ fontSize: '0.72rem', opacity: 0.85, textTransform: 'uppercase', fontWeight: '700' }}>
                  Limited Time
                </div>
              </div>

              <Link
                to="/products"
                style={{
                  backgroundColor: '#fff',
                  color: activeSale.theme?.primaryColor || '#D86B80',
                  padding: '12px 24px',
                  borderRadius: '12px',
                  fontWeight: '800',
                  fontSize: '0.95rem',
                  textDecoration: 'none',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '8px',
                  boxShadow: '0 4px 15px rgba(0,0,0,0.15)'
                }}
              >
                Shop Sale <ArrowRight size={16} />
              </Link>
            </div>
          </div>
        </section>
      )}

      {/* 3. Categories Section (Circular Navigators) */}
      <section className="container" style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
        <div style={{ textAlign: 'center', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          <h2 className="font-serif" style={{ fontSize: '2.2rem', fontWeight: '600' }}>Browse Categories</h2>
          <p style={{ color: 'var(--light-text)' }}>Find your exact fit in our curated fashion groups</p>
        </div>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(110px, 1fr))',
          gap: '1.5rem',
          justifyContent: 'center'
        }}>
          {categories.map((cat) => (
            <Link
              key={cat.name}
              to={`/products?category=${encodeURIComponent(cat.name)}`}
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '0.75rem',
                textAlign: 'center',
                transition: 'var(--transition-smooth)'
              }}
              onMouseOver={(e) => { e.currentTarget.style.transform = 'scale(1.05)'; }}
              onMouseOut={(e) => { e.currentTarget.style.transform = 'scale(1)'; }}
            >
              <div style={{
                width: '95px',
                height: '95px',
                borderRadius: '50%',
                overflow: 'hidden',
                boxShadow: 'var(--shadow-sm)',
                border: '3px solid white',
                boxSizing: 'content-box',
                transition: 'var(--transition-smooth)'
              }}
                onMouseOver={(e) => { e.currentTarget.style.borderColor = 'var(--primary-pink)'; }}
                onMouseOut={(e) => { e.currentTarget.style.borderColor = 'white'; }}>
                <img src={cat.image} alt={cat.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              </div>
              <span style={{ fontSize: '0.85rem', fontWeight: '600', color: 'var(--dark-text)' }}>{cat.name}</span>
            </Link>
          ))}
        </div>
      </section>

      {/* 3. Featured Products Grid Section */}
      <section className="container" style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
            <h2 className="font-serif" style={{ fontSize: '2.2rem', fontWeight: '600' }}>Featured Collections</h2>
            <p style={{ color: 'var(--light-text)' }}>Handpicked styles trending this week</p>
          </div>
          <Link to="/products" style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            color: 'var(--rose-gold-dark)',
            fontWeight: '600',
            fontSize: '0.95rem'
          }}>
            Explore All <ArrowRight size={16} />
          </Link>
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', padding: '3rem', fontSize: '1.1rem', color: 'var(--rose-gold)' }}>
            Loading stunning collections...
          </div>
        ) : featuredProducts.length === 0 ? (
          <div style={{
            textAlign: 'center',
            padding: '4rem 2rem',
            backgroundColor: 'white',
            borderRadius: '12px',
            border: '1px dashed var(--light-border)',
            color: 'var(--light-text)'
          }}>
            <h3>No products found!</h3>
            <p style={{ marginTop: '0.5rem' }}>Products will appear here once added to the catalog.</p>
          </div>
        ) : (
          <div className="grid-4">
            {featuredProducts.map((product) => (
              <ProductCard key={product._id} product={product} />
            ))}
          </div>
        )}
      </section>

      {/* 4. Luxury Promos / Value Props */}
      <section style={{ backgroundColor: 'white', padding: '4rem 0', borderTop: '1px solid var(--light-border)', borderBottom: '1px solid var(--light-border)' }}>
        <div className="container" style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
          gap: '2.5rem',
          textAlign: 'center'
        }}>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.8rem' }}>
            <div style={{ width: '50px', height: '50px', borderRadius: '50%', backgroundColor: 'var(--rose-gold-light)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--rose-gold-dark)' }}>
              <ShieldCheck size={24} />
            </div>
            <h3 style={{ fontSize: '1.1rem', fontWeight: '600' }}>Premium Quality</h3>
            <p style={{ fontSize: '0.85rem', color: 'var(--light-text)' }}>Carefully selected materials and tailored stitching for ultimate durability.</p>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.8rem' }}>
            <div style={{ width: '50px', height: '50px', borderRadius: '50%', backgroundColor: 'var(--rose-gold-light)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--rose-gold-dark)' }}>
              <TrendingUp size={24} />
            </div>
            <h3 style={{ fontSize: '1.1rem', fontWeight: '600' }}>Trending Fashion</h3>
            <p style={{ fontSize: '0.85rem', color: 'var(--light-text)' }}>Constantly updating inventory with the latest ethnic & western apparel.</p>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.8rem' }}>
            <div style={{ width: '50px', height: '50px', borderRadius: '50%', backgroundColor: 'var(--rose-gold-light)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--rose-gold-dark)' }}>
              <Heart size={24} />
            </div>
            <h3 style={{ fontSize: '1.1rem', fontWeight: '600' }}>Customer Focused</h3>
            <p style={{ fontSize: '0.85rem', color: 'var(--light-text)' }}>Dedicated support and easy exchanges to ensure a wonderful shopping experience.</p>
          </div>
        </div>
      </section>

      {/* Custom inline responsive css */}
      <style>{`
        @media(min-width: 769px) {
          .desktop-hero-img { display: flex !important; }
        }
      `}</style>

    </div>
  );
};

export default Home;
