'use client';
import { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { Building2, Check, CheckCircle2, CreditCard, Hourglass, Landmark, Plane, QrCode, ShieldCheck, Star, Store, Wallet, Zap } from 'lucide-react';
import { DS } from '../lib/ds';
import { AIRPORT_NAMES, FlightType, SearchParams } from './FlightResultsPage';
import { FareType } from './FlightFarePage';
import { createOrderId } from '../utils/orderId';

const VA_BANKS = ['BCA', 'Mandiri', 'BNI', 'BRI', 'Permata'];
const GROUPS = [
  { id: 'va', label: 'Virtual Account', icon: 'bank', sub: 'BCA, Mandiri, BNI, BRI, Permata', children: VA_BANKS.map(b => ({ id: `va-${b.toLowerCase()}`, label: `${b} Virtual Account`, icon: 'bank' })) },
  { id: 'credit', label: 'Kartu Kredit / Debit', icon: 'card', sub: 'Visa, Mastercard, JCB, Amex', children: [] },
  { id: 'ewallet', label: 'E-Wallet', icon: 'wallet', sub: 'GoPay, OVO, DANA, ShopeePay, LinkAja', children: [{ id: 'gopay', label: 'GoPay', icon: 'wallet' }, { id: 'dana', label: 'DANA', icon: 'wallet' }, { id: 'ovo', label: 'OVO', icon: 'wallet' }, { id: 'shopee', label: 'ShopeePay', icon: 'wallet' }, { id: 'linkaja', label: 'LinkAja', icon: 'wallet' }] },
  { id: 'instant', label: 'Instant Payment', icon: 'instant', sub: 'blu, KlikBCA, OCTO Clicks', children: [] },
  { id: 'retail', label: 'Minimarket', icon: 'store', sub: 'Alfamart, Indomaret, Lawson', children: [] },
];
const STEPS = ['Pilih Metode', 'Bayar', 'Selesai'];

const PAYMENT_ICONS: Record<string, React.ElementType> = {
  bank: Landmark,
  card: CreditCard,
  wallet: Wallet,
  instant: Zap,
  store: Store,
};

const ICON_COLORS: Record<string, { bg: string; fg: string }> = {
  bank: { bg: '#EAF2FF', fg: '#2563EB' },
  card: { bg: '#EEF2FF', fg: '#4F46E5' },
  wallet: { bg: '#ECFDF5', fg: '#059669' },
  instant: { bg: '#FFF7ED', fg: '#EA580C' },
  store: { bg: '#FDF2F8', fg: '#DB2777' },
};

const INPUT_STYLE: React.CSSProperties = {
  width: '100%', minHeight: 44, border: `1px solid ${DS.n200}`, borderRadius: 8,
  background: DS.white, color: DS.dark, padding: '0 16px',
  fontFamily: 'Helvetica Neue', fontSize: 14, boxSizing: 'border-box', outline: 'none',
};

export interface PaymentBookingData {
  flight?: FlightType;
  returnFlight?: FlightType | null;
  fare?: FareType & { outbound?: { name: string } };
  searchParams?: SearchParams;
  total: number;
  orderId?: string;
  basePrice?: number;
  baggageTotal?: number;
  protectionTotal?: number;
  tax?: number;
  serviceFee?: number;
  paxCount?: number;
  [key: string]: unknown;
}

function useBreakpoint() {
  const [w, setW] = useState(typeof window !== 'undefined' ? window.innerWidth : 1280);
  useEffect(() => {
    const fn = () => setW(window.innerWidth);
    window.addEventListener('resize', fn);
    return () => window.removeEventListener('resize', fn);
  }, []);
  return { isMobile: w < 768, isTablet: w >= 768 && w < 1024 };
}

const formatCardNumber = (value: string) =>
  value.replace(/\D/g, '').slice(0, 16).replace(/(.{4})/g, '$1 ').trim();

const formatExpiry = (value: string) => {
  const digits = value.replace(/\D/g, '').slice(0, 4);
  if (digits.length <= 2) return digits;
  return `${digits.slice(0, 2)}/${digits.slice(2)}`;
};

function PaymentIcon({ name, selected = false }: { name: string; selected?: boolean }) {
  const Icon = PAYMENT_ICONS[name] || Building2;
  const tone = ICON_COLORS[name] || { bg: DS.accentLight, fg: DS.accent };
  return (
    <span style={{ width: 32, height: 32, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', borderRadius: 10, background: selected ? tone.fg : tone.bg, flexShrink: 0 }}>
      <Icon size={20} strokeWidth={2.2} color={selected ? DS.white : tone.fg} />
    </span>
  );
}

function Stepper({ step }: { step: number }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 0, marginBottom: 24 }}>
      {STEPS.map((label, i) => {
        const done = i < step, active = i === step;
        return (
          <div key={label} style={{ display: 'flex', alignItems: 'center' }}>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
              <div style={{ width: 32, height: 32, borderRadius: '50%', background: done ? DS.success : active ? DS.accent : DS.n200, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 700, fontSize: 13, fontFamily: 'Helvetica Neue' }}>
                {done ? <Check size={16} strokeWidth={3} /> : i + 1}
              </div>
              <span style={{ fontFamily: 'Helvetica Neue', fontSize: 11, color: active ? DS.accent : done ? DS.success : DS.n400, fontWeight: active ? 700 : 400 }}>{label}</span>
            </div>
            {i < STEPS.length - 1 && (
              <div style={{ width: '10vw', maxWidth: 60, minWidth: 20, height: 2, background: done ? DS.success : DS.n200, margin: '0 4px', marginBottom: 16 }} />
            )}
          </div>
        );
      })}
    </div>
  );
}

