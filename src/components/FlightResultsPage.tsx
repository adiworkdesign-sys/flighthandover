'use client';
import { useState, useEffect, useMemo, CSSProperties } from 'react';
import { DS, layout } from '../lib/ds';
import {
  ArrowLeft, ArrowRight, ChevronDown, ChevronUp, SlidersHorizontal,
  RotateCcw, Plane, Luggage, RefreshCw, Filter, UtensilsCrossed,
  Utensils, Building2, Backpack,
} from 'lucide-react';

function useBreakpoint() {
  const [w, setW] = useState(typeof window !== 'undefined' ? window.innerWidth : 1280);
  useEffect(() => {
    const fn = () => setW(window.innerWidth);
    window.addEventListener('resize', fn);
    return () => window.removeEventListener('resize', fn);
  }, []);
  return { isMobile: w < 1024, isTablet: w >= 768 && w < 1024, isDesktop: w >= 1024, w };
}

function FilterSection({ title, open, onToggle, children }: { title: string; open: boolean; onToggle: () => void; children: React.ReactNode }) {
  return (
    <div style={{ borderBottom: `1px solid ${DS.n100}`, paddingBottom: 16, marginBottom: 16 }}>
      <button onClick={onToggle} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%', background: 'none', border: 'none', cursor: 'pointer', padding: '4px 0', outline: 'none' }}>
        <span style={{ fontFamily: 'Helvetica Neue', fontWeight: 700, fontSize: 14, color: DS.dark }}>{title}</span>
        {open ? <ChevronUp size={18} color={DS.n400} /> : <ChevronDown size={18} color={DS.n400} />}
      </button>
      {open && <div style={{ paddingTop: 12 }}>{children}</div>}
    </div>
  );
}

