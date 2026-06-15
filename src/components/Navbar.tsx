'use client';
import { useState } from 'react';
import { DS, layout } from '../lib/ds';
import { Menu, X } from 'lucide-react';

const tabs = [
  { id: 'tour', label: 'Tours' },
  { id: 'flight', label: 'Flight' },
  { id: 'hotel', label: 'Hotel' },
  { id: 'train', label: 'Train' },
  { id: 'visa', label: 'Visa & Document', disabled: true },
  { id: 'promo', label: 'Promo', disabled: true },
];

export default function Navbar({ activeTab = 'flight' }: { activeTab?: string }) {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <nav style={{
      position: 'fixed', top: 0, left: 0, right: 0, zIndex: 1000,
      background: 'rgba(24, 47, 74, 0.85)',
      backdropFilter: 'blur(16px)',
      WebkitBackdropFilter: 'blur(16px)',
      borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
      height: 72,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
    }}>
      <div style={{
        maxWidth: layout.container['2xl'],
        width: '100%',
        margin: '0 auto',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 24px',
      }}>
        {/* Logo */}
        <button
          style={{
            background: 'none', border: 'none', cursor: 'pointer',
            display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0,
            padding: '4px 8px', borderRadius: 8, transition: 'background 0.2s',
          }}
          onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.05)')}
          onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
        >
          <svg width="36" height="36" viewBox="0 0 40 40" fill="none">
            <path d="M20 4 C20 4 10 16 10 26 C10 31.5228 14.4772 36 20 36 C25.5228 36 30 31.5228 30 26 C30 20 25 15 20 4 Z" fill="transparent" stroke="white" strokeWidth="2.5"/>
            <circle cx="20" cy="27" r="3" fill="white"/>
            <path d="M14 26 C14 22.6863 16.6863 20 20 20" stroke="white" strokeWidth="2.5" strokeLinecap="round"/>
          </svg>
          <span style={{ color: '#fff', fontFamily: 'Helvetica Neue, sans-serif', fontWeight: 800, fontSize: 18, letterSpacing: '-0.5px' }}>
            BeningMata
          </span>
        </button>

        {/* Desktop links */}
        <div className="hidden md:flex" style={{ gap: 8, alignItems: 'center', display: 'flex' }}>
          {tabs.map(({ id, label, disabled }) => {
            const isActive = activeTab === id;
            return (
              <button key={id}
                style={{
                  background: isActive ? 'rgba(255, 255, 255, 0.12)' : 'transparent',
                  border: 'none',
                  padding: '8px 16px',
                  borderRadius: 999,
                  color: isActive ? '#fff' : disabled ? 'rgba(255,255,255,0.3)' : 'rgba(255,255,255,0.7)',
                  fontFamily: 'Helvetica Neue, sans-serif',
                  fontSize: 14,
                  fontWeight: isActive ? 600 : 500,
                  cursor: disabled ? 'not-allowed' : 'pointer',
                  transition: 'all 0.2s ease',
                }}
                onMouseEnter={e => {
                  if (!disabled && !isActive) {
                    e.currentTarget.style.color = '#fff';
                    e.currentTarget.style.background = 'rgba(255,255,255,0.06)';
                  }
                }}
                onMouseLeave={e => {
                  if (!isActive && !disabled) {
                    e.currentTarget.style.color = 'rgba(255,255,255,0.7)';
                    e.currentTarget.style.background = 'transparent';
                  }
                }}
              >
                {label}
              </button>
            );
          })}
        </div>

        {/* Right actions */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <button className="hidden md:flex" style={{
            alignItems: 'center', gap: 8,
            background: 'transparent',
            border: '1px solid #fff',
            borderRadius: 999,
            padding: '8px 16px',
            color: '#fff',
            fontFamily: 'Helvetica Neue',
            fontSize: 13,
            fontWeight: 500,
            cursor: 'pointer',
            display: 'flex',
          }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/>
              <path d="M3 3v5h5"/>
            </svg>
            <span>Instant Service</span>
          </button>

          <button className="flex md:hidden" onClick={() => setMenuOpen(true)} style={{
            background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.2)',
            color: '#fff', cursor: 'pointer', padding: 8, borderRadius: '50%',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <Menu size={20} />
          </button>
        </div>
      </div>

      {/* Mobile Menu Overlay */}
      {menuOpen && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(15, 30, 50, 0.96)',
          backdropFilter: 'blur(24px)', WebkitBackdropFilter: 'blur(24px)',
          zIndex: 9999, display: 'flex', flexDirection: 'column',
        }}>
          <div style={{ height: 72, display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 24px' }}>
            <div style={{ color: '#fff', fontFamily: 'Helvetica Neue', fontWeight: 800, fontSize: 18, letterSpacing: '-0.5px' }}>BeningMata</div>
            <button onClick={() => setMenuOpen(false)} style={{ background: 'rgba(255,255,255,0.1)', border: 'none', color: '#fff', cursor: 'pointer', padding: 8, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <X size={20} />
            </button>
          </div>
          <div style={{ padding: '32px 24px', display: 'flex', flexDirection: 'column', gap: 24, flex: 1 }}>
            {tabs.map(({ id, label, disabled }) => {
              const isActive = activeTab === id;
              return (
                <button key={id} onClick={() => { if (!disabled) setMenuOpen(false); }}
                  style={{
                    background: 'none', border: 'none', textAlign: 'left',
                    color: isActive ? '#fff' : disabled ? 'rgba(255,255,255,0.2)' : 'rgba(255,255,255,0.7)',
                    fontFamily: 'Helvetica Neue', fontSize: 32, fontWeight: 700, letterSpacing: '-1px',
                    padding: 0, cursor: disabled ? 'not-allowed' : 'pointer',
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  }}>
                  {label}
                  {isActive && <div style={{ width: 10, height: 10, borderRadius: '50%', background: DS.accent, boxShadow: `0 0 12px ${DS.accent}` }} />}
                </button>
              );
            })}
            <div style={{ marginTop: 'auto', paddingTop: 24, paddingBottom: 24 }}>
              <button style={{
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                background: 'linear-gradient(135deg, #FF6B00, #FF8C00)', color: '#fff',
                border: 'none', borderRadius: 16, padding: '16px', width: '100%',
                fontFamily: 'Helvetica Neue', fontSize: 16, fontWeight: 700, cursor: 'pointer',
                boxShadow: '0 8px 24px rgba(255, 107, 0, 0.3)',
              }}>
                Instant Service
              </button>
            </div>
          </div>
        </div>
      )}
    </nav>
  );
}