function Timer({ secs }: { secs: number }) {
  const h = Math.floor(secs / 3600), m = Math.floor((secs % 3600) / 60), s = secs % 60;
  const fmt = (n: number) => String(n).padStart(2, '0');
  const urgent = secs < 300;
  return <span style={{ fontFamily: 'Helvetica Neue', fontWeight: 700, fontSize: 22, color: urgent ? DS.error : DS.warningText }}>{fmt(h)}:{fmt(m)}:{fmt(s)}</span>;
}

function LoadingModal() {
  const [dots, setDots] = useState('');
  useEffect(() => {
    const t = setInterval(() => setDots(d => d.length < 3 ? d + '.' : ''), 500);
    return () => clearInterval(t);
  }, []);
  return (
    <div style={{ position: 'fixed', inset: 0, background: DS.white, zIndex: 2000, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 20 }}>
      <h2 style={{ fontFamily: 'Helvetica Neue', fontWeight: 700, fontSize: 22, color: DS.dark, margin: 0 }}>Sebentar ya{dots}</h2>
      <p style={{ fontFamily: 'Helvetica Neue', fontSize: 14, color: DS.n500, margin: 0, textAlign: 'center' }}>Kami sedang memproses pesanan dan memastikan ketersediaan layananmu.</p>
      <div style={{ width: 200, height: 4, background: DS.n100, borderRadius: 99, overflow: 'hidden' }}>
        <div style={{ height: '100%', background: DS.accent, borderRadius: 99, animation: 'payment-progress 2s ease-in-out infinite' }} />
      </div>
      <style>{`@keyframes payment-progress { 0%{width:0%} 50%{width:80%} 100%{width:100%} }`}</style>
    </div>
  );
}

function TimeoutModal({ onRetry }: { onRetry: () => void }) {
  return (
    <>
      <div onClick={onRetry} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 1000 }} />
      <div style={{ position: 'fixed', top: '50%', left: '50%', transform: 'translate(-50%,-50%)', background: DS.white, borderRadius: 16, padding: 32, zIndex: 1001, width: '90%', maxWidth: 440, boxShadow: '0 20px 60px rgba(0,0,0,0.2)', textAlign: 'center' }}>
        <div style={{ fontSize: 56, marginBottom: 12 }}>⏰</div>
        <h3 style={{ fontFamily: 'Helvetica Neue', fontWeight: 700, fontSize: 20, color: DS.dark, margin: '0 0 8px' }}>Waktu Habis!</h3>
        <p style={{ fontFamily: 'Helvetica Neue', fontSize: 14, color: DS.n500, margin: '0 0 24px' }}>Sesi pemesanan telah berakhir. Harga atau ketersediaan tiket mungkin telah berubah.</p>
        <button onClick={onRetry} style={{ width: '100%', borderRadius: 999, height: 48, fontSize: 15, fontWeight: 700, fontFamily: 'Helvetica Neue', background: `linear-gradient(135deg,${DS.primary},${DS.primaryDark})`, color: '#fff', border: 'none', cursor: 'pointer' }}>
          Cari Penerbangan Lagi
        </button>
      </div>
    </>
  );
}