function Checkbox({ label, checked, onChange }: { label: string; checked: boolean; onChange: () => void }) {
  return (
    <label onClick={onChange} style={{ display: 'flex', alignItems: 'center', gap: 12, cursor: 'pointer', marginBottom: 12, padding: '4px 0' }}>
      <div style={{ width: 20, height: 20, borderRadius: 6, border: `2px solid ${checked ? DS.primary : DS.n200}`, background: checked ? DS.primary : DS.white, display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.15s', flexShrink: 0 }}>
        {checked && <svg width="12" height="9" viewBox="0 0 12 9"><path d="M1 4.5l3 3 6-7" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none" /></svg>}
      </div>
      <span style={{ fontFamily: 'Helvetica Neue', fontSize: 14, color: DS.n700 }}>{label}</span>
    </label>
  );
}

type FiltersState = { direct: boolean; airlines: string[]; maxPrice: number };

function FlightFilterContent({ filters, onFiltersChange, allAirlines, onApply }: {
  filters: FiltersState; onFiltersChange: (f: FiltersState) => void; allAirlines: string[]; onApply?: () => void;
}) {
  const [sections, setSections] = useState({ price: true, type: true, airline: true });
  const toggle = (s: string) => setSections(p => ({ ...p, [s]: !p[s as keyof typeof p] }));
  const update = (patch: Partial<FiltersState>) => onFiltersChange({ ...filters, ...patch });
  const toggleArr = (key: keyof FiltersState, val: string) => {
    const current = filters[key] as string[];
    update({ [key]: current.includes(val) ? current.filter(x => x !== val) : [...current, val] });
  };

  return (
    <div style={{ padding: '16px' }}>
      <FilterSection title="Tipe Penerbangan" open={sections.type} onToggle={() => toggle('type')}>
        <Checkbox label="Hanya penerbangan langsung" checked={filters.direct} onChange={() => update({ direct: !filters.direct })} />
      </FilterSection>
      <FilterSection title="Maskapai" open={sections.airline} onToggle={() => toggle('airline')}>
        {allAirlines.map(al => (
          <Checkbox key={al} label={al} checked={filters.airlines.includes(al)} onChange={() => toggleArr('airlines', al)} />
        ))}
      </FilterSection>
      <FilterSection title="Harga Maksimum" open={sections.price} onToggle={() => toggle('price')}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 14 }}>
          <span style={{ fontFamily: 'Helvetica Neue', fontSize: 13, color: DS.n500 }}>Rp 0</span>
          <span style={{ fontFamily: 'Helvetica Neue', fontSize: 13, color: DS.primary, fontWeight: 700 }}>Rp {filters.maxPrice.toLocaleString('id-ID')}</span>
        </div>
        <div style={{ padding: '0 4px', position: 'relative', marginBottom: 8 }}>
          <style>{`
            .flight-price-slider { -webkit-appearance:none; width:100%; height:6px; background:${DS.n200}; border-radius:4px; outline:none; margin:0; }
            .flight-price-slider::-webkit-slider-thumb { -webkit-appearance:none; appearance:none; width:24px; height:24px; border-radius:50%; background:${DS.white}; border:2px solid ${DS.primary}; cursor:pointer; box-shadow:0 2px 6px rgba(0,0,0,0.15); }
          `}</style>
          <input type="range" min="400000" max="2000000" step="50000" value={filters.maxPrice}
            onChange={e => update({ maxPrice: Number(e.target.value) })}
            className="flight-price-slider"
            style={{ background: `linear-gradient(to right, ${DS.primary} ${((filters.maxPrice - 400000) / (2000000 - 400000)) * 100}%, ${DS.n200} ${((filters.maxPrice - 400000) / (2000000 - 400000)) * 100}%)` } as CSSProperties}
          />
        </div>
      </FilterSection>
      <div style={{ height: onApply ? 60 : 0 }} />
    </div>
  );
}

const AIRLINE_PROFILES: Record<string, {
  name: string; logo: string; color: string; lcc: boolean; cabinBag: string; checkinBag: string; meal: boolean;
  aircraft: string[]; terminals: Record<string, string>; refundFee: number | null; rescheduleFee: number;
}> = {
  GA: { name: 'Garuda Indonesia', logo: '/logos/garuda-logo.png', color: '#004B87', lcc: false, cabinBag: '7 kg', checkinBag: '20 kg', meal: true, aircraft: ['Boeing 737-800', 'Airbus A330-300', 'Boeing 777-300ER'], terminals: { CGK: 'T3', DPS: 'Internasional', SUB: 'T2', BPN: 'Internasional' }, refundFee: 350000, rescheduleFee: 200000 },
  JT: { name: 'Lion Air', logo: '/logos/lionair-logo.png', color: '#FF6B00', lcc: true, cabinBag: '7 kg', checkinBag: '0 kg (berbayar)', meal: false, aircraft: ['Boeing 737-900ER', 'Boeing 737-800'], terminals: { CGK: 'T1B', DPS: 'Domestik', SUB: 'T2', BPN: 'Domestik' }, refundFee: null, rescheduleFee: 350000 },
  ID: { name: 'Batik Air', logo: '/logos/batikair-logo.png', color: '#C8102E', lcc: false, cabinBag: '7 kg', checkinBag: '20 kg', meal: true, aircraft: ['Airbus A320', 'Boeing 737-800', 'Airbus A330'], terminals: { CGK: 'T1C', DPS: 'Domestik', SUB: 'T2', BPN: 'Domestik' }, refundFee: 300000, rescheduleFee: 150000 },
  QG: { name: 'Citilink', logo: '/logos/citilink-logo.png', color: '#0F8040', lcc: true, cabinBag: '7 kg', checkinBag: '0 kg (berbayar)', meal: false, aircraft: ['Airbus A320', 'Airbus A320neo'], terminals: { CGK: 'T2', DPS: 'Domestik', SUB: 'T1', BPN: 'Domestik' }, refundFee: null, rescheduleFee: 300000 },
  QZ: { name: 'AirAsia', logo: '/logos/airasia-logo.png', color: '#E21836', lcc: true, cabinBag: '7 kg', checkinBag: '0 kg (berbayar)', meal: false, aircraft: ['Airbus A320', 'Airbus A320neo'], terminals: { CGK: 'T2', DPS: 'Internasional', SUB: 'T2', BPN: 'Domestik' }, refundFee: null, rescheduleFee: 400000 },
};

export const AIRPORT_NAMES: Record<string, string> = {
  CGK: 'Soekarno-Hatta, Jakarta',
  DPS: 'Ngurah Rai, Denpasar',
  NRT: 'Narita, Tokyo',
  HND: 'Haneda, Tokyo',
  SIN: 'Changi, Singapore',
  KUL: 'KLIA, Kuala Lumpur',
  BKK: 'Suvarnabhumi, Bangkok',
  JOG: 'Adisutjipto, Yogyakarta',
  SUB: 'Juanda, Surabaya',
  BDO: 'Husein Sastranegara, Bandung',
  MES: 'Kualanamu, Medan',
  UPG: 'Sultan Hasanuddin, Makassar',
  LOP: 'Lombok International',
};

export type FlightType = {
  id: number; airline: string; code: string; logo: string; logoColor: string; flightNo: string;
  dep: string; arr: string; depCode: string; arrCode: string; duration: string; direct: boolean;
  transit: string | null; price: number; cashback: number; depDate: Date | null;
  refundable: boolean; reschedule: boolean; seats: number; cabinBag: string; checkinBag: string;
  meal: boolean; aircraft: string; terminal: string; refundFee: number | null; rescheduleFee: number; lcc: boolean;
};
type Flight = FlightType;

function generateFlights(from: string, to: string, selectedDate: Date | null, anchorPrice = 450000, dateOffset = 0): Flight[] {
  const codes = ['GA', 'JT', 'ID', 'QG', 'QZ'];
  const times: [string, string][] = [
    ['05:30', '07:45'], ['07:15', '09:30'], ['09:00', '11:10'], ['11:30', '13:45'],
    ['13:00', '15:15'], ['15:30', '17:45'], ['17:00', '19:10'], ['19:30', '21:45'], ['21:00', '23:10'],
  ];
  return times.map((t, i) => {
    const code = codes[i % codes.length];
    const al = AIRLINE_PROFILES[code];
    const dateSeed = selectedDate ? selectedDate.getDate() + selectedDate.getMonth() * 31 : 0;
    const variance = ((dateSeed + dateOffset + i * 17) % 9) * 18000;
    const base = Math.max(320000, anchorPrice + (i * 87000) + variance - (i % 2 === 0 ? 28000 : 0));
    const cashback = Math.round(base * 0.07 / 1000) * 1000;
    const direct = i % 3 !== 2;
    const [dep, arr] = t;
    const depH = parseInt(dep.split(':')[0]);
    const arrH = parseInt(arr.split(':')[0]);
    const durationMin = (arrH - depH) * 60 + (parseInt(arr.split(':')[1]) - parseInt(dep.split(':')[1]));
    return {
      id: i + 1, airline: al.name, code, logo: al.logo, logoColor: al.color,
      flightNo: `${code}${200 + i * 37}`, dep, arr, depCode: from, arrCode: to,
      duration: `${Math.floor(durationMin / 60)}j ${durationMin % 60}m`,
      direct, transit: direct ? null : 'Surabaya (SUB)',
      price: base, cashback, depDate: selectedDate,
      refundable: !al.lcc && i % 2 === 0,
      reschedule: i % 3 !== 1,
      seats: 3 + (i % 8),
      cabinBag: al.cabinBag, checkinBag: al.checkinBag, meal: al.meal,
      aircraft: al.aircraft[i % al.aircraft.length],
      terminal: (al.terminals[from] || 'T1') + ' -> ' + (al.terminals[to] || 'T1'),
      refundFee: al.refundFee, rescheduleFee: al.rescheduleFee, lcc: al.lcc,
    };
  });
}

function generatePriceBar(baseDate?: string | null) {
  const today = baseDate ? new Date(baseDate) : new Date();
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(today);
    d.setDate(d.getDate() + i);
    const seed = d.getDate() + d.getMonth() * 31 + i * 7;
    const price = 420000 + (seed % 17) * 35000 + (seed % 5) * 22000;
    return { date: d, label: d.toLocaleDateString('id-ID', { weekday: 'short', day: 'numeric', month: 'short' }), price, isSelected: i === 0 };
  });
}

