'use client';
import { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { DS, layout } from '../lib/ds';
import { ChevronLeft, ChevronDown, ChevronUp, ShieldCheck, User, Search, Plane } from 'lucide-react';
import telephoneData from 'country-telephone-data';
import type { FlightType, SearchParams } from './FlightResultsPage';
import { AIRPORT_NAMES } from './FlightResultsPage';
import type { FareType } from './FlightFarePage';

// ─── Types ─────────────────────────────────────────────────────────────────
type PhoneCountry = { iso: string; name: string; dial: string };
type PassengerState = {
  id: number; type: 'Dewasa' | 'Anak-Anak' | 'Bayi';
  salutation: string; name: string; sameAsContact: boolean;
  dob: string; passport: string; expiry: string; country: string;
  companionIdx?: number;
};

// ─── Constants ─────────────────────────────────────────────────────────────
const ID_AIRPORTS = new Set([
  'CGK','HLP','DPS','SUB','MLG','KNO','BTJ','MES','PDG','PKU','BTH','PLM','TKG','BDO',
  'JOG','SOC','SRG','DJB','PGK','BPN','TRK','BDJ','UPG','MDC','GTO','MNF','KDI','PLW',
  'PNK','SMQ','LOP','AMQ','TTE','MKQ','DJJ','BIK','FKQ','MKW','SQR','NAH','KOE','MOF',
  'ENE','LBJ','SBY','BWX','JBB','RAW','LUV','GSH','WGP','MPB','ONI','JLA',
]);

const PHONE_COUNTRIES: PhoneCountry[] = (telephoneData.allCountries as { name: string; iso2: string; dialCode: string }[])
  .map(({ name, iso2, dialCode }) => ({
    iso: iso2.toUpperCase(),
    name: name.replace(/\s*\(.+\)\s*$/, ''),
    dial: `+${dialCode}`,
  }))
  .sort((a, b) => a.name.localeCompare(b.name));

const PROTECTIONS = [
  { id:'full',      name:'Full Protection Bundle', price:149000, icon:'🛡️', desc:'Proteksi lengkap: refund, reschedule, keterlambatan, dan bagasi', popular:true },
  { id:'baggage',   name:'Asuransi Bagasi',         price: 45000, icon:'🧳', desc:'Ganti rugi hingga Rp 5 juta jika bagasi hilang atau rusak' },
  { id:'delayplus', name:'Flight Delay Plus',        price: 79000, icon:'⏱️', desc:'Kompensasi s.d. Rp 2 juta jika delay > 2 jam' },
  { id:'delaybasic',name:'Flight Delay Basic',       price: 39000, icon:'🕐', desc:'Kompensasi s.d. Rp 500rb jika delay > 4 jam' },
];

const BAGGAGE_OPTIONS = [
  { kg:0,  price:0,      label:'Termasuk dalam tarif' },
  { kg:5,  price:65000,  label:'Tambah 5 kg' },
  { kg:10, price:120000, label:'Tambah 10 kg' },
  { kg:20, price:220000, label:'Tambah 20 kg' },
];

const ALL_COUNTRIES = [
  { code:'ID',name:'Indonesia' },{ code:'MY',name:'Malaysia' },{ code:'SG',name:'Singapura' },
  { code:'TH',name:'Thailand' },{ code:'VN',name:'Vietnam' },{ code:'PH',name:'Filipina' },
  { code:'MM',name:'Myanmar' },{ code:'KH',name:'Kamboja' },{ code:'LA',name:'Laos' },
  { code:'BN',name:'Brunei Darussalam' },{ code:'TL',name:'Timor Leste' },{ code:'JP',name:'Jepang' },
  { code:'KR',name:'Korea Selatan' },{ code:'KP',name:'Korea Utara' },{ code:'CN',name:'Tiongkok' },
  { code:'TW',name:'Taiwan' },{ code:'HK',name:'Hong Kong' },{ code:'MO',name:'Makau' },
  { code:'MN',name:'Mongolia' },{ code:'IN',name:'India' },{ code:'PK',name:'Pakistan' },
  { code:'BD',name:'Bangladesh' },{ code:'LK',name:'Sri Lanka' },{ code:'NP',name:'Nepal' },
  { code:'BT',name:'Bhutan' },{ code:'MV',name:'Maladewa' },{ code:'AF',name:'Afghanistan' },
  { code:'AU',name:'Australia' },{ code:'NZ',name:'Selandia Baru' },{ code:'PG',name:'Papua Nugini' },
  { code:'FJ',name:'Fiji' },{ code:'US',name:'Amerika Serikat' },{ code:'CA',name:'Kanada' },
  { code:'MX',name:'Meksiko' },{ code:'BR',name:'Brasil' },{ code:'AR',name:'Argentina' },
  { code:'CL',name:'Chili' },{ code:'CO',name:'Kolombia' },{ code:'PE',name:'Peru' },
  { code:'VE',name:'Venezuela' },{ code:'EC',name:'Ekuador' },{ code:'BO',name:'Bolivia' },
  { code:'UY',name:'Uruguay' },{ code:'PY',name:'Paraguay' },{ code:'GB',name:'Inggris Raya' },
  { code:'FR',name:'Prancis' },{ code:'DE',name:'Jerman' },{ code:'IT',name:'Italia' },
  { code:'ES',name:'Spanyol' },{ code:'PT',name:'Portugal' },{ code:'NL',name:'Belanda' },
  { code:'BE',name:'Belgia' },{ code:'CH',name:'Swiss' },{ code:'AT',name:'Austria' },
  { code:'SE',name:'Swedia' },{ code:'NO',name:'Norwegia' },{ code:'DK',name:'Denmark' },
  { code:'FI',name:'Finlandia' },{ code:'PL',name:'Polandia' },{ code:'RU',name:'Rusia' },
  { code:'UA',name:'Ukraina' },{ code:'CZ',name:'Ceko' },{ code:'HU',name:'Hungaria' },
  { code:'RO',name:'Rumania' },{ code:'BG',name:'Bulgaria' },{ code:'HR',name:'Kroasia' },
  { code:'RS',name:'Serbia' },{ code:'GR',name:'Yunani' },{ code:'SA',name:'Arab Saudi' },
  { code:'AE',name:'Uni Emirat Arab' },{ code:'QA',name:'Qatar' },{ code:'KW',name:'Kuwait' },
  { code:'BH',name:'Bahrain' },{ code:'OM',name:'Oman' },{ code:'YE',name:'Yaman' },
  { code:'IQ',name:'Irak' },{ code:'IR',name:'Iran' },{ code:'JO',name:'Yordania' },
  { code:'LB',name:'Lebanon' },{ code:'SY',name:'Suriah' },{ code:'IL',name:'Israel' },
  { code:'TR',name:'Turki' },{ code:'EG',name:'Mesir' },{ code:'ZA',name:'Afrika Selatan' },
  { code:'NG',name:'Nigeria' },{ code:'KE',name:'Kenya' },{ code:'ET',name:'Ethiopia' },
  { code:'GH',name:'Ghana' },{ code:'TZ',name:'Tanzania' },{ code:'UG',name:'Uganda' },
  { code:'MA',name:'Maroko' },{ code:'TN',name:'Tunisia' },{ code:'DZ',name:'Aljazair' },
  { code:'LY',name:'Libya' },{ code:'SD',name:'Sudan' },{ code:'MZ',name:'Mozambik' },
  { code:'MG',name:'Madagaskar' },{ code:'ZM',name:'Zambia' },{ code:'ZW',name:'Zimbabwe' },
  { code:'CM',name:'Kamerun' },{ code:'SN',name:'Senegal' },{ code:'CI',name:'Pantai Gading' },
];

const TITLE_OPTIONS = ['Tuan', 'Nyonya', 'Nona'];

// ─── Styles ────────────────────────────────────────────────────────────────
const INPUT_STYLE: React.CSSProperties = {
  width: '100%', minHeight: 44, border: `1px solid ${DS.n200}`, borderRadius: 8,
  background: DS.white, color: DS.dark, padding: '0 16px',
  fontFamily: 'Helvetica Neue', fontSize: 14, boxSizing: 'border-box', outline: 'none',
};
const INPUT_ERROR_STYLE: React.CSSProperties = { ...INPUT_STYLE, borderColor: DS.error, background: DS.errorBg };
const LABEL_STYLE: React.CSSProperties = { display: 'block', marginBottom: 6, color: DS.n700, fontFamily: 'Helvetica Neue', fontSize: 12, fontWeight: 500 };

function useBreakpoint() {
  const [w, setW] = useState(typeof window !== 'undefined' ? window.innerWidth : 1280);
  useEffect(() => {
    const fn = () => setW(window.innerWidth);
    window.addEventListener('resize', fn);
    return () => window.removeEventListener('resize', fn);
  }, []);
  return { isMobile: w < 768, isTablet: w >= 768 && w < 1024 };
}

const normalizePhone = (raw: string, countryIso = 'ID', dial = '+62') => {
  let digits = raw.replace(/\D/g, '');
  if (countryIso === 'ID') {
    digits = digits.replace(/^62/, '').replace(/^0+/, '');
  } else {
    const dialDigits = dial.replace(/\D/g, '');
    if (dialDigits && digits.startsWith(dialDigits)) digits = digits.slice(dialDigits.length);
    digits = digits.replace(/^0+/, '');
  }
  if (!digits) return '';
  if (countryIso === 'ID') {
    if (digits.startsWith('8')) return digits;
    const idx = digits.indexOf('8');
    return idx >= 0 ? digits.slice(idx) : '';
  }
  return digits;
};

const validateFullName = (value: string, label = 'Nama lengkap') => {
  const name = value.trim().replace(/\s+/g, ' ');
  if (!name) return 'Wajib diisi';
  if (name.length < 3 || name.length > 60) return 'Harus terdiri atas 3-60 karakter';
  if (/\d/.test(name)) return `${label} tidak boleh berisi angka`;
  if (!/^[\p{L}\s'.-]+$/u.test(name)) return `${label} hanya boleh berisi huruf, spasi, apostrof, titik, atau tanda hubung`;
  if (/[.'-]{2,}/.test(name)) return `${label} tidak boleh berisi tanda baca berulang`;
  return '';
};
const validatePhone = (value: string, countryIso: string, required = true) => {
  const phone = value.trim();
  if (!phone) return required ? 'Wajib diisi' : '';
  if (phone.length < 6 || phone.length > 15) return 'Nomor HP harus 6-15 digit';
  if (/^(\d)\1+$/.test(phone)) return 'Nomor HP tidak valid';
  if (countryIso === 'ID') {
    if (!phone.startsWith('8')) return 'Nomor HP Indonesia harus diawali 8';
    if (phone.length < 9 || phone.length > 13) return 'Nomor HP Indonesia harus 9-13 digit setelah 0/+62';
  }
  return '';
};
const validateEmail = (value: string) => {
  const email = value.trim();
  if (!email) return 'Wajib diisi';
  if (email.length > 254) return 'Email maksimal 254 karakter';
  if (/\s/.test(email)) return 'Email tidak boleh berisi spasi';
  if ((email.match(/@/g) || []).length !== 1) return 'Format email tidak valid';
  const [local, domain] = email.split('@');
  if (!local || !domain) return 'Format email tidak valid';
  if (local.length > 64) return 'Bagian sebelum @ maksimal 64 karakter';
  if (local.startsWith('.') || local.endsWith('.') || local.includes('..')) return 'Format email tidak valid';
  if (!/^[A-Za-z0-9.!#$%&'*+/=?^_`{|}~-]+$/.test(local)) return 'Format email tidak valid';
  if (domain.includes('..') || domain.startsWith('-') || domain.endsWith('-')) return 'Format domain email tidak valid';
  if (!/^[A-Za-z0-9-]+(\.[A-Za-z0-9-]+)+$/.test(domain)) return 'Format domain email tidak valid';
  const tld = domain.split('.').pop();
  if (!tld || !/^[A-Za-z]{2,}$/.test(tld)) return 'Domain email tidak valid';
  return '';
};
const validatePassport = (value: string) => {
  const v = value.trim();
  if (!v) return '';
  if (!/^[a-zA-Z0-9]+$/.test(v)) return 'Nomor paspor hanya boleh huruf dan angka';
  if (v.length < 6 || v.length > 20) return 'Nomor paspor harus 6-20 karakter';
  return '';
};
const validateExpiry = (value: string) => {
  if (!value) return '';
  const expiry = new Date(value);
  const sixMonths = new Date(); sixMonths.setMonth(sixMonths.getMonth() + 6);
  if (expiry < new Date()) return 'Paspor sudah kedaluwarsa';
  if (expiry < sixMonths) return 'Paspor harus berlaku minimal 6 bulan ke depan';
  return '';
};
const validateDob = (dob: string, type: string) => {
  if (!dob) return type === 'Dewasa' ? '' : 'Tanggal lahir wajib diisi';
  const birth = new Date(dob); const today = new Date();
  const ageMs = today.getTime() - birth.getTime();
  const ageYears = ageMs / (365.25 * 24 * 60 * 60 * 1000);
  const ageDays = ageMs / (24 * 60 * 60 * 1000);
  if (type === 'Bayi') {
    if (ageDays < 14) return 'Bayi minimal berusia 14 hari untuk terbang';
    if (ageYears >= 2) return 'Bayi harus berusia di bawah 2 tahun';
  } else if (type === 'Anak-Anak') {
    if (ageYears < 2) return 'Usia minimal anak-anak adalah 2 tahun';
    if (ageYears >= 12) return 'Usia maksimal anak-anak adalah 11 tahun';
  } else if (dob) {
    if (ageYears < 12) return 'Dewasa harus berusia minimal 12 tahun';
  }
  return '';
};

// ─── Sub-components ────────────────────────────────────────────────────────
function Field({ label, required, error, fieldId, children }: { label: string; required?: boolean; error?: string; fieldId?: string; children: React.ReactNode }) {
  return (
    <div id={fieldId} style={{ marginBottom: 14 }}>
      <label style={LABEL_STYLE}>{label}{required && <span style={{ color: DS.error }}> *</span>}</label>
      {children}
      {error && <div style={{ fontFamily: 'Helvetica Neue', fontSize: 11, color: DS.error, marginTop: 4 }}>{error}</div>}
    </div>
  );
}

function InputField({ icon, error, ...props }: { icon?: React.ReactNode; error?: string } & React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <div style={{ position: 'relative' }}>
      {icon && <div style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: DS.n400, pointerEvents: 'none' }}>{icon}</div>}
      <input style={{ ...(error ? INPUT_ERROR_STYLE : INPUT_STYLE), paddingLeft: icon ? 38 : 16 }} {...props} />
    </div>
  );
}

function Section({ title, children, collapsible = false }: { title: string; children: React.ReactNode; collapsible?: boolean }) {
  const [open, setOpen] = useState(true);
  return (
    <div style={{ background: DS.white, borderRadius: 14, border: `1px solid ${DS.n100}`, marginBottom: 14 }}>
      <div style={{ padding: '16px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: collapsible ? 'pointer' : 'default', borderBottom: open ? `1px solid ${DS.n100}` : 'none' }}
        onClick={() => collapsible && setOpen(o => !o)}>
        <div style={{ fontFamily: 'Helvetica Neue', fontWeight: 700, fontSize: 15, color: DS.dark }}>{title}</div>
        {collapsible && (open ? <ChevronUp size={18} color={DS.n400} /> : <ChevronDown size={18} color={DS.n400} />)}
      </div>
      {open && <div style={{ padding: '16px 20px' }}>{children}</div>}
    </div>
  );
}

function TitleSelect({ label, required, value, onChange, isMobile, onOpenSheet, disabled }: {
  label: string; required?: boolean; value: string;
  onChange: (e: React.ChangeEvent<HTMLSelectElement>) => void;
  isMobile: boolean; onOpenSheet: () => void; disabled?: boolean;
}) {
  if (isMobile) {
    return (
      <Field label={label} required={required}>
        <button type="button" onClick={onOpenSheet} disabled={disabled}
          style={{ width: '100%', minHeight: 44, border: `1px solid ${DS.n200}`, borderRadius: 8, background: DS.white, padding: '0 12px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontFamily: 'Helvetica Neue', fontSize: 14, color: DS.dark, cursor: 'pointer', boxSizing: 'border-box' }}>
          <span>{value}</span><ChevronDown size={16} color={DS.n400} />
        </button>
      </Field>
    );
  }
  return (
    <Field label={label} required={required}>
      <select value={value} onChange={onChange} disabled={disabled}
        style={{ ...INPUT_STYLE, appearance: 'none', backgroundImage: `url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='12' height='8'><path d='M0 0l6 8 6-8z' fill='%23666'/></svg>")`, backgroundPosition: 'right 14px center', backgroundRepeat: 'no-repeat', paddingRight: 36 }}>
        {TITLE_OPTIONS.map(o => <option key={o} value={o}>{o}</option>)}
      </select>
    </Field>
  );
}

function PhoneCountryInput({ label, required, value, countryIso, onCountryChange, onChange, error, fieldId }: {
  label: string; required?: boolean; value: string; countryIso: string;
  onCountryChange: (iso: string) => void; onChange: (val: string) => void; error?: string; fieldId?: string;
}) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const wrapRef = useRef<HTMLDivElement>(null);
  const isNarrow = typeof window !== 'undefined' && window.innerWidth < 1024;
  const selected = PHONE_COUNTRIES.find(c => c.iso === countryIso) || PHONE_COUNTRIES.find(c => c.iso === 'ID')!;
  const filtered = PHONE_COUNTRIES.filter(c => {
    const q = query.trim().toLowerCase();
    return !q || c.name.toLowerCase().includes(q) || c.dial.includes(q);
  });
  const visibleCountries = query.trim() ? filtered : [selected, ...filtered.filter(c => c.iso !== selected.iso)];

  useEffect(() => {
    if (!open || isNarrow) return;
    const h = (e: MouseEvent) => { if (!wrapRef.current?.contains(e.target as Node)) { setOpen(false); setQuery(''); } };
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, [open, isNarrow]);

  const countryList = (
    <div style={{ flex: 1, overflowY: 'auto' }}>
      {visibleCountries.map(c => (
        <button key={`${c.iso}-${c.dial}`} type="button"
          onClick={() => { onCountryChange(c.iso); setOpen(false); setQuery(''); }}
          style={{ width: '100%', padding: '14px 16px', border: 'none', borderBottom: `1px solid ${DS.n50}`, background: c.iso === selected.iso ? DS.accentLight : DS.white, display: 'flex', alignItems: 'center', gap: 12, cursor: 'pointer', textAlign: 'left' }}
          onMouseEnter={e => (e.currentTarget.style.background = DS.n50)}
          onMouseLeave={e => (e.currentTarget.style.background = c.iso === selected.iso ? DS.accentLight : DS.white)}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={`https://flagcdn.com/w40/${c.iso.toLowerCase()}.png`} alt="" style={{ width: 24, borderRadius: 2, flexShrink: 0 }} />
          <span style={{ fontFamily: 'Helvetica Neue', fontSize: 14, color: DS.dark, flex: 1 }}>{c.name}</span>
          <span style={{ fontFamily: 'Helvetica Neue', fontSize: 13, color: DS.n500 }}>{c.dial}</span>
        </button>
      ))}
    </div>
  );

  return (
    <div id={fieldId} ref={wrapRef} style={{ position: 'relative', marginBottom: 14 }}>
      <label style={LABEL_STYLE}>{label}{required && <span style={{ color: DS.error }}> *</span>}</label>
      <div style={{ position: 'relative', display: 'grid', gridTemplateColumns: 'auto 1fr', alignItems: 'center', minHeight: 44, border: `1px solid ${error ? DS.error : DS.n200}`, borderRadius: 8, background: error ? DS.errorBg : DS.white, overflow: 'visible', transition: 'border-color 150ms' }}>
        <button type="button" onClick={() => setOpen(v => !v)}
          style={{ minHeight: 42, display: 'inline-flex', alignItems: 'center', gap: 8, padding: '0 12px', border: 0, borderRight: `1px solid ${DS.n100}`, background: 'transparent', color: DS.dark, fontFamily: 'Helvetica Neue', fontSize: 13, cursor: 'pointer', flexShrink: 0 }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={`https://flagcdn.com/w40/${selected.iso.toLowerCase()}.png`} alt={selected.name} style={{ width: 22, height: 15, objectFit: 'cover', borderRadius: 2 }} />
          <span>{selected.dial}</span>
          <ChevronDown size={14} color={DS.n400} />
        </button>
        <input value={value}
          onChange={e => onChange(normalizePhone(e.target.value, selected.iso, selected.dial))}
          inputMode="tel" autoComplete="tel-national" placeholder="8XXXXXXXXXX" maxLength={15}
          style={{ width: '100%', minWidth: 0, minHeight: 42, border: 0, background: 'transparent', color: DS.dark, padding: '0 14px', fontFamily: 'Helvetica Neue', fontSize: 14, outline: 'none' }} />
        {open && typeof document !== 'undefined' && (isNarrow
          ? createPortal(
              <div style={{ position: 'fixed', inset: 0, zIndex: 9999, background: DS.white, display: 'flex', flexDirection: 'column' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 16px', borderBottom: `1px solid ${DS.n100}`, flexShrink: 0 }}>
                  <button type="button" onClick={() => { setOpen(false); setQuery(''); }}
                    style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4 }}>
                    <ChevronLeft size={22} color={DS.dark} />
                  </button>
                  <span style={{ fontFamily: 'Helvetica Neue', fontWeight: 700, fontSize: 17, color: DS.dark }}>Pilih Kode Negara</span>
                </div>
                <div style={{ padding: '12px 16px', borderBottom: `1px solid ${DS.n100}`, flexShrink: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: DS.n50, borderRadius: 10, padding: '10px 12px' }}>
                    <Search size={16} color={DS.n400} />
                    <input value={query} onChange={e => setQuery(e.target.value)} autoFocus placeholder="Cari negara atau kode"
                      style={{ flex: 1, border: 'none', background: 'none', fontFamily: 'Helvetica Neue', fontSize: 14, color: DS.dark, outline: 'none' }} />
                    {query && <button type="button" onClick={() => setQuery('')} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, fontSize: 18, color: DS.n400, lineHeight: 1 }}>×</button>}
                  </div>
                </div>
                {countryList}
              </div>, document.body)
          : <div style={{ position: 'absolute', top: 'calc(100% + 6px)', left: 0, right: 0, zIndex: 220, border: `1px solid ${DS.n100}`, borderRadius: 10, background: DS.white, boxShadow: '0 10px 30px rgba(15,23,42,0.12)', overflow: 'hidden' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 12px', borderBottom: `1px solid ${DS.n100}`, color: DS.n400 }}>
                <Search size={15} />
                <input value={query} onChange={e => setQuery(e.target.value)} placeholder="Cari negara atau kode" autoFocus
                  style={{ width: '100%', minWidth: 0, border: 0, outline: 0, color: DS.dark, fontFamily: 'Helvetica Neue', fontSize: 13, background: 'none' }} />
              </div>
              <div style={{ maxHeight: 250, overflowY: 'auto', padding: 6 }}>
                {visibleCountries.map(c => (
                  <button key={`${c.iso}-${c.dial}`} type="button"
                    onClick={() => { onCountryChange(c.iso); setOpen(false); setQuery(''); }}
                    style={{ width: '100%', minHeight: 42, display: 'flex', alignItems: 'center', gap: 12, border: 0, borderRadius: 8, background: c.iso === selected.iso ? DS.accentLight : 'transparent', color: DS.dark, padding: '8px 10px', fontFamily: 'Helvetica Neue', fontSize: 14, textAlign: 'left', cursor: 'pointer' }}
                    onMouseEnter={e => (e.currentTarget.style.background = DS.accentLight)}
                    onMouseLeave={e => (e.currentTarget.style.background = c.iso === selected.iso ? DS.accentLight : 'transparent')}>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={`https://flagcdn.com/w40/${c.iso.toLowerCase()}.png`} alt="" style={{ width: 22, height: 15, objectFit: 'cover', borderRadius: 2, flexShrink: 0 }} />
                    <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{c.name} ({c.dial})</span>
                  </button>
                ))}
              </div>
            </div>
        )}
      </div>
      {error && <div style={{ fontFamily: 'Helvetica Neue', fontSize: 11, color: DS.error, marginTop: 4 }}>{error}</div>}
    </div>
  );
}

function BookingDatePicker({ value, onChange, placeholder, pastOnly = false, initialYear }: {
  value: string; onChange: (v: string) => void; placeholder?: string; pastOnly?: boolean; initialYear?: number;
}) {
  const [open, setOpen] = useState(false);
  const [pos, setPos] = useState({ top: 0, left: 0 });
  const triggerRef = useRef<HTMLDivElement>(null);
  const months = ['Jan','Feb','Mar','Apr','Mei','Jun','Jul','Agu','Sep','Okt','Nov','Des'];
  const today = new Date();
  const isNarrow = typeof window !== 'undefined' && window.innerWidth < 1024;
  const [yearPickerOpen, setYearPickerOpen] = useState(false);
  const [yearRangeStart, setYearRangeStart] = useState(Math.floor((initialYear || today.getFullYear()) / 12) * 12);

  const valDate = value ? new Date(value) : null;
  const [displayMonth, setDisplayMonth] = useState(valDate ? valDate.getMonth() : today.getMonth());
  const [displayYear, setDisplayYear] = useState(valDate ? valDate.getFullYear() : (initialYear || today.getFullYear()));

  useEffect(() => {
    if (valDate) { setDisplayMonth(valDate.getMonth()); setDisplayYear(valDate.getFullYear()); }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);

  const daysInMonth = new Date(displayYear, displayMonth + 1, 0).getDate();
  const firstDay = new Date(displayYear, displayMonth, 1).getDay();
  const days: (number | null)[] = [];
  for (let i = 0; i < firstDay; i++) days.push(null);
  for (let i = 1; i <= daysInMonth; i++) days.push(i);

  const handleOpen = () => {
    if (triggerRef.current) {
      const rect = triggerRef.current.getBoundingClientRect();
      setPos({ top: rect.bottom + window.scrollY + 8, left: rect.left + window.scrollX });
    }
    setOpen(true);
  };

  useEffect(() => {
    if (!open || isNarrow) return;
    const h = (e: MouseEvent) => {
      if (triggerRef.current && !triggerRef.current.contains(e.target as Node)) {
        const portal = document.getElementById('booking-datepicker-portal');
        if (portal?.contains(e.target as Node)) return;
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, [open, isNarrow]);

  const handleDayClick = (day: number | null) => {
    if (!day) return;
    const m = String(displayMonth + 1).padStart(2, '0');
    const d = String(day).padStart(2, '0');
    onChange(`${displayYear}-${m}-${d}`);
    setOpen(false);
  };

  const isSelected = (day: number | null) => !day || !valDate ? false
    : valDate.getDate() === day && valDate.getMonth() === displayMonth && valDate.getFullYear() === displayYear;
  const isDisabled = (day: number | null) => {
    if (!day) return true;
    const d = new Date(displayYear, displayMonth, day);
    const t = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    return pastOnly ? d > t : d < t;
  };
  const fmt = (d: string) => d ? new Date(d).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' }) : '';

  const calendarBody = (
    <>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
        <button onClick={() => { if (displayMonth===0){setDisplayMonth(11);setDisplayYear(y=>y-1);}else setDisplayMonth(m=>m-1); }}
          style={{ background:'none',border:'none',cursor:'pointer',width:28,height:28,borderRadius:6,color:DS.n600,fontSize:16,display:'flex',alignItems:'center',justifyContent:'center' }}>‹</button>
        <button onClick={() => { setYearPickerOpen(v=>!v); setYearRangeStart(Math.floor(displayYear/12)*12); }}
          style={{ background:'none',border:'none',cursor:'pointer',fontFamily:'Helvetica Neue',fontWeight:700,fontSize:14,color:DS.dark,padding:'2px 8px',borderRadius:6,display:'flex',alignItems:'center',gap:8 }}>
          {months[displayMonth]} {displayYear}
          <svg width="10" height="6" viewBox="0 0 10 6" fill="none" style={{ marginLeft:2, flexShrink:0 }}>
            <path d={yearPickerOpen ? 'M1 5l4-4 4 4' : 'M1 1l4 4 4-4'} stroke={DS.n500} strokeWidth="1.5" strokeLinecap="round"/>
          </svg>
        </button>
        <button onClick={() => { if (displayMonth===11){setDisplayMonth(0);setDisplayYear(y=>y+1);}else setDisplayMonth(m=>m+1); }}
          style={{ background:'none',border:'none',cursor:'pointer',width:28,height:28,borderRadius:6,color:DS.n600,fontSize:16,display:'flex',alignItems:'center',justifyContent:'center' }}>›</button>
      </div>
      {yearPickerOpen ? (
        <>
          <div style={{ display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:8 }}>
            <button onClick={() => setYearRangeStart(s=>s-12)} style={{ background:'none',border:'none',cursor:'pointer',width:28,height:28,borderRadius:6,color:DS.n600,fontSize:16,display:'flex',alignItems:'center',justifyContent:'center' }}>‹</button>
            <span style={{ fontFamily:'Helvetica Neue',fontSize:12,color:DS.n500 }}>{yearRangeStart} – {yearRangeStart+11}</span>
            <button onClick={() => setYearRangeStart(s=>s+12)} style={{ background:'none',border:'none',cursor:'pointer',width:28,height:28,borderRadius:6,color:DS.n600,fontSize:16,display:'flex',alignItems:'center',justifyContent:'center' }}>›</button>
          </div>
          <div style={{ display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:6,marginBottom:4 }}>
            {Array.from({length:12},(_,i)=>yearRangeStart+i).map(y => (
              <button key={y} onClick={() => { setDisplayYear(y); setYearPickerOpen(false); }}
                style={{ height:34,borderRadius:8,border:'none',cursor:'pointer',fontFamily:'Helvetica Neue',fontSize:13,fontWeight:y===displayYear?700:400,background:y===displayYear?DS.accent:'none',color:y===displayYear?DS.white:y===today.getFullYear()?DS.primary:DS.dark }}
                onMouseEnter={e=>{ if(y!==displayYear) e.currentTarget.style.background=DS.n50; }}
                onMouseLeave={e=>{ if(y!==displayYear) e.currentTarget.style.background='none'; }}>{y}</button>
            ))}
          </div>
        </>
      ) : (
        <>
          <div style={{ display:'grid',gridTemplateColumns:'repeat(7,1fr)',gap:2,marginBottom:6 }}>
            {['Min','Sen','Sel','Rab','Kam','Jum','Sab'].map(d => (<div key={d} style={{ textAlign:'center',fontSize:11,color:DS.n400,fontFamily:'Helvetica Neue',fontWeight:700 }}>{d}</div>))}
          </div>
          <div style={{ display:'grid',gridTemplateColumns:'repeat(7,1fr)',gap:2 }}>
            {days.map((day, i) => (
              <button key={i} onClick={() => handleDayClick(day)} disabled={!day || isDisabled(day)}
                style={{ height:34,borderRadius:8,border:'none',cursor:day&&!isDisabled(day)?'pointer':'default',background:isSelected(day)?DS.accent:'none',color:!day?'transparent':isDisabled(day)?DS.n200:isSelected(day)?DS.white:DS.dark,fontFamily:'Helvetica Neue',fontSize:13,fontWeight:isSelected(day)?700:500 }}
                onMouseEnter={e=>{ if(day&&!isDisabled(day)&&!isSelected(day)) e.currentTarget.style.background=DS.n50; }}
                onMouseLeave={e=>{ if(!isSelected(day)) e.currentTarget.style.background='none'; }}>{day||''}</button>
            ))}
          </div>
        </>
      )}
    </>
  );

  const calendar = open && typeof document !== 'undefined' ? createPortal(
    isNarrow ? (
      <>
        <div onMouseDown={() => setOpen(false)} style={{ position:'fixed',inset:0,background:'rgba(0,0,0,0.4)',zIndex:9998 }} />
        <div onMouseDown={e=>e.stopPropagation()} style={{ position:'fixed',bottom:0,left:0,right:0,zIndex:9999,background:DS.white,borderRadius:'16px 16px 0 0',padding:'20px 20px 32px' }}>
          <div style={{ width:40,height:4,borderRadius:2,background:DS.n200,margin:'0 auto 16px' }} />
          <div style={{ fontFamily:'Helvetica Neue',fontWeight:700,fontSize:16,color:DS.dark,marginBottom:16 }}>{placeholder || 'Pilih Tanggal'}</div>
          {calendarBody}
        </div>
      </>
    ) : (
      <div id="booking-datepicker-portal" onClick={e=>e.stopPropagation()} style={{ position:'absolute',top:pos.top,left:pos.left,zIndex:9999,background:DS.white,borderRadius:12,padding:16,boxShadow:'0 12px 40px rgba(0,0,0,0.15)',border:`1px solid ${DS.n100}`,minWidth:290 }}>
        {calendarBody}
      </div>
    ), document.body
  ) : null;

  return (
    <div ref={triggerRef} onClick={handleOpen}
      style={{ ...INPUT_STYLE, display:'flex',alignItems:'center',cursor:'pointer',color:value?DS.dark:DS.n400 }}>
      {value ? fmt(value) : placeholder}
      <div style={{ marginLeft:'auto',color:DS.n400 }}>📅</div>
      {calendar}
    </div>
  );
}

function CountrySelect({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [w, setW] = useState(typeof window !== 'undefined' ? window.innerWidth : 1280);
  useEffect(() => { const fn = () => setW(window.innerWidth); window.addEventListener('resize', fn); return () => window.removeEventListener('resize', fn); }, []);
  const isNarrow = w < 1024;
  const selected = ALL_COUNTRIES.find(c => c.name === value) || ALL_COUNTRIES[0];
  const filtered = query.trim() ? ALL_COUNTRIES.filter(c => c.name.toLowerCase().includes(query.toLowerCase())) : ALL_COUNTRIES;

  useEffect(() => {
    if (!open || isNarrow) return;
    const h = (e: MouseEvent) => { if (containerRef.current && !containerRef.current.contains(e.target as Node)) { setOpen(false); setQuery(''); } };
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, [open, isNarrow]);

  useEffect(() => { if (open) setTimeout(() => inputRef.current?.focus(), 80); }, [open]);

  const handleSelect = (c: { code: string; name: string }) => { onChange(c.name); setOpen(false); setQuery(''); };

  const countryListItems = (
    <div style={{ flex: 1, overflowY: 'auto' }}>
      {filtered.length === 0 && <div style={{ padding: 24, textAlign: 'center', color: DS.n400, fontSize: 13, fontFamily: 'Helvetica Neue' }}>Negara tidak ditemukan</div>}
      {filtered.map(c => (
        <div key={c.code} onClick={() => handleSelect(c)}
          style={{ padding: '13px 20px', display: 'flex', alignItems: 'center', gap: 12, cursor: 'pointer', borderBottom: `1px solid ${DS.n50}`, background: c.name === value ? DS.accentLight : 'none' }}
          onMouseEnter={e => (e.currentTarget.style.background = DS.n50)}
          onMouseLeave={e => (e.currentTarget.style.background = c.name === value ? DS.accentLight : 'none')}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={`https://flagcdn.com/w20/${c.code.toLowerCase()}.png`} width="20" alt={c.name} style={{ borderRadius: 2, flexShrink: 0 }} />
          <span style={{ fontSize: 14, color: DS.dark, fontFamily: 'Helvetica Neue', flex: 1 }}>{c.name}</span>
          {c.name === value && <span style={{ color: DS.primary, fontSize: 16, fontWeight: 700 }}>✓</span>}
        </div>
      ))}
    </div>
  );

  return (
    <div ref={containerRef} style={{ position: 'relative' }}>
      <div onClick={() => { setOpen(true); setQuery(''); }}
        style={{ ...INPUT_STYLE, display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer' }}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={`https://flagcdn.com/w20/${selected.code.toLowerCase()}.png`} width="20" alt={selected.name} style={{ borderRadius: 2, flexShrink: 0 }} />
        <span style={{ color: DS.dark, flex: 1 }}>{selected.name}</span>
        <ChevronDown size={16} color={DS.n400} />
      </div>
      {open && isNarrow && typeof document !== 'undefined' && createPortal(
        <div style={{ position: 'fixed', inset: 0, zIndex: 9999, background: DS.white, display: 'flex', flexDirection: 'column' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '14px 16px', borderBottom: `1px solid ${DS.n100}`, flexShrink: 0 }}>
            <button onClick={() => { setOpen(false); setQuery(''); }} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4 }}>
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none"><path d="M19 12H5M12 5l-7 7 7 7" stroke={DS.dark} strokeWidth="2" strokeLinecap="round"/></svg>
            </button>
            <span style={{ fontFamily: 'Helvetica Neue', fontWeight: 700, fontSize: 16, color: DS.dark }}>Pilih Negara/Wilayah</span>
          </div>
          <div style={{ padding: '12px 16px', borderBottom: `1px solid ${DS.n100}`, flexShrink: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, background: DS.n50, borderRadius: 10, padding: '10px 14px' }}>
              <Search size={16} color={DS.n400} />
              <input ref={inputRef} value={query} onChange={e => setQuery(e.target.value)} placeholder="Cari negara..."
                style={{ flex: 1, border: 'none', background: 'none', fontFamily: 'Helvetica Neue', fontSize: 14, color: DS.dark, outline: 'none' }} />
              {query && <button onClick={() => setQuery('')} style={{ background: 'none', border: 'none', cursor: 'pointer', color: DS.n400, fontSize: 18, lineHeight: 1, padding: 0 }}>×</button>}
            </div>
          </div>
          {countryListItems}
        </div>, document.body
      )}
      {open && !isNarrow && (
        <div style={{ position: 'absolute', top: '100%', left: 0, right: 0, marginTop: 4, background: '#fff', border: `1px solid ${DS.n100}`, borderRadius: 10, boxShadow: '0 8px 24px rgba(0,0,0,0.12)', zIndex: 200, display: 'flex', flexDirection: 'column' }}>
          <div style={{ padding: '10px 12px', borderBottom: `1px solid ${DS.n100}` }}>
            <input ref={inputRef} value={query} onChange={e => setQuery(e.target.value)} placeholder="Cari negara..."
              style={{ width: '100%', border: `1px solid ${DS.n100}`, borderRadius: 8, padding: '8px 12px', fontFamily: 'Helvetica Neue', fontSize: 13, color: DS.dark, outline: 'none', boxSizing: 'border-box' }} />
          </div>
          <div style={{ maxHeight: 220, overflowY: 'auto' }}>
            {filtered.length === 0 && <div style={{ padding: 14, textAlign: 'center', color: DS.n400, fontSize: 13, fontFamily: 'Helvetica Neue' }}>Negara tidak ditemukan</div>}
            {filtered.map(c => (
              <div key={c.code} onClick={() => handleSelect(c)}
                style={{ padding: '10px 14px', display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer', borderBottom: `1px solid ${DS.n50}`, background: c.name === value ? DS.accentLight : 'none', transition: 'background 0.1s' }}
                onMouseEnter={e => (e.currentTarget.style.background = DS.n50)}
                onMouseLeave={e => (e.currentTarget.style.background = c.name === value ? DS.accentLight : 'none')}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={`https://flagcdn.com/w20/${c.code.toLowerCase()}.png`} width="20" alt={c.name} style={{ borderRadius: 2, flexShrink: 0 }} />
                <span style={{ fontSize: 13, color: DS.dark }}>{c.name}</span>
                {c.name === value && <span style={{ marginLeft: 'auto', color: DS.primary, fontSize: 14 }}>✓</span>}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Main component ────────────────────────────────────────────────────────
export default function FlightBookingPage({ flight, returnFlight, fareData, searchParams, onConfirm, onBack }: {
  flight: FlightType;
  returnFlight?: FlightType | null;
  fareData: FareType;
  searchParams: SearchParams;
  onConfirm: (data: unknown) => void;
  onBack: () => void;
}) {
  const { isMobile, isTablet } = useBreakpoint();
  const fmt = (p: number) => 'Rp ' + p.toLocaleString('id-ID');

  const [contact, setContact] = useState({ salutation: 'Tuan', name: '', phone: '', phoneCountry: 'ID', email: '' });
  const [titleSheet, setTitleSheet] = useState<string | null>(null);

  const buildPassengers = (): PassengerState[] => {
    const list: PassengerState[] = [];
    const adults = searchParams?.adults || 1;
    const children = searchParams?.children || 0;
    const infants = searchParams?.infants || 0;
    for (let i = 0; i < adults;   i++) list.push({ id: list.length, type:'Dewasa',    salutation:'Tuan', name:'', sameAsContact:false, dob:'', passport:'', expiry:'', country:'Indonesia' });
    for (let i = 0; i < children; i++) list.push({ id: list.length, type:'Anak-Anak', salutation:'Tuan', name:'', sameAsContact:false, dob:'', passport:'', expiry:'', country:'Indonesia' });
    for (let i = 0; i < infants;  i++) list.push({ id: list.length, type:'Bayi',      salutation:'',     name:'', sameAsContact:false, dob:'', passport:'', expiry:'', country:'Indonesia', companionIdx:0 });
    return list;
  };
  const [passengers, setPassengers] = useState<PassengerState[]>(buildPassengers);

  const updatePassenger = (idx: number, field: string, val: unknown) =>
    setPassengers(prev => { const n = [...prev]; n[idx] = { ...n[idx], [field]: val }; return n; });

  const [selectedProtections, setSelectedProtections] = useState<string[]>([]);
  const [selectedBaggage, setSelectedBaggage] = useState(BAGGAGE_OPTIONS[0]);
  const [selectedReturnBaggage, setSelectedReturnBaggage] = useState(BAGGAGE_OPTIONS[0]);
  const [activeBaggageLeg, setActiveBaggageLeg] = useState<'outbound' | 'return'>('outbound');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [showSummarySheet, setShowSummarySheet] = useState(false);
  const [openOutbound, setOpenOutbound] = useState(false);
  const [openReturn, setOpenReturn] = useState(false);
  const [companionSheet, setCompanionSheet] = useState<number | null>(null);

  const isRoundTrip = searchParams?.tripType === 'roundtrip';
  const isDomestic = ID_AIRPORTS.has(searchParams?.from || '') && ID_AIRPORTS.has(searchParams?.to || '');
  const paxCount = (searchParams?.adults || 1) + (searchParams?.children || 0) + (searchParams?.infants || 0);
  const basePrice = ((flight?.price || 800000) - (flight?.cashback || 0) + (fareData?.price || 120000)) * paxCount;
  const baggageTotal = selectedBaggage.price + (isRoundTrip ? selectedReturnBaggage.price : 0);
  const protectionTotal = selectedProtections.reduce((s, id) => s + (PROTECTIONS.find(p => p.id === id)?.price || 0), 0);
  const subtotal = basePrice + baggageTotal + protectionTotal;
  const tax = Math.round(subtotal * 0.11);
  const serviceFee = Math.round(subtotal * 0.05);
  const total = subtotal + tax + serviceFee;

  const terminals = flight?.terminal?.split(' -> ') || ['', ''];
  const retTerminals = returnFlight?.terminal?.split(' -> ') || ['', ''];
  const fmtDepDate = flight?.depDate ? new Date(flight.depDate).toLocaleDateString('id-ID', { weekday:'short', day:'numeric', month:'short' }) : '';
  const fmtRetDate = returnFlight?.depDate ? new Date(returnFlight.depDate).toLocaleDateString('id-ID', { weekday:'short', day:'numeric', month:'short' }) : '';
  const baggageLabel = (() => {
    if (!isRoundTrip) return selectedBaggage.kg > 0 ? `Bagasi ekstra +${selectedBaggage.kg}kg` : null;
    const o = selectedBaggage.kg, r = selectedReturnBaggage.kg;
    if (o > 0 && r > 0) return `Bagasi ekstra Pergi +${o}kg & Pulang +${r}kg`;
    if (o > 0) return `Bagasi ekstra Pergi +${o}kg`;
    if (r > 0) return `Bagasi ekstra Pulang +${r}kg`;
    return null;
  })();

  useEffect(() => {
    setPassengers(prev => prev.map(p =>
      p.sameAsContact && p.type === 'Dewasa' ? { ...p, name: contact.name, salutation: contact.salutation } : p
    ));
  }, [contact.name, contact.salutation]);

  useEffect(() => {
    if (!isMobile && !isTablet) {
      setShowSummarySheet(false);
      setTitleSheet(null);
      setCompanionSheet(null);
    }
  }, [isMobile, isTablet]);

  const validate = () => {
    const e: Record<string, string> = {};
    const nameErr  = validateFullName(contact.name, 'Nama lengkap');
    const phoneErr = validatePhone(contact.phone, contact.phoneCountry);
    const emailErr = validateEmail(contact.email);
    if (nameErr)  e.contactName  = nameErr;
    if (phoneErr) e.contactPhone = phoneErr;
    if (emailErr) e.contactEmail = emailErr;
    passengers.forEach((pax, idx) => {
      if (!pax.sameAsContact) {
        const paxNameErr = validateFullName(pax.name, 'Nama penumpang');
        if (paxNameErr) e[`paxName_${idx}`] = paxNameErr;
      }
      const dobErr = validateDob(pax.dob, pax.type);
      if (dobErr) e[`dob_${idx}`] = dobErr;
      if (!isDomestic) {
        const passportErr = validatePassport(pax.passport || '');
        const expiryErr   = validateExpiry(pax.expiry);
        if (passportErr) e[`passport_${idx}`] = passportErr;
        if (expiryErr)   e[`expiry_${idx}`]   = expiryErr;
      }
    });
    return e;
  };

  const handleSubmit = () => {
    const e = validate();
    if (Object.keys(e).length > 0) {
      setErrors(e);
      const order = [
        'contactName', 'contactPhone', 'contactEmail',
        ...passengers.flatMap((_, i) => [`paxName_${i}`, `dob_${i}`, `passport_${i}`, `expiry_${i}`]),
      ];
      const firstKey = order.find(k => e[k]);
      if (firstKey) {
        requestAnimationFrame(() => {
          document.getElementById(`field-${firstKey}`)?.scrollIntoView({ behavior: 'smooth', block: 'center' });
        });
      }
      return;
    }
    const dialCode = PHONE_COUNTRIES.find(c => c.iso === contact.phoneCountry)?.dial || '+62';
    onConfirm({
      flight, fare: fareData,
      returnFlight: isRoundTrip ? returnFlight : null,
      searchParams,
      contact: { ...contact, phone: `${dialCode} ${contact.phone}` },
      passengers, protections: selectedProtections,
      baggage: isRoundTrip ? { outbound: selectedBaggage, return: selectedReturnBaggage } : selectedBaggage,
      promo: null, total, promoDisc: 0,
      basePrice, baggageTotal, protectionTotal, tax, serviceFee, paxCount,
    });
  };

  // Horizontal card — desktop sidebar
  const renderFlightCard = (
    f: FlightType, termsArr: string[], fmtDate: string, depCity: string, arrCity: string,
    label: string | null, open: boolean, onToggle: () => void
  ) => (
    <div>
      <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:10 }}>
        {label && (
          <span style={{ fontFamily:'Helvetica Neue', fontWeight:700, fontSize:11, color:'#fff', background:DS.primary, borderRadius:99, padding:'3px 10px', flexShrink:0 }}>
            {label === 'Penerbangan Pergi' ? 'Pergi' : 'Pulang'}
          </span>
        )}
        <span style={{ fontFamily:'Helvetica Neue', fontWeight:700, fontSize:14, color:DS.dark, flex:1 }}>{fmtDate}</span>
        <button onClick={onToggle} style={{ background:'none', border:'none', cursor:'pointer', padding:0, display:'flex', alignItems:'center', color:DS.n600 }}>
          {open ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
        </button>
      </div>
      <div style={{ border:`1px solid ${DS.n200}`, borderRadius:10, padding:'12px 14px' }}>
        <div style={{ display:'flex', alignItems:'center', gap:10 }}>
          {f?.logo
            ? <img src={f.logo} alt={f.airline} style={{ width:32, height:32, borderRadius:6, objectFit:'contain', border:`1px solid ${DS.n100}`, padding:3, background:DS.white, flexShrink:0 }} />
            : <div style={{ width:32, height:32, borderRadius:6, background:DS.n50, border:`1px solid ${DS.n100}`, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}><Plane size={15} color={DS.n500} style={{ transform:'rotate(90deg)' }} /></div>
          }
          <div style={{ textAlign:'left' }}>
            <div style={{ fontFamily:'Helvetica Neue', fontWeight:800, fontSize:20, color:DS.dark, lineHeight:1 }}>{f?.dep || '--:--'}</div>
            <div style={{ fontFamily:'Helvetica Neue', fontWeight:700, fontSize:12, color:DS.n700, marginTop:3 }}>{AIRPORT_NAMES[f?.depCode] || f?.depCode || '---'}</div>
          </div>
          <div style={{ flex:1, display:'flex', flexDirection:'column', alignItems:'center', gap:2 }}>
            <div style={{ fontFamily:'Helvetica Neue', fontSize:11, color:DS.n600, fontWeight:500 }}>{f?.duration || ''}</div>
            <div style={{ display:'flex', alignItems:'center', width:'100%' }}>
              <div style={{ flex:1, height:1, background:DS.n300 }} />
              <Plane size={12} color={DS.primary} style={{ margin:'0 3px', flexShrink:0, transform:'rotate(90deg)' }} />
              <div style={{ flex:1, height:1, background:DS.n300 }} />
            </div>
            <div style={{ fontFamily:'Helvetica Neue', fontSize:11, color: f?.direct ? DS.successText : DS.dark, fontWeight:600 }}>
              {f?.direct ? 'Langsung' : '1 Transit'}
            </div>
          </div>
          <div style={{ textAlign:'right' }}>
            <div style={{ fontFamily:'Helvetica Neue', fontWeight:800, fontSize:20, color:DS.dark, lineHeight:1 }}>{f?.arr || '--:--'}</div>
            <div style={{ fontFamily:'Helvetica Neue', fontWeight:700, fontSize:12, color:DS.n700, marginTop:3 }}>{AIRPORT_NAMES[f?.arrCode] || f?.arrCode || '---'}</div>
          </div>
        </div>
        {open && (
          <div style={{ marginTop:10, paddingTop:10, borderTop:`1px dashed ${DS.n200}` }}>
            <div style={{ fontFamily:'Helvetica Neue', fontSize:12, color:DS.n700, marginBottom:6 }}>
              {f?.airline} · {f?.flightNo} · {fareData?.name || 'Ekonomi'}
            </div>
            {(termsArr[0] || termsArr[1]) && (
              <div style={{ fontFamily:'Helvetica Neue', fontSize:12, color:DS.n600 }}>
                {depCity}{termsArr[0] ? ` (T${termsArr[0]})` : ''} → {arrCity}{termsArr[1] ? ` (${termsArr[1]})` : ''}
              </div>
            )}
          </div>
        )}
      </div>
      {(f?.refundable || f?.reschedule) && (
        <div style={{ display:'flex', alignItems:'center', gap:6, marginTop:8, flexWrap:'wrap' }}>
          {f.refundable && <span style={{ fontFamily:'Helvetica Neue', fontSize:12, color:DS.successText, fontWeight:500 }}>Bisa Refund</span>}
          {f.refundable && f.reschedule && <span style={{ color:DS.n400, fontSize:12 }}>·</span>}
          {f.reschedule && <span style={{ fontFamily:'Helvetica Neue', fontSize:12, color:DS.successText, fontWeight:500 }}>Bisa Reschedule</span>}
        </div>
      )}
    </div>
  );

  // Vertical itinerary strip — all breakpoints
  const renderFlightStrip = (
    f: FlightType, termsArr: string[], fmtDate: string, label: string | null,
    open: boolean, onToggle: () => void
  ) => (
    <div style={{ background: DS.white, borderRadius: 12, overflow: 'hidden', border:`1px solid ${DS.n100}` }}>
      {/* Header: badge + airline + date + toggle */}
      <div
        onClick={onToggle}
        style={{ padding: '12px 14px 10px', borderBottom: open ? `1px solid ${DS.n100}` : 'none', display: 'flex', alignItems: 'center', gap: 8, cursor:'pointer', userSelect:'none' }}>
        {label && (
          <span style={{ fontFamily:'Helvetica Neue', fontWeight:700, fontSize:11, color:'#fff', background:DS.primary, borderRadius:99, padding:'3px 10px', flexShrink:0 }}>
            {label === 'Penerbangan Pergi' ? 'Pergi' : 'Pulang'}
          </span>
        )}
        {f?.logo && (
          <img src={f.logo} alt={f.airline} style={{ width:22, height:22, borderRadius:4, objectFit:'contain', background:DS.white, padding:2, border:`1px solid ${DS.n100}`, flexShrink:0 }} />
        )}
        <div style={{ flex:1, minWidth:0 }}>
          <div style={{ fontFamily:'Helvetica Neue', fontWeight:700, fontSize:12, color:DS.dark, whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>
            {f?.airline} · {f?.flightNo}
          </div>
          <div style={{ fontFamily:'Helvetica Neue', fontSize:11, color:DS.n500 }}>{fmtDate}</div>
        </div>
        <div style={{ display:'flex', alignItems:'center', gap:6, flexShrink:0 }}>
          <span style={{ fontFamily:'Helvetica Neue', fontWeight:700, fontSize:10, color:DS.accent, background:DS.accentLight, borderRadius:99, padding:'3px 9px', textTransform:'uppercase', letterSpacing:'0.04em', border:`1px solid ${DS.accent}22` }}>{fareData?.name || 'Value'}</span>
          {open ? <ChevronUp size={14} color={DS.n500} /> : <ChevronDown size={14} color={DS.n500} />}
        </div>
      </div>

      {/* Vertical timeline — collapsible */}
      {open && (
        <div style={{ padding: '14px 16px', display:'flex', gap:12 }}>
          {/* Timeline rail */}
          <div style={{ display:'flex', flexDirection:'column', alignItems:'center', paddingTop:3 }}>
            <div style={{ width:10, height:10, borderRadius:'50%', background:DS.primary, border:`2px solid ${DS.white}`, boxShadow:`0 0 0 2px ${DS.primary}`, flexShrink:0 }} />
            <div style={{ width:2, flex:1, minHeight:32, background:`linear-gradient(to bottom, ${DS.primary}, ${DS.n300})`, borderRadius:1, margin:'4px 0' }} />
            <div style={{ width:10, height:10, borderRadius:'50%', background:DS.n400, border:`2px solid ${DS.white}`, boxShadow:`0 0 0 2px ${DS.n400}`, flexShrink:0 }} />
          </div>

          {/* Info column */}
          <div style={{ flex:1, display:'flex', flexDirection:'column', justifyContent:'space-between', minWidth:0 }}>
            {/* Departure */}
            <div>
              <div style={{ display:'flex', alignItems:'baseline', gap:8 }}>
                <span style={{ fontFamily:'Helvetica Neue', fontWeight:800, fontSize:22, color:DS.dark, lineHeight:1 }}>{f?.dep || '--:--'}</span>
                <span style={{ fontFamily:'Helvetica Neue', fontSize:11, color:DS.n500 }}>{f?.depCode}</span>
              </div>
              <div style={{ fontFamily:'Helvetica Neue', fontSize:12, color:DS.n600, marginTop:1 }}>{AIRPORT_NAMES[f?.depCode] || ''}</div>
            </div>

            {/* Duration + status */}
            <div style={{ display:'flex', alignItems:'center', gap:6, padding:'8px 0' }}>
              <div style={{ display:'flex', alignItems:'center', gap:4 }}>
                <Plane size={11} color={DS.primary} style={{ transform:'rotate(90deg)' }} />
                <span style={{ fontFamily:'Helvetica Neue', fontSize:11, color:DS.n500 }}>{f?.duration}</span>
              </div>
              <span style={{ color:DS.n300, fontSize:11 }}>·</span>
              <span style={{ fontFamily:'Helvetica Neue', fontSize:11, fontWeight:600, color: f?.direct ? DS.successText : DS.dark }}>
                {f?.direct ? 'Langsung' : '1 Transit'}
              </span>
              {termsArr[0] && <span style={{ fontFamily:'Helvetica Neue', fontSize:11, color:DS.n400 }}>· T{termsArr[0]}</span>}
            </div>

            {/* Arrival */}
            <div>
              <div style={{ display:'flex', alignItems:'baseline', gap:8 }}>
                <span style={{ fontFamily:'Helvetica Neue', fontWeight:800, fontSize:22, color:DS.dark, lineHeight:1 }}>{f?.arr || '--:--'}</span>
                <span style={{ fontFamily:'Helvetica Neue', fontSize:11, color:DS.n500 }}>{f?.arrCode}</span>
              </div>
              <div style={{ fontFamily:'Helvetica Neue', fontSize:12, color:DS.n600, marginTop:1 }}>{AIRPORT_NAMES[f?.arrCode] || ''}</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );

  const summaryContent = (
    <div>
      <div style={{ display:'flex', flexDirection:'column', gap:10, marginBottom:14 }}>
        {renderFlightStrip(flight, terminals, fmtDepDate, isRoundTrip ? 'Penerbangan Pergi' : null, openOutbound, () => setOpenOutbound(o=>!o))}
        {isRoundTrip && returnFlight && renderFlightStrip(returnFlight, retTerminals, fmtRetDate, 'Penerbangan Pulang', openReturn, () => setOpenReturn(o=>!o))}
      </div>
    </div>
  );

  const summarySheetContent = (
    <div>
      <div style={{ display:'flex', flexDirection:'column', gap:10, marginBottom:14 }}>
        {renderFlightStrip(flight, terminals, fmtDepDate, isRoundTrip ? 'Penerbangan Pergi' : null, openOutbound, () => setOpenOutbound(o=>!o))}
        {isRoundTrip && returnFlight && renderFlightStrip(returnFlight, retTerminals, fmtRetDate, 'Penerbangan Pulang', openReturn, () => setOpenReturn(o=>!o))}
      </div>
    </div>
  );

  const priceRows = (
    <>
      <div style={{ fontFamily:'Helvetica Neue', fontWeight:600, fontSize:12, color:DS.n600, marginBottom:10, textTransform:'uppercase', letterSpacing:'0.05em' }}>Rincian Harga</div>
      {[
        { label:`Tiket (${fareData?.name||'Value'}) × ${paxCount} pax`, val:basePrice },
        ...(baggageTotal > 0 && baggageLabel ? [{ label:baggageLabel, val:baggageTotal }] : []),
        ...(protectionTotal > 0 ? [{ label:'Proteksi perjalanan', val:protectionTotal }] : []),
        { label:'Pajak (11%)', val:tax },
        { label:'Biaya Layanan (5%)', val:serviceFee },
      ].map(({ label, val }) => (
        <div key={label} style={{ display:'flex', justifyContent:'space-between', marginBottom:10, gap:8 }}>
          <span style={{ fontFamily:'Helvetica Neue', fontSize:13, color:DS.n700, flex:1 }}>{label}</span>
          <span style={{ fontFamily:'Helvetica Neue', fontWeight:500, fontSize:13, color:DS.dark, flexShrink:0 }}>{fmt(val)}</span>
        </div>
      ))}
      <div style={{ borderTop:`2px solid ${DS.n100}`, marginTop:4, paddingTop:12, display:'flex', justifyContent:'space-between', marginBottom:16 }}>
        <span style={{ fontFamily:'Helvetica Neue', fontWeight:700, fontSize:15, color:DS.dark }}>Total</span>
        <span style={{ fontFamily:'Helvetica Neue', fontWeight:700, fontSize:18, color:DS.primary }}>{fmt(total)}</span>
      </div>
    </>
  );

  const submitBtn = (
    <button onClick={handleSubmit}
      style={{ width:'100%', borderRadius:999, height:48, fontSize:15, fontWeight:700, fontFamily:'Helvetica Neue', background:`linear-gradient(135deg,${DS.primary},${DS.primaryDark})`, color:'#fff', border:'none', cursor:'pointer', boxShadow:'0 4px 14px rgba(53,107,166,0.28)' }}>
      Lanjut ke Pembayaran
    </button>
  );

  void layout;
  void ShieldCheck;

  return (
    <div style={{ minHeight:'100vh', background:DS.surface }}>
      {/* Header */}
      <div style={{ background:DS.white, borderBottom:`1px solid ${DS.n100}`, padding:'12px 24px' }}>
        <button onClick={onBack} style={{ background:'none', border:'none', cursor:'pointer', display:'flex', alignItems:'center', gap:6, color:DS.n500, fontFamily:'Helvetica Neue', fontSize:12 }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none"><path d="M19 12H5M12 5l-7 7 7 7" stroke={DS.n400} strokeWidth="2" strokeLinecap="round"/></svg>
          Kembali ke pilih tarif
        </button>
      </div>

      <div style={{ maxWidth:1200, margin:'0 auto', padding: isMobile ? '16px 16px 120px' : '28px 80px 60px', display:'flex', gap:24, alignItems:'flex-start' }}>
        {/* Form column */}
        <div style={{ flex:1, minWidth:0 }}>

          {/* Contact */}
          <Section title="Data Pemesan (Kontak Utama)">
            <div style={{ display:'grid', gridTemplateColumns: isMobile ? '1fr' : '112px 1fr 1fr', gap: isMobile ? 12 : '0 16px', marginBottom: isMobile ? 0 : 16 }}>
              <TitleSelect label="Sapaan" required value={contact.salutation}
                onChange={e => setContact(p => ({ ...p, salutation: e.target.value }))}
                isMobile={isMobile} onOpenSheet={() => setTitleSheet('contact')} />
              <Field label="Nama Lengkap" required error={errors.contactName} fieldId="field-contactName">
                <InputField placeholder="Sesuai KTP/Paspor" value={contact.name} error={errors.contactName} maxLength={60}
                  onChange={e => { setContact(p => ({ ...p, name: e.target.value })); setErrors(er => ({ ...er, contactName:'' })); }} />
              </Field>
              <PhoneCountryInput label="Nomor HP / WhatsApp" required value={contact.phone} countryIso={contact.phoneCountry}
                error={errors.contactPhone} fieldId="field-contactPhone"
                onCountryChange={iso => setContact(p => ({ ...p, phoneCountry: iso }))}
                onChange={val => { setContact(p => ({ ...p, phone: val })); setErrors(er => ({ ...er, contactPhone:'' })); }} />
            </div>
            <div style={{ marginTop: isMobile ? 12 : 0 }}>
              <Field label="Email" required error={errors.contactEmail} fieldId="field-contactEmail">
                <InputField type="email" placeholder="email@example.com" value={contact.email} error={errors.contactEmail} maxLength={254}
                  onChange={e => { setContact(p => ({ ...p, email: e.target.value })); setErrors(er => ({ ...er, contactEmail:'' })); }} />
              </Field>
            </div>
          </Section>

          {/* Passengers */}
          {passengers.map((pax, idx) => (
            <Section key={idx} title={`Data Penumpang ${idx + 1}${passengers.length > 1 ? ` — ${pax.type}` : ''}`}>
              {pax.type !== 'Bayi' ? (
                <div style={{ display:'grid', gridTemplateColumns: isMobile ? '1fr' : '112px 1fr', gap: isMobile ? 12 : '0 16px', marginBottom:14 }}>
                  <TitleSelect label="Sapaan" required value={pax.salutation}
                    onChange={e => updatePassenger(idx, 'salutation', e.target.value)}
                    isMobile={isMobile} onOpenSheet={() => setTitleSheet(`pax-${idx}`)} />
                  <Field label="Nama Lengkap" required error={errors[`paxName_${idx}`]} fieldId={`field-paxName_${idx}`}>
                    <InputField icon={<User size={15}/>} placeholder="Sesuai kartu identitas" value={pax.name} error={errors[`paxName_${idx}`]} maxLength={60}
                      onChange={e => { updatePassenger(idx, 'name', e.target.value); setErrors(er => ({ ...er, [`paxName_${idx}`]:'' })); }} />
                  </Field>
                </div>
              ) : (
                <div style={{ marginBottom:14 }}>
                  <Field label="Nama Lengkap" required error={errors[`paxName_${idx}`]} fieldId={`field-paxName_${idx}`}>
                    <InputField icon={<User size={15}/>} placeholder="Sesuai akta kelahiran" value={pax.name} error={errors[`paxName_${idx}`]} maxLength={60}
                      onChange={e => { updatePassenger(idx, 'name', e.target.value); setErrors(er => ({ ...er, [`paxName_${idx}`]:'' })); }} />
                  </Field>
                </div>
              )}

              {pax.type !== 'Dewasa' && (
                <Field label="Tanggal Lahir *" error={errors[`dob_${idx}`]} fieldId={`field-dob_${idx}`}>
                  <BookingDatePicker pastOnly
                    initialYear={pax.type === 'Bayi' ? new Date().getFullYear() : new Date().getFullYear() - 5}
                    value={pax.dob}
                    onChange={d => { updatePassenger(idx, 'dob', d); setErrors(er => ({ ...er, [`dob_${idx}`]:'' })); }}
                    placeholder="Pilih tanggal lahir" />
                </Field>
              )}

              {pax.type === 'Bayi' && (() => {
                const adults = passengers.filter(p => p.type === 'Dewasa');
                const selectedAdult = adults.find(a => a.id === (pax.companionIdx ?? 0)) || adults[0];
                const displayName = selectedAdult ? (selectedAdult.name || `Penumpang Dewasa ${selectedAdult.id + 1}`) : '—';
                return (
                  <Field label="Nama Pendamping (Dewasa)" required>
                    {(isMobile || isTablet) ? (
                      <button type="button" onClick={() => setCompanionSheet(idx)}
                        style={{ ...INPUT_STYLE, display:'flex', alignItems:'center', justifyContent:'space-between', cursor:'pointer', textAlign:'left', minHeight:44 }}>
                        <span style={{ color: selectedAdult ? DS.dark : DS.n400 }}>{displayName}</span>
                        <ChevronDown size={16} color={DS.n400} />
                      </button>
                    ) : (
                      <select value={pax.companionIdx ?? 0} onChange={e => updatePassenger(idx, 'companionIdx', parseInt(e.target.value))}
                        style={{ ...INPUT_STYLE, appearance:'none', paddingRight:36, backgroundImage:`url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='12' height='8'><path d='M0 0l6 8 6-8z' fill='%23666'/></svg>")`, backgroundPosition:'right 14px center', backgroundRepeat:'no-repeat' }}>
                        {adults.map(a => (<option key={a.id} value={a.id}>{a.name || `Penumpang Dewasa ${a.id + 1}`}</option>))}
                      </select>
                    )}
                    <div style={{ fontFamily:'Helvetica Neue', fontSize:11, color:DS.n500, marginTop:6 }}>1 dewasa hanya bisa mendampingi 1 bayi</div>
                  </Field>
                );
              })()}

              {!isDomestic && (
                <div style={{ marginTop:14 }}>
                  <div style={{ fontFamily:'Helvetica Neue', fontWeight:700, fontSize:15, color:DS.dark, marginBottom:16 }}>Info Identitas</div>
                  <Field label="Nomor Paspor" required error={errors[`passport_${idx}`]} fieldId={`field-passport_${idx}`}>
                    <InputField placeholder="Masukkan nomor paspor" value={pax.passport||''} error={errors[`passport_${idx}`]} maxLength={20}
                      onChange={e => { updatePassenger(idx, 'passport', e.target.value); setErrors(er => ({ ...er, [`passport_${idx}`]:'' })); }} />
                    {!errors[`passport_${idx}`] && <div style={{ fontFamily:'Helvetica Neue', fontSize:11, color:DS.n500, marginTop:6 }}>Berlaku setidaknya 6 bulan dari tanggal keberangkatan</div>}
                  </Field>
                  <Field label="Tanggal Habis Berlaku" required error={errors[`expiry_${idx}`]} fieldId={`field-expiry_${idx}`}>
                    <BookingDatePicker value={pax.expiry} onChange={d => { updatePassenger(idx, 'expiry', d); setErrors(er => ({ ...er, [`expiry_${idx}`]:'' })); }} placeholder="Pilih tanggal" />
                  </Field>
                  <Field label="Negara/Wilayah yang Mengeluarkan">
                    <CountrySelect value={pax.country} onChange={c => updatePassenger(idx, 'country', c)} />
                  </Field>
                </div>
              )}
            </Section>
          ))}

          {/* Baggage add-ons */}
          <Section title="🧳 Travel Add-ons — Bagasi" collapsible>
            {isRoundTrip ? (() => {
              const fromCode = searchParams?.from || '';
              const toCode   = searchParams?.to   || '';
              const activeSel = activeBaggageLeg === 'outbound' ? selectedBaggage : selectedReturnBaggage;
              const setActive = activeBaggageLeg === 'outbound' ? setSelectedBaggage : setSelectedReturnBaggage;
              const includedLabel = fareData?.id === 'lite' ? 'Tidak ada' : fareData?.id === 'value' ? '20 kg' : '30 kg';
              const bagLabel = (b: typeof BAGGAGE_OPTIONS[0]) => b.kg === 0 ? 'Termasuk' : `+${b.kg} kg`;
              return (
                <>
                  <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:8, marginBottom:16 }}>
                    {[
                      { key:'outbound' as const, label:'Pergi',  from:fromCode, to:toCode,   sel:selectedBaggage },
                      { key:'return'   as const, label:'Pulang', from:toCode,   to:fromCode, sel:selectedReturnBaggage },
                    ].map(leg => {
                      const isActive = activeBaggageLeg === leg.key;
                      return (
                        <button key={leg.key} type="button" onClick={() => setActiveBaggageLeg(leg.key)}
                          style={{ borderRadius:10, border:`2px solid ${isActive?DS.primary:DS.n100}`, background:isActive?DS.white:DS.n50, padding:'10px 12px', cursor:'pointer', textAlign:'left', transition:'all 0.15s', position:'relative' }}>
                          <div style={{ display:'flex', alignItems:'center', gap:6, marginBottom:4 }}>
                            <span style={{ fontFamily:'Helvetica Neue', fontWeight:700, fontSize:12, color:isActive?DS.primary:DS.n500 }}>{leg.label}</span>
                            <span style={{ fontFamily:'Helvetica Neue', fontSize:11, color:isActive?DS.primary:DS.n400 }}>{leg.from} → {leg.to}</span>
                          </div>
                          <div style={{ display:'inline-flex', alignItems:'center', gap:4, background:leg.sel.kg===0?DS.n100:DS.accentLight, borderRadius:99, padding:'2px 8px' }}>
                            <span style={{ fontSize:11 }}>🧳</span>
                            <span style={{ fontFamily:'Helvetica Neue', fontWeight:700, fontSize:11, color:leg.sel.kg===0?DS.n500:DS.accent }}>{bagLabel(leg.sel)}</span>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                  <div style={{ fontFamily:'Helvetica Neue', fontSize:12, color:DS.n500, marginBottom:12 }}>
                    Bagasi check-in sudah termasuk: <strong>{includedLabel}</strong>
                  </div>
                  <div style={{ display:'grid', gridTemplateColumns: isMobile?'1fr 1fr':'repeat(4,1fr)', gap:10 }}>
                    {BAGGAGE_OPTIONS.map(opt => {
                      const picked = activeSel.kg === opt.kg;
                      return (
                        <button key={opt.kg} onClick={() => setActive(opt)}
                          style={{ padding:'12px 10px', borderRadius:10, border:`2px solid ${picked?DS.accent:DS.n100}`, background:picked?DS.accentLight:'#fff', cursor:'pointer', transition:'all 0.15s', textAlign:'center' }}>
                          <div style={{ fontSize:20, marginBottom:4 }}>🧳</div>
                          <div style={{ fontFamily:'Helvetica Neue', fontWeight:700, fontSize:14, color:picked?DS.accent:DS.dark }}>{opt.kg===0?'Termasuk':`+${opt.kg} kg`}</div>
                          <div style={{ fontFamily:'Helvetica Neue', fontSize:11, color:DS.n500 }}>{opt.price===0?'Gratis':`+Rp ${opt.price.toLocaleString('id-ID')}`}</div>
                        </button>
                      );
                    })}
                  </div>
                </>
              );
            })() : (
              <>
                <div style={{ fontFamily:'Helvetica Neue', fontSize:12, color:DS.n500, marginBottom:14 }}>Bagasi check-in sudah termasuk: {fareData?.id==='lite'?'Tidak ada':fareData?.id==='value'?'20 kg':'30 kg'}</div>
                <div style={{ display:'grid', gridTemplateColumns: isMobile?'1fr 1fr':'repeat(4,1fr)', gap:10 }}>
                  {BAGGAGE_OPTIONS.map(opt => (
                    <button key={opt.kg} onClick={() => setSelectedBaggage(opt)}
                      style={{ padding:'12px 10px', borderRadius:10, border:`2px solid ${selectedBaggage.kg===opt.kg?DS.accent:DS.n100}`, background:selectedBaggage.kg===opt.kg?DS.accentLight:'#fff', cursor:'pointer', transition:'all 0.15s', textAlign:'center' }}>
                      <div style={{ fontSize:20, marginBottom:4 }}>🧳</div>
                      <div style={{ fontFamily:'Helvetica Neue', fontWeight:700, fontSize:14, color:selectedBaggage.kg===opt.kg?DS.accent:DS.dark }}>{opt.kg===0?'Termasuk':`+${opt.kg} kg`}</div>
                      <div style={{ fontFamily:'Helvetica Neue', fontSize:11, color:DS.n500 }}>{opt.price===0?'Gratis':`+Rp ${opt.price.toLocaleString('id-ID')}`}</div>
                    </button>
                  ))}
                </div>
              </>
            )}
          </Section>

          {/* Protections */}
          <Section title="🛡️ Perlindungan Ekstra" collapsible>
            <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
              {(() => {
                const fullActive = selectedProtections.includes('full');
                return PROTECTIONS.map(p => {
                  const active = selectedProtections.includes(p.id);
                  const disabled = fullActive && p.id !== 'full';
                  return (
                    <div key={p.id}
                      onClick={() => {
                        if (disabled) return;
                        if (p.id === 'full') {
                          setSelectedProtections(prev => prev.includes('full') ? prev.filter(x => x !== 'full') : ['full']);
                        } else {
                          setSelectedProtections(prev => active ? prev.filter(x => x !== p.id) : [...prev, p.id]);
                        }
                      }}
                      style={{ borderRadius:12, border:`2px solid ${active?DS.primary:DS.n100}`, padding:'14px 16px', cursor: disabled ? 'default' : 'pointer', background:active?DS.accentLight:'#fff', transition:'all 0.15s', display:'flex', alignItems:'center', gap:14, position:'relative', opacity: disabled ? 0.4 : 1, pointerEvents: disabled ? 'none' : 'auto' }}>
                      <div style={{ fontSize:28, flexShrink:0 }}>{p.icon}</div>
                      <div style={{ flex:1, minWidth:0 }}>
                        <div style={{ fontFamily:'Helvetica Neue', fontWeight:700, fontSize:14, color:DS.dark }}>{p.name}</div>
                        <div style={{ fontFamily:'Helvetica Neue', fontSize:12, color:DS.n500, marginTop:2 }}>{p.desc}</div>
                      </div>
                      <div style={{ textAlign:'right', flexShrink:0 }}>
                        <div style={{ fontFamily:'Helvetica Neue', fontWeight:700, fontSize:14, color:DS.primary }}>+Rp {p.price.toLocaleString('id-ID')}</div>
                        <div style={{ width:22, height:22, borderRadius:4, border:`2px solid ${active?DS.primary:DS.n300}`, background:active?DS.primary:'#fff', display:'flex', alignItems:'center', justifyContent:'center', marginLeft:'auto', marginTop:6 }}>
                          {active && <span style={{ color:'#fff', fontSize:13, fontWeight:700 }}>✓</span>}
                        </div>
                      </div>
                    </div>
                  );
                });
              })()}
            </div>
          </Section>
        </div>

        {/* Sidebar — desktop only */}
        {!isMobile && !isTablet && (
          <div style={{ width:340, flexShrink:0 }}>
            <div style={{ position:'sticky', top:20, background:DS.white, borderRadius:12, border:`1px solid ${DS.n100}`, boxShadow:'0 4px 20px rgba(0,0,0,0.06)', overflow:'hidden' }}>
              <div style={{ padding:'16px 20px', borderBottom:`1px solid ${DS.n100}` }}>
                <h3 style={{ fontFamily:'Helvetica Neue', fontWeight:700, fontSize:15, color:DS.dark, margin:'0 0 14px 0' }}>Ringkasan Pesanan</h3>
                {summaryContent}
              </div>
              <div style={{ padding:'16px 20px' }}>
                {priceRows}
                {submitBtn}
                <div style={{ textAlign:'center', fontFamily:'Helvetica Neue', fontSize:11, color:DS.n500, marginTop:10 }}>Transaksi aman dan terenkripsi SSL</div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Bottom bar — mobile/tablet */}
      {(isMobile || isTablet) && (
        <div style={{ position:'fixed', bottom:0, left:0, right:0, background:'#fff', padding:'14px 20px 20px', boxShadow:'0 -4px 20px rgba(0,0,0,0.10)', zIndex:200, display:'flex', flexDirection:'column', gap:10, borderRadius:'24px 24px 0 0' }}>
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', width:'100%', cursor:'pointer', userSelect:'none' }}
            onClick={() => setShowSummarySheet(v => !v)}>
            <div>
              <div style={{ fontFamily:'Helvetica Neue', fontSize:11, color:'#888', marginBottom:2 }}>Total Pembayaran</div>
              <div style={{ fontFamily:'Helvetica Neue', fontWeight:700, fontSize:18, color:DS.primary }}>{fmt(total)}</div>
            </div>
            <div style={{ display:'flex', alignItems:'center', gap:4, color:'#888' }}>
              <span style={{ fontFamily:'Helvetica Neue', fontSize:12 }}>Lihat detail</span>
              {showSummarySheet ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
            </div>
          </div>
          {submitBtn}
        </div>
      )}

      {/* Summary sheet — mobile/tablet */}
      {showSummarySheet && typeof document !== 'undefined' && createPortal(
        <>
          <div onClick={() => setShowSummarySheet(false)} style={{ display:'block', position:'fixed', inset:0, background:'rgba(0,0,0,0.45)', zIndex:300 }} />
          <div style={{ position:'fixed', bottom:0, left:0, right:0, background:'#fff', borderRadius:'20px 20px 0 0', padding:'8px 24px 80px', zIndex:301, maxHeight:'85vh', overflowY:'auto', boxShadow:'0 -8px 32px rgba(0,0,0,0.15)' }}>
            <div style={{ width:40, height:4, borderRadius:2, background:DS.n200, margin:'8px auto 16px' }} />
            <div style={{ fontFamily:'Helvetica Neue', fontWeight:700, fontSize:16, color:DS.dark, marginBottom:16 }}>Ringkasan Pesanan</div>
            {summarySheetContent}
            <div style={{ height:1, background:DS.n100, margin:'12px 0' }} />
            {priceRows}
          </div>
        </>, document.body
      )}

      {/* Companion sheet — mobile/tablet */}
      {companionSheet !== null && typeof document !== 'undefined' && createPortal(
        <>
          <div onClick={() => setCompanionSheet(null)} style={{ display:'block', position:'fixed', inset:0, background:'rgba(0,0,0,0.45)', zIndex:300 }} />
          <div style={{ position:'fixed', bottom:0, left:0, right:0, background:'#fff', borderRadius:'20px 20px 0 0', padding:'8px 24px 40px', zIndex:301 }}>
            <div style={{ display:'flex', justifyContent:'center', paddingTop:12, marginBottom:8 }}>
              <div style={{ width:40, height:4, borderRadius:99, background:'#DDD' }} />
            </div>
            <div style={{ fontFamily:'Helvetica Neue', fontWeight:700, fontSize:18, color:DS.dark, marginBottom:6 }}>Pilih Pendamping</div>
            <div style={{ fontFamily:'Helvetica Neue', fontSize:12, color:DS.n500, marginBottom:16 }}>1 dewasa hanya bisa mendampingi 1 bayi</div>
            <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
              {passengers.filter(p => p.type === 'Dewasa').map(a => {
                const label = a.name || `Penumpang Dewasa ${a.id + 1}`;
                const selected = (passengers[companionSheet]?.companionIdx ?? 0) === a.id;
                return (
                  <button key={a.id} type="button"
                    onClick={() => { updatePassenger(companionSheet, 'companionIdx', a.id); setCompanionSheet(null); }}
                    style={{ minHeight:50, borderRadius:10, border:`1.5px solid ${selected?DS.accent:DS.n100}`, background:selected?DS.accentLight:DS.white, color:DS.dark, fontFamily:'Helvetica Neue', fontWeight:selected?700:400, fontSize:14, cursor:'pointer', textAlign:'left', padding:'0 16px', display:'flex', alignItems:'center', justifyContent:'space-between' }}>
                    <span>{label}</span>
                    {selected && <span style={{ color:DS.accent, fontWeight:700, fontSize:16 }}>✓</span>}
                  </button>
                );
              })}
            </div>
          </div>
        </>, document.body
      )}

      {/* Title sheet — mobile */}
      {Boolean(titleSheet) && typeof document !== 'undefined' && createPortal(
        <>
          <div onClick={() => setTitleSheet(null)} style={{ display:'block', position:'fixed', inset:0, background:'rgba(0,0,0,0.45)', zIndex:300 }} />
          <div style={{ position:'fixed', bottom:0, left:0, right:0, background:'#fff', borderRadius:'20px 20px 0 0', padding:'8px 24px 40px', zIndex:301 }}>
            <div style={{ display:'flex', justifyContent:'center', paddingTop:12, marginBottom:8 }}>
              <div style={{ width:40, height:4, borderRadius:99, background:'#DDD' }} />
            </div>
            <div style={{ fontFamily:'Helvetica Neue', fontWeight:700, fontSize:18, color:DS.dark, marginBottom:20 }}>Pilih Sapaan</div>
            <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
              {TITLE_OPTIONS.map(option => {
                const paxMatch = titleSheet?.match(/^pax-(\d+)$/);
                const paxIdx = paxMatch ? parseInt(paxMatch[1]) : null;
                const currentVal = paxIdx !== null ? passengers[paxIdx]?.salutation : contact.salutation;
                return (
                  <button key={option} type="button"
                    onClick={() => { if (paxIdx !== null) updatePassenger(paxIdx, 'salutation', option); else setContact(p => ({ ...p, salutation: option })); setTitleSheet(null); }}
                    style={{ minHeight:46, borderRadius:10, border:`1.5px solid ${currentVal===option?DS.accent:DS.n100}`, background:currentVal===option?DS.accentLight:DS.white, color:DS.dark, fontFamily:'Helvetica Neue', fontWeight:700, fontSize:14, cursor:'pointer', textAlign:'left', padding:'0 14px' }}>
                    {option}
                  </button>
                );
              })}
            </div>
          </div>
        </>, document.body
      )}
    </div>
  );
}
