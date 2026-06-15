'use client';
import { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { DS, layout } from '../lib/ds';
import { ArrowLeftRight, ArrowRight, ChevronDown, ChevronRight, Plane } from 'lucide-react';
import FlightResultsPage, { SearchParams, FlightType } from '../components/FlightResultsPage';
import FlightFarePage, { FareType } from '../components/FlightFarePage';
import FlightBookingPage from '../components/FlightBookingPage';
import PaymentPage, { PaymentBookingData } from '../components/PaymentPage';
import ConfirmationPage, { ConfirmationBookingData } from '../components/ConfirmationPage';

const HOME_CONTAINER_MAX = layout.container['2xl'];

function useBreakpoint() {
  const [w, setW] = useState(typeof window !== 'undefined' ? window.innerWidth : 1280);
  useEffect(() => {
    const fn = () => setW(window.innerWidth);
    window.addEventListener('resize', fn);
    return () => window.removeEventListener('resize', fn);
  }, []);
  return { isMobile: w < 768, isTablet: w >= 768 && w < 1024, isDesktop: w >= 1024 };
}

const AIRPORTS = [
  { code: 'CGK', city: 'Jakarta', name: 'Soekarno-Hatta International', icon: '🏙️' },
  { code: 'DPS', city: 'Denpasar', name: 'Ngurah Rai International', icon: '🌴' },
  { code: 'NRT', city: 'Tokyo', name: 'Narita International Airport', icon: 'JP' },
  { code: 'HND', city: 'Tokyo', name: 'Haneda Airport', icon: 'JP' },
  { code: 'SIN', city: 'Singapore', name: 'Changi Airport', icon: 'SG' },
  { code: 'KUL', city: 'Kuala Lumpur', name: 'Kuala Lumpur International Airport', icon: 'MY' },
  { code: 'BKK', city: 'Bangkok', name: 'Suvarnabhumi Airport', icon: 'TH' },
  { code: 'JOG', city: 'Yogyakarta', name: 'Adisutjipto International', icon: '🏛️' },
  { code: 'SUB', city: 'Surabaya', name: 'Juanda International', icon: '🌆' },
  { code: 'BDO', city: 'Bandung', name: 'Husein Sastranegara', icon: '🌿' },
  { code: 'MES', city: 'Medan', name: 'Kualanamu International', icon: '🌾' },
  { code: 'UPG', city: 'Makassar', name: 'Sultan Hasanuddin International', icon: '⛵' },
  { code: 'LOP', city: 'Lombok', name: 'International Airport Lombok', icon: '🏖️' },
];

const POPULAR_ROUTES = [
  { from: 'CGK', to: 'DPS', fromCity: 'Jakarta', toCity: 'Bali / Denpasar', price: 'Rp 1.254.700', date: '17 May 2026', image: '/photos/flightBali.jpg' },
  { from: 'CGK', to: 'JOG', fromCity: 'Jakarta', toCity: 'Yogyakarta', price: 'Rp 820.000', date: '20 May 2026', image: '/photos/flightYogya.jpg' },
  { from: 'CGK', to: 'SUB', fromCity: 'Jakarta', toCity: 'Surabaya', price: 'Rp 980.500', date: '22 May 2026', image: '/photos/flightSurabaya.jpg' },
  { from: 'CGK', to: 'BDO', fromCity: 'Jakarta', toCity: 'Bandung', price: 'Rp 450.000', date: '25 May 2026', image: '/photos/flightBandung.jpg' },
];

const truncateText = (value: string, maxChars: number) => {
  if (!value || value.length <= maxChars) return value;
  return `${value.slice(0, Math.max(0, maxChars - 1))}…`;
};

const parseDateInput = (value: string | Date | null): Date | null => {
  if (!value) return null;
  if (value instanceof Date) return new Date(value.getFullYear(), value.getMonth(), value.getDate());
  const [year, month, day] = String(value).split('-').map(Number);
  if (!year || !month || !day) return null;
  return new Date(year, month - 1, day);
};

const formatDateInput = (date: Date | string | null): string => {
  if (!date) return '';
  const localDate = parseDateInput(date as string);
  if (!localDate) return '';
  const y = localDate.getFullYear();
  const m = String(localDate.getMonth() + 1).padStart(2, '0');
  const d = String(localDate.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
};

const addDays = (value: string, days: number): Date | null => {
  const date = parseDateInput(value);
  if (!date) return null;
  date.setDate(date.getDate() + days);
  return date;
};

function SheetPortal({ id, title, onClose, children }: { id: string; title: string; onClose: () => void; children: React.ReactNode }) {
  if (typeof document === 'undefined') return null;
  return createPortal(
    <div id={id} onClick={e => e.stopPropagation()} style={{ position: 'fixed', inset: 0, zIndex: 9999, display: 'flex', flexDirection: 'column', justifyContent: 'flex-end' }}>
      <div onClick={e => { e.stopPropagation(); onClose(); }} style={{ position: 'absolute', inset: 0, background: 'rgba(15,23,42,0.46)' }} />
      <div onClick={e => e.stopPropagation()} style={{ position: 'relative', background: DS.white, borderRadius: '22px 22px 0 0', maxHeight: '86vh', overflowY: 'auto', padding: '12px 18px 20px', boxShadow: '0 -12px 34px rgba(15,23,42,0.2)' }}>
        <div style={{ display: 'flex', justifyContent: 'center', padding: '2px 0 12px' }}>
          <div style={{ width: 42, height: 4, borderRadius: 99, background: DS.n200 }} />
        </div>
        <div style={{ fontFamily: 'Helvetica Neue', fontWeight: 700, fontSize: 18, color: DS.dark, marginBottom: 14 }}>{title}</div>
        {children}
      </div>
    </div>,
    document.body
  );
}

function FieldContainer({ label, children, onClick, hasBorderRight, isCompact }: {
  label: string; children: React.ReactNode; onClick?: () => void; hasBorderRight?: boolean; isCompact?: boolean;
}) {
  return (
    <div onClick={onClick} style={{
      padding: isCompact ? '14px 16px' : '16px 16px',
      cursor: 'pointer', background: 'transparent', flex: 1,
      borderRight: !isCompact && hasBorderRight ? `1px solid ${DS.n100}` : 'none',
      position: 'relative', minWidth: 0,
    }}>
      <div style={{ fontSize: 11, fontWeight: 700, color: DS.white, marginBottom: 4, fontFamily: 'Helvetica Neue', textTransform: 'uppercase', letterSpacing: '.05em' }}>{label}</div>
      <div style={{ overflow: 'hidden' }}>{children}</div>
    </div>
  );
}

function AirportDropdown({ label, value, onChange, exclude, hasBorderRight, isCompact, maxCityChars }: {
  label: string; value: string; onChange: (code: string) => void; exclude: string;
  hasBorderRight?: boolean; isCompact?: boolean; maxCityChars?: number;
}) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const ref = useRef<HTMLDivElement>(null);

  const filtered = AIRPORTS.filter(a =>
    a.code !== exclude &&
    (query === '' || a.city.toLowerCase().includes(query.toLowerCase()) || a.code.toLowerCase().includes(query.toLowerCase()) || a.name.toLowerCase().includes(query.toLowerCase()))
  );
  const listTitle = query.trim() ? 'Hasil Pencarian' : 'Bandara Populer';

  useEffect(() => {
    if (isCompact) return;
    const h = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false); };
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, [isCompact]);

  const selected = AIRPORTS.find(a => a.code === value);
  const selectedCity = selected ? truncateText(selected.city, maxCityChars || 20) : '';

  const optionList = (
    <>
      {filtered.length > 0 ? filtered.map(a => (
        <button key={a.code} type="button" onMouseDown={() => { onChange(a.code); setOpen(false); }}
          style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 12, padding: isCompact ? '14px 16px' : '10px 16px', cursor: 'pointer', border: 0, borderBottom: `1px solid ${DS.n50}`, background: 'transparent', textAlign: 'left' }}
          onMouseEnter={e => (e.currentTarget.style.background = DS.n50)}
          onMouseLeave={e => (e.currentTarget.style.background = 'none')}>
          <div style={{ width: isCompact ? 40 : 36, height: isCompact ? 40 : 36, borderRadius: 10, background: DS.primaryLight, color: DS.primary, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <Plane size={isCompact ? 20 : 18} style={{ transform: 'rotate(45deg)' }} />
          </div>
          <div style={{ minWidth: 0, flex: 1 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 0 }}>
              <span style={{ fontFamily: 'Helvetica Neue', fontWeight: 700, fontSize: 15, color: DS.dark }}>{a.city}</span>
              <span style={{ fontFamily: 'Helvetica Neue', fontWeight: 700, fontSize: 11, color: DS.primary, background: DS.primaryLight, borderRadius: 4, padding: '2px 6px', flexShrink: 0 }}>{a.code}</span>
            </div>
            <div style={{ fontFamily: 'Helvetica Neue', fontSize: isCompact ? 13 : 12, color: DS.n500, marginTop: 2, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              Bandara | {a.name}
            </div>
          </div>
        </button>
      )) : (
        <div style={{ padding: '32px 16px', textAlign: 'center', fontFamily: 'Helvetica Neue', fontSize: 14, color: DS.n500 }}>
          Bandara tidak ditemukan
        </div>
      )}
    </>
  );

  return (
    <div ref={ref} style={{ position: 'relative', flex: 1, borderRight: !isCompact && hasBorderRight ? '1px solid rgba(255,255,255,0.34)' : 'none' }}>
      <FieldContainer label={label} isCompact={isCompact} onClick={() => { setOpen(o => !o); setQuery(''); }}>
        {selected ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0 }}>
            <Plane size={18} color={DS.white} style={{ flexShrink: 0, transform: 'rotate(45deg)' }} />
            <div style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', minWidth: 0 }}>
              <span style={{ fontFamily: 'Helvetica Neue', fontWeight: 700, fontSize: 15, color: DS.white }}>{selectedCity}</span>
              <span style={{ fontFamily: 'Helvetica Neue', fontWeight: 700, fontSize: 11, color: DS.primary, background: DS.primaryLight, borderRadius: 4, padding: '2px 6px', marginLeft: 6, verticalAlign: 'middle' }}>{selected.code}</span>
            </div>
          </div>
        ) : (
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, fontFamily: 'Helvetica Neue', fontWeight: 700, fontSize: 15, color: DS.dark }}>
            <Plane size={18} color={DS.white} style={{ flexShrink: 0, transform: 'rotate(45deg)' }} />
            Pilih kota atau bandara
          </div>
        )}
      </FieldContainer>

      {open && (isCompact ? (
        typeof document !== 'undefined' && createPortal(
          <div style={{ position: 'fixed', inset: 0, zIndex: 9999, display: 'flex', flexDirection: 'column', background: DS.surface }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '16px', background: DS.white, borderBottom: `1px solid ${DS.n200}` }}>
              <button onClick={() => setOpen(false)} style={{ background: 'none', border: 0, padding: 0, cursor: 'pointer' }}>
                <ChevronRight style={{ transform: 'rotate(180deg)' }} size={24} color={DS.dark} />
              </button>
              <div style={{ flex: 1, display: 'flex', alignItems: 'center', background: DS.n50, borderRadius: 8, padding: '0 12px', height: 40 }}>
                <Plane size={18} color={DS.n500} style={{ marginRight: 8, transform: 'rotate(45deg)' }} />
                <input autoFocus value={query} onChange={e => setQuery(e.target.value)}
                  placeholder="Cari kota, bandara, atau kode IATA"
                  style={{ width: '100%', height: '100%', border: 0, background: 'transparent', outline: 'none', fontFamily: 'Helvetica Neue', fontSize: 14, color: DS.dark }} />
              </div>
            </div>
            <div style={{ padding: '10px 16px 8px', fontFamily: 'Helvetica Neue', fontWeight: 700, fontSize: 11, color: DS.n400, textTransform: 'uppercase', letterSpacing: '.05em', background: DS.white }}>
              {listTitle}
            </div>
            <div style={{ flex: 1, overflowY: 'auto', background: DS.white }}>{optionList}</div>
          </div>,
          document.body
        )
      ) : (
        <div style={{ position: 'absolute', top: 'calc(100% + 4px)', left: hasBorderRight ? 0 : 'auto', right: hasBorderRight ? 'auto' : 0, zIndex: 999, background: DS.white, borderRadius: 14, padding: '8px 0', boxShadow: '0 12px 40px rgba(0,0,0,0.15)', border: `1px solid ${DS.n100}`, width: 'min(360px, calc(100vw - 32px))', minWidth: '100%', maxHeight: 320, overflowY: 'auto' }}>
          <div style={{ padding: '8px 16px' }}>
            <input autoFocus value={query} onChange={e => setQuery(e.target.value)}
              placeholder="Cari kota, bandara, atau kode IATA"
              style={{ width: '100%', border: `1px solid ${DS.n200}`, borderRadius: 8, padding: '10px 14px', fontFamily: 'Helvetica Neue', fontSize: 14, outline: 'none', color: DS.dark }} />
          </div>
          <div style={{ padding: '4px 16px 8px', fontFamily: 'Helvetica Neue', fontWeight: 700, fontSize: 11, color: DS.n400, textTransform: 'uppercase', letterSpacing: '.05em' }}>{listTitle}</div>
          <div>{optionList}</div>
        </div>
      ))}
    </div>
  );
}