function FlightCard({ flight, onSelect }: { flight: Flight; onSelect: (f: Flight) => void }) {
  const { isMobile } = useBreakpoint();
  const [expanded, setExpanded] = useState(false);
  const [hov, setHov] = useState(false);
  const fmt = (p: number) => 'Rp ' + p.toLocaleString('id-ID');

  const detailItems = [
    { icon: <Backpack size={14} />, label: 'Bagasi Kabin', val: flight.cabinBag },
    { icon: <Luggage size={14} />, label: 'Bagasi Check-in', val: flight.checkinBag },
    { icon: <RotateCcw size={14} />, label: 'Refund', val: flight.refundable ? `Dapat direfund${flight.refundFee ? ` (Rp ${flight.refundFee.toLocaleString('id-ID')})` : ''}` : 'Tidak dapat direfund', color: flight.refundable ? DS.successText : DS.n500 },
    { icon: <RefreshCw size={14} />, label: 'Reschedule', val: flight.reschedule ? `Dapat reschedule (Rp ${flight.rescheduleFee.toLocaleString('id-ID')})` : 'Tidak dapat reschedule', color: flight.reschedule ? DS.successText : DS.n500 },
    { icon: flight.meal ? <Utensils size={14} /> : <UtensilsCrossed size={14} />, label: 'Makanan', val: flight.meal ? 'Termasuk' : 'Tidak termasuk', color: flight.meal ? DS.successText : DS.n500 },
    { icon: <Building2 size={14} />, label: 'Terminal', val: flight.terminal },
    { icon: <Plane size={14} />, label: 'Tipe Pesawat', val: flight.aircraft },
  ];

  if (isMobile) {
    return (
      <div style={{ background: DS.white, borderRadius: 14, border: `1px solid ${DS.n100}`, boxShadow: DS.shadowSm, marginBottom: 12, overflow: 'hidden' }}>
        <div style={{ padding: 14 }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10, marginBottom: 14 }}>
            <div style={{ width: 44, height: 44, borderRadius: 12, background: `${flight.logoColor}15`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, overflow: 'hidden', padding: 4 }}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={flight.logo} alt={flight.airline} style={{ width: '100%', height: '100%', objectFit: 'contain' }} onError={e => { (e.currentTarget as HTMLImageElement).style.display = 'none'; }} />
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontFamily: 'Helvetica Neue', fontSize: 11, color: DS.n400 }}>{flight.airline} - {flight.flightNo}</div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8, marginTop: 4 }}>
                <div style={{ textAlign: 'left', flexShrink: 0 }}>
                  <div style={{ fontFamily: 'Helvetica Neue', fontWeight: 700, fontSize: 22, color: DS.dark, lineHeight: 1 }}>{flight.dep}</div>
                  <div style={{ fontFamily: 'Helvetica Neue', fontSize: 11, color: DS.n500, marginTop: 4 }}>{AIRPORT_NAMES[flight.depCode] || flight.depCode}</div>
                </div>
                <div style={{ flex: 1, minWidth: 70, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
                  <div style={{ fontFamily: 'Helvetica Neue', fontSize: 11, color: DS.n400, whiteSpace: 'nowrap' }}>{flight.duration}</div>
                  <div style={{ width: '100%', height: 2, background: DS.n100, borderRadius: 1, position: 'relative' }}>
                    <Plane size={12} color={DS.accent} style={{ position: 'absolute', left: '50%', top: '50%', transform: 'translate(-50%,-50%) rotate(90deg)', background: DS.white }} />
                  </div>
                  <div style={{ fontFamily: 'Helvetica Neue', fontSize: 11, color: flight.direct ? DS.successText : DS.dark, whiteSpace: 'nowrap' }}>
                    {flight.direct ? 'Langsung' : '1 Transit'}
                  </div>
                </div>
                <div style={{ textAlign: 'right', flexShrink: 0 }}>
                  <div style={{ fontFamily: 'Helvetica Neue', fontWeight: 700, fontSize: 22, color: DS.dark, lineHeight: 1 }}>{flight.arr}</div>
                  <div style={{ fontFamily: 'Helvetica Neue', fontSize: 11, color: DS.n500, marginTop: 4 }}>{AIRPORT_NAMES[flight.arrCode] || flight.arrCode}</div>
                </div>
              </div>
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: 12, paddingTop: 12, borderTop: `1px solid ${DS.n100}` }}>
            <div style={{ minWidth: 0 }}>
              <div style={{ fontFamily: 'Helvetica Neue', fontWeight: 700, fontSize: 20, color: DS.primary, lineHeight: 1.1 }}>{fmt(flight.price - flight.cashback)}</div>
              <div style={{ fontFamily: 'Helvetica Neue', fontSize: 11, color: DS.n400, textDecoration: 'line-through', marginTop: 3 }}>{fmt(flight.price)}</div>
              <div style={{ fontFamily: 'Helvetica Neue', fontSize: 10, color: DS.successText, marginTop: 2 }}>cashback {fmt(flight.cashback)}</div>
            </div>
            <div style={{ width: 112, flexShrink: 0, textAlign: 'right' }}>
              <button onClick={() => onSelect(flight)} style={{ borderRadius: 999, width: '100%', height: 36, background: DS.accent, color: '#fff', border: 'none', cursor: 'pointer', fontFamily: 'Helvetica Neue', fontWeight: 700, fontSize: 14 }}>Pilih</button>
              {flight.seats <= 5 && <div style={{ fontFamily: 'Helvetica Neue', fontSize: 10, color: DS.error, marginTop: 5, whiteSpace: 'nowrap' }}>{flight.seats} kursi tersisa!</div>}
            </div>
          </div>
        </div>
        <div style={{ padding: '0 14px 12px', display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
          {flight.refundable && <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontFamily: 'Helvetica Neue', fontSize: 11, color: DS.successText, background: DS.successBg, borderRadius: 99, padding: '3px 8px' }}><RotateCcw size={10} /> Refund & Reschedule</span>}
          <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontFamily: 'Helvetica Neue', fontSize: 11, color: DS.n500, background: DS.n50, borderRadius: 99, padding: '3px 8px' }}><Luggage size={10} /> Bagasi {flight.cabinBag}</span>
          <button onClick={() => setExpanded(e => !e)} style={{ marginLeft: 'auto', background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'Helvetica Neue', fontSize: 11, color: DS.accent, display: 'flex', alignItems: 'center', gap: 4, padding: '4px 0' }}>
            {expanded ? 'Sembunyikan' : 'Lihat detail'} <ChevronDown size={12} style={{ transform: expanded ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }} />
          </button>
        </div>
        {expanded && (
          <div style={{ padding: '12px 14px 14px', borderTop: `1px solid ${DS.n100}`, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            {detailItems.map(({ icon, label, val, color }) => (
              <div key={label} style={{ display: 'flex', alignItems: 'flex-start', gap: 8 }}>
                <div style={{ color: DS.accent, marginTop: 2, flexShrink: 0 }}>{icon}</div>
                <div>
                  <div style={{ fontFamily: 'Helvetica Neue', fontSize: 11, color: DS.n400 }}>{label}</div>
                  <div style={{ fontFamily: 'Helvetica Neue', fontWeight: 700, fontSize: 12, color: color || DS.dark }}>{val}</div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }

  return (
    <div style={{ background: DS.white, borderRadius: 14, border: `1px solid ${hov ? DS.accent : DS.n100}`, boxShadow: hov ? DS.shadowMd : DS.shadowSm, transition: 'all 0.2s', marginBottom: 10 }}
      onMouseEnter={() => setHov(true)} onMouseLeave={() => setHov(false)}>
      <div style={{ padding: '16px 20px', display: 'flex', alignItems: 'center', gap: 16 }}>
        <div style={{ width: 44, height: 44, borderRadius: 12, background: `${flight.logoColor}15`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, overflow: 'hidden', padding: 4 }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={flight.logo} alt={flight.airline} style={{ width: '100%', height: '100%', objectFit: 'contain' }} onError={e => { (e.currentTarget as HTMLImageElement).style.display = 'none'; }} />
        </div>
        <div style={{ flex: '1 1 0', minWidth: 0 }}>
          <div style={{ fontFamily: 'Helvetica Neue', fontSize: 11, color: DS.n400, marginBottom: 4 }}>{flight.airline} - {flight.flightNo}</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <div style={{ textAlign: 'center', flexShrink: 0 }}>
              <div style={{ fontFamily: 'Helvetica Neue', fontWeight: 700, fontSize: 20, color: DS.dark, lineHeight: 1.2 }}>{flight.dep}</div>
              <div style={{ fontFamily: 'Helvetica Neue', fontSize: 11, color: DS.n500, marginTop: 2 }}>{AIRPORT_NAMES[flight.depCode] || flight.depCode}</div>
            </div>
            <div style={{ flex: 1, minWidth: 80, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, padding: '0 12px' }}>
              <div style={{ fontFamily: 'Helvetica Neue', fontSize: 11, color: DS.n400, whiteSpace: 'nowrap' }}>{flight.duration}</div>
              <div style={{ position: 'relative', width: '100%', height: 2, background: DS.n100, borderRadius: 1 }}>
                <div style={{ position: 'absolute', left: '50%', top: '50%', transform: 'translate(-50%,-50%)', padding: '0 2px' }}>
                  <Plane size={12} color={DS.accent} style={{ transform: 'rotate(90deg)', display: 'block' }} />
                </div>
              </div>
              <div style={{ fontFamily: 'Helvetica Neue', fontSize: 11, color: flight.direct ? DS.successText : DS.dark, whiteSpace: 'nowrap' }}>
                {flight.direct ? 'Langsung' : '1 Transit'}
              </div>
            </div>
            <div style={{ textAlign: 'center', flexShrink: 0 }}>
              <div style={{ fontFamily: 'Helvetica Neue', fontWeight: 700, fontSize: 20, color: DS.dark, lineHeight: 1.2 }}>{flight.arr}</div>
              <div style={{ fontFamily: 'Helvetica Neue', fontSize: 11, color: DS.n500, marginTop: 2 }}>{AIRPORT_NAMES[flight.arrCode] || flight.arrCode}</div>
            </div>
          </div>
        </div>
        <div style={{ textAlign: 'right', flexShrink: 0 }}>
          <div style={{ fontFamily: 'Helvetica Neue', fontWeight: 700, fontSize: 20, color: DS.primary }}>{fmt(flight.price - flight.cashback)}</div>
          <div style={{ fontFamily: 'Helvetica Neue', fontSize: 11, color: DS.n400, textDecoration: 'line-through' }}>{fmt(flight.price)}</div>
          <div style={{ fontFamily: 'Helvetica Neue', fontSize: 10, color: DS.successText, marginBottom: 8 }}>cashback {fmt(flight.cashback)}</div>
          <button onClick={() => onSelect(flight)} style={{ borderRadius: 999, padding: '8px 20px', background: DS.accent, color: '#fff', border: 'none', cursor: 'pointer', fontFamily: 'Helvetica Neue', fontWeight: 700, fontSize: 14, width: '100%' }}>Pilih</button>
          {flight.seats <= 5 && <div style={{ fontFamily: 'Helvetica Neue', fontSize: 10, color: DS.error, marginTop: 4 }}>{flight.seats} kursi tersisa!</div>}
        </div>
      </div>
      <div style={{ padding: '0 20px 12px', display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
        {flight.refundable && <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontFamily: 'Helvetica Neue', fontSize: 11, color: DS.successText, background: DS.successBg, borderRadius: 99, padding: '2px 8px' }}><RotateCcw size={10} /> Refund & Reschedule</span>}
        <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontFamily: 'Helvetica Neue', fontSize: 11, color: DS.n500, background: DS.n50, borderRadius: 99, padding: '2px 8px' }}><Luggage size={10} /> Bagasi {flight.cabinBag}</span>
        <button onClick={() => setExpanded(e => !e)} style={{ marginLeft: 'auto', background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'Helvetica Neue', fontSize: 11, color: DS.accent, display: 'flex', alignItems: 'center', gap: 4 }}>
          {expanded ? 'Sembunyikan' : 'Lihat detail'} <ChevronDown size={12} style={{ transform: expanded ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }} />
        </button>
      </div>
      {expanded && (
        <div style={{ padding: '12px 20px 16px', borderTop: `1px solid ${DS.n100}`, display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 12 }}>
          {detailItems.map(({ icon, label, val, color }) => (
            <div key={label} style={{ display: 'flex', alignItems: 'flex-start', gap: 8 }}>
              <div style={{ color: DS.accent, marginTop: 2, flexShrink: 0 }}>{icon}</div>
              <div>
                <div style={{ fontFamily: 'Helvetica Neue', fontSize: 11, color: DS.n400 }}>{label}</div>
                <div style={{ fontFamily: 'Helvetica Neue', fontWeight: 700, fontSize: 13, color: color || DS.dark }}>{val}</div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export type SearchParams = {
  from: string; to: string; fromCity: string; toCity: string;
  depDate: string; retDate?: string; adults: number; children: number; infants: number;
  cabinClass: string; tripType: string;
};

export default function FlightResultsPage({
  searchParams, onBack,
  mode = 'outbound',
  outboundFlight = null,
  onSelectFlight,
}: {
  searchParams: SearchParams;
  onBack: () => void;
  mode?: 'outbound' | 'return';
  outboundFlight?: FlightType | null;
  onSelectFlight?: (flight: FlightType) => void;
}) {
  const { isMobile } = useBreakpoint();
  const isReturn = mode === 'return';
  const { from: rawFrom, to: rawTo, fromCity: rawFromCity, toCity: rawToCity, depDate, retDate, adults = 1, cabinClass = 'economy' } = searchParams;
  const from = isReturn ? rawTo : rawFrom;
  const to = isReturn ? rawFrom : rawTo;
  const activeDate = isReturn ? (retDate || depDate) : depDate;
  const [priceBar] = useState(() => generatePriceBar(activeDate));
  const [selectedDateIdx, setSelectedDateIdx] = useState(0);
  const selectedPriceDate = priceBar[selectedDateIdx] || priceBar[0];
  const flights = useMemo(
    () => generateFlights(from || 'CGK', to || 'DPS', selectedPriceDate?.date, selectedPriceDate?.price, selectedDateIdx),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [from, to, selectedPriceDate?.date, selectedPriceDate?.price, selectedDateIdx]
  );
  const [showFilterSheet, setShowFilterSheet] = useState(false);
  const [showSortSheet, setShowSortSheet] = useState(false);
  const [sortBy, setSortBy] = useState('price');
  const [filters, setFilters] = useState<FiltersState>({ direct: false, airlines: [], maxPrice: 2000000 });

  const sortOptions: [string, string][] = [
    ['price', 'Harga Termurah'],
    ['dep', 'Berangkat Paling Awal'],
    ['duration', 'Durasi Terpendek'],
  ];
  const selectedSortLabel = sortOptions.find(([v]) => v === sortBy)?.[1] || 'Harga Termurah';
  const allAirlines = [...new Set(flights.map(f => f.airline))];
  const resetFilters = () => setFilters({ direct: false, airlines: [], maxPrice: 2000000 });
  // If return mode & same calendar day as departure, only show flights after outbound arrival
  const isSameDay = isReturn && outboundFlight && selectedPriceDate?.date
    ? (() => {
        const sel = selectedPriceDate.date;
        const dep = new Date(depDate);
        return sel.getFullYear() === dep.getFullYear() &&
               sel.getMonth() === dep.getMonth() &&
               sel.getDate() === dep.getDate();
      })()
    : false;

  const filtered = flights.filter(f => {
    if (isSameDay && outboundFlight && f.dep <= outboundFlight.arr) return false;
    return (!filters.direct || f.direct) &&
      (filters.airlines.length === 0 || filters.airlines.includes(f.airline)) &&
      f.price <= filters.maxPrice;
  }).sort((a, b) =>
    sortBy === 'price' ? (a.price - b.price) :
    sortBy === 'duration' ? a.duration.localeCompare(b.duration) :
    a.dep.localeCompare(b.dep)
  );

  const fmt = (p: number) => 'Rp ' + p.toLocaleString('id-ID');
  const selectedDateText = selectedPriceDate?.date?.toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'short', year: 'numeric' });

  useEffect(() => {
    if (showFilterSheet || showSortSheet) document.body.style.overflow = 'hidden';
    else document.body.style.overflow = 'auto';
    return () => { document.body.style.overflow = 'auto'; };
  }, [showFilterSheet, showSortSheet]);

  return (
    <div style={{ minHeight: '100vh', background: DS.surface }}>
      {/* Sticky header */}
      <div style={{ background: DS.white, borderBottom: `1px solid ${DS.n100}`, position: 'sticky', top: 0, zIndex: 100 }}>
        <div style={{ maxWidth: layout.container['2xl'], margin: '0 auto', padding: isMobile ? '12px 16px' : '16px 24px', display: 'flex', alignItems: 'center', gap: isMobile ? 12 : 20 }}>
          <button onClick={onBack} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: 40, height: 40, borderRadius: '50%', background: DS.n50, border: 'none', cursor: 'pointer', flexShrink: 0, transition: 'all 0.15s' }}
            onMouseEnter={e => (e.currentTarget.style.background = DS.n100)} onMouseLeave={e => (e.currentTarget.style.background = DS.n50)}>
            <ArrowLeft size={20} color={DS.dark} />
          </button>
          <div onClick={onBack} style={{ flex: 1, display: 'flex', flexDirection: 'column', cursor: 'pointer', padding: '6px 12px', borderRadius: 12, border: `1px solid ${DS.n100}`, background: DS.white, transition: 'border-color 0.2s', minWidth: 0 }}
            onMouseEnter={e => (e.currentTarget.style.borderColor = DS.n300)} onMouseLeave={e => (e.currentTarget.style.borderColor = DS.n100)}>
            <div style={{ fontFamily: 'Helvetica Neue', fontWeight: 700, fontSize: 14, color: DS.dark, marginBottom: 2, display: 'flex', alignItems: 'center', gap: 6 }}>
              <Plane size={14} color={DS.primary} />
              <span>{rawFromCity || rawFrom}</span>
              <ArrowRight size={14} color={DS.n500} strokeWidth={2.4} />
              <span>{rawToCity || rawTo}</span>
            </div>
            <div style={{ fontFamily: 'Helvetica Neue', fontSize: 12, color: DS.n500, display: 'flex', alignItems: 'center', gap: 6 }}>
              <span>{adults} Penumpang</span>
              <span style={{ color: DS.n300 }}>-</span>
              <span>{cabinClass.charAt(0).toUpperCase() + cabinClass.slice(1)}</span>
            </div>
          </div>
          {!isMobile && (
            <button onClick={onBack} style={{ padding: '12px 24px', borderRadius: 999, border: `1px solid ${DS.primary}`, background: DS.white, color: DS.primary, fontFamily: 'Helvetica Neue', fontWeight: 700, fontSize: 14, cursor: 'pointer', whiteSpace: 'nowrap', transition: 'background 0.2s' }}
              onMouseEnter={e => (e.currentTarget.style.background = DS.primaryLight)} onMouseLeave={e => (e.currentTarget.style.background = DS.white)}>
              Ubah Pencarian
            </button>
          )}
        </div>
      </div>

      {/* Date price bar */}
      <div style={{ background: DS.white, borderBottom: `1px solid ${DS.n100}`, overflowX: 'auto', boxShadow: '0 2px 12px rgba(0,0,0,0.06)' }}>
        <div style={{ maxWidth: layout.container['2xl'], margin: '0 auto', padding: isMobile ? '0 16px' : '0 48px', display: 'flex', gap: 0 }}>
          {priceBar.map((d, i) => (
            <button key={i} onClick={() => setSelectedDateIdx(i)}
              style={{ flex: '0 0 auto', padding: '10px 16px', border: 'none', borderBottom: `3px solid ${i === selectedDateIdx ? DS.accent : 'transparent'}`, background: 'none', cursor: 'pointer', textAlign: 'center', transition: 'all 0.15s' }}>
              <div style={{ fontFamily: 'Helvetica Neue', fontSize: 11, color: i === selectedDateIdx ? DS.accent : DS.n500, fontWeight: 500, whiteSpace: 'nowrap' }}>{d.label}</div>
              <div style={{ fontFamily: 'Helvetica Neue', fontWeight: 700, fontSize: 13, color: i === selectedDateIdx ? DS.accent : DS.dark, marginTop: 2 }}>{fmt(d.price)}</div>
            </button>
          ))}
        </div>
      </div>

      <div style={{ maxWidth: layout.container['2xl'], margin: '0 auto', padding: isMobile ? '16px 16px 100px' : '24px 48px 60px', display: 'flex', gap: 24, alignItems: 'flex-start' }}>
        {/* Desktop sidebar filter */}
        {!isMobile && (
          <div style={{ width: 260, flexShrink: 0 }}>
            <div style={{ background: DS.white, borderRadius: 16, border: `1px solid ${DS.n100}`, overflow: 'hidden', position: 'sticky', top: 100, boxShadow: DS.shadowLg }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px', borderBottom: `1px solid ${DS.n100}`, background: DS.n50 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <SlidersHorizontal size={18} color={DS.primary} />
                  <span style={{ fontFamily: 'Helvetica Neue', fontWeight: 700, fontSize: 15, color: DS.dark }}>Filter</span>
                </div>
                <button onClick={resetFilters} style={{ background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'Helvetica Neue', fontSize: 13, color: DS.primary, fontWeight: 700 }}>Reset</button>
              </div>
              <FlightFilterContent filters={filters} onFiltersChange={setFilters} allAirlines={allAirlines} />
            </div>
          </div>
        )}

        {/* Main results */}
        <div style={{ flex: 1, minWidth: 0 }}>
          {/* Locked outbound strip (return mode only) */}
          {isReturn && outboundFlight && (
            <>
              <div style={{ background: DS.primaryLight, borderRadius: 14, border: `1px solid ${DS.primary}22`, padding: '12px 16px', marginBottom: 12 }}>
                {/* Row 1: chip + times + price */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                  <span style={{ background: DS.primary, color: '#fff', borderRadius: 99, padding: '2px 9px', fontFamily: 'Helvetica Neue', fontWeight: 700, fontSize: 11, flexShrink: 0 }}>Pergi</span>
                  <span style={{ fontFamily: 'Helvetica Neue', fontWeight: 800, fontSize: 16, color: DS.dark, letterSpacing: '-0.3px', flexShrink: 0 }}>
                    {outboundFlight.dep} – {outboundFlight.arr}
                  </span>
                  <span style={{ fontFamily: 'Helvetica Neue', fontWeight: 700, fontSize: 13, color: DS.primary, marginLeft: 'auto', flexShrink: 0 }}>
                    Rp {(outboundFlight.price - outboundFlight.cashback).toLocaleString('id-ID')}
                  </span>
                </div>
                {/* Row 2: logo + airline info + date */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                  <div style={{ width: 18, height: 18, borderRadius: 4, background: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', padding: 2, flexShrink: 0 }}>
                    <img src={outboundFlight.logo} alt="" style={{ width: '100%', height: '100%', objectFit: 'contain' }} onError={e => (e.currentTarget.style.display = 'none')} />
                  </div>
                  <span style={{ fontFamily: 'Helvetica Neue', fontSize: 12, color: DS.n600 }}>
                    {outboundFlight.airline} · {outboundFlight.flightNo} · {outboundFlight.duration}
                  </span>
                  <span style={{ fontFamily: 'Helvetica Neue', fontSize: 12, fontWeight: 600, color: outboundFlight.direct ? '#0d9469' : DS.dark }}>
                    · {outboundFlight.direct ? 'Langsung' : '1 Transit'}
                  </span>
                  {depDate && (
                    <span style={{ fontFamily: 'Helvetica Neue', fontSize: 12, color: DS.n500, marginLeft: 'auto', flexShrink: 0 }}>
                      {new Date(depDate + 'T00:00:00').toLocaleDateString('id-ID', { weekday: 'short', day: 'numeric', month: 'short', year: '2-digit' })}
                    </span>
                  )}
                </div>
              </div>
              <div style={{ fontFamily: 'Helvetica Neue', fontWeight: 700, fontSize: 15, color: DS.dark, marginBottom: 4 }}>
                Pilih penerbangan pulang
              </div>
            </>
          )}

          {/* Results info & sort */}
          <div style={{ display: 'flex', flexDirection: isMobile ? 'column' : 'row', justifyContent: 'space-between', alignItems: isMobile ? 'flex-start' : 'center', marginBottom: 20, gap: 12 }}>
            <div>
              <h1 style={{ fontFamily: 'Helvetica Neue', fontWeight: 700, fontSize: isMobile ? 18 : 22, color: DS.dark, margin: 0, display: 'flex', alignItems: 'center', gap: 10 }}>
                {filtered.length} penerbangan ditemukan
                {isReturn && (
                  <span style={{ background: DS.primary, color: '#fff', borderRadius: 99, padding: '3px 10px', fontFamily: 'Helvetica Neue', fontWeight: 700, fontSize: 12 }}>Pulang</span>
                )}
              </h1>
              <p style={{ fontFamily: 'Helvetica Neue', fontSize: 13, color: DS.n500, margin: '4px 0 0 0' }}>
                Harga terbaik untuk {selectedDateText || 'tanggal pilihan Anda'}
              </p>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, alignSelf: isMobile ? 'stretch' : 'auto' }}>
              {!isMobile && <span style={{ fontFamily: 'Helvetica Neue', fontSize: 13, color: DS.n500, whiteSpace: 'nowrap' }}>Urutkan:</span>}
              {isMobile ? (
                <button onClick={() => setShowSortSheet(true)} style={{ flex: 1, border: `1px solid ${DS.n200}`, borderRadius: 10, padding: '11px 14px', fontFamily: 'Helvetica Neue', fontWeight: 700, fontSize: 13, color: DS.dark, background: DS.white, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <span>Urutkan: {selectedSortLabel}</span>
                  <ChevronDown size={16} color={DS.n400} />
                </button>
              ) : (
                <select value={sortBy} onChange={e => setSortBy(e.target.value)} style={{ border: `1px solid ${DS.n200}`, borderRadius: 10, padding: '10px 14px', fontFamily: 'Helvetica Neue', fontWeight: 700, fontSize: 13, color: DS.dark, background: DS.white, cursor: 'pointer', outline: 'none', appearance: 'none', paddingRight: 36, backgroundImage: "url(\"data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='12' height='8'><path d='M0 0l6 8 6-8z' fill='%23666'/></svg>\")", backgroundRepeat: 'no-repeat', backgroundPosition: 'right 14px center' }}>
                  {sortOptions.map(([value, label]) => <option key={value} value={value}>{label}</option>)}
                </select>
              )}
            </div>
          </div>

          {filtered.length === 0 && isSameDay && (
            <div style={{ textAlign: 'center', padding: '48px 24px', color: DS.n500, fontFamily: 'Helvetica Neue' }}>
              <div style={{ fontSize: 32, marginBottom: 12 }}>✈️</div>
              <div style={{ fontWeight: 700, fontSize: 16, color: DS.dark, marginBottom: 8 }}>
                Tidak ada penerbangan pulang tersedia
              </div>
              <div style={{ fontSize: 14 }}>
                Penerbangan pergi tiba pukul <b>{outboundFlight?.arr}</b>.<br />
                Tidak ada penerbangan pulang setelah jam tersebut pada hari yang sama.<br />
                Silakan pilih tanggal pulang yang berbeda.
              </div>
            </div>
          )}
          {filtered.map(f => <FlightCard key={f.id} flight={f} onSelect={(flight) => onSelectFlight?.(flight)} />)}
        </div>
      </div>

      {/* Mobile FAB filter */}
      {isMobile && (
        <div style={{ position: 'fixed', bottom: 24, right: 24, zIndex: 90 }}>
          <button onClick={() => setShowFilterSheet(true)} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', background: DS.white, color: DS.dark, border: `1px solid ${DS.n100}`, borderRadius: '50%', width: 56, height: 56, boxShadow: '0 6px 20px rgba(0,0,0,0.15)', cursor: 'pointer', transition: 'transform 0.2s' }}
            onMouseEnter={e => (e.currentTarget.style.transform = 'scale(1.05)')}
            onMouseLeave={e => (e.currentTarget.style.transform = 'scale(1)')}>
            <Filter size={24} color={DS.dark} />
          </button>
        </div>
      )}

      {/* Mobile filter bottom sheet */}
      {isMobile && showFilterSheet && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 1000, display: 'flex', flexDirection: 'column', justifyContent: 'flex-end' }}>
          <div onClick={() => setShowFilterSheet(false)} style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.5)', animation: 'fadeIn 0.2s' }} />
          <div style={{ position: 'relative', background: DS.white, width: '100%', maxHeight: '85vh', borderTopLeftRadius: 24, borderTopRightRadius: 24, display: 'flex', flexDirection: 'column', animation: 'slideUp 0.3s cubic-bezier(0.16, 1, 0.3, 1)' }}>
            <div style={{ display: 'flex', justifyContent: 'center', padding: '12px 0 4px' }}>
              <div style={{ width: 40, height: 4, borderRadius: 2, background: DS.n200 }} />
            </div>
            <div style={{ display: 'flex', alignItems: 'center', padding: '8px 20px 16px', borderBottom: `1px solid ${DS.n100}` }}>
              <div style={{ fontFamily: 'Helvetica Neue', fontWeight: 700, fontSize: 18, color: DS.dark }}>Filter Penerbangan</div>
            </div>
            <div style={{ flex: 1, overflowY: 'auto', paddingBottom: 80 }}>
              <FlightFilterContent filters={filters} onFiltersChange={setFilters} allAirlines={allAirlines} onApply={() => setShowFilterSheet(false)} />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '0.7fr 1fr', gap: 12, padding: '16px 20px', borderTop: `1px solid ${DS.n100}`, background: DS.white, position: 'absolute', bottom: 0, left: 0, right: 0 }}>
              <button onClick={resetFilters} style={{ width: '100%', padding: '14px', borderRadius: 999, background: DS.white, color: DS.accent, border: `1.5px solid ${DS.accent}`, fontFamily: 'Helvetica Neue', fontWeight: 700, fontSize: 16, cursor: 'pointer' }}>Reset</button>
              <button onClick={() => setShowFilterSheet(false)} style={{ width: '100%', padding: '14px', borderRadius: 999, background: DS.accent, color: DS.white, border: 'none', fontFamily: 'Helvetica Neue', fontWeight: 700, fontSize: 16, cursor: 'pointer', boxShadow: '0 4px 14px rgba(53,107,166,0.24)' }}>Terapkan Filter</button>
            </div>
            <style>{`
              @keyframes slideUp { from { transform: translateY(100%); } to { transform: translateY(0); } }
              @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
            `}</style>
          </div>
        </div>
      )}

      {/* Mobile sort sheet */}
      {isMobile && showSortSheet && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 1000, display: 'flex', flexDirection: 'column', justifyContent: 'flex-end' }}>
          <div onClick={() => setShowSortSheet(false)} style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.5)' }} />
          <div style={{ position: 'relative', background: DS.white, width: '100%', borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: '12px 20px 20px' }}>
            <div style={{ display: 'flex', justifyContent: 'center', padding: '0 0 12px' }}><div style={{ width: 40, height: 4, borderRadius: 2, background: DS.n200 }} /></div>
            <div style={{ fontFamily: 'Helvetica Neue', fontWeight: 700, fontSize: 18, color: DS.dark, marginBottom: 12 }}>Urutkan Hasil</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {sortOptions.map(([value, label]) => (
                <button key={value} onClick={() => { setSortBy(value); setShowSortSheet(false); }}
                  style={{ minHeight: 48, borderRadius: 12, border: `1.5px solid ${sortBy === value ? DS.accent : DS.n100}`, background: sortBy === value ? DS.accentLight : DS.white, color: DS.dark, fontFamily: 'Helvetica Neue', fontWeight: 700, fontSize: 14, cursor: 'pointer', textAlign: 'left', padding: '0 14px' }}>
                  {label}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
