import React, { useState } from 'react';
import { Search } from 'lucide-react';

const SearchBar = ({ onSearch, placeholder = 'Search for sarees, kurtis, dresses...' }) => {
  const [query, setQuery] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (onSearch) {
      onSearch(query);
    }
  };

  return (
    <form onSubmit={handleSubmit} style={{ width: '100%' }}>
      <div style={{
        position: 'relative',
        display: 'flex',
        alignItems: 'center',
        width: '100%'
      }}>
        <input
          type="text"
          className="form-control"
          placeholder={placeholder}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          style={{
            paddingLeft: '3rem',
            paddingRight: '1rem',
            borderRadius: '24px',
            border: '1px solid var(--border)',
            boxShadow: 'var(--shadow-sm)'
          }}
        />
        <button
          type="submit"
          style={{
            position: 'absolute',
            left: '1.2rem',
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            color: 'var(--purple)',
            display: 'flex',
            alignItems: 'center'
          }}
          aria-label="Search"
        >
          <Search size={18} />
        </button>
      </div>
    </form>
  );
};

export default SearchBar;