export default function PaymentPage({ bookingData, onPaySuccess, onBack }: {
  bookingData: PaymentBookingData;
  onPaySuccess: (orderId: string) => void;
  onBack: () => void;
}) {
  const { isMobile, isTablet } = useBreakpoint();
  const isNarrow = isMobile || isTablet;

  const [fallbackOrderId] = useState(() => createOrderId('flight'));
  const [timeLeft, setTimeLeft] = useState(60 * 60);
  const [method, setMethod] = useState<string | null>(null);
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  const [step, setStep] = useState(0);
  const [loading, setLoading] = useState(true);
  const [summaryOpen, setSummaryOpen] = useState(false);
  const [openOutbound, setOpenOutbound] = useState(false);
  const [openReturn, setOpenReturn] = useState(false);
  const [copiedNotice, setCopiedNotice] = useState(false);
  const copiedTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [cardDetails, setCardDetails] = useState({ number: '', name: '', expiry: '', cvv: '' });

  useEffect(() => {
    const t = setTimeout(() => setLoading(false), 2000);
    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    if (!loading) {
      const t = setInterval(() => setTimeLeft(p => p > 0 ? p - 1 : 0), 1000);
      return () => clearInterval(t);
    }
  }, [loading]);

  // close summary sheet on desktop
  useEffect(() => {
    if (!isNarrow) setSummaryOpen(false);
  }, [isNarrow]);

  const handlePay = () => { setLoading(true); setTimeout(() => { setLoading(false); onPaySuccess(orderId); }, 2200); };
  const goToStep = (nextStep: number) => {
    setStep(nextStep);
    requestAnimationFrame(() => window.scrollTo({ top: 0, behavior: 'auto' }));
  };
  const copyToClipboard = async (value: string) => {
    await navigator.clipboard?.writeText(value);
    setCopiedNotice(true);
    if (copiedTimerRef.current) clearTimeout(copiedTimerRef.current);
    copiedTimerRef.current = setTimeout(() => setCopiedNotice(false), 1600);
  };

  const total = bookingData?.total || 0;
  const fl = bookingData?.flight;
  const returnFl = bookingData?.returnFlight;
  const isRoundTrip = !!returnFl;
  const fare = bookingData?.fare;
  const fareName = fare?.name || (fare?.outbound?.name) || 'Ekonomi';
  const orderId = bookingData?.orderId || fallbackOrderId;
  const basePrice = bookingData?.basePrice || 0;
  const baggageTotal = bookingData?.baggageTotal || 0;
  const protectionTotal = bookingData?.protectionTotal || 0;
  const tax = bookingData?.tax || 0;
  const serviceFee = bookingData?.serviceFee || 0;
  const paxCount = bookingData?.paxCount || 1;

  const selGroup = GROUPS.find(g => g.id === method || g.children.some(c => c.id === method));
  const paymentActionDisabled = step === 0 && !method;
  const handleMobilePaymentAction = () => {
    if (step === 0) { if (method) goToStep(1); return; }
    handlePay();
  };

  if (loading) return <LoadingModal />;
  if (timeLeft === 0) return <TimeoutModal onRetry={onBack} />;
  if (!bookingData) return null;

  const renderFlightStrip = (f: FlightType, label: string | null, open: boolean, onToggle: () => void) => (
    <div style={{ background: DS.white, borderRadius: 12, overflow: 'hidden', border: `1px solid ${DS.n100}` }}>
      {/* Header — always visible, tap to toggle */}
      <div onClick={onToggle} style={{ padding: '11px 13px', borderBottom: open ? `1px solid ${DS.n100}` : 'none', display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', userSelect: 'none' }}>
        {label && (
          <span style={{ fontFamily: 'Helvetica Neue', fontWeight: 700, fontSize: 10, color: '#fff', background: DS.primary, borderRadius: 99, padding: '2px 8px', flexShrink: 0, letterSpacing: '0.04em' }}>{label}</span>
        )}
        {f?.logo && (
          <img src={f.logo} alt={f.airline} style={{ width: 20, height: 20, borderRadius: 4, objectFit: 'contain', background: DS.white, padding: 2, border: `1px solid ${DS.n100}`, flexShrink: 0 }} />
        )}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontFamily: 'Helvetica Neue', fontWeight: 700, fontSize: 12, color: DS.dark, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            {f?.airline} · {f?.flightNo}
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0 }}>
          <span style={{ fontFamily: 'Helvetica Neue', fontWeight: 700, fontSize: 10, color: DS.accent, background: DS.accentLight, borderRadius: 99, padding: '2px 8px', textTransform: 'uppercase', letterSpacing: '0.04em', border: `1px solid ${DS.accent}22` }}>{fareName}</span>
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke={DS.n400} strokeWidth="2.5" style={{ transform: open ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s', flexShrink: 0 }}><path d="M6 9l6 6 6-6" strokeLinecap="round" /></svg>
        </div>
      </div>
      {/* Vertical timeline — collapsible */}
      {open && (
        <div style={{ padding: '13px 14px', display: 'flex', gap: 11 }}>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', paddingTop: 3 }}>
            <div style={{ width: 9, height: 9, borderRadius: '50%', background: DS.primary, border: `2px solid ${DS.white}`, boxShadow: `0 0 0 2px ${DS.primary}`, flexShrink: 0 }} />
            <div style={{ width: 2, flex: 1, minHeight: 28, background: `linear-gradient(to bottom, ${DS.primary}, ${DS.n300})`, borderRadius: 1, margin: '3px 0' }} />
            <div style={{ width: 9, height: 9, borderRadius: '50%', background: DS.n400, border: `2px solid ${DS.white}`, boxShadow: `0 0 0 2px ${DS.n400}`, flexShrink: 0 }} />
          </div>
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'space-between', minWidth: 0 }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 7 }}>
                <span style={{ fontFamily: 'Helvetica Neue', fontWeight: 800, fontSize: 20, color: DS.dark, lineHeight: 1 }}>{f?.dep || '--:--'}</span>
                <span style={{ fontFamily: 'Helvetica Neue', fontSize: 11, color: DS.n500 }}>{f?.depCode}</span>
              </div>
              <div style={{ fontFamily: 'Helvetica Neue', fontSize: 11, color: DS.n600, marginTop: 1 }}>{AIRPORT_NAMES[f?.depCode] || ''}</div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '7px 0' }}>
              <Plane size={10} color={DS.primary} style={{ transform: 'rotate(90deg)' }} />
              <span style={{ fontFamily: 'Helvetica Neue', fontSize: 11, color: DS.n500 }}>{f?.duration}</span>
              <span style={{ color: DS.n300, fontSize: 11 }}>·</span>
              <span style={{ fontFamily: 'Helvetica Neue', fontSize: 11, fontWeight: 600, color: f?.direct ? DS.successText : DS.dark }}>
                {f?.direct ? 'Langsung' : '1 Transit'}
              </span>
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 7 }}>
                <span style={{ fontFamily: 'Helvetica Neue', fontWeight: 800, fontSize: 20, color: DS.dark, lineHeight: 1 }}>{f?.arr || '--:--'}</span>
                <span style={{ fontFamily: 'Helvetica Neue', fontSize: 11, color: DS.n500 }}>{f?.arrCode}</span>
              </div>
              <div style={{ fontFamily: 'Helvetica Neue', fontSize: 11, color: DS.n600, marginTop: 1 }}>{AIRPORT_NAMES[f?.arrCode] || ''}</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );

  const fmt = (n: number) => 'Rp ' + n.toLocaleString('id-ID');

  const renderOrderId = (
    <div style={{ background: DS.n50, borderRadius: 12, padding: 14, marginBottom: 12 }}>
      <div style={{ fontFamily: 'Helvetica Neue', fontSize: 11, color: DS.n500, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 4 }}>Order ID</div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12 }}>
        <div style={{ fontFamily: 'Helvetica Neue', fontWeight: 700, fontSize: 16, color: DS.primary }}>{orderId}</div>
        <button onClick={() => copyToClipboard(orderId)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'Helvetica Neue', fontSize: 12, color: DS.accent }}>Salin</button>
      </div>
    </div>
  );

  const priceRow = (label: string, value: number, bold = false) => (
    <div key={label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: bold ? 0 : 8 }}>
      <span style={{ fontFamily: 'Helvetica Neue', fontSize: bold ? 14 : 12, fontWeight: bold ? 700 : 400, color: bold ? DS.dark : DS.n600 }}>{label}</span>
      <span style={{ fontFamily: 'Helvetica Neue', fontSize: bold ? 15 : 12, fontWeight: bold ? 700 : 500, color: bold ? DS.primary : DS.dark }}>{fmt(value)}</span>
    </div>
  );

  const renderPriceRows = (showPoints = true) => (
    <div>
      {priceRow(`Tiket (${fareName}) × ${paxCount} pax`, basePrice)}
      {priceRow('Pajak & Biaya Layanan', tax + serviceFee + (baggageTotal || 0) + (protectionTotal || 0))}
      <div style={{ borderTop: `1px dashed ${DS.n200}`, margin: '8px 0 10px' }} />
      {priceRow('Total', total, true)}
      {showPoints && (
        <div style={{ marginTop: 12, padding: '8px 12px', background: '#FFFBEB', borderRadius: 8, border: '1px solid #FFD966', display: 'flex', gap: 8, alignItems: 'center' }}>
          <Star size={15} color='#B45309' fill='#FBBF24' />
          <span style={{ fontFamily: 'Helvetica Neue', fontSize: 11, color: DS.warningText }}>Estimasi dapat <strong>{Math.floor(total / 10000)} poin</strong> reward dari transaksi ini</span>
        </div>
      )}
    </div>
  );

  const renderFlights = (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      {fl && renderFlightStrip(fl, isRoundTrip ? 'Pergi' : null, openOutbound, () => setOpenOutbound(o => !o))}
      {isRoundTrip && returnFl && renderFlightStrip(returnFl, 'Pulang', openReturn, () => setOpenReturn(o => !o))}
    </div>
  );

  const primaryBtn = (label: string, onClick: () => void, disabled = false) => (
    <button onClick={onClick} disabled={disabled}
      style={{ width: '100%', borderRadius: 999, height: 48, fontSize: 15, fontWeight: 700, fontFamily: 'Helvetica Neue', background: `linear-gradient(135deg,${DS.primary},${DS.primaryDark})`, color: '#fff', border: 'none', cursor: disabled ? 'not-allowed' : 'pointer', opacity: disabled ? 0.5 : 1 }}>
      {label}
    </button>
  );

  return (
    <div style={{ minHeight: '100vh', background: DS.surface, paddingBottom: isNarrow ? 92 : 0 }}>

      {/* Header */}
      <div style={{ background: DS.white, borderBottom: `1px solid ${DS.n100}`, padding: '12px 24px' }}>
        <button onClick={onBack} style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, color: DS.n500, fontFamily: 'Helvetica Neue', fontSize: 12 }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none"><path d="M19 12H5M12 5l-7 7 7 7" stroke={DS.n400} strokeWidth="2" strokeLinecap="round" /></svg>
          Kembali ke rincian pesanan
        </button>
      </div>

      <div style={{ maxWidth: 1100, margin: '0 auto', padding: '24px 20px' }}>
        <Stepper step={step} />

        {/* Timer */}
        <div style={{ background: '#FFFBEB', border: '1px solid #FFD966', borderRadius: 12, padding: '14px 20px', marginBottom: 24, display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{ width: 36, height: 36, borderRadius: 10, background: '#FEF3C7', color: '#B45309', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}><Hourglass size={20} /></span>
            <div>
              <div style={{ fontFamily: 'Helvetica Neue', fontWeight: 700, fontSize: 14, color: DS.warningText }}>Selesaikan pembayaran sebelum</div>
              <div style={{ fontFamily: 'Helvetica Neue', fontSize: 12, color: '#997300' }}>Harga tiket & kursi ditahan selama waktu ini</div>
            </div>
          </div>
          <Timer secs={timeLeft} />
        </div>

        <div style={{ display: 'flex', gap: 24, alignItems: 'flex-start', flexWrap: 'wrap' }}>

          {/* LEFT — payment methods */}
          <div style={{ flex: 1, minWidth: 280 }}>
            <div style={{ background: DS.white, borderRadius: 12, border: `1px solid ${DS.n100}`, overflow: 'hidden' }}>
              <div style={{ padding: '20px 24px', borderBottom: `1px solid ${DS.n100}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <h2 style={{ fontFamily: 'Helvetica Neue', fontWeight: 700, fontSize: 18, color: DS.dark, margin: 0 }}>Metode Pembayaran</h2>
                  {step === 1 && <div style={{ fontFamily: 'Helvetica Neue', fontSize: 13, color: DS.n500, marginTop: 4 }}>Ikuti instruksi untuk menyelesaikan pembayaran</div>}
                </div>
                <div style={{ background: '#E8F5E9', borderRadius: 8, padding: '6px 12px', display: 'flex', alignItems: 'center', gap: 6 }}>
                  <ShieldCheck size={16} color='#2E7D32' />
                  <span style={{ fontFamily: 'Helvetica Neue', fontWeight: 700, fontSize: 11, color: '#2E7D32' }}>100% AMAN</span>
                </div>
              </div>

              <div style={{ padding: '16px 24px' }}>
                {step === 0 ? (
                  <>
                    {GROUPS.map(g => {
                      const isExp = expanded[g.id], isSelGroup = selGroup?.id === g.id;
                      return (
                        <div key={g.id} style={{ marginBottom: 8 }}>
                          <div onClick={() => { if (g.children.length) { setExpanded(e => ({ ...e, [g.id]: !e[g.id] })); } else setMethod(g.id); }}
                            style={{ display: 'flex', alignItems: 'center', gap: 12, padding: 14, borderRadius: 10, border: `1.5px solid ${isSelGroup ? DS.accent : DS.n200}`, background: isSelGroup ? DS.accentLight : DS.white, cursor: 'pointer', transition: 'all 0.15s' }}>
                            <div style={{ width: 20, height: 20, borderRadius: '50%', border: `2px solid ${isSelGroup ? DS.accent : DS.n300}`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                              {isSelGroup && <div style={{ width: 10, height: 10, borderRadius: '50%', background: DS.accent }} />}
                            </div>
                            <PaymentIcon name={g.icon} selected={isSelGroup} />
                            <div style={{ flex: 1 }}>
                              <div style={{ fontFamily: 'Helvetica Neue', fontWeight: 700, fontSize: 14, color: DS.dark }}>{g.label}</div>
                              <div style={{ fontFamily: 'Helvetica Neue', fontSize: 12, color: DS.n500, marginTop: 2 }}>{g.sub}</div>
                            </div>
                            {g.children.length > 0 && (
                              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={DS.n400} strokeWidth="2" style={{ transform: isExp ? 'rotate(180deg)' : 'rotate(0deg)', transition: '0.2s', flexShrink: 0 }}><path d="M6 9l6 6 6-6" strokeLinecap="round" /></svg>
                            )}
                          </div>
                          {isExp && g.children.length > 0 && (
                            <div style={{ marginLeft: 20, marginTop: 4, display: 'flex', flexDirection: 'column', gap: 6 }}>
                              {g.children.map(c => (
                                <div key={c.id} onClick={() => setMethod(c.id)}
                                  style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px', borderRadius: 8, border: `1.5px solid ${method === c.id ? DS.accent : DS.n200}`, background: method === c.id ? DS.accentLight : DS.white, cursor: 'pointer' }}>
                                  <div style={{ width: 16, height: 16, borderRadius: '50%', border: `2px solid ${method === c.id ? DS.accent : DS.n300}`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                    {method === c.id && <div style={{ width: 8, height: 8, borderRadius: '50%', background: DS.accent }} />}
                                  </div>
                                  <span style={{ fontFamily: 'Helvetica Neue', fontSize: 13, color: DS.dark }}>{c.label}</span>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      );
                    })}
                    {!isNarrow && (
                      <div style={{ marginTop: 16 }}>
                        {primaryBtn('Lanjutkan pembayaran', () => method && goToStep(1), !method)}
                      </div>
                    )}
                  </>
                ) : (
                  <>
                    {/* Selected method row */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 16px', background: DS.n50, borderRadius: 10, border: `1px solid ${DS.n200}`, marginBottom: 20, flexWrap: 'wrap', gap: 12 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <PaymentIcon name={selGroup?.icon || 'bank'} selected />
                        <div>
                          <div style={{ fontFamily: 'Helvetica Neue', fontSize: 11, color: DS.n500 }}>Metode dipilih</div>
                          <div style={{ fontFamily: 'Helvetica Neue', fontWeight: 700, fontSize: 15, color: DS.dark }}>{selGroup?.label}</div>
                        </div>
                      </div>
                      <button onClick={() => goToStep(0)} style={{ background: 'none', border: 'none', color: DS.accent, fontFamily: 'Helvetica Neue', fontWeight: 700, fontSize: 13, cursor: 'pointer' }}>Ubah</button>
                    </div>

                    {/* Credit card */}
                    {method === 'credit' && (
                      <div style={{ padding: 20, borderRadius: 12, border: `1px solid ${DS.n200}`, marginBottom: 20 }}>
                        <h3 style={{ fontFamily: 'Helvetica Neue', fontWeight: 700, fontSize: 15, color: DS.dark, marginBottom: 16, margin: '0 0 16px' }}>Detail Kartu Kredit / Debit</h3>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                          <div>
                            <label style={{ display: 'block', fontFamily: 'Helvetica Neue', fontSize: 12, fontWeight: 500, marginBottom: 6 }}>Nomor Kartu</label>
                            <input style={INPUT_STYLE} inputMode="numeric" autoComplete="cc-number" maxLength={19} placeholder="0000 0000 0000 0000"
                              value={cardDetails.number} onChange={e => setCardDetails(p => ({ ...p, number: formatCardNumber(e.target.value) }))} />
                          </div>
                          <div>
                            <label style={{ display: 'block', fontFamily: 'Helvetica Neue', fontSize: 12, fontWeight: 500, marginBottom: 6 }}>Nama di Kartu</label>
                            <input style={INPUT_STYLE} autoComplete="cc-name" placeholder="Sesuai kartu"
                              value={cardDetails.name} onChange={e => setCardDetails(p => ({ ...p, name: e.target.value }))} />
                          </div>
                          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                            <div>
                              <label style={{ display: 'block', fontFamily: 'Helvetica Neue', fontSize: 12, fontWeight: 500, marginBottom: 6 }}>Masa Berlaku</label>
                              <input style={INPUT_STYLE} inputMode="numeric" autoComplete="cc-exp" maxLength={5} placeholder="MM/YY"
                                value={cardDetails.expiry} onChange={e => setCardDetails(p => ({ ...p, expiry: formatExpiry(e.target.value) }))} />
                            </div>
                            <div>
                              <label style={{ display: 'block', fontFamily: 'Helvetica Neue', fontSize: 12, fontWeight: 500, marginBottom: 6 }}>CVV</label>
                              <input style={INPUT_STYLE} inputMode="numeric" autoComplete="cc-csc" type="password" placeholder="???" maxLength={4}
                                value={cardDetails.cvv} onChange={e => setCardDetails(p => ({ ...p, cvv: e.target.value.replace(/\D/g, '').slice(0, 4) }))} />
                            </div>
                          </div>
                        </div>
                        <div style={{ display: 'flex', gap: 8, marginTop: 14, padding: 12, background: '#F0F7FF', borderRadius: 8 }}>
                          <ShieldCheck size={16} color={DS.primary} />
                          <span style={{ fontFamily: 'Helvetica Neue', fontSize: 11, color: DS.n500 }}>Dilindungi enkripsi PCI-DSS. Data kartu tidak pernah disimpan.</span>
                        </div>
                      </div>
                    )}

                    {/* Virtual Account */}
                    {method?.startsWith('va') && (
                      <div style={{ padding: 20, borderRadius: 12, border: `1px solid ${DS.n200}`, marginBottom: 20 }}>
                        <h3 style={{ fontFamily: 'Helvetica Neue', fontWeight: 700, fontSize: 15, color: DS.dark, marginBottom: 8, margin: '0 0 8px' }}>Nomor Virtual Account</h3>
                        <p style={{ fontFamily: 'Helvetica Neue', fontSize: 13, color: DS.n500, margin: '0 0 14px' }}>Bayar lewat ATM, m-Banking, atau Internet Banking.</p>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: 16, background: DS.n50, borderRadius: 8, border: `1px dashed ${DS.n300}`, flexWrap: 'wrap', gap: 12 }}>
                          <div>
                            <div style={{ fontFamily: 'Helvetica Neue', fontSize: 11, color: DS.n500, marginBottom: 4 }}>No. Virtual Account</div>
                            <div style={{ fontFamily: 'Helvetica Neue', fontWeight: 700, fontSize: 20, color: DS.primary, letterSpacing: 1 }}>3901 8274 6152 900</div>
                          </div>
                          <button onClick={() => copyToClipboard('3901827461529')} style={{ padding: '6px 14px', borderRadius: 999, border: `1px solid ${DS.n200}`, background: DS.white, cursor: 'pointer', fontFamily: 'Helvetica Neue', fontSize: 13 }}>Salin</button>
                        </div>
                      </div>
                    )}

                    {/* E-Wallet / QRIS */}
                    {['ewallet', 'gopay', 'dana', 'ovo', 'shopee', 'linkaja'].includes(method || '') && (
                      <div style={{ padding: 20, borderRadius: 12, border: `1px solid ${DS.n200}`, textAlign: 'center', marginBottom: 20 }}>
                        <h3 style={{ fontFamily: 'Helvetica Neue', fontWeight: 700, fontSize: 15, color: DS.dark, marginBottom: 16, margin: '0 0 16px' }}>Scan QRIS</h3>
                        <div style={{ width: 160, height: 160, background: '#EEF6FF', color: DS.primary, borderRadius: 12, margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'center', border: `1px dashed ${DS.primary}` }}>
                          <QrCode size={84} strokeWidth={1.8} />
                        </div>
                        <p style={{ fontFamily: 'Helvetica Neue', fontSize: 13, color: DS.n500, marginTop: 12 }}>Buka GoPay / OVO / DANA dan scan kode QR di atas.</p>
                      </div>
                    )}

                    <p style={{ fontFamily: 'Helvetica Neue', fontSize: 11, color: DS.n400, lineHeight: 1.6, marginBottom: 16 }}>
                      Dengan melanjutkan, kamu menyetujui <span style={{ color: DS.accent, cursor: 'pointer', textDecoration: 'underline' }}>Syarat & Ketentuan</span> serta <span style={{ color: DS.accent, cursor: 'pointer', textDecoration: 'underline' }}>Kebijakan Privasi</span> BeningMata Travel.
                    </p>
                    {!isNarrow && (
                      <button onClick={handlePay} style={{ width: '100%', borderRadius: 999, height: 48, fontSize: 15, fontWeight: 700, fontFamily: 'Helvetica Neue', background: `linear-gradient(135deg,${DS.primary},${DS.primaryDark})`, color: '#fff', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                        <CheckCircle2 size={16} /> Saya Sudah Bayar
                      </button>
                    )}
                  </>
                )}
              </div>
            </div>
          </div>

          {/* RIGHT — desktop sidebar */}
          {!isNarrow && (
            <div style={{ width: 300, flexShrink: 0 }}>
              <div style={{ position: 'sticky', top: 20, display: 'flex', flexDirection: 'column', gap: 12 }}>
                {/* Order ID */}
                <div style={{ background: DS.white, borderRadius: 12, border: `1px solid ${DS.n100}`, padding: 16 }}>
                  <div style={{ fontFamily: 'Helvetica Neue', fontSize: 11, color: DS.n500, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 4 }}>Order ID</div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ fontFamily: 'Helvetica Neue', fontWeight: 700, fontSize: 16, color: DS.primary }}>{orderId}</div>
                    <button onClick={() => copyToClipboard(orderId)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'Helvetica Neue', fontSize: 12, color: DS.accent }}>Salin</button>
                  </div>
                </div>
                {/* Summary */}
                <div style={{ background: DS.white, borderRadius: 12, border: `1px solid ${DS.n100}`, padding: '14px 16px' }}>
                  <div style={{ fontFamily: 'Helvetica Neue', fontWeight: 700, fontSize: 14, color: DS.dark, marginBottom: 12 }}>Ringkasan Pesanan</div>
                  {renderFlights}
                  <div style={{ marginTop: 14 }}>
                    {renderPriceRows()}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Mobile/tablet bottom bar */}
      {isNarrow && (
        <div style={{ position: 'fixed', bottom: 0, left: 0, right: 0, background: '#fff', padding: '14px 20px 20px', boxShadow: '0 -4px 20px rgba(0,0,0,0.10)', zIndex: 200, display: 'flex', flexDirection: 'column', gap: 10, borderRadius: '24px 24px 0 0' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%', cursor: 'pointer', userSelect: 'none' }}
            onClick={() => setSummaryOpen(v => !v)}>
            <div>
              <div style={{ fontFamily: 'Helvetica Neue', fontSize: 11, color: '#888', marginBottom: 2 }}>Ringkasan Pesanan</div>
              <div style={{ fontFamily: 'Helvetica Neue', fontWeight: 700, fontSize: 18, color: DS.primary }}>Rp {total.toLocaleString('id-ID')}</div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 4, color: '#888' }}>
              <span style={{ fontFamily: 'Helvetica Neue', fontSize: 12 }}>Lihat detail</span>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" style={{ transform: summaryOpen ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.25s', flexShrink: 0 }}>
                <path d="M6 9l6 6 6-6" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
          </div>
          {primaryBtn(step === 0 ? 'Lanjutkan pembayaran' : 'Saya Sudah Bayar', handleMobilePaymentAction, paymentActionDisabled)}
        </div>
      )}

      {/* Summary sheet — mobile/tablet */}
      {summaryOpen && isNarrow && typeof document !== 'undefined' && createPortal(
        <>
          <div onClick={() => setSummaryOpen(false)} style={{ display: 'block', position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', zIndex: 300 }} />
          <div style={{ position: 'fixed', bottom: 0, left: 0, right: 0, background: '#fff', borderRadius: '20px 20px 0 0', padding: '8px 24px 80px', zIndex: 301, maxHeight: '85vh', overflowY: 'auto', boxShadow: '0 -8px 32px rgba(0,0,0,0.15)' }}>
            <div style={{ display: 'flex', justifyContent: 'center', paddingTop: 12, marginBottom: 8 }}>
              <div style={{ width: 40, height: 4, borderRadius: 99, background: '#DDD' }} />
            </div>
            <div style={{ display: 'flex', alignItems: 'center', marginBottom: 20 }}>
              <span style={{ fontFamily: 'Helvetica Neue', fontWeight: 700, fontSize: 18, color: DS.dark }}>Ringkasan Pesanan</span>
            </div>
            {renderOrderId}
            <div style={{ fontFamily: 'Helvetica Neue', fontWeight: 700, fontSize: 14, color: DS.dark, marginBottom: 12 }}>Ringkasan Pesanan</div>
            {renderFlights}
            <div style={{ marginTop: 14 }}>
              {renderPriceRows()}
            </div>
          </div>
        </>, document.body
      )}

      {/* Copied toast */}
      {copiedNotice && (
        <div style={{ position: 'fixed', left: '50%', bottom: isNarrow ? 116 : 24, transform: 'translateX(-50%)', zIndex: 1200, background: DS.dark, color: DS.white, borderRadius: 999, padding: '10px 16px', boxShadow: '0 10px 28px rgba(15,23,42,0.22)', fontFamily: 'Helvetica Neue', fontWeight: 700, fontSize: 13 }}>
          Berhasil Disalin
        </div>
      )}
    </div>
  );

}
