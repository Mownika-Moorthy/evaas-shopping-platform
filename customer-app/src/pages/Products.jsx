import React, { useState, useEffect, useMemo } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { getProducts } from '../services/productService';
import { getActiveCategories } from '../services/categoryService';
import ProductCard from '../components/ProductCard';
import SearchBar from '../components/SearchBar';
import { SlidersHorizontal, RefreshCw, Star, X } from 'lucide-react';

const Products = () => {
  const location = useLocation();
  const navigate = useNavigate();

  const getQueryParam = (param) => {
    const params = new URLSearchParams(location.search);
    return params.get(param) || '';
  };

  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState(getQueryParam('search'));
  const [category, setCategory] = useState(getQueryParam('category'));
  const [minPrice, setMinPrice] = useState('');
  const [maxPrice, setMaxPrice] = useState('');
  const [rating, setRating] = useState('');
  const [sortBy, setSortBy] = useState(getQueryParam('sortBy') || 'latest');
  const [showMobileFilters, setShowMobileFilters] = useState(false);

  // Lock outer window scroll so only the products list is scrollable
  useEffect(() => {
    document.body.classList.add('products-view-mode');
    return () => {
      document.body.classList.remove('products-view-mode');
    };
  }, []);

  useEffect(() => {
    let isMounted = true;
    const loadCategories = async () => {
      const data = await getActiveCategories();
      if (isMounted) {
        setCategories(data.map(c => typeof c === 'string' ? c : c.name));
      }
    };
    loadCategories();
    return () => { isMounted = false; };
  }, []);

  useEffect(() => {
    setSearch(getQueryParam('search'));
    setCategory(getQueryParam('category'));
    const urlSort = getQueryParam('sortBy');
    if (urlSort) {
      setSortBy(urlSort);
    }
  }, [location.search]);

  const fetchFilteredProducts = async () => {
    setLoading(true);
    try {
      const params = {};
      if (search) params.search = search;
      if (category) params.category = category;
      if (minPrice) params.minPrice = minPrice;
      if (maxPrice) params.maxPrice = maxPrice;
      if (rating) params.rating = rating;
      if (sortBy) params.sortBy = sortBy;

      const data = await getProducts(params);
      setProducts(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Error loading catalog products:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFilteredProducts();
  }, [search, category, minPrice, maxPrice, rating, sortBy]);

  const handleSearchSubmit = (query) => {
    setSearch(query);
    const params = new URLSearchParams(location.search);
    if (query) {
      params.set('search', query);
    } else {
      params.delete('search');
    }
    navigate({ search: params.toString() });
  };

  const handleCategorySelect = (cat) => {
    const newCat = category === cat ? '' : cat;
    setCategory(newCat);
    
    const params = new URLSearchParams(location.search);
    if (newCat) {
      params.set('category', newCat);
    } else {
      params.delete('category');
    }
    navigate({ search: params.toString() });
  };

  const handleSortChange = (newSort) => {
    setSortBy(newSort);
    const params = new URLSearchParams(location.search);
    if (newSort && newSort !== 'latest') {
      params.set('sortBy', newSort);
    } else {
      params.delete('sortBy');
    }
    navigate({ search: params.toString() });
  };

  const handleResetFilters = () => {
    setSearch('');
    setCategory('');
    setMinPrice('');
    setMaxPrice('');
    setRating('');
    setSortBy('latest');
    navigate({ search: '' });
  };

  const displayedProducts = useMemo(() => {
    const list = [...products];
    if (sortBy === 'price_low') {
      return list.sort((a, b) => (Number(a.price) || 0) - (Number(b.price) || 0));
    }
    if (sortBy === 'price_high') {
      return list.sort((a, b) => (Number(b.price) || 0) - (Number(a.price) || 0));
    }
    if (sortBy === 'rating') {
      return list.sort((a, b) => (Number(b.averageRating) || 0) - (Number(a.averageRating) || 0));
    }
    if (sortBy === 'latest') {
      return list.sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
    }
    return list;
  }, [products, sortBy]);

  return (
    <div className="container products-page-container">
      
      {/* 1. Search & Sort Header Bar (Fixed at top) */}
      <div className="products-top-bar" style={{
        display: 'flex',
        flexWrap: 'wrap',
        gap: '1rem',
        justifyContent: 'space-between',
        alignItems: 'center',
        backgroundColor: 'white',
        padding: '0.85rem 1.25rem',
        borderRadius: '14px',
        boxShadow: 'var(--shadow-sm)',
        border: '1px solid var(--light-border)',
        flexShrink: 0,
        zIndex: 20
      }}>
        <div style={{ flex: '1 1 300px' }}>
          <SearchBar onSearch={handleSearchSubmit} placeholder="Search for sarees, kurtis, dresses..." />
        </div>

        <div style={{ display: 'flex', gap: '0.8rem', alignItems: 'center' }}>
          {/* Mobile Filter Trigger */}
          <button
            className="btn btn-outline btn-sm mobile-filter-btn"
            onClick={() => setShowMobileFilters(!showMobileFilters)}
            style={{ display: 'none' }}
          >
            <SlidersHorizontal size={15} /> Filters {category || minPrice || maxPrice || rating ? '•' : ''}
          </button>

          {/* Sort By Dropdown */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '0.88rem', color: 'var(--light-text)', whiteSpace: 'nowrap' }}>Sort By:</span>
            <select
              value={sortBy}
              onChange={(e) => handleSortChange(e.target.value)}
              className="form-control"
              style={{ width: 'auto', padding: '0.42rem 0.85rem', fontSize: '0.85rem', borderRadius: '8px' }}
            >
              <option value="latest">Latest Arrivals</option>
              <option value="price_low">Price: Low to High</option>
              <option value="price_high">Price: High to Low</option>
              <option value="rating">Top Rated</option>
            </select>
          </div>
        </div>
      </div>

      {/* 2. Main Layout Grid: Fixed Sidebar + Scrollable Products Grid */}
      <div className="products-layout-grid" style={{
        display: 'grid',
        gridTemplateColumns: '270px 1fr',
        gap: '1.5rem',
        flex: 1,
        minHeight: 0,
        overflow: 'hidden'
      }}>
        
        {/* Left Side: Desktop Sidebar Filters (Fixed in place, internally scrollable) */}
        <aside className={`filters-sidebar ${showMobileFilters ? 'mobile-show' : ''}`} style={{
          backgroundColor: 'white',
          padding: '1.25rem',
          borderRadius: '16px',
          boxShadow: 'var(--shadow-sm)',
          display: 'flex',
          flexDirection: 'column',
          gap: '1.2rem',
          border: '1px solid var(--light-border)',
          height: '100%',
          maxHeight: '100%',
          overflowY: 'auto',
          overflowX: 'hidden'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <h3 style={{ fontSize: '1.05rem', fontWeight: '700' }}>Filters</h3>
              {(category || minPrice || maxPrice || rating) && (
                <span style={{
                  backgroundColor: 'var(--rose-gold-light)',
                  color: 'var(--rose-gold-dark)',
                  padding: '2px 8px',
                  borderRadius: '12px',
                  fontSize: '0.72rem',
                  fontWeight: '700'
                }}>Active</span>
              )}
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <button
                onClick={handleResetFilters}
                style={{
                  background: 'none',
                  border: 'none',
                  color: 'var(--rose-gold-dark)',
                  fontSize: '0.8rem',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px'
                }}
              >
                <RefreshCw size={12} /> Reset
              </button>
              {showMobileFilters && (
                <button
                  onClick={() => setShowMobileFilters(false)}
                  style={{
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    color: 'var(--dark-text)',
                    display: 'flex',
                    alignItems: 'center',
                    padding: '4px'
                  }}
                  aria-label="Close filters"
                >
                  <X size={20} />
                </button>
              )}
            </div>
          </div>

          {/* Categories */}
          <div>
            <h4 style={{ fontSize: '0.88rem', fontWeight: '600', marginBottom: '0.75rem', color: 'var(--dark-text)' }}>Categories</h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.45rem' }}>
              {categories.map((cat) => (
                <button
                  key={cat}
                  onClick={() => handleCategorySelect(cat)}
                  style={{
                    background: category === cat ? 'var(--rose-gold-light)' : 'none',
                    color: category === cat ? 'var(--rose-gold-dark)' : 'var(--light-text)',
                    fontWeight: category === cat ? '700' : '400',
                    border: 'none',
                    textAlign: 'left',
                    padding: '6px 10px',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    fontSize: '0.88rem',
                    transition: 'var(--transition-smooth)'
                  }}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          <hr style={{ border: 'none', borderTop: '1px solid var(--light-border)' }} />

          {/* Price Range */}
          <div>
            <h4 style={{ fontSize: '0.88rem', fontWeight: '600', marginBottom: '0.75rem', color: 'var(--dark-text)' }}>Price Range (₹)</h4>
            <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
              <input
                type="number"
                placeholder="Min"
                className="form-control"
                style={{ padding: '0.4rem 0.6rem', fontSize: '0.85rem' }}
                value={minPrice}
                onChange={(e) => setMinPrice(e.target.value)}
              />
              <span style={{ color: 'var(--light-text)' }}>-</span>
              <input
                type="number"
                placeholder="Max"
                className="form-control"
                style={{ padding: '0.4rem 0.6rem', fontSize: '0.85rem' }}
                value={maxPrice}
                onChange={(e) => setMaxPrice(e.target.value)}
              />
            </div>
          </div>

          <hr style={{ border: 'none', borderTop: '1px solid var(--light-border)' }} />

          {/* Customer Rating */}
          <div>
            <h4 style={{ fontSize: '0.88rem', fontWeight: '600', marginBottom: '0.75rem', color: 'var(--dark-text)' }}>Minimum Rating</h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
              {[4, 3, 2].map((stars) => (
                <button
                  key={stars}
                  onClick={() => setRating(rating === String(stars) ? '' : String(stars))}
                  style={{
                    background: rating === String(stars) ? 'var(--rose-gold-light)' : 'none',
                    border: 'none',
                    cursor: 'pointer',
                    padding: '6px 10px',
                    borderRadius: '6px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    fontSize: '0.85rem',
                    color: 'var(--dark-text)'
                  }}
                >
                  <div style={{ display: 'flex', gap: '2px', color: '#fbbf24' }}>
                    {[...Array(stars)].map((_, i) => (
                      <Star key={i} size={14} fill="#fbbf24" color="#fbbf24" />
                    ))}
                  </div>
                  <span>&amp; above</span>
                </button>
              ))}
            </div>
          </div>

          {showMobileFilters && (
            <button
              onClick={() => setShowMobileFilters(false)}
              className="btn btn-primary btn-sm"
              style={{ width: '100%', marginTop: 'auto', padding: '0.75rem' }}
            >
              Apply Filters ({displayedProducts.length})
            </button>
          )}
        </aside>

        {/* Right Side: Scrollable Products Grid Area */}
        <main className="products-scroll-area" style={{
          height: '100%',
          maxHeight: '100%',
          overflowY: 'auto',
          overflowX: 'hidden',
          paddingRight: '6px',
          paddingBottom: '2.5rem'
        }}>
          {loading ? (
            <div style={{ textAlign: 'center', padding: '5rem', fontSize: '1.2rem', color: 'var(--rose-gold-dark)' }}>
              Filtering catalog products...
            </div>
          ) : displayedProducts.length === 0 ? (
            <div style={{
              textAlign: 'center',
              backgroundColor: 'white',
              borderRadius: '16px',
              padding: '5rem 2rem',
              boxShadow: 'var(--shadow-sm)',
              border: '1px solid var(--light-border)',
              color: 'var(--light-text)'
            }}>
              <h3>No products matched your filters</h3>
              <p style={{ marginTop: '0.5rem' }}>Try clearing filters or changing your search criteria.</p>
              <button onClick={handleResetFilters} className="btn btn-secondary btn-sm" style={{ marginTop: '1.5rem' }}>
                Reset All Filters
              </button>
            </div>
          ) : (
            <>
              <div className="grid-3">
                {displayedProducts.map((product) => (
                  <ProductCard key={product._id} product={product} />
                ))}
              </div>
              <div style={{
                textAlign: 'center',
                padding: '2.5rem 1rem 1rem',
                color: 'var(--light-text)',
                fontSize: '0.85rem'
              }}>
                Showing all {displayedProducts.length} {displayedProducts.length === 1 ? 'item' : 'items'} in collection
              </div>
            </>
          )}
        </main>
      </div>

      <style>{`
        body.products-view-mode {
          overflow: hidden !important;
        }
        body.products-view-mode .app-container {
          height: 100vh !important;
          max-height: 100vh !important;
          overflow: hidden !important;
        }
        body.products-view-mode .main-content {
          flex: 1 !important;
          min-height: 0 !important;
          overflow: hidden !important;
          padding-bottom: 0 !important;
          display: flex !important;
          flex-direction: column !important;
        }
        body.products-view-mode footer {
          display: none !important;
        }

        .products-page-container {
          flex: 1;
          min-height: 0;
          height: 100%;
          display: flex;
          flex-direction: column;
          overflow: hidden;
          padding-top: 1rem !important;
          padding-bottom: 0.75rem !important;
          gap: 1rem !important;
        }

        .products-scroll-area::-webkit-scrollbar {
          width: 6px;
        }
        .products-scroll-area::-webkit-scrollbar-track {
          background: transparent;
        }
        .products-scroll-area::-webkit-scrollbar-thumb {
          background: var(--pink-light);
          border-radius: 9999px;
        }
        .products-scroll-area::-webkit-scrollbar-thumb:hover {
          background: var(--pink);
        }

        .filters-sidebar::-webkit-scrollbar {
          width: 5px;
        }
        .filters-sidebar::-webkit-scrollbar-track {
          background: transparent;
        }
        .filters-sidebar::-webkit-scrollbar-thumb {
          background: var(--border);
          border-radius: 9999px;
        }

        @media (max-width: 900px) {
          .products-layout-grid {
            grid-template-columns: 1fr !important;
          }
          .mobile-filter-btn {
            display: inline-flex !important;
          }
          .filters-sidebar {
            display: none !important;
          }
          .filters-sidebar.mobile-show {
            display: flex !important;
            position: fixed !important;
            top: 0 !important;
            left: 0 !important;
            right: 0 !important;
            bottom: 0 !important;
            z-index: 1050 !important;
            border-radius: 0 !important;
            width: 100% !important;
            height: 100vh !important;
            overflow-y: auto !important;
            padding: 1.5rem !important;
          }
        }
      `}</style>
    </div>
  );
};

export default Products;