function PassengerClassPicker({ adults, children: childCount, infants, cabinClass, onChange, hasBorderRight, isCompact }: {
  adults: number; children: number; infants: number; cabinClass: string;
  onChange: (a: number, c: number, i: number, cl: string) => void;
  hasBorderRight?: boolean; isCompact?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [error, setError] = useState('');
  const ref = useRef<HTMLDivElement>(null);
  const maxSeatedPassengers = 7;
  const maxInfants = 4;
  const seatedPassengers = adults + childCount;
  const total = seatedPassengers + infants;
  const cabinLabel: Record<string, string> = { economy: 'Ekonomi', business: 'Bisnis', premium: 'Premium Ekonomi', first: 'First Class' };
  const maxInfantsForAdults = Math.min(maxInfants, adults);

  useEffect(() => {
    const h = (e: MouseEvent) => {
      if (ref.current && ref.current.contains(e.target as Node)) return;
      const portal = document.getElementById('flight-passenger-portal');
      if (portal && portal.contains(e.target as Node)) return;
      setOpen(false);
    };
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, []);

  const setPassengerCounts = (nextAdults: number, nextChildren: number, nextInfants: number) => {
    const safeAdults = Math.min(maxSeatedPassengers, Math.max(1, nextAdults));
    const safeChildren = Math.min(maxSeatedPassengers - safeAdults, Math.max(0, nextChildren));
    const safeInfants = Math.min(maxInfants, safeAdults, Math.max(0, nextInfants));
    if (nextAdults + nextChildren > maxSeatedPassengers) {
      setError('Dewasa dan anak-anak maksimal 7 penumpang.');
    } else if (nextInfants > maxInfants) {
      setError('Bayi maksimal 4 penumpang.');
    } else if (nextInfants > safeAdults) {
      setError('1 bayi wajib didampingi 1 orang dewasa.');
    } else {
      setError('');
    }
    onChange(safeAdults, safeChildren, safeInfants, cabinClass);
  };

  const Counter = ({ label, sub, val, onInc, onDec, min = 0, max }: {
    label: string; sub?: string; val: number; onInc: () => void; onDec: () => void; min?: number; max?: number;
  }) => {
    const decDisabled = val <= min;
    const incDisabled = max !== undefined && val >= max;
    return (
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 0', borderBottom: `1px solid ${DS.n100}` }}>
        <div>
          <div style={{ fontFamily: 'Helvetica Neue', fontWeight: 700, fontSize: 15, color: DS.dark }}>{label}</div>
          {sub && <div style={{ fontFamily: 'Helvetica Neue', fontSize: 12, color: DS.n400 }}>{sub}</div>}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <button onClick={onDec} disabled={decDisabled} style={{ width: 32, height: 32, borderRadius: '50%', border: `1px solid ${decDisabled ? DS.n200 : DS.accent}`, background: 'none', cursor: decDisabled ? 'not-allowed' : 'pointer', color: decDisabled ? DS.n300 : DS.accent, fontSize: 18, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 500 }}>-</button>
          <span style={{ width: 48, height: 34, border: `1px solid ${DS.n200}`, borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'Helvetica Neue', fontWeight: 700, fontSize: 15, color: DS.dark }}>{val}</span>
          <button onClick={onInc} disabled={incDisabled} style={{ width: 32, height: 32, borderRadius: '50%', border: `1px solid ${incDisabled ? DS.n200 : DS.accent}`, background: incDisabled ? DS.n100 : DS.accent, cursor: incDisabled ? 'not-allowed' : 'pointer', color: incDisabled ? DS.n300 : '#fff', fontSize: 18, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 500 }}>+</button>
        </div>
      </div>
    );
  };

  const pickerBody = (
    <>
      <Counter label="Dewasa" sub="> 12 tahun" val={adults} min={1} max={maxSeatedPassengers - childCount}
        onInc={() => setPassengerCounts(adults + 1, childCount, infants)}
        onDec={() => setPassengerCounts(adults - 1, childCount, infants)} />
      <Counter label="Anak-anak" sub="2 - 11 tahun" val={childCount} min={0} max={maxSeatedPassengers - adults}
        onInc={() => setPassengerCounts(adults, childCount + 1, infants)}
        onDec={() => setPassengerCounts(adults, childCount - 1, infants)} />
      <Counter label="Bayi" sub="< 2 tahun" val={infants} min={0} max={maxInfantsForAdults}
        onInc={() => setPassengerCounts(adults, childCount, infants + 1)}
        onDec={() => setPassengerCounts(adults, childCount, infants - 1)} />
      {error && (
        <div style={{ marginTop: 10, padding: '10px 12px', borderRadius: 10, background: '#FEF2F2', border: '1px solid #FECACA', fontFamily: 'Helvetica Neue', fontSize: 12, lineHeight: 1.45, color: DS.error }}>{error}</div>
      )}
      <div style={{ marginTop: 20 }}>
        <div style={{ fontFamily: 'Helvetica Neue', fontWeight: 700, fontSize: 14, color: DS.dark, marginBottom: 12 }}>Kelas Penerbangan</div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
          {([['economy', 'Ekonomi'], ['business', 'Bisnis'], ['premium', 'Premium Ekonomi'], ['first', 'First Class']] as [string, string][]).map(([val, lbl]) => (
            <button key={val} onClick={() => onChange(adults, childCount, infants, val)}
              style={{ padding: '8px 12px', borderRadius: 8, border: `1px solid ${cabinClass === val ? DS.accent : DS.n200}`, background: cabinClass === val ? DS.accentLight : 'none', fontFamily: 'Helvetica Neue', fontWeight: cabinClass === val ? 700 : 500, fontSize: 13, color: cabinClass === val ? DS.accent : DS.n600, cursor: 'pointer', transition: 'all 0.2s' }}>
              {lbl}
            </button>
          ))}
        </div>
      </div>
      <button onClick={() => setOpen(false)} style={{ width: '100%', marginTop: 24, borderRadius: 999, height: 44, fontSize: 16, background: DS.accent, color: '#fff', border: 'none', cursor: 'pointer', fontFamily: 'Helvetica Neue', fontWeight: 700 }}>
        Selesai
      </button>
    </>
  );

  return (
    <div ref={ref} style={{ position: 'relative', flex: 1, borderRight: hasBorderRight ? '1px solid rgba(255,255,255,0.34)' : 'none' }}>
      <FieldContainer label="Penumpang, Kelas" isCompact={isCompact} onClick={() => setOpen(o => !o)}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10, minWidth: 0 }}>
          <div style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', fontFamily: 'Helvetica Neue', fontWeight: 700, fontSize: 15, color: DS.white }}>
            {total} Penumpang, {cabinLabel[cabinClass]}
          </div>
          <ChevronDown size={16} color="rgba(255,255,255,0.78)" style={{ flexShrink: 0, transform: open ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 160ms ease' }} />
        </div>
      </FieldContainer>

      {open && (isCompact ? (
        <SheetPortal id="flight-passenger-portal" title="Penumpang, Kelas" onClose={() => setOpen(false)}>
          {pickerBody}
        </SheetPortal>
      ) : (
        <div style={{ position: 'absolute', top: 'calc(100% + 8px)', right: 0, zIndex: 999, background: DS.white, borderRadius: 12, padding: '20px', boxShadow: '0 12px 40px rgba(0,0,0,0.15)', border: `1px solid ${DS.n100}`, minWidth: 320 }}>
          {pickerBody}
        </div>
      ))}
    </div>
  );
}

function DateField({ label, value, onChange, hasBorderRight, placeholder, disabled, isCompact, minDate }: {
  label: string; value: string | null; onChange: (v: string) => void;
  hasBorderRight?: boolean; placeholder?: string; disabled?: boolean; isCompact?: boolean; minDate?: string;
}) {
  const [open, setOpen] = useState(false);
  const [pos, setPos] = useState({ top: 0, left: 0, width: 0 });
  const triggerRef = useRef<HTMLDivElement>(null);
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];
  const today = new Date();

  const minFloor = parseDateInput(minDate || null) || new Date(today.getFullYear(), today.getMonth(), today.getDate());
  const valDate = parseDateInput(value || null);
  const [displayMonth, setDisplayMonth] = useState((valDate || minFloor).getMonth());
  const [displayYear, setDisplayYear] = useState((valDate || minFloor).getFullYear());

  useEffect(() => {
    if (valDate) {
      setDisplayMonth(valDate.getMonth());
      setDisplayYear(valDate.getFullYear());
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);

  const daysInMonth = new Date(displayYear, displayMonth + 1, 0).getDate();
  const firstDay = new Date(displayYear, displayMonth, 1).getDay();
  const days: (number | null)[] = [];
  for (let i = 0; i < firstDay; i++) days.push(null);
  for (let i = 1; i <= daysInMonth; i++) days.push(i);

  const handleOpen = () => {
    if (disabled) return;
    if (triggerRef.current) {
      const rect = triggerRef.current.getBoundingClientRect();
      setPos({ top: rect.bottom + window.scrollY + 8, left: rect.left + window.scrollX, width: rect.width });
    }
    setOpen(o => !o);
  };

  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (triggerRef.current && !triggerRef.current.contains(e.target as Node)) {
        const portal = document.getElementById('flight-datepicker-portal');
        if (portal && portal.contains(e.target as Node)) return;
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  const handleDayClick = (day: number | null) => {
    if (!day) return;
    const next = new Date(displayYear, displayMonth, day);
    if (next < minFloor) return;
    onChange(formatDateInput(next));
    setOpen(false);
  };

  const isSelected = (day: number | null) => {
    if (!day || !valDate) return false;
    return valDate.getDate() === day && valDate.getMonth() === displayMonth && valDate.getFullYear() === displayYear;
  };

  const isDisabledDate = (day: number | null) => {
    if (!day) return false;
    return new Date(displayYear, displayMonth, day) < minFloor;
  };

  const fmt = (d: string | null) => {
    const localDate = parseDateInput(d);
    return localDate ? localDate.toLocaleDateString('id-ID', { weekday: 'short', day: 'numeric', month: 'short', year: '2-digit' }) : null;
  };

  const calendarBody = (
    <>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
        <button onClick={() => { if (displayMonth === 0) { setDisplayMonth(11); setDisplayYear(y => y - 1); } else setDisplayMonth(m => m - 1); }}
          style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '4px 8px', borderRadius: 6, color: DS.n500, fontSize: 18, lineHeight: 1 }}>‹</button>
        <span style={{ fontFamily: 'Helvetica Neue', fontWeight: 700, fontSize: 15, color: DS.dark }}>{months[displayMonth]} {displayYear}</span>
        <button onClick={() => { if (displayMonth === 11) { setDisplayMonth(0); setDisplayYear(y => y + 1); } else setDisplayMonth(m => m + 1); }}
          style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '4px 8px', borderRadius: 6, color: DS.n500, fontSize: 18, lineHeight: 1 }}>›</button>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7,1fr)', gap: 2, marginBottom: 6 }}>
        {['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab'].map(d => (
          <div key={d} style={{ textAlign: 'center', fontSize: 11, color: DS.n400, fontFamily: 'Helvetica Neue', fontWeight: 700, padding: '2px 0' }}>{d}</div>
        ))}
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7,1fr)', gap: 2 }}>
        {days.map((day, i) => (
          <button key={i} onClick={() => handleDayClick(day)} disabled={!day || isDisabledDate(day)}
            style={{
              height: 36, borderRadius: 8, border: 'none',
              cursor: day && !isDisabledDate(day) ? 'pointer' : 'default',
              background: isSelected(day) ? DS.accent : 'none',
              color: !day ? 'transparent' : isSelected(day) ? DS.white : isDisabledDate(day) ? DS.n200 : DS.dark,
              fontFamily: 'Helvetica Neue', fontSize: 14, fontWeight: isSelected(day) ? 700 : 500, transition: 'background 0.1s',
            }}
            onMouseEnter={e => { if (day && !isDisabledDate(day) && !isSelected(day)) e.currentTarget.style.background = DS.n50; }}
            onMouseLeave={e => { if (!isSelected(day)) e.currentTarget.style.background = 'none'; }}
          >{day || ''}</button>
        ))}
      </div>
    </>
  );

  const calendar = open ? (isCompact ? (
    <SheetPortal id="flight-datepicker-portal" title={label} onClose={() => setOpen(false)}>
      {calendarBody}
    </SheetPortal>
  ) : (
    typeof document !== 'undefined' && createPortal(
      <div id="flight-datepicker-portal" onClick={e => e.stopPropagation()} style={{
        position: 'absolute', top: pos.top, left: pos.left, zIndex: 9999,
        background: DS.white, borderRadius: 12, padding: 16,
        boxShadow: '0 12px 40px rgba(0,0,0,0.15)', minWidth: 320, border: `1px solid ${DS.n100}`,
      }}>
        {calendarBody}
      </div>,
      document.body
    )
  )) : null;

  return (
    <div ref={triggerRef} onClick={handleOpen} style={{ flex: 1, borderRight: hasBorderRight ? '1px solid rgba(255,255,255,0.34)' : 'none', opacity: disabled ? 0.5 : 1 }}>
      <FieldContainer label={label} isCompact={isCompact}>
        <div style={{ position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10, minWidth: 0 }}>
          <div style={{ fontFamily: 'Helvetica Neue', fontWeight: 700, fontSize: 15, color: value ? DS.white : DS.dark, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            {value ? fmt(value) : placeholder}
          </div>
          <ChevronDown size={16} color={disabled ? 'rgba(15,23,42,0.42)' : 'rgba(255,255,255,0.78)'} style={{ flexShrink: 0, transform: open ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 160ms ease' }} />
        </div>
      </FieldContainer>
      {calendar}
    </div>
  );
}

export default function FlightHomePage() {
  const { isMobile, isTablet } = useBreakpoint();
  const isCompact = isMobile || isTablet;
  const px = isMobile ? 16 : isTablet ? 24 : 48;
  const airportCityMaxChars = isMobile ? 24 : isTablet ? 32 : 18;
  const [tripType, setTripType] = useState('oneway');
  const [from, setFrom] = useState('CGK');
  const [to, setTo] = useState('NRT');
  const [depDate, setDepDate] = useState(formatDateInput(new Date()));
  const [retDate, setRetDate] = useState('');
  const [adults, setAdults] = useState(1);
  const [children, setChildren] = useState(0);
  const [infants, setInfants] = useState(0);
  const [cabinClass, setCabinClass] = useState('economy');
  const todayDate = formatDateInput(new Date());
  const minRetDate = depDate;
  const [searchResult, setSearchResult] = useState<SearchParams | null>(null);
  const [selectedFlight, setSelectedFlight] = useState<FlightType | null>(null);
  const [flightMode, setFlightMode] = useState<'outbound' | 'return'>('outbound');
  const [selectedReturnFlight, setSelectedReturnFlight] = useState<FlightType | null>(null);
  const [flightView, setFlightView] = useState<'results' | 'fare' | 'booking' | 'payment' | 'confirmation'>('results');
  const [selectedFare, setSelectedFare] = useState<FareType | null>(null);
  const [bookingData, setBookingData] = useState<PaymentBookingData | null>(null);
  const [confirmationData, setConfirmationData] = useState<ConfirmationBookingData | null>(null);

  const handleSwap = () => { setFrom(to); setTo(from); };

  const ensureReturnAfterDeparture = (departure: string, currentReturn = retDate): string => {
    const returnDate = parseDateInput(currentReturn);
    const depDateObj = parseDateInput(departure);
    if (!returnDate || !depDateObj || returnDate < depDateObj) {
      return departure; // default to same day as departure
    }
    return currentReturn;
  };

  const handleTripTypeChange = (nextType: string) => {
    setTripType(nextType);
    if (nextType === 'roundtrip') {
      setRetDate(prev => ensureReturnAfterDeparture(depDate, prev));
    }
  };

  const handleDepDateChange = (nextDate: string) => {
    setDepDate(nextDate);
    setRetDate(prev => {
      if (tripType !== 'roundtrip') return prev;
      return ensureReturnAfterDeparture(nextDate, prev);
    });
  };

  const handleRetDateChange = (nextDate: string) => {
    const minReturn = parseDateInput(depDate);
    const nextReturn = parseDateInput(nextDate);
    setRetDate(formatDateInput(nextReturn && minReturn && nextReturn >= minReturn ? nextReturn : minReturn));
  };

  const handleSearch = () => {
    const fromApt = AIRPORTS.find(a => a.code === from);
    const toApt = AIRPORTS.find(a => a.code === to);
    setSelectedFlight(null);
    setSelectedReturnFlight(null);
    setFlightMode('outbound');
    setFlightView('results');
    setSelectedFare(null);
    setBookingData(null);
    setConfirmationData(null);
    setSearchResult({ from, to, fromCity: fromApt?.city || '', toCity: toApt?.city || '', depDate, retDate, adults, children, infants, cabinClass, tripType });
  };

  const handleSelectFlight = (flight: FlightType) => {
    if (searchResult?.tripType === 'roundtrip' && flightMode === 'outbound') {
      setSelectedFlight(flight);
      setFlightMode('return');
    } else if (searchResult?.tripType === 'roundtrip' && flightMode === 'return') {
      setSelectedReturnFlight(flight);
      setFlightView('fare');
    } else {
      // one-way → go to fare page
      setSelectedFlight(flight);
      setFlightView('fare');
    }
  };

  const handleSelectFare = (fare: FareType | { outbound: FareType; return: FareType }, _withProtection: boolean) => {
    const outboundFare = 'outbound' in fare ? fare.outbound : fare;
    setSelectedFare(outboundFare);
    setFlightView('booking');
  };

  if (flightView === 'confirmation' && confirmationData) {
    return (
      <ConfirmationPage
        bookingData={confirmationData}
        onBackHome={() => {
          setFlightView('results');
          setSearchResult(null);
          setSelectedFlight(null);
          setSelectedReturnFlight(null);
          setSelectedFare(null);
          setBookingData(null);
          setConfirmationData(null);
        }}
      />
    );
  }

  if (flightView === 'payment' && bookingData) {
    return (
      <PaymentPage
        bookingData={bookingData}
        onPaySuccess={(orderId) => {
          setConfirmationData({ ...(bookingData as unknown as ConfirmationBookingData), orderId });
          setFlightView('confirmation');
        }}
        onBack={() => setFlightView('booking')}
      />
    );
  }

  if (searchResult && flightView === 'booking' && selectedFlight && selectedFare) {
    return (
      <FlightBookingPage
        flight={selectedFlight}
        returnFlight={selectedReturnFlight}
        fareData={selectedFare}
        searchParams={searchResult}
        onConfirm={(data) => {
          setBookingData(data as PaymentBookingData);
          setFlightView('payment');
        }}
        onBack={() => setFlightView('fare')}
      />
    );
  }

  if (searchResult && flightView === 'fare' && selectedFlight) {
    return (
      <FlightFarePage
        flight={selectedFlight}
        returnFlight={selectedReturnFlight}
        searchParams={searchResult}
        onSelectFare={handleSelectFare}
        onBack={() => {
          setFlightView('results');
          if (searchResult.tripType === 'roundtrip') {
            setFlightMode('return');
            setSelectedReturnFlight(null);
          }
        }}
      />
    );
  }

  if (searchResult) {
    return (
      <FlightResultsPage
        searchParams={searchResult}
        mode={flightMode}
        outboundFlight={selectedFlight}
        onSelectFlight={handleSelectFlight}
        onBack={() => {
          if (flightMode === 'return') {
            setFlightMode('outbound');
            setSelectedFlight(null);
          } else {
            setSearchResult(null);
          }
        }}
      />
    );
  }

  return (
    <div style={{ minHeight: '100vh', background: DS.surface }}>
      {/* HERO SECTION */}
      <div style={{
        position: 'relative',
        minHeight: isCompact ? 'auto' : 440,
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'flex-end',
      }}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/photos/destTokyo.jpg" alt="Flight Hero" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }} />
        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(160deg, rgba(0,0,0,0.68) 0%, rgba(5,15,40,0.82) 55%, rgba(5,15,40,0.66) 100%)' }} />

        <div style={{ position: 'relative', zIndex: 10, width: '100%', maxWidth: HOME_CONTAINER_MAX, margin: '0 auto', padding: isCompact ? `80px ${px}px 16px` : `0 ${px}px 16px` }}>
          <h1 style={{
            fontFamily: 'Helvetica Neue',
            fontWeight: 700,
            fontSize: isMobile ? 30 : 46,
            color: '#fff',
            margin: '0 0 12px 0',
            lineHeight: 1.15,
            textShadow: '0 2px 12px rgba(0,0,0,0.3)',
          }}>
            Cari tiket pesawat murah
          </h1>
          <p style={{
            fontFamily: 'Helvetica Neue',
            fontSize: isMobile ? 13 : 16,
            color: 'rgba(255,255,255,0.85)',
            margin: 0,
          }}>
            Bandingkan rute, jadwal, dan harga penerbangan terbaik untuk perjalananmu.
          </p>
        </div>

        {/* SEARCH CARD */}
        <div style={{
          position: 'relative',
          width: '100%',
          maxWidth: HOME_CONTAINER_MAX,
          margin: '0 auto',
          padding: `0 ${px}px 48px`,
          zIndex: 20,
        }}>
          <div style={{
            background: 'linear-gradient(135deg, rgba(255,255,255,0.24), rgba(255,255,255,0.12))',
            backdropFilter: 'blur(28px) saturate(170%)',
            WebkitBackdropFilter: 'blur(28px) saturate(170%)',
            border: '1px solid rgba(255,255,255,0.38)',
            borderRadius: 20,
            padding: isCompact ? 18 : 16,
            boxShadow: '0 22px 70px rgba(0,0,0,0.32), inset 0 1px 0 rgba(255,255,255,0.55)',
          }}>

            {/* Trip type radios */}
            <div style={{ display: 'flex', gap: 24, marginBottom: 16 }}>
              {[{ id: 'oneway', label: 'Sekali jalan' }, { id: 'roundtrip', label: 'Pulang-pergi' }].map(type => (
                <label key={type.id} onClick={() => handleTripTypeChange(type.id)} style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
                  <div style={{
                    width: 18, height: 18, borderRadius: '50%',
                    border: `2px solid ${tripType === type.id ? DS.accent : 'rgba(255,255,255,0.65)'}`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}>
                    {tripType === type.id && <div style={{ width: 10, height: 10, borderRadius: '50%', background: DS.accent }} />}
                  </div>
                  <span style={{ fontFamily: 'Helvetica Neue', fontWeight: 700, fontSize: 14, color: DS.white }}>{type.label}</span>
                </label>
              ))}
            </div>

            {/* Form Inputs Row */}
            <div style={{
              display: 'flex',
              flexDirection: isCompact ? 'column' : 'row',
              border: isCompact ? 'none' : '1px solid rgba(255,255,255,0.56)',
              borderRadius: isCompact ? 0 : 16,
              gap: isCompact ? 12 : 0,
              minHeight: isCompact ? 'auto' : 76,
              overflow: 'visible',
            }}>
              {/* Airports Wrapper */}
              <div style={{ display: 'flex', flexDirection: isCompact ? 'column' : 'row', flex: 2, position: 'relative', border: isCompact ? '1px solid rgba(255,255,255,0.34)' : 'none', borderRadius: isCompact ? 14 : 0, overflow: 'visible' }}>
                {isCompact && (
                  <div style={{ position: 'absolute', top: '50%', left: 0, right: 58, height: 1, background: 'rgba(255,255,255,0.24)', pointerEvents: 'none', zIndex: 1 }} />
                )}
                <AirportDropdown label="Dari" value={from} onChange={setFrom} exclude={to} hasBorderRight={true} isCompact={isCompact} maxCityChars={airportCityMaxChars} />

                {/* Swap button */}
                <button onClick={handleSwap} style={{
                  position: 'absolute',
                  top: '50%',
                  right: isCompact ? 16 : 'auto',
                  left: isCompact ? 'auto' : '50%',
                  transform: isCompact ? 'translateY(-50%) rotate(90deg)' : 'translate(-50%, -50%)',
                  width: 28, height: 28, borderRadius: '50%',
                  border: '1px solid rgba(255,255,255,0.50)',
                  background: 'rgba(255,255,255,0.42)',
                  backdropFilter: 'blur(14px) saturate(150%)',
                  WebkitBackdropFilter: 'blur(14px) saturate(150%)',
                  cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                  color: DS.n600, zIndex: 10,
                  boxShadow: '0 8px 20px rgba(12,30,54,0.16), inset 0 1px 0 rgba(255,255,255,0.65)',
                }}>
                  <ArrowLeftRight size={14} />
                </button>

                <AirportDropdown label="Ke" value={to} onChange={setTo} exclude={from} hasBorderRight={false} isCompact={isCompact} maxCityChars={airportCityMaxChars} />
              </div>

              {/* Dates Wrapper */}
              <div style={{ display: 'flex', flex: 1.5, border: isCompact ? '1px solid rgba(255,255,255,0.34)' : 'none', borderRadius: isCompact ? 14 : 0, overflow: 'visible' }}>
                <DateField label="Pergi" value={depDate} onChange={handleDepDateChange} hasBorderRight={true} isCompact={isCompact} minDate={todayDate} />
                <DateField
                  label="Pulang"
                  value={tripType === 'roundtrip' ? retDate : null}
                  onChange={handleRetDateChange}
                  hasBorderRight={!isCompact}
                  disabled={tripType === 'oneway'}
                  minDate={minRetDate || ''}
                  placeholder="Lebih hemat!"
                  isCompact={isCompact}
                />
              </div>

              {/* Passengers */}
              <div style={{ display: 'flex', flex: 1.5, border: isCompact ? '1px solid rgba(255,255,255,0.34)' : 'none', borderRadius: isCompact ? 14 : 0, overflow: 'visible' }}>
                <PassengerClassPicker adults={adults} children={children} infants={infants} cabinClass={cabinClass}
                  onChange={(a, c, i, cl) => { setAdults(a); setChildren(c); setInfants(i); setCabinClass(cl); }}
                  hasBorderRight={false} isCompact={isCompact} />
              </div>

              {/* Search Button */}
              <div style={{ display: 'flex', padding: isCompact ? 0 : '8px 8px 8px 0', alignItems: 'stretch' }}>
                <button onClick={handleSearch} style={{
                  width: isCompact ? '100%' : 'auto',
                  padding: '0 28px',
                  borderRadius: 999,
                  fontSize: 15,
                  fontWeight: 700,
                  height: '100%',
                  minHeight: isCompact ? 48 : 'auto',
                  background: 'linear-gradient(135deg, #356BA6, #2F6FAF)',
                  color: DS.white,
                  border: 'none',
                  cursor: 'pointer',
                  fontFamily: 'Helvetica Neue',
                  boxShadow: '0 10px 20px rgba(53,107,166,0.28)',
                }}>
                  Ayo Cari
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* MAIN CONTENT */}
      <div style={{ maxWidth: HOME_CONTAINER_MAX, margin: '0 auto', padding: isCompact ? `28px ${px}px 60px` : `40px ${px}px 80px` }}>
        <div>
          <h2 style={{ display: 'flex', alignItems: 'center', gap: 10, fontFamily: 'Helvetica Neue', fontWeight: 700, fontSize: isMobile ? 20 : 24, color: DS.dark, marginBottom: 20 }}>
            <Plane size={isMobile ? 20 : 24} color={DS.primary} style={{ transform: 'rotate(45deg)', flexShrink: 0 }} />
            Rute Penerbangan Favorit
          </h2>
          <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : isTablet ? 'repeat(2, minmax(0, 1fr))' : 'repeat(4, minmax(0, 1fr))', gap: isMobile ? 12 : isTablet ? 16 : 18 }}>
            {POPULAR_ROUTES.map((r, i) => (
              <div key={i}
                onClick={() => { setFrom(r.from); setTo(r.to); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
                style={{
                  position: 'relative',
                  minHeight: 390,
                  aspectRatio: '9 / 14',
                  background: DS.n900,
                  borderRadius: 24,
                  overflow: 'hidden',
                  cursor: 'pointer',
                  border: '1px solid rgba(255,255,255,0.16)',
                  boxShadow: '0 8px 24px rgba(15,23,42,0.16)',
                  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                }}
                onMouseEnter={e => {
                  e.currentTarget.style.transform = 'translateY(-4px)';
                  e.currentTarget.style.boxShadow = '0 18px 42px rgba(15,23,42,0.28)';
                  const img = e.currentTarget.querySelector('img') as HTMLImageElement;
                  if (img) img.style.transform = 'scale(1.05)';
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.transform = 'none';
                  e.currentTarget.style.boxShadow = '0 8px 24px rgba(15,23,42,0.16)';
                  const img = e.currentTarget.querySelector('img') as HTMLImageElement;
                  if (img) img.style.transform = 'scale(1)';
                }}>

                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={r.image} alt={`${r.fromCity} ke ${r.toCity}`} style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', transition: 'transform 0.45s ease' }} />
                <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(180deg, rgba(0,0,0,0.66) 0%, rgba(0,0,0,0.16) 42%, rgba(0,0,0,0.82) 100%)' }} />

                <div style={{ position: 'absolute', top: 30, left: 22, right: 22 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', marginBottom: 12 }}>
                    <span style={{ fontFamily: 'Helvetica Neue', fontWeight: 700, fontSize: 11, lineHeight: 1, color: DS.white, padding: '6px 9px', borderRadius: 99, background: 'rgba(255,255,255,0.18)', backdropFilter: 'blur(8px)', WebkitBackdropFilter: 'blur(8px)' }}>Sekali jalan</span>
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontFamily: 'Helvetica Neue', fontWeight: 700, fontSize: 11, lineHeight: 1, color: 'rgba(255,255,255,0.82)', padding: '6px 9px', borderRadius: 99, background: 'rgba(0,0,0,0.24)' }}>
                      {r.from} <ArrowRight size={12} /> {r.to}
                    </span>
                  </div>
                  <div style={{ fontFamily: 'Helvetica Neue', fontSize: 14, lineHeight: 1.35, color: 'rgba(255,255,255,0.86)', marginBottom: 4 }}>{r.date}</div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 7, flexWrap: 'wrap', fontFamily: 'Helvetica Neue', fontWeight: 700, fontSize: 24, lineHeight: 1.08, color: DS.white, textTransform: 'uppercase', textShadow: '0 2px 14px rgba(0,0,0,0.35)' }}>
                    <span>{r.fromCity}</span>
                    <ArrowRight size={20} strokeWidth={2.7} style={{ flexShrink: 0 }} />
                    <span>{r.toCity}</span>
                  </div>
                </div>

                <div style={{ position: 'absolute', left: 22, right: 22, bottom: 20, textAlign: 'center' }}>
                  <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, marginBottom: 14, padding: '8px 11px', borderRadius: 12, background: 'rgba(0,0,0,0.28)', backdropFilter: 'blur(8px)', WebkitBackdropFilter: 'blur(8px)', fontFamily: 'Helvetica Neue', fontWeight: 700, fontSize: 12, color: DS.white, lineHeight: 1 }}>
                    <Plane size={13} style={{ transform: 'rotate(45deg)' }} />
                    Penerbangan favorit
                  </div>
                  <div style={{ fontFamily: 'Helvetica Neue', fontSize: 10, color: 'rgba(255,255,255,0.74)', marginBottom: 4 }}>Mulai dari</div>
                  <div style={{ fontFamily: 'Helvetica Neue', fontWeight: 700, fontSize: 23, lineHeight: 1.1, color: DS.white, letterSpacing: '.01em', textShadow: '0 2px 14px rgba(0,0,0,0.45)' }}>{r.price}</div>
                  <div style={{ fontFamily: 'Helvetica Neue', fontSize: 11, color: 'rgba(255,255,255,0.72)', marginTop: 6 }}>/orang</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
