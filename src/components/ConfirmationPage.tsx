'use client';

import { useEffect, useState } from 'react';
import { Plane, TrainFront } from 'lucide-react';
import { DS } from '../lib/ds';
import { createOrderId } from '../utils/orderId';
import { AIRPORT_NAMES } from './FlightResultsPage';

function useBreakpoint() {
  const [w, setW] = useState(() => (typeof window !== 'undefined' ? window.innerWidth : 1200));
  useEffect(() => {
    const fn = () => setW(window.innerWidth);
    window.addEventListener('resize', fn);
    return () => window.removeEventListener('resize', fn);
  }, []);
  return { isMobile: w < 768, isTablet: w >= 768 && w < 1024 };
}

export interface ConfirmationBookingData {
  orderId?: string;
  pnr?: string;
  flight?: Record<string, unknown>;
  returnFlight?: Record<string, unknown> | null;
  train?: Record<string, unknown>;
  returnTrain?: Record<string, unknown> | null;
  tour?: Record<string, unknown>;
  hotel?: Record<string, unknown>;
  room?: Record<string, unknown>;
  fare?: Record<string, unknown>;
  contact?: { name?: string; email?: string; phone?: string };
  passengers?: Array<{ name?: string; type?: string; idType?: string; idNumber?: string }>;
  passenger?: { name?: string; type?: string };
  total?: number;
  subtotal?: number;
  basePrice?: number;
  baggageTotal?: number;
  protectionTotal?: number;
  addonItems?: Array<{ id: string; name: string; price: number }>;
  addonTotal?: number;
  tax?: number;
  serviceFee?: number;
  baggage?: Record<string, unknown>;
  searchParams?: Record<string, unknown>;
  seats?: Record<string, unknown>;
  paxCount?: number;
  nights?: number;
  checkInDate?: string;
  checkOutDate?: string;
  form?: Record<string, unknown>;
  promoDisc?: number;
  [key: string]: unknown;
}

interface Props {
  bookingData: ConfirmationBookingData;
  onBackHome: () => void;
}

export default function ConfirmationPage({ bookingData, onBackHome }: Props) {
  const { isMobile, isTablet } = useBreakpoint();
  const isNarrow = isMobile || isTablet;
  const [fallbackBookingRef] = useState(() =>
    createOrderId(
      bookingData?.hotel ? 'hotel'
        : bookingData?.flight ? 'flight'
        : bookingData?.train ? 'train'
        : bookingData?.tour ? 'tour'
        : 'hotel'
    )
  );
  const bookingRef = (bookingData?.orderId as string) || fallbackBookingRef;
  const [downloaded, setDownloaded] = useState(false);
  const [generatingPdf, setGeneratingPdf] = useState(false);

  const isFlight = !!(bookingData?.flight);
  const isTrain = !!(bookingData?.train);
  const isTour = !!(bookingData?.tour);

  const months = ['Jan','Feb','Mar','Apr','Mei','Jun','Jul','Agu','Sep','Okt','Nov','Des'];
  const formatDate = (d: unknown): string => {
    if (!d) return '—';
    const dt = new Date(d as string);
    return `${dt.getDate()} ${months[dt.getMonth()]} ${dt.getFullYear()}`;
  };

  const sectionTitleStyle: React.CSSProperties = {
    background: DS.n50,
    borderTop: `1px solid ${DS.n100}`,
    borderBottom: `1px solid ${DS.n100}`,
    padding: '9px 16px',
    fontFamily: 'Helvetica Neue',
    fontWeight: 700,
    fontSize: 12,
    color: DS.dark,
    textTransform: 'uppercase',
  };
  const infoLabelStyle: React.CSSProperties = { fontFamily: 'Helvetica Neue', fontSize: 12, color: DS.n400, marginBottom: 4 };
  const infoValueStyle: React.CSSProperties = { fontFamily: 'Helvetica Neue', fontWeight: 700, fontSize: 13, color: DS.dark, wordBreak: 'break-word' };

  /* ─── FLIGHT confirmation ─── */
  if (isFlight) {
    const fl = bookingData.flight as Record<string, unknown>;
    const returnFl = bookingData.returnFlight as Record<string, unknown> | null;
    const fare = bookingData.fare as Record<string, unknown> | undefined;
    const contact = bookingData.contact;
    const passengers = bookingData.passengers || [];
    const total = bookingData.total || 0;
    const searchParams = bookingData.searchParams as Record<string, unknown> | undefined;
    const isRoundTrip = !!(returnFl);
    const fareNamePergi = (fare?.name || (fare?.outbound as Record<string,unknown>)?.name || searchParams?.cabinClass || 'Ekonomi') as string;
    const fareNamePulang = (fare?.name || (fare?.return as Record<string,unknown>)?.name || searchParams?.cabinClass || 'Ekonomi') as string;
    const guestName = contact?.name || passengers?.[0]?.name || (bookingData.passenger as Record<string,unknown>)?.name as string || '-';
    const basePrice = (bookingData.basePrice as number) || 0;
    const baggageTotal = (bookingData.baggageTotal as number) || 0;
    const protectionTotal = (bookingData.protectionTotal as number) || 0;
    const paidSubtotal = basePrice + baggageTotal + protectionTotal || total;
    const paidTax = (bookingData.tax as number) || Math.round(paidSubtotal * 0.11);
    const paidServiceFee = (bookingData.serviceFee as number) || Math.round(paidSubtotal * 0.05);
    const paidTotal = (bookingData.total as number) || (paidSubtotal + paidTax + paidServiceFee);

    const renderFlightLeg = (f: Record<string, unknown>, legFareName: string, legDate: unknown) => {
      const dayNames = ['Minggu','Senin','Selasa','Rabu','Kamis','Jumat','Sabtu'];
      const monthNames = ['Januari','Februari','Maret','April','Mei','Juni','Juli','Agustus','September','Oktober','November','Desember'];
      let dateStr = '';
      if (legDate) {
        const d = new Date(legDate as string);
        if (!isNaN(d.getTime())) {
          dateStr = `${dayNames[d.getDay()]}, ${d.getDate()} ${monthNames[d.getMonth()]} ${d.getFullYear()}`;
        }
      }
      const depCode = f?.depCode as string || '';
      const arrCode = f?.arrCode as string || '';
      const depAirportName = AIRPORT_NAMES[depCode] || depCode || '---';
      const arrAirportName = AIRPORT_NAMES[arrCode] || arrCode || '---';
      const tips = [
        { icon: '✈️', text: 'Tunjukkan e-tiket dan identitas para penumpang saat check-in' },
        { icon: '🕐', text: 'Check-in paling lambat 90 menit sebelum keberangkatan' },
        { icon: 'ℹ️', text: 'Waktu tertera adalah waktu bandara setempat' },
      ];
      return (
        <div style={{ padding: isNarrow ? '16px 18px' : '20px 32px' }}>
          {/* Airline meta + date */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, marginBottom: 18, flexWrap: 'wrap' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{ width: 40, height: 40, borderRadius: 10, background: `${(f?.logoColor as string) || DS.primary}15`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, overflow: 'hidden', padding: 4 }}>
                <img src={f?.logo as string} alt={f?.airline as string} style={{ width: '100%', height: '100%', objectFit: 'contain' }}
                  onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = 'none'; if (e.currentTarget.parentElement) e.currentTarget.parentElement.innerHTML = "<span style='font-size:20px'>✈️</span>"; }} />
              </div>
              <div>
                <div style={{ fontFamily: 'Helvetica Neue', fontWeight: 700, fontSize: 14, color: DS.dark }}>{f?.airline as string}</div>
                <div style={{ fontFamily: 'Helvetica Neue', fontSize: 12, color: DS.n500 }}>{f?.flightNo as string} · Subclass {legFareName}</div>
              </div>
            </div>
            {dateStr && <div style={{ fontFamily: 'Helvetica Neue', fontWeight: 600, fontSize: 13, color: DS.n600 }}>{dateStr}</div>}
          </div>

          {/* NARROW (mobile + tablet): vertical timeline */}
          {isNarrow ? (
            <div style={{ background: DS.n50, borderRadius: 12, padding: '14px 16px', display: 'flex', gap: 12, marginBottom: 16 }}>
              {/* Rail */}
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', paddingTop: 4 }}>
                <div style={{ width: 10, height: 10, borderRadius: '50%', background: DS.primary, border: `2px solid ${DS.white}`, boxShadow: `0 0 0 2px ${DS.primary}`, flexShrink: 0 }} />
                <div style={{ width: 2, flex: 1, minHeight: 36, background: `linear-gradient(to bottom, ${DS.primary}, ${DS.n300})`, borderRadius: 1, margin: '4px 0' }} />
                <div style={{ width: 10, height: 10, borderRadius: '50%', background: DS.n400, border: `2px solid ${DS.white}`, boxShadow: `0 0 0 2px ${DS.n400}`, flexShrink: 0 }} />
              </div>
              {/* Info */}
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'space-between', minWidth: 0 }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
                    <span style={{ fontFamily: 'Helvetica Neue', fontWeight: 800, fontSize: 22, color: DS.dark, lineHeight: 1 }}>{(f?.dep as string) || '--:--'}</span>
                    <span style={{ fontFamily: 'Helvetica Neue', fontWeight: 700, fontSize: 13, color: DS.n500 }}>{depCode}</span>
                  </div>
                  <div style={{ fontFamily: 'Helvetica Neue', fontSize: 12, color: DS.n600, marginTop: 2 }}>{depAirportName}</div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '10px 0' }}>
                  <Plane size={11} color={DS.primary} style={{ transform: 'rotate(90deg)', flexShrink: 0 }} />
                  <span style={{ fontFamily: 'Helvetica Neue', fontSize: 12, color: DS.n500 }}>{(f?.duration as string) || ''}</span>
                  <span style={{ color: DS.n300 }}>·</span>
                  <span style={{ fontFamily: 'Helvetica Neue', fontSize: 12, fontWeight: 600, color: f?.direct !== false ? DS.successText : DS.dark }}>
                    {f?.direct !== false ? 'Langsung' : '1 Transit'}
                  </span>
                </div>
                <div>
                  <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
                    <span style={{ fontFamily: 'Helvetica Neue', fontWeight: 800, fontSize: 22, color: DS.dark, lineHeight: 1 }}>{(f?.arr as string) || '--:--'}</span>
                    <span style={{ fontFamily: 'Helvetica Neue', fontWeight: 700, fontSize: 13, color: DS.n500 }}>{arrCode}</span>
                  </div>
                  <div style={{ fontFamily: 'Helvetica Neue', fontSize: 12, color: DS.n600, marginTop: 2 }}>{arrAirportName}</div>
                </div>
              </div>
            </div>
          ) : (
            /* DESKTOP: horizontal strip */
            <div style={{ display: 'flex', alignItems: 'center', background: DS.n50, borderRadius: 12, padding: '18px 24px', marginBottom: 16 }}>
              <div style={{ textAlign: 'left', flexShrink: 0 }}>
                <div style={{ fontFamily: 'Helvetica Neue', fontWeight: 800, fontSize: 32, color: DS.dark, lineHeight: 1 }}>{(f?.dep as string) || '--:--'}</div>
                <div style={{ fontFamily: 'Helvetica Neue', fontWeight: 700, fontSize: 15, color: DS.dark, marginTop: 4 }}>{depCode}</div>
                <div style={{ fontFamily: 'Helvetica Neue', fontSize: 11, color: DS.n500, marginTop: 2, maxWidth: 120 }}>{depAirportName}</div>
              </div>
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, padding: '0 16px' }}>
                <div style={{ fontFamily: 'Helvetica Neue', fontSize: 11, color: DS.n400 }}>{(f?.duration as string) || ''}</div>
                <div style={{ display: 'flex', alignItems: 'center', width: '100%', gap: 4 }}>
                  <div style={{ flex: 1, height: 1.5, background: DS.n300, borderRadius: 1 }} />
                  <Plane size={18} color={DS.primary} style={{ flexShrink: 0, transform: 'rotate(90deg)' }} />
                  <div style={{ flex: 1, height: 1.5, background: DS.n300, borderRadius: 1 }} />
                </div>
                <div style={{ fontFamily: 'Helvetica Neue', fontSize: 11, fontWeight: 600, color: f?.direct !== false ? DS.successText : DS.dark }}>
                  {f?.direct !== false ? 'Langsung' : '1 Transit'}
                </div>
              </div>
              <div style={{ textAlign: 'right', flexShrink: 0 }}>
                <div style={{ fontFamily: 'Helvetica Neue', fontWeight: 800, fontSize: 32, color: DS.dark, lineHeight: 1 }}>{(f?.arr as string) || '--:--'}</div>
                <div style={{ fontFamily: 'Helvetica Neue', fontWeight: 700, fontSize: 15, color: DS.dark, marginTop: 4 }}>{arrCode}</div>
                <div style={{ fontFamily: 'Helvetica Neue', fontSize: 11, color: DS.n500, marginTop: 2, maxWidth: 120, textAlign: 'right' }}>{arrAirportName}</div>
              </div>
            </div>
          )}

          {/* Tips */}
          <div style={{ display: 'grid', gridTemplateColumns: isNarrow ? '1fr' : 'repeat(3,1fr)', gap: 10, paddingTop: 16, borderTop: `1px solid ${DS.n100}` }}>
            {tips.map(({ icon, text }) => (
              <div key={text} style={{ display: 'flex', gap: 8, alignItems: 'flex-start' }}>
                <span style={{ fontSize: 16, flexShrink: 0, lineHeight: 1.3 }}>{icon}</span>
                <span style={{ fontFamily: 'Helvetica Neue', fontSize: 11, color: DS.n600, lineHeight: 1.5 }}>{text}</span>
              </div>
            ))}
          </div>
        </div>
      );
    };

    return (
      <div style={{ minHeight: '100vh', background: DS.surface, padding: isNarrow ? '16px 12px 72px' : '32px 20px 80px' }}>
        <div style={{ maxWidth: 960, margin: '0 auto' }}>
          <div style={{ background: DS.white, border: `1px solid ${DS.n100}`, borderRadius: 8, padding: isNarrow ? '18px 16px' : '22px 28px', marginBottom: 18, display: 'flex', alignItems: isNarrow ? 'flex-start' : 'center', flexDirection: isNarrow ? 'column' : 'row', gap: 16, boxShadow: '0 6px 18px rgba(15,23,42,0.04)' }}>
            <div style={{ width: 44, height: 44, borderRadius: '50%', background: DS.successBg, color: DS.successText, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M5 13l4 4L19 7" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" /></svg>
            </div>
            <div>
              <h1 style={{ fontFamily: 'Helvetica Neue', fontWeight: 700, fontSize: isNarrow ? 20 : 24, color: DS.dark, margin: '0 0 4px' }}>Tiket berhasil dipesan</h1>
              <p style={{ fontFamily: 'Helvetica Neue', fontSize: 14, color: DS.n500, margin: 0, lineHeight: 1.45 }}>
                E-Voucher dan detail pembayaran telah dikirim ke <strong style={{ color: DS.dark }}>{contact?.email || 'email@example.com'}</strong>
              </p>
            </div>
          </div>

          <div style={{ background: DS.white, border: `1px solid ${DS.n200}`, borderRadius: 8, overflow: 'hidden', boxShadow: '0 8px 24px rgba(15,23,42,0.06)' }}>
            <div style={{ padding: isNarrow ? '22px 18px 18px' : '32px 32px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexDirection: isNarrow ? 'column' : 'row', gap: 18, flexWrap: 'wrap' }}>
              <div>
                <div style={{ fontFamily: 'Helvetica Neue', fontWeight: 700, fontSize: isNarrow ? 24 : 30, color: DS.dark, marginBottom: 4 }}>Flight Voucher</div>
                <div style={{ fontFamily: 'Helvetica Neue', fontSize: 13, color: DS.n400, fontStyle: 'italic' }}>E-Tiket Penerbangan</div>
              </div>
              <div style={{ textAlign: isNarrow ? 'left' : 'right', width: isNarrow ? '100%' : 'auto' }}>
                <div style={{ marginBottom: 10 }}>
                  <div style={{ fontFamily: 'Helvetica Neue', fontSize: 11, color: DS.n400, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 4 }}>
                    Kode Booking Maskapai (PNR)
                  </div>
                  <div style={{ fontFamily: 'Helvetica Neue', fontWeight: 800, fontSize: isNarrow ? 28 : 34, color: DS.primary, letterSpacing: '0.12em', lineHeight: 1 }}>
                    {(bookingData?.pnr as string) || bookingRef?.slice(-6).toUpperCase()}
                  </div>
                </div>
                <div style={{ marginBottom: 10 }}>
                  <div style={{ fontFamily: 'Helvetica Neue', fontSize: 11, color: DS.n400, marginBottom: 3 }}>Order ID</div>
                  <div style={{ display: 'inline-flex', alignItems: 'center', background: DS.n100, color: DS.n600, borderRadius: 4, padding: '4px 10px', fontFamily: 'Helvetica Neue', fontWeight: 600, fontSize: 12, letterSpacing: '0.04em' }}>
                    {bookingRef}
                  </div>
                </div>
                <span style={{ display: 'inline-flex', background: DS.successBg, color: DS.successText, border: `1px solid ${DS.success}33`, borderRadius: 4, padding: '4px 10px', fontFamily: 'Helvetica Neue', fontWeight: 700, fontSize: 12, letterSpacing: '0.04em' }}>
                  BISA REFUND
                </span>
              </div>
            </div>

            <div style={sectionTitleStyle}>Detail Pemesan</div>
            <div style={{ padding: isNarrow ? '16px 18px 18px' : '18px 32px 20px', display: 'grid', gridTemplateColumns: isNarrow ? '1fr' : 'repeat(3, minmax(0, 1fr))', gap: isNarrow ? 14 : 28 }}>
              <div><div style={infoLabelStyle}>Nama Lengkap</div><div style={infoValueStyle}>{guestName}</div></div>
              <div><div style={infoLabelStyle}>Email</div><div style={infoValueStyle}>{contact?.email || '-'}</div></div>
              <div><div style={infoLabelStyle}>Nomor HP</div><div style={infoValueStyle}>{contact?.phone || '-'}</div></div>
            </div>

            <div style={sectionTitleStyle}>{isRoundTrip ? 'Detail Penerbangan — Pergi' : 'Detail Penerbangan'}</div>
            {renderFlightLeg(fl, fareNamePergi, searchParams?.depDate)}

            {isRoundTrip && returnFl && (
              <>
                <div style={sectionTitleStyle}>Detail Penerbangan — Pulang</div>
                {renderFlightLeg(returnFl, fareNamePulang, searchParams?.retDate)}
              </>
            )}

            <div style={sectionTitleStyle}>Detail Penumpang</div>
            <div style={{ padding: isNarrow ? '0 18px 18px' : '0 32px 20px', overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontFamily: 'Helvetica Neue', fontSize: 13, color: DS.dark }}>
                <thead>
                  <tr style={{ borderBottom: `1px solid ${DS.n200}`, background: DS.n50 }}>
                    <th style={{ textAlign: 'left', padding: '11px 12px', fontWeight: 700, color: DS.n600, fontSize: 12 }}>No.</th>
                    <th style={{ textAlign: 'left', padding: '11px 12px', fontWeight: 700, color: DS.n600, fontSize: 12 }}>Nama Penumpang</th>
                    <th style={{ textAlign: 'left', padding: '11px 12px', fontWeight: 700, color: DS.n600, fontSize: 12 }}>Jenis Tiket</th>
                    <th style={{ textAlign: 'left', padding: '11px 12px', fontWeight: 700, color: DS.n600, fontSize: 12 }}>Bagasi</th>
                  </tr>
                </thead>
                <tbody>
                  {(passengers.length > 0 ? passengers : [{ name: guestName, type: 'Dewasa' }]).map((p, i) => {
                    const baggage = bookingData.baggage as Record<string, unknown> | undefined;
                    const baggageVal = isRoundTrip
                      ? ((baggage?.outbound as Record<string,unknown>)?.[i] || baggage?.outbound || '-')
                      : ((baggage as Record<string,unknown>)?.[i] || baggage || '-');
                    const baggageStr = typeof baggageVal === 'object' && baggageVal
                      ? ((baggageVal as Record<string,unknown>)?.label || (baggageVal as Record<string,unknown>)?.weight || '-') as string
                      : String(baggageVal || '-');
                    return (
                      <tr key={i} style={{ borderBottom: `1px solid ${DS.n100}` }}>
                        <td style={{ padding: '13px 12px' }}>{i + 1}</td>
                        <td style={{ padding: '13px 12px', fontWeight: 700 }}>{p?.name || '-'}</td>
                        <td style={{ padding: '13px 12px' }}>{p?.type || 'Dewasa'}</td>
                        <td style={{ padding: '13px 12px' }}>{baggageStr}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            <div style={sectionTitleStyle}>Detail Pembayaran</div>
            <div style={{ padding: isNarrow ? '18px 18px 24px' : '20px 32px 32px', display: 'grid', gridTemplateColumns: isNarrow ? '1fr' : 'minmax(0, 1fr) 320px', gap: isNarrow ? 16 : 28, alignItems: 'start' }}>
              <div style={{ border: `1px solid ${DS.n200}`, borderRadius: 6, overflow: 'hidden' }}>
                <div style={{ overflowX: 'auto' }}>
                  <div style={{ display: 'grid', gridTemplateColumns: '52px 1fr 72px 132px', minWidth: 360, background: DS.n50, borderBottom: `1px solid ${DS.n200}`, fontFamily: 'Helvetica Neue', fontWeight: 700, fontSize: 12, color: DS.n600 }}>
                    <div style={{ padding: '10px 8px' }}>No</div>
                    <div style={{ padding: '10px 8px' }}>Deskripsi</div>
                    <div style={{ padding: '10px 8px', textAlign: 'center' }}>Pax</div>
                    <div style={{ padding: '10px 8px', textAlign: 'right' }}>Total</div>
                  </div>
                  {isRoundTrip ? (
                    <>
                      <div style={{ display: 'grid', gridTemplateColumns: '52px 1fr 72px 132px', minWidth: 360, fontFamily: 'Helvetica Neue', fontSize: 13, color: DS.dark, borderBottom: `1px solid ${DS.n100}` }}>
                        <div style={{ padding: '12px 8px' }}>1</div>
                        <div style={{ padding: '12px 8px' }}><strong>Tiket Pergi</strong><div style={{ color: DS.n500, marginTop: 4 }}>{fl?.airline as string}{fl?.flightNo ? ` · ${fl.flightNo}` : ''}, {fareNamePergi}</div></div>
                        <div style={{ padding: '12px 8px', textAlign: 'center' }}>{passengers?.length || 1}</div>
                        <div style={{ padding: '12px 8px', textAlign: 'right' }}>Rp {Math.round(paidSubtotal / 2).toLocaleString('id-ID')}</div>
                      </div>
                      <div style={{ display: 'grid', gridTemplateColumns: '52px 1fr 72px 132px', minWidth: 360, fontFamily: 'Helvetica Neue', fontSize: 13, color: DS.dark }}>
                        <div style={{ padding: '12px 8px' }}>2</div>
                        <div style={{ padding: '12px 8px' }}><strong>Tiket Pulang</strong><div style={{ color: DS.n500, marginTop: 4 }}>{returnFl?.airline as string}{returnFl?.flightNo ? ` · ${returnFl.flightNo}` : ''}, {fareNamePulang}</div></div>
                        <div style={{ padding: '12px 8px', textAlign: 'center' }}>{passengers?.length || 1}</div>
                        <div style={{ padding: '12px 8px', textAlign: 'right' }}>Rp {(paidSubtotal - Math.round(paidSubtotal / 2)).toLocaleString('id-ID')}</div>
                      </div>
                    </>
                  ) : (
                    <div style={{ display: 'grid', gridTemplateColumns: '52px 1fr 72px 132px', minWidth: 360, fontFamily: 'Helvetica Neue', fontSize: 13, color: DS.dark }}>
                      <div style={{ padding: '12px 8px' }}>1</div>
                      <div style={{ padding: '12px 8px' }}><strong>Tiket Pesawat</strong><div style={{ color: DS.n500, marginTop: 4 }}>{fl?.airline as string}{fl?.flightNo ? ` · ${fl.flightNo}` : ''}, {fareNamePergi}</div></div>
                      <div style={{ padding: '12px 8px', textAlign: 'center' }}>{passengers?.length || 1}</div>
                      <div style={{ padding: '12px 8px', textAlign: 'right' }}>Rp {paidSubtotal.toLocaleString('id-ID')}</div>
                    </div>
                  )}
                </div>
              </div>
              <div style={{ border: `1px solid ${DS.n200}`, borderRadius: 6, overflow: 'hidden', fontFamily: 'Helvetica Neue', fontSize: 13 }}>
                {([['Subtotal', paidSubtotal], ['Pajak', paidTax], ['Biaya layanan', paidServiceFee]] as [string, number][]).map(([label, value]) => (
                  <div key={label} style={{ display: 'flex', justifyContent: 'space-between', gap: 12, padding: '12px 14px', borderBottom: `1px solid ${DS.n100}` }}>
                    <span style={{ color: DS.n600 }}>{label}</span>
                    <strong style={{ color: DS.dark }}>Rp {Number(value).toLocaleString('id-ID')}</strong>
                  </div>
                ))}
                <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, padding: '16px 14px', background: DS.n50 }}>
                  <span style={{ fontWeight: 700, color: DS.dark }}>Total Pembayaran</span>
                  <strong style={{ color: DS.primary, fontSize: 16 }}>Rp {paidTotal.toLocaleString('id-ID')}</strong>
                </div>
              </div>
            </div>

            <div style={sectionTitleStyle}>Informasi Penting</div>
            <div style={{ padding: isNarrow ? '18px 18px 24px' : '20px 32px 30px', display: 'grid', gridTemplateColumns: isNarrow ? '1fr' : '1fr 1fr', gap: isNarrow ? 0 : 32, fontFamily: 'Helvetica Neue', fontSize: 13, color: DS.n700, lineHeight: 1.7 }}>
              <ul style={{ margin: 0, paddingLeft: 18 }}>
                <li>Tunjukkan E-Voucher ini dan KTP/Paspor asli saat check-in di bandara.</li>
                <li>Disarankan tiba di bandara minimal <strong>2 jam</strong> sebelum keberangkatan.</li>
              </ul>
              <ul style={{ margin: 0, paddingLeft: 18 }}>
                <li>Sebutkan kode booking <strong>{bookingRef}</strong> jika diminta petugas maskapai.</li>
                <li>Tiket tidak dapat dipindahtangankan kepada pihak lain.</li>
              </ul>
            </div>
          </div>

          <div style={{ marginTop: isNarrow ? 20 : 32, display: 'flex', gap: 12, justifyContent: 'center', flexDirection: isNarrow ? 'column' : 'row', flexWrap: 'wrap' }}>
            <button onClick={() => setDownloaded(true)} style={{ width: isNarrow ? '100%' : 'auto', padding: '14px 28px', borderRadius: 999, border: `1.5px solid ${DS.primary}`, background: DS.white, color: DS.primary, cursor: 'pointer', fontFamily: 'Helvetica Neue', fontWeight: 700, fontSize: 14 }}>
              {downloaded ? '✓ E-Voucher Tersimpan' : 'Unduh E-Voucher'}
            </button>
            <button onClick={onBackHome} style={{ width: isNarrow ? '100%' : 'auto', padding: '14px 28px', borderRadius: 999, border: 'none', background: DS.accent, color: DS.white, cursor: 'pointer', fontFamily: 'Helvetica Neue', fontWeight: 700, fontSize: 14, boxShadow: '0 4px 16px rgba(53,107,166,0.24)' }}>
              Selesai &amp; Ke Beranda
            </button>
          </div>
        </div>
      </div>
    );
  }

  /* ─── TRAIN confirmation ─── */
  if (isTrain) {
    const tr = bookingData.train as Record<string, unknown>;
    const retTr = bookingData.returnTrain as Record<string, unknown> | null;
    const contact = bookingData.contact;
    const passengers = bookingData.passengers || [];
    const total = bookingData.total || 0;
    const searchParams = bookingData.searchParams as Record<string, unknown> | undefined;
    const seats = bookingData.seats as Record<string, unknown> | undefined;
    const isRoundTrip = !!(retTr);
    const guestName = contact?.name || passengers?.[0]?.name || (bookingData.passenger as Record<string,unknown>)?.name as string || '-';
    const paidSubtotal = total;
    const paidTax = Math.round(paidSubtotal * 0.11);
    const paidServiceFee = Math.round(paidSubtotal * 0.05);
    const paidTotal = paidSubtotal + paidTax + paidServiceFee;

    const renderTrainLeg = (t: Record<string, unknown>, legDate: unknown) => {
      const dayNames = ['Minggu','Senin','Selasa','Rabu','Kamis','Jumat','Sabtu'];
      const monthNames = ['Januari','Februari','Maret','April','Mei','Juni','Juli','Agustus','September','Oktober','November','Desember'];
      let dateStr = '';
      if (legDate) {
        const d = new Date(legDate as string);
        if (!isNaN(d.getTime())) dateStr = `${dayNames[d.getDay()]}, ${d.getDate()} ${monthNames[d.getMonth()]} ${d.getFullYear()}`;
      }
      return (
        <div style={{ padding: isNarrow ? '16px 18px' : '20px 32px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, marginBottom: 18, flexWrap: 'wrap' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{ width: 40, height: 40, borderRadius: 10, background: DS.primaryLight, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <TrainFront size={22} color={DS.primary} />
              </div>
              <div>
                <div style={{ fontFamily: 'Helvetica Neue', fontWeight: 700, fontSize: 14, color: DS.dark }}>{t?.trainName as string} {t?.code as string}</div>
                <div style={{ fontFamily: 'Helvetica Neue', fontSize: 12, color: DS.n500 }}>{t?.trainClass as string}{t?.subClass ? ` · Subkelas ${t.subClass}` : ''}</div>
              </div>
            </div>
            {dateStr && <div style={{ fontFamily: 'Helvetica Neue', fontWeight: 600, fontSize: 13, color: DS.n600 }}>{dateStr}</div>}
          </div>

          {isNarrow ? (
            <div style={{ background: DS.n50, borderRadius: 12, padding: '14px 16px', display: 'flex', gap: 12, marginBottom: 0 }}>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', paddingTop: 4 }}>
                <div style={{ width: 10, height: 10, borderRadius: '50%', background: DS.primary, border: `2px solid ${DS.white}`, boxShadow: `0 0 0 2px ${DS.primary}`, flexShrink: 0 }} />
                <div style={{ width: 2, flex: 1, minHeight: 36, background: `linear-gradient(to bottom, ${DS.primary}, ${DS.n300})`, borderRadius: 1, margin: '4px 0' }} />
                <div style={{ width: 10, height: 10, borderRadius: '50%', background: DS.n400, border: `2px solid ${DS.white}`, boxShadow: `0 0 0 2px ${DS.n400}`, flexShrink: 0 }} />
              </div>
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'space-between', minWidth: 0 }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
                    <span style={{ fontFamily: 'Helvetica Neue', fontWeight: 800, fontSize: 22, color: DS.dark, lineHeight: 1 }}>{(t?.dep as string) || '--:--'}</span>
                    <span style={{ fontFamily: 'Helvetica Neue', fontWeight: 700, fontSize: 13, color: DS.n500 }}>{(t?.depCode as string) || '---'}</span>
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '10px 0' }}>
                  <TrainFront size={11} color={DS.primary} style={{ flexShrink: 0 }} />
                  <span style={{ fontFamily: 'Helvetica Neue', fontSize: 11, color: DS.n500 }}>{(t?.duration as string) || ''}</span>
                  <span style={{ color: DS.n300 }}>·</span>
                  <span style={{ fontFamily: 'Helvetica Neue', fontWeight: 600, fontSize: 11, color: DS.successText }}>Terkonfirmasi</span>
                </div>
                <div>
                  <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
                    <span style={{ fontFamily: 'Helvetica Neue', fontWeight: 800, fontSize: 22, color: DS.dark }}>{(t?.arr as string) || '--:--'}</span>
                    <span style={{ fontFamily: 'Helvetica Neue', fontWeight: 700, fontSize: 13, color: DS.n500 }}>{(t?.arrCode as string) || '---'}</span>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div style={{ display: 'flex', alignItems: 'center', gap: 0, background: DS.n50, borderRadius: 12, padding: '18px 24px' }}>
              <div style={{ textAlign: 'left', flexShrink: 0 }}>
                <div style={{ fontFamily: 'Helvetica Neue', fontWeight: 800, fontSize: 32, color: DS.dark, lineHeight: 1 }}>{(t?.dep as string) || '--:--'}</div>
                <div style={{ fontFamily: 'Helvetica Neue', fontWeight: 700, fontSize: 15, color: DS.dark, marginTop: 4 }}>{(t?.depCode as string) || '---'}</div>
              </div>
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, padding: '0 12px' }}>
                <div style={{ fontFamily: 'Helvetica Neue', fontSize: 11, color: DS.n400 }}>{(t?.duration as string) || ''}</div>
                <div style={{ display: 'flex', alignItems: 'center', width: '100%', gap: 4 }}>
                  <div style={{ flex: 1, height: 1.5, background: DS.n300, borderRadius: 1 }} />
                  <TrainFront size={14} color={DS.primary} style={{ flexShrink: 0 }} />
                  <div style={{ flex: 1, height: 1.5, background: DS.n300, borderRadius: 1 }} />
                </div>
                <div style={{ fontFamily: 'Helvetica Neue', fontSize: 11, fontWeight: 600, color: DS.successText }}>Terkonfirmasi</div>
              </div>
              <div style={{ textAlign: 'right', flexShrink: 0 }}>
                <div style={{ fontFamily: 'Helvetica Neue', fontWeight: 800, fontSize: 32, color: DS.dark, lineHeight: 1 }}>{(t?.arr as string) || '--:--'}</div>
                <div style={{ fontFamily: 'Helvetica Neue', fontWeight: 700, fontSize: 15, color: DS.dark, marginTop: 4 }}>{(t?.arrCode as string) || '---'}</div>
              </div>
            </div>
          )}

          <div style={{ display: 'grid', gridTemplateColumns: isNarrow ? '1fr' : 'repeat(3,1fr)', gap: 10, marginTop: 16, paddingTop: 16, borderTop: `1px solid ${DS.n100}` }}>
            {[
              { icon: '🚆', text: 'Tunjukkan e-tiket dan identitas di loket atau gerbang otomatis' },
              { icon: '🕐', text: 'Datang minimal 30 menit sebelum keberangkatan' },
              { icon: 'ℹ️', text: 'Cetak boarding pass di mesin tiket atau loket stasiun' },
            ].map(({ icon, text }) => (
              <div key={text} style={{ display: 'flex', gap: 8, alignItems: 'flex-start' }}>
                <span style={{ fontSize: 16, flexShrink: 0, lineHeight: 1.3 }}>{icon}</span>
                <span style={{ fontFamily: 'Helvetica Neue', fontSize: 11, color: DS.n600, lineHeight: 1.5 }}>{text}</span>
              </div>
            ))}
          </div>
        </div>
      );
    };

    return (
      <div style={{ minHeight: '100vh', background: DS.surface, padding: isNarrow ? '16px 12px 72px' : '32px 20px 80px' }}>
        <div style={{ maxWidth: 960, margin: '0 auto' }}>
          <div style={{ background: DS.white, border: `1px solid ${DS.n100}`, borderRadius: 8, padding: isNarrow ? '18px 16px' : '22px 28px', marginBottom: 18, display: 'flex', alignItems: isNarrow ? 'flex-start' : 'center', flexDirection: isNarrow ? 'column' : 'row', gap: 16, boxShadow: '0 6px 18px rgba(15,23,42,0.04)' }}>
            <div style={{ width: 44, height: 44, borderRadius: '50%', background: DS.successBg, color: DS.successText, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M5 13l4 4L19 7" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" /></svg>
            </div>
            <div>
              <h1 style={{ fontFamily: 'Helvetica Neue', fontWeight: 700, fontSize: isNarrow ? 20 : 24, color: DS.dark, margin: '0 0 4px' }}>Tiket kereta berhasil dipesan</h1>
              <p style={{ fontFamily: 'Helvetica Neue', fontSize: 14, color: DS.n500, margin: 0, lineHeight: 1.45 }}>
                E-Tiket dan detail pembayaran telah dikirim ke <strong style={{ color: DS.dark }}>{contact?.email || 'email@example.com'}</strong>
              </p>
            </div>
          </div>

          <div style={{ background: DS.white, border: `1px solid ${DS.n200}`, borderRadius: 8, overflow: 'hidden', boxShadow: '0 8px 24px rgba(15,23,42,0.06)' }}>
            <div style={{ padding: isNarrow ? '22px 18px 18px' : '32px 32px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexDirection: isNarrow ? 'column' : 'row', gap: 18, flexWrap: 'wrap' }}>
              <div>
                <div style={{ fontFamily: 'Helvetica Neue', fontWeight: 700, fontSize: isNarrow ? 24 : 30, color: DS.dark, marginBottom: 4 }}>Train Voucher</div>
                <div style={{ fontFamily: 'Helvetica Neue', fontSize: 13, color: DS.n400, fontStyle: 'italic' }}>E-Tiket Kereta Api</div>
              </div>
              <div style={{ textAlign: isNarrow ? 'left' : 'right', width: isNarrow ? '100%' : 'auto' }}>
                <div style={{ marginBottom: 10 }}>
                  <div style={{ fontFamily: 'Helvetica Neue', fontSize: 11, color: DS.n400, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 4 }}>
                    Kode Booking Kereta
                  </div>
                  <div style={{ fontFamily: 'Helvetica Neue', fontWeight: 800, fontSize: isNarrow ? 28 : 34, color: DS.primary, letterSpacing: '0.12em', lineHeight: 1 }}>
                    {bookingRef?.slice(-8).toUpperCase()}
                  </div>
                </div>
                <div style={{ marginBottom: 10 }}>
                  <div style={{ fontFamily: 'Helvetica Neue', fontSize: 11, color: DS.n400, marginBottom: 3 }}>Order ID</div>
                  <div style={{ display: 'inline-flex', alignItems: 'center', background: DS.n100, color: DS.n600, borderRadius: 4, padding: '4px 10px', fontFamily: 'Helvetica Neue', fontWeight: 600, fontSize: 12, letterSpacing: '0.04em' }}>
                    {bookingRef}
                  </div>
                </div>
                <span style={{ display: 'inline-flex', background: DS.successBg, color: DS.successText, border: `1px solid ${DS.success}33`, borderRadius: 4, padding: '4px 10px', fontFamily: 'Helvetica Neue', fontWeight: 700, fontSize: 12, letterSpacing: '0.04em' }}>
                  TERKONFIRMASI
                </span>
              </div>
            </div>

            <div style={sectionTitleStyle}>Detail Pemesan</div>
            <div style={{ padding: isNarrow ? '16px 18px 18px' : '18px 32px 20px', display: 'grid', gridTemplateColumns: isNarrow ? '1fr' : 'repeat(3, minmax(0, 1fr))', gap: isNarrow ? 14 : 28 }}>
              <div><div style={infoLabelStyle}>Nama Lengkap</div><div style={infoValueStyle}>{guestName}</div></div>
              <div><div style={infoLabelStyle}>Email</div><div style={infoValueStyle}>{contact?.email || '-'}</div></div>
              <div><div style={infoLabelStyle}>Nomor HP</div><div style={infoValueStyle}>{contact?.phone || '-'}</div></div>
            </div>

            <div style={sectionTitleStyle}>{isRoundTrip ? 'Detail Perjalanan — Pergi' : 'Detail Perjalanan'}</div>
            {renderTrainLeg(tr, searchParams?.departDate)}

            {isRoundTrip && retTr && (
              <>
                <div style={sectionTitleStyle}>Detail Perjalanan — Pulang</div>
                {renderTrainLeg(retTr, searchParams?.returnDate)}
              </>
            )}

            <div style={sectionTitleStyle}>Detail Penumpang</div>
            <div style={{ padding: isNarrow ? '0 18px 18px' : '0 32px 20px', overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontFamily: 'Helvetica Neue', fontSize: 13, color: DS.dark }}>
                <thead>
                  <tr style={{ borderBottom: `1px solid ${DS.n200}`, background: DS.n50 }}>
                    <th style={{ textAlign: 'left', padding: '11px 12px', fontWeight: 700, color: DS.n600, fontSize: 12 }}>No.</th>
                    <th style={{ textAlign: 'left', padding: '11px 12px', fontWeight: 700, color: DS.n600, fontSize: 12 }}>Nama Penumpang</th>
                    <th style={{ textAlign: 'left', padding: '11px 12px', fontWeight: 700, color: DS.n600, fontSize: 12 }}>Jenis</th>
                    <th style={{ textAlign: 'left', padding: '11px 12px', fontWeight: 700, color: DS.n600, fontSize: 12 }}>Kursi Pergi</th>
                    {isRoundTrip && <th style={{ textAlign: 'left', padding: '11px 12px', fontWeight: 700, color: DS.n600, fontSize: 12 }}>Kursi Pulang</th>}
                  </tr>
                </thead>
                <tbody>
                  {(passengers.length > 0 ? passengers : [{ name: guestName, type: 'Dewasa' }]).map((p, i) => (
                    <tr key={i} style={{ borderBottom: `1px solid ${DS.n100}` }}>
                      <td style={{ padding: '13px 12px' }}>{i + 1}</td>
                      <td style={{ padding: '13px 12px', fontWeight: 700 }}>{p?.name || '-'}</td>
                      <td style={{ padding: '13px 12px' }}>{p?.type || 'Dewasa'}</td>
                      <td style={{ padding: '13px 12px' }}>{(seats?.out as Record<string,unknown>)?.[i] as string || (seats as Record<string,unknown>)?.[i] as string || '-'}</td>
                      {isRoundTrip && <td style={{ padding: '13px 12px' }}>{(seats?.ret as Record<string,unknown>)?.[i] as string || '-'}</td>}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div style={sectionTitleStyle}>Detail Pembayaran</div>
            <div style={{ padding: isNarrow ? '18px 18px 24px' : '20px 32px 32px', display: 'grid', gridTemplateColumns: isNarrow ? '1fr' : 'minmax(0, 1fr) 320px', gap: isNarrow ? 16 : 28, alignItems: 'start' }}>
              <div style={{ border: `1px solid ${DS.n200}`, borderRadius: 6, overflow: 'hidden' }}>
                <div style={{ overflowX: 'auto' }}>
                  <div style={{ display: 'grid', gridTemplateColumns: '52px 1fr 72px 132px', minWidth: 360, background: DS.n50, borderBottom: `1px solid ${DS.n200}`, fontFamily: 'Helvetica Neue', fontWeight: 700, fontSize: 12, color: DS.n600 }}>
                    <div style={{ padding: '10px 8px' }}>No</div>
                    <div style={{ padding: '10px 8px' }}>Deskripsi</div>
                    <div style={{ padding: '10px 8px', textAlign: 'center' }}>Pax</div>
                    <div style={{ padding: '10px 8px', textAlign: 'right' }}>Total</div>
                  </div>
                  {isRoundTrip ? (
                    <>
                      <div style={{ display: 'grid', gridTemplateColumns: '52px 1fr 72px 132px', minWidth: 360, fontFamily: 'Helvetica Neue', fontSize: 13, color: DS.dark, borderBottom: `1px solid ${DS.n100}` }}>
                        <div style={{ padding: '12px 8px' }}>1</div>
                        <div style={{ padding: '12px 8px' }}><strong>Tiket Pergi</strong><div style={{ color: DS.n500, marginTop: 4 }}>{tr?.trainName as string} {tr?.code as string}, {tr?.trainClass as string}</div></div>
                        <div style={{ padding: '12px 8px', textAlign: 'center' }}>{passengers?.length || 1}</div>
                        <div style={{ padding: '12px 8px', textAlign: 'right' }}>Rp {Math.round(paidSubtotal / 2).toLocaleString('id-ID')}</div>
                      </div>
                      <div style={{ display: 'grid', gridTemplateColumns: '52px 1fr 72px 132px', minWidth: 360, fontFamily: 'Helvetica Neue', fontSize: 13, color: DS.dark }}>
                        <div style={{ padding: '12px 8px' }}>2</div>
                        <div style={{ padding: '12px 8px' }}><strong>Tiket Pulang</strong><div style={{ color: DS.n500, marginTop: 4 }}>{retTr?.trainName as string} {retTr?.code as string}, {retTr?.trainClass as string}</div></div>
                        <div style={{ padding: '12px 8px', textAlign: 'center' }}>{passengers?.length || 1}</div>
                        <div style={{ padding: '12px 8px', textAlign: 'right' }}>Rp {(paidSubtotal - Math.round(paidSubtotal / 2)).toLocaleString('id-ID')}</div>
                      </div>
                    </>
                  ) : (
                    <div style={{ display: 'grid', gridTemplateColumns: '52px 1fr 72px 132px', minWidth: 360, fontFamily: 'Helvetica Neue', fontSize: 13, color: DS.dark }}>
                      <div style={{ padding: '12px 8px' }}>1</div>
                      <div style={{ padding: '12px 8px' }}><strong>Tiket Kereta</strong><div style={{ color: DS.n500, marginTop: 4 }}>{tr?.trainName as string} {tr?.code as string}, {tr?.trainClass as string}</div></div>
                      <div style={{ padding: '12px 8px', textAlign: 'center' }}>{passengers?.length || 1}</div>
                      <div style={{ padding: '12px 8px', textAlign: 'right' }}>Rp {paidSubtotal.toLocaleString('id-ID')}</div>
                    </div>
                  )}
                </div>
              </div>
              <div style={{ border: `1px solid ${DS.n200}`, borderRadius: 6, overflow: 'hidden', fontFamily: 'Helvetica Neue', fontSize: 13 }}>
                {([['Subtotal', paidSubtotal], ['Pajak', paidTax], ['Biaya layanan', paidServiceFee]] as [string, number][]).map(([label, value]) => (
                  <div key={label} style={{ display: 'flex', justifyContent: 'space-between', gap: 12, padding: '12px 14px', borderBottom: `1px solid ${DS.n100}` }}>
                    <span style={{ color: DS.n600 }}>{label}</span>
                    <strong style={{ color: DS.dark }}>Rp {Number(value).toLocaleString('id-ID')}</strong>
                  </div>
                ))}
                <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, padding: '16px 14px', background: DS.n50 }}>
                  <span style={{ fontWeight: 700, color: DS.dark }}>Total Pembayaran</span>
                  <strong style={{ color: DS.primary, fontSize: 16 }}>Rp {paidTotal.toLocaleString('id-ID')}</strong>
                </div>
              </div>
            </div>

            <div style={sectionTitleStyle}>Informasi Penting</div>
            <div style={{ padding: isNarrow ? '18px 18px 24px' : '20px 32px 30px', display: 'grid', gridTemplateColumns: isNarrow ? '1fr' : '1fr 1fr', gap: isNarrow ? 0 : 32, fontFamily: 'Helvetica Neue', fontSize: 13, color: DS.n700, lineHeight: 1.7 }}>
              <ul style={{ margin: 0, paddingLeft: 18 }}>
                <li>Tunjukkan e-tiket dan KTP/Paspor asli saat check-in di stasiun.</li>
                <li>Tiba di stasiun minimal <strong>30 menit</strong> sebelum keberangkatan.</li>
              </ul>
              <ul style={{ margin: 0, paddingLeft: 18 }}>
                <li>Sebutkan kode booking <strong>{bookingRef?.slice(-8).toUpperCase()}</strong> jika diminta petugas.</li>
                <li>Tiket tidak dapat dipindahtangankan kepada pihak lain.</li>
              </ul>
            </div>
          </div>

          <div style={{ marginTop: isNarrow ? 20 : 32, display: 'flex', gap: 12, justifyContent: 'center', flexDirection: isNarrow ? 'column' : 'row', flexWrap: 'wrap' }}>
            <button onClick={() => setDownloaded(true)} style={{ width: isNarrow ? '100%' : 'auto', padding: '14px 28px', borderRadius: 999, border: `1.5px solid ${DS.primary}`, background: DS.white, color: DS.primary, cursor: 'pointer', fontFamily: 'Helvetica Neue', fontWeight: 700, fontSize: 14 }}>
              {downloaded ? '✓ E-Tiket Tersimpan' : 'Unduh E-Tiket'}
            </button>
            <button onClick={onBackHome} style={{ width: isNarrow ? '100%' : 'auto', padding: '14px 28px', borderRadius: 999, border: 'none', background: DS.accent, color: DS.white, cursor: 'pointer', fontFamily: 'Helvetica Neue', fontWeight: 700, fontSize: 14, boxShadow: '0 4px 16px rgba(53,107,166,0.24)' }}>
              Selesai &amp; Ke Beranda
            </button>
          </div>
        </div>
      </div>
    );
  }

  /* ─── TOUR confirmation ─── */
  if (isTour) {
    const t = bookingData.tour as Record<string, unknown>;
    const contact = bookingData.contact;
    const form = bookingData.form as Record<string, unknown> | undefined;
    const paxCount = bookingData.paxCount || 1;
    const tourPassengers = bookingData.passengers || [];
    const total = bookingData.total || 0;
    const tourSubtotal = bookingData.subtotal || 0;
    const tourBasePrice = bookingData.basePrice || 0;
    const tourAddonItems = bookingData.addonItems || [];
    const tourAddonTotal = bookingData.addonTotal || 0;
    const tourTax = bookingData.tax;
    const tourServiceFee = bookingData.serviceFee;
    const tourSearchParams = bookingData.searchParams as Record<string, unknown> | undefined;
    const promoDisc = bookingData.promoDisc || 0;
    const guestName = contact?.name || (form?.guestName as string) || (form?.bookerName as string) || '-';
    const paidSubtotal = tourSubtotal || 0;
    const paidTax = tourTax ?? Math.round(paidSubtotal * 0.11);
    const paidServiceFee = tourServiceFee ?? Math.round(paidSubtotal * 0.05);
    const paidTotal = total || (paidSubtotal + paidTax + paidServiceFee);
    const paidBasePrice = tourBasePrice || paidSubtotal;
    const paidAddonItems = tourAddonItems;
    const paidAddonTotal = tourAddonTotal;

    const handleTourTicketDownload = async () => {
      setGeneratingPdf(true);
      try {
        const { jsPDF } = await import('jspdf');
        const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
        const colors = {
          page: [245, 247, 249] as [number,number,number],
          white: [255, 255, 255] as [number,number,number],
          dark: [15, 23, 42] as [number,number,number],
          n50: [248, 250, 252] as [number,number,number],
          n100: [241, 245, 249] as [number,number,number],
          n200: [226, 232, 240] as [number,number,number],
          n400: [148, 163, 184] as [number,number,number],
          n500: [100, 116, 139] as [number,number,number],
          primary: [53, 107, 166] as [number,number,number],
          primaryLight: [232, 240, 248] as [number,number,number],
          successBg: [236, 251, 243] as [number,number,number],
          successText: [32, 138, 76] as [number,number,number],
          warningBg: [254, 249, 231] as [number,number,number],
          warningBorder: [245, 193, 7] as [number,number,number],
          warningText: [122, 92, 0] as [number,number,number],
        };
        const money = (value: number) => `Rp ${Number(value || 0).toLocaleString('id-ID')}`;
        const pageW = 210;
        const pageH = 297;
        const x = 10;
        const w = 190;
        let y = 10;
        const line = (x1: number, y1: number, x2: number, y2: number, color = colors.n200) => { pdf.setDrawColor(...color); pdf.line(x1, y1, x2, y2); };
        const fill = (x1: number, y1: number, w1: number, h1: number, color: [number,number,number]) => { pdf.setFillColor(...color); pdf.rect(x1, y1, w1, h1, 'F'); };
        const rect = (x1: number, y1: number, w1: number, h1: number, color: [number,number,number] = colors.n200, radius = 1.5) => { pdf.setDrawColor(...color); pdf.roundedRect(x1, y1, w1, h1, radius, radius, 'S'); };
        const text = (value: string, x1: number, y1: number, { size = 9, color = colors.dark, bold = false, maxWidth }: { size?: number; color?: [number,number,number]; bold?: boolean; maxWidth?: number } = {}) => {
          pdf.setFont('helvetica', bold ? 'bold' : 'normal');
          pdf.setFontSize(size);
          pdf.setTextColor(...color);
          if (maxWidth) pdf.text(pdf.splitTextToSize(String(value), maxWidth), x1, y1);
          else pdf.text(String(value), x1, y1);
        };
        const section = (label: string) => { fill(x, y, w, 7.5, colors.n50); line(x, y, x + w, y, colors.n100); line(x, y + 7.5, x + w, y + 7.5, colors.n100); text(label.toUpperCase(), x + 3, y + 5, { size: 8, bold: true }); y += 7.5; };
        const info = (label: string, value: string, x1: number, y1: number, width: number) => { text(label, x1, y1, { size: 7.5, color: colors.n400 }); text(value || '-', x1, y1 + 4.2, { size: 8.5, bold: true, maxWidth: width }); };

        fill(0, 0, pageW, pageH, colors.page);
        pdf.setFillColor(...colors.white);
        pdf.setDrawColor(...colors.n200);
        pdf.roundedRect(x, y, w, 184, 1.8, 1.8, 'FD');
        text('Tour Voucher', x + 6, y + 12, { size: 17, bold: true });
        text('Voucher Tur', x + 6, y + 17.5, { size: 8, color: colors.n400 });
        fill(x + w - 58, y + 6, 52, 8, colors.primaryLight);
        text(`Order ID: ${bookingRef}`, x + w - 55, y + 11.2, { size: 7.5, color: colors.primary, bold: true });
        fill(x + w - 22, y + 15.5, 16, 6.6, colors.successBg);
        rect(x + w - 22, y + 15.5, 16, 6.6, [186, 230, 202], 3.3);
        text('Paid', x + w - 18.3, y + 20, { size: 7.5, color: colors.successText, bold: true });
        y += 25;

        section('Detail Pemesan');
        info('Nama Lengkap', guestName, x + 6, y + 8, 46);
        info('Email', (contact?.email || form?.bookerEmail as string), x + 70, y + 8, 48);
        info('Nomor HP', (contact?.phone || form?.bookerPhone as string), x + 142, y + 8, 40);
        y += 19;

        section('Detail Tur');
        text((t?.name as string) || 'Paket Tur', x + 6, y + 12, { size: 13, bold: true });
        text((t?.loc as string) || 'Lokasi', x + 6, y + 18, { size: 8.5, color: colors.dark, maxWidth: 120 });
        fill(x + w - 24, y + 6, 18, 7, colors.warningBg);
        rect(x + w - 24, y + 6, 18, 7, colors.warningBorder, 3.5);
        text(`${(t?.duration as string) || '1 Hari'}`, x + w - 20.5, y + 10.7, { size: 7.5, color: colors.warningText, bold: true });
        pdf.setDrawColor(...colors.primary);
        pdf.setLineWidth(0.8);
        pdf.line(x + 6, y + 26, x + 6, y + 39);
        pdf.line(x + 95, y + 26, x + 95, y + 39);
        pdf.setLineWidth(0.2);
        info('Tanggal Tur', formatDate(tourSearchParams?.date || t?.date || new Date()), x + 10, y + 29, 52);
        text('Sesuai Itinerary', x + 10, y + 38, { size: 7.5, color: colors.primary });
        info('Kategori', (t?.category as string) || 'Open Trip', x + 99, y + 29, 52);
        text((t?.duration as string) || '1 Hari', x + 99, y + 38, { size: 7.5, color: colors.primary });
        y += 45;

        section('Detail Booking');
        const tableX = x + 6;
        const cols = [10, 80, 50, 50];
        const heads = ['No', 'Nama Tur', 'Tamu', 'Jumlah Peserta'];
        let cx = tableX;
        heads.forEach((head, i) => { text(head, cx, y + 7, { size: 8, color: colors.n500, bold: true }); cx += cols[i]; });
        line(tableX, y + 10, x + w - 6, y + 10);
        cx = tableX;
        ['1', (t?.name as string) || 'Paket Tur', guestName, `${paxCount} Pax`].forEach((value, i) => { text(value, cx, y + 18, { size: 8, bold: i === 1 || i === 2, maxWidth: cols[i] - 2 }); cx += cols[i]; });
        line(tableX, y + 22, x + w - 6, y + 22);
        y += 28;

        section('Detail Pembayaran');
        const leftX = x + 6;
        const leftW = 108;
        const rightX = x + 126;
        const rightW = 58;
        rect(leftX, y + 6, leftW, 44);
        fill(leftX, y + 6, leftW, 9, colors.n50);
        text('No', leftX + 3, y + 12, { size: 7.5, bold: true, color: colors.n500 });
        text('Deskripsi', leftX + 15, y + 12, { size: 7.5, bold: true, color: colors.n500 });
        text('Qty', leftX + 75, y + 12, { size: 7.5, bold: true, color: colors.n500 });
        text('Total', leftX + 96, y + 12, { size: 7.5, bold: true, color: colors.n500 });
        text('1', leftX + 3, y + 23, { size: 8 });
        text('Paket Tur', leftX + 15, y + 23, { size: 8, bold: true });
        text(`${(t?.name as string) || 'Paket Tur'}, ${(t?.category as string) || 'Open Trip'}, ${(t?.duration as string) || '1 Hari'}`, leftX + 15, y + 28, { size: 7.5, color: colors.n500, maxWidth: 50 });
        text(String(paxCount), leftX + 76, y + 23, { size: 8, bold: true });
        text(money(paidSubtotal), leftX + 90, y + 23, { size: 8, bold: true });
        rect(rightX, y + 6, rightW, 44);
        ([['Harga Tur', paidSubtotal], ['Diskon', -(promoDisc || 0)]] as [string, number][]).forEach(([label, value], i) => {
          const rowY = y + 13 + i * 9;
          text(label, rightX + 3, rowY, { size: 8, color: colors.n500 });
          text(money(value), rightX + 34, rowY, { size: 8, bold: true });
          line(rightX, rowY + 3.5, rightX + rightW, rowY + 3.5, colors.n100);
        });
        fill(rightX, y + 39, rightW, 11, colors.n50);
        text('Total Pembayaran', rightX + 3, y + 46, { size: 8, bold: true });
        text(money(paidTotal), rightX + 33, y + 46, { size: 10, bold: true, color: colors.primary });
        y += 56;

        section('Instruksi Kumpul');
        const policyA = ['Meeting point akan diinformasikan H-1 keberangkatan.', 'Tiba di lokasi minimal 30 menit sebelum berangkat.'];
        const policyB = ['Bawa identitas (KTP/Paspor) sesuai pesanan.', 'Jadwal dapat berubah menyesuaikan kondisi cuaca.'];
        policyA.forEach((item, i) => text(`- ${item}`, x + 8, y + 9 + i * 6, { size: 7.5, maxWidth: 78 }));
        policyB.forEach((item, i) => text(`- ${item}`, x + 100, y + 9 + i * 6, { size: 7.5, maxWidth: 80 }));

        pdf.save(`e-voucher-${bookingRef}.pdf`);
        setDownloaded(true);
      } finally {
        setGeneratingPdf(false);
      }
    };

    return (
      <div style={{ minHeight: '100vh', background: DS.surface, padding: isNarrow ? '16px 12px 72px' : '32px 20px 80px' }}>
        <div style={{ maxWidth: 960, margin: '0 auto' }}>
          <div style={{ background: DS.white, border: `1px solid ${DS.n100}`, borderRadius: 8, padding: isNarrow ? '18px 16px' : '22px 28px', marginBottom: 18, display: 'flex', alignItems: isNarrow ? 'flex-start' : 'center', flexDirection: isNarrow ? 'column' : 'row', gap: 16, boxShadow: '0 6px 18px rgba(15,23,42,0.04)' }}>
            <div style={{ width: 44, height: 44, borderRadius: '50%', background: DS.successBg, color: DS.successText, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M5 13l4 4L19 7" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" /></svg>
            </div>
            <div>
              <h1 style={{ fontFamily: 'Helvetica Neue', fontWeight: 700, fontSize: isNarrow ? 20 : 24, color: DS.dark, margin: '0 0 4px' }}>Tur berhasil dipesan</h1>
              <p style={{ fontFamily: 'Helvetica Neue', fontSize: 14, color: DS.n500, margin: 0, lineHeight: 1.45 }}>
                E-Voucher dan detail pembayaran telah dikirim ke <strong style={{ color: DS.dark }}>{(contact?.email || (form?.bookerEmail as string)) || 'email@example.com'}</strong>
              </p>
            </div>
          </div>

          <div style={{ background: DS.white, border: `1px solid ${DS.n200}`, borderRadius: 8, overflow: 'hidden', boxShadow: '0 8px 24px rgba(15,23,42,0.06)' }}>
            <div style={{ padding: isNarrow ? '22px 18px 18px' : '32px 32px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexDirection: isNarrow ? 'column' : 'row', gap: 18, flexWrap: 'wrap' }}>
              <div>
                <div style={{ fontFamily: 'Helvetica Neue', fontWeight: 700, fontSize: isNarrow ? 24 : 30, color: DS.dark, marginBottom: 4 }}>Tour Voucher</div>
                <div style={{ fontFamily: 'Helvetica Neue', fontSize: 13, color: DS.n400, fontStyle: 'italic' }}>Voucher Tur</div>
              </div>
              <div style={{ textAlign: isNarrow ? 'left' : 'right', width: isNarrow ? '100%' : 'auto' }}>
                <div style={{ display: 'inline-flex', alignItems: 'center', background: DS.primaryLight, color: DS.primary, borderRadius: 6, padding: '9px 14px', fontFamily: 'Helvetica Neue', fontWeight: 700, fontSize: 13, marginBottom: 10 }}>
                  Order ID: {bookingRef}
                </div>
                <div>
                  <span style={{ display: 'inline-flex', background: DS.successBg, color: DS.successText, border: `1px solid ${DS.success}33`, borderRadius: 999, padding: '5px 10px', fontFamily: 'Helvetica Neue', fontWeight: 700, fontSize: 12 }}>
                    Paid
                  </span>
                </div>
              </div>
            </div>

            <div style={sectionTitleStyle}>Detail Pemesan</div>
            <div style={{ padding: isNarrow ? '16px 18px 18px' : '18px 32px 20px', display: 'grid', gridTemplateColumns: isNarrow ? '1fr' : 'repeat(3, minmax(0, 1fr))', gap: isNarrow ? 14 : 28 }}>
              <div><div style={infoLabelStyle}>Nama Lengkap</div><div style={infoValueStyle}>{guestName || '-'}</div></div>
              <div><div style={infoLabelStyle}>Email</div><div style={infoValueStyle}>{(contact?.email || (form?.bookerEmail as string)) || '-'}</div></div>
              <div><div style={infoLabelStyle}>Nomor HP</div><div style={infoValueStyle}>{(contact?.phone || (form?.bookerPhone as string)) || '-'}</div></div>
            </div>

            <div style={sectionTitleStyle}>Detail Tur</div>
            <div style={{ padding: isNarrow ? '18px' : '22px 32px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 24, marginBottom: 22, flexWrap: 'wrap' }}>
                <div>
                  <div style={{ fontFamily: 'Helvetica Neue', fontWeight: 700, fontSize: 22, color: DS.dark, marginBottom: 6 }}>{(t?.name as string) || 'Paket Tur'}</div>
                  <div style={{ fontFamily: 'Helvetica Neue', fontSize: 13, color: DS.n600, lineHeight: 1.5, maxWidth: 560 }}>{(t?.loc as string) || 'Lokasi'}</div>
                </div>
                <div style={{ fontFamily: 'Helvetica Neue', fontWeight: 700, fontSize: 13, color: DS.warningText, background: DS.warningBg, border: `1px solid ${DS.warning}`, borderRadius: 999, padding: '6px 12px' }}>
                  {(t?.duration as string) || '1 Hari'}
                </div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: isNarrow ? 16 : 36 }}>
                <div style={{ borderLeft: `4px solid ${DS.primary}`, paddingLeft: 12 }}>
                  <div style={infoLabelStyle}>Tanggal Tur</div>
                  <div style={infoValueStyle}>{formatDate(tourSearchParams?.date || t?.date || new Date())}</div>
                  <div style={{ fontFamily: 'Helvetica Neue', fontSize: 12, color: DS.primary, marginTop: 4 }}>Sesuai Itinerary</div>
                </div>
                <div style={{ borderLeft: `4px solid ${DS.primary}`, paddingLeft: 12 }}>
                  <div style={infoLabelStyle}>Kategori</div>
                  <div style={infoValueStyle}>{(t?.category as string) || 'Open Trip'}</div>
                  <div style={{ fontFamily: 'Helvetica Neue', fontSize: 12, color: DS.primary, marginTop: 4 }}>{(t?.duration as string) || '1 Hari'}</div>
                </div>
              </div>
            </div>

            <div style={sectionTitleStyle}>Detail Peserta</div>
            <div style={{ padding: isNarrow ? '14px 18px 20px' : '16px 32px 24px', display: 'flex', flexDirection: 'column', gap: 10 }}>
              {(tourPassengers.length > 0 ? tourPassengers : [{ name: guestName, type: 'Dewasa', idType: '-', idNumber: '-' }]).map((p, i) => (
                <div key={i} style={{ display: 'grid', gridTemplateColumns: isNarrow ? '1fr' : '28px 1fr 100px 120px 180px', gap: isNarrow ? 6 : 16, alignItems: 'center', background: DS.n50, borderRadius: 8, padding: '12px 16px', border: `1px solid ${DS.n100}` }}>
                  <div style={{ fontFamily: 'Helvetica Neue', fontWeight: 700, fontSize: 13, color: DS.n400 }}>{i + 1}</div>
                  <div>
                    <div style={{ fontFamily: 'Helvetica Neue', fontWeight: 700, fontSize: 14, color: DS.dark }}>{p?.name || '-'}</div>
                    <div style={{ fontFamily: 'Helvetica Neue', fontSize: 12, color: DS.n500, marginTop: 2 }}>{p?.type || 'Dewasa'}</div>
                  </div>
                  {!isNarrow && (
                    <>
                      <div>
                        <div style={{ fontFamily: 'Helvetica Neue', fontSize: 11, color: DS.n400, marginBottom: 2 }}>Jenis</div>
                        <div style={{ fontFamily: 'Helvetica Neue', fontWeight: 600, fontSize: 12, color: DS.dark }}>{p?.type || 'Dewasa'}</div>
                      </div>
                      <div>
                        <div style={{ fontFamily: 'Helvetica Neue', fontSize: 11, color: DS.n400, marginBottom: 2 }}>Jenis ID</div>
                        <div style={{ fontFamily: 'Helvetica Neue', fontWeight: 600, fontSize: 12, color: DS.dark }}>{p?.idType || '-'}</div>
                      </div>
                      <div>
                        <div style={{ fontFamily: 'Helvetica Neue', fontSize: 11, color: DS.n400, marginBottom: 2 }}>Nomor ID</div>
                        <div style={{ fontFamily: 'Helvetica Neue', fontWeight: 600, fontSize: 13, color: DS.dark, letterSpacing: '0.04em' }}>{p?.idNumber || '-'}</div>
                      </div>
                    </>
                  )}
                  {isNarrow && (
                    <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
                      <div><span style={{ fontFamily: 'Helvetica Neue', fontSize: 11, color: DS.n400 }}>Jenis ID: </span><span style={{ fontFamily: 'Helvetica Neue', fontWeight: 600, fontSize: 12, color: DS.dark }}>{p?.idType || '-'}</span></div>
                      <div><span style={{ fontFamily: 'Helvetica Neue', fontSize: 11, color: DS.n400 }}>Nomor: </span><span style={{ fontFamily: 'Helvetica Neue', fontWeight: 600, fontSize: 12, color: DS.dark }}>{p?.idNumber || '-'}</span></div>
                    </div>
                  )}
                </div>
              ))}
            </div>

            <div style={sectionTitleStyle}>Detail Pembayaran</div>
            <div style={{ padding: isNarrow ? '18px 18px 24px' : '20px 32px 32px', display: 'grid', gridTemplateColumns: isNarrow ? '1fr' : 'minmax(0, 1fr) 320px', gap: isNarrow ? 16 : 28, alignItems: 'start' }}>
              <div style={{ border: `1px solid ${DS.n200}`, borderRadius: 6, overflow: 'hidden' }}>
                <div style={{ overflowX: 'auto' }}>
                  <div style={{ display: 'grid', gridTemplateColumns: '52px 1fr 72px 132px', minWidth: 360, background: DS.n50, borderBottom: `1px solid ${DS.n200}`, fontFamily: 'Helvetica Neue', fontWeight: 700, fontSize: 12, color: DS.n600 }}>
                    <div style={{ padding: '10px 8px' }}>No</div>
                    <div style={{ padding: '10px 8px' }}>Deskripsi</div>
                    <div style={{ padding: '10px 8px', textAlign: 'center' }}>Pax</div>
                    <div style={{ padding: '10px 8px', textAlign: 'right' }}>Total</div>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '52px 1fr 72px 132px', minWidth: 360, fontFamily: 'Helvetica Neue', fontSize: 13, color: DS.dark, borderBottom: paidAddonItems.length > 0 ? `1px solid ${DS.n100}` : 'none' }}>
                    <div style={{ padding: '12px 8px' }}>1</div>
                    <div style={{ padding: '12px 8px' }}><strong>Paket Tur</strong><div style={{ color: DS.n500, marginTop: 4 }}>{(t?.name as string) || 'Paket Tur'}, {(t?.category as string) || 'Open Trip'}, {(t?.duration as string) || '1 Hari'}</div></div>
                    <div style={{ padding: '12px 8px', textAlign: 'center' }}>{paxCount}</div>
                    <div style={{ padding: '12px 8px', textAlign: 'right' }}>Rp {paidBasePrice.toLocaleString('id-ID')}</div>
                  </div>
                  {paidAddonItems.length > 0 && (
                    <div style={{ display: 'grid', gridTemplateColumns: '52px 1fr 72px 132px', minWidth: 360, fontFamily: 'Helvetica Neue', fontSize: 13, color: DS.dark }}>
                      <div style={{ padding: '12px 8px' }}>2</div>
                      <div style={{ padding: '12px 8px' }}>
                        <strong>Fasilitas Tambahan</strong>
                        {paidAddonItems.map(a => (
                          <div key={a.id} style={{ color: DS.n500, marginTop: 3, fontSize: 12 }}>· {a.name} — Rp {a.price.toLocaleString('id-ID')}</div>
                        ))}
                      </div>
                      <div style={{ padding: '12px 8px', textAlign: 'center' }}>—</div>
                      <div style={{ padding: '12px 8px', textAlign: 'right' }}>Rp {paidAddonTotal.toLocaleString('id-ID')}</div>
                    </div>
                  )}
                </div>
              </div>
              <div style={{ border: `1px solid ${DS.n200}`, borderRadius: 6, overflow: 'hidden', fontFamily: 'Helvetica Neue', fontSize: 13 }}>
                {([
                  ['Paket Tur', paidBasePrice],
                  ...(paidAddonTotal > 0 ? [['Fasilitas Tambahan', paidAddonTotal]] : []),
                  ['Pajak', paidTax],
                  ['Biaya Layanan', paidServiceFee],
                ] as [string, number][]).map(([label, value]) => (
                  <div key={label} style={{ display: 'flex', justifyContent: 'space-between', gap: 12, padding: '12px 14px', borderBottom: `1px solid ${DS.n100}` }}>
                    <span style={{ color: DS.n600 }}>{label}</span>
                    <strong style={{ color: DS.dark }}>Rp {Number(value).toLocaleString('id-ID')}</strong>
                  </div>
                ))}
                <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, padding: '16px 14px', background: DS.n50 }}>
                  <span style={{ fontWeight: 700, color: DS.dark }}>Total Pembayaran</span>
                  <strong style={{ color: DS.primary, fontSize: 16 }}>Rp {paidTotal.toLocaleString('id-ID')}</strong>
                </div>
              </div>
            </div>

            <div style={sectionTitleStyle}>Instruksi Kumpul</div>
            <div style={{ padding: isNarrow ? '18px 18px 24px' : '20px 32px 30px', display: 'grid', gridTemplateColumns: isNarrow ? '1fr' : '1fr 1fr', gap: isNarrow ? 0 : 32, fontFamily: 'Helvetica Neue', fontSize: 13, color: DS.n700, lineHeight: 1.7 }}>
              <ul style={{ margin: 0, paddingLeft: 18 }}>
                <li>Meeting point akan diinformasikan H-1 keberangkatan.</li>
                <li>Tiba di lokasi minimal 30 menit sebelum berangkat.</li>
              </ul>
              <ul style={{ margin: 0, paddingLeft: 18 }}>
                <li>Bawa identitas (KTP/Paspor) sesuai pesanan.</li>
                <li>Jadwal dapat berubah menyesuaikan kondisi cuaca.</li>
              </ul>
            </div>
          </div>

          <div style={{ marginTop: isNarrow ? 20 : 32, display: 'flex', gap: 12, justifyContent: 'center', flexDirection: isNarrow ? 'column' : 'row', flexWrap: 'wrap' }}>
            <button onClick={handleTourTicketDownload} disabled={generatingPdf} style={{ width: isNarrow ? '100%' : 'auto', padding: '14px 28px', borderRadius: 999, border: `1.5px solid ${DS.primary}`, background: DS.white, color: DS.primary, cursor: generatingPdf ? 'not-allowed' : 'pointer', opacity: generatingPdf ? 0.7 : 1, fontFamily: 'Helvetica Neue', fontWeight: 700, fontSize: 14 }}>
              {generatingPdf ? 'Menyiapkan PDF...' : downloaded ? 'E-Voucher Tersimpan' : 'Unduh E-Voucher'}
            </button>
            <button onClick={onBackHome} style={{ width: isNarrow ? '100%' : 'auto', padding: '14px 28px', borderRadius: 999, border: 'none', background: DS.accent, color: DS.white, cursor: 'pointer', fontFamily: 'Helvetica Neue', fontWeight: 700, fontSize: 14, boxShadow: '0 4px 16px rgba(53,107,166,0.24)' }}>
              Selesai &amp; Ke Beranda
            </button>
          </div>
        </div>
      </div>
    );
  }

  /* ─── HOTEL confirmation ─── */
  const hotel = (bookingData?.hotel || { name: 'The Layar Seminyak', location: 'Seminyak, Bali' }) as Record<string, unknown>;
  const room = (bookingData?.room || { name: 'Deluxe Garden View', price: 1850000, refundable: true }) as Record<string, unknown>;
  const n = (bookingData?.nights as number) || 2;
  const stayCheckIn = (bookingData?.checkInDate as string) || (bookingData?.searchParams as Record<string,unknown>)?.checkIn as string;
  const stayCheckOut = (bookingData?.checkOutDate as string) || (bookingData?.searchParams as Record<string,unknown>)?.checkOut as string;
  const paidTotal = (bookingData?.total as number) || ((room.price as number) * n);
  const roomQty = (bookingData?.searchParams as Record<string,unknown>)?.rooms as number || 1;
  const adults = (bookingData?.searchParams as Record<string,unknown>)?.adults as number || 2;
  const paidSubtotal = (bookingData?.subtotal as number) || ((room.price as number) * n * roomQty);
  const paidTax = (bookingData?.tax as number) || Math.round(paidSubtotal * 0.11);
  const paidServiceFee = (bookingData?.serviceFee as number) || Math.max(0, paidTotal - paidSubtotal - paidTax);
  const form = bookingData?.form as Record<string, unknown> | undefined;
  const guestName = (form?.guestName as string) || (form?.bookerName as string) || '-';
  const hotelLocation = (hotel.loc as string) || (hotel.location as string) || '-';

  const handleHotelTicketDownload = async () => {
    setGeneratingPdf(true);
    try {
      const { jsPDF } = await import('jspdf');
      const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
      const colors = {
        page: [245, 247, 249] as [number,number,number],
        white: [255, 255, 255] as [number,number,number],
        dark: [15, 23, 42] as [number,number,number],
        n50: [248, 250, 252] as [number,number,number],
        n100: [241, 245, 249] as [number,number,number],
        n200: [226, 232, 240] as [number,number,number],
        n400: [148, 163, 184] as [number,number,number],
        n500: [100, 116, 139] as [number,number,number],
        primary: [53, 107, 166] as [number,number,number],
        primaryLight: [232, 240, 248] as [number,number,number],
        successBg: [236, 251, 243] as [number,number,number],
        successText: [32, 138, 76] as [number,number,number],
        warningBg: [254, 249, 231] as [number,number,number],
        warningBorder: [245, 193, 7] as [number,number,number],
        warningText: [122, 92, 0] as [number,number,number],
      };
      const money = (value: number) => `Rp ${Number(value || 0).toLocaleString('id-ID')}`;
      const pageW = 210;
      const pageH = 297;
      const x = 10;
      const w = 190;
      let y = 10;
      const line = (x1: number, y1: number, x2: number, y2: number, color = colors.n200) => { pdf.setDrawColor(...color); pdf.line(x1, y1, x2, y2); };
      const fill = (x1: number, y1: number, w1: number, h1: number, color: [number,number,number]) => { pdf.setFillColor(...color); pdf.rect(x1, y1, w1, h1, 'F'); };
      const rect = (x1: number, y1: number, w1: number, h1: number, color: [number,number,number] = colors.n200, radius = 1.5) => { pdf.setDrawColor(...color); pdf.roundedRect(x1, y1, w1, h1, radius, radius, 'S'); };
      const text = (value: string, x1: number, y1: number, { size = 9, color = colors.dark, bold = false, maxWidth }: { size?: number; color?: [number,number,number]; bold?: boolean; maxWidth?: number } = {}) => {
        pdf.setFont('helvetica', bold ? 'bold' : 'normal');
        pdf.setFontSize(size);
        pdf.setTextColor(...color);
        if (maxWidth) pdf.text(pdf.splitTextToSize(String(value), maxWidth), x1, y1);
        else pdf.text(String(value), x1, y1);
      };
      const section = (label: string) => { fill(x, y, w, 7.5, colors.n50); line(x, y, x + w, y, colors.n100); line(x, y + 7.5, x + w, y + 7.5, colors.n100); text(label.toUpperCase(), x + 3, y + 5, { size: 8, bold: true }); y += 7.5; };
      const info = (label: string, value: string, x1: number, y1: number, width: number) => { text(label, x1, y1, { size: 7.5, color: colors.n400 }); text(value || '-', x1, y1 + 4.2, { size: 8.5, bold: true, maxWidth: width }); };

      fill(0, 0, pageW, pageH, colors.page);
      pdf.setFillColor(...colors.white);
      pdf.setDrawColor(...colors.n200);
      pdf.roundedRect(x, y, w, 184, 1.8, 1.8, 'FD');
      text('Hotel Voucher', x + 6, y + 12, { size: 17, bold: true });
      text('Voucher Hotel', x + 6, y + 17.5, { size: 8, color: colors.n400 });
      fill(x + w - 58, y + 6, 52, 8, colors.primaryLight);
      text(`Order ID: ${bookingRef}`, x + w - 55, y + 11.2, { size: 7.5, color: colors.primary, bold: true });
      fill(x + w - 22, y + 15.5, 16, 6.6, colors.successBg);
      rect(x + w - 22, y + 15.5, 16, 6.6, [186, 230, 202], 3.3);
      text('Paid', x + w - 18.3, y + 20, { size: 7.5, color: colors.successText, bold: true });
      y += 25;

      section('Detail Pemesan');
      info('Nama Lengkap', form?.bookerName as string, x + 6, y + 8, 46);
      info('Email', form?.bookerEmail as string, x + 70, y + 8, 48);
      info('Nomor HP', form?.bookerPhone as string, x + 142, y + 8, 40);
      y += 19;

      section('Detail Hotel');
      text(hotel.name as string, x + 6, y + 12, { size: 13, bold: true });
      text(hotelLocation, x + 6, y + 18, { size: 8.5, color: colors.dark, maxWidth: 120 });
      fill(x + w - 24, y + 6, 18, 7, colors.warningBg);
      rect(x + w - 24, y + 6, 18, 7, colors.warningBorder, 3.5);
      text(`${n} malam`, x + w - 20.5, y + 10.7, { size: 7.5, color: colors.warningText, bold: true });
      pdf.setDrawColor(...colors.primary);
      pdf.setLineWidth(0.8);
      pdf.line(x + 6, y + 26, x + 6, y + 39);
      pdf.line(x + 95, y + 26, x + 95, y + 39);
      pdf.setLineWidth(0.2);
      info('Check-in', formatDate(stayCheckIn), x + 10, y + 29, 52);
      text('Mulai 14:00', x + 10, y + 38, { size: 7.5, color: colors.primary });
      info('Check-out', formatDate(stayCheckOut), x + 99, y + 29, 52);
      text('Sebelum 12:00', x + 99, y + 38, { size: 7.5, color: colors.primary });
      y += 45;

      section('Detail Booking');
      const tableX = x + 6;
      const cols = [10, 50, 50, 46, 24];
      const heads = ['No', 'Nama Kamar', 'Tamu', 'Tamu per Kamar', 'Sarapan'];
      let cx = tableX;
      heads.forEach((head, i) => { text(head, cx, y + 7, { size: 8, color: colors.n500, bold: true }); cx += cols[i]; });
      line(tableX, y + 10, x + w - 6, y + 10);
      cx = tableX;
      ['1', room.name as string, guestName, `${adults} dewasa`, (room.breakfastIncluded ? 'Ya' : 'Tidak')].forEach((value, i) => { text(value, cx, y + 18, { size: 8, bold: i === 1 || i === 2, maxWidth: cols[i] - 2 }); cx += cols[i]; });
      line(tableX, y + 22, x + w - 6, y + 22);
      y += 28;

      section('Detail Pembayaran');
      const leftX = x + 6;
      const leftW = 108;
      const rightX = x + 126;
      const rightW = 58;
      rect(leftX, y + 6, leftW, 44);
      fill(leftX, y + 6, leftW, 9, colors.n50);
      text('No', leftX + 3, y + 12, { size: 7.5, bold: true, color: colors.n500 });
      text('Deskripsi', leftX + 15, y + 12, { size: 7.5, bold: true, color: colors.n500 });
      text('Qty', leftX + 75, y + 12, { size: 7.5, bold: true, color: colors.n500 });
      text('Total', leftX + 96, y + 12, { size: 7.5, bold: true, color: colors.n500 });
      text('1', leftX + 3, y + 23, { size: 8 });
      text('Hotel', leftX + 15, y + 23, { size: 8, bold: true });
      text(`${hotel.name as string}, ${room.name as string}, ${n} malam`, leftX + 15, y + 28, { size: 7.5, color: colors.n500, maxWidth: 50 });
      text(String(roomQty), leftX + 76, y + 23, { size: 8, bold: true });
      text(money(paidSubtotal), leftX + 90, y + 23, { size: 8, bold: true });
      rect(rightX, y + 6, rightW, 44);
      ([['Subtotal', paidSubtotal], ['Pajak', paidTax], ['Biaya layanan', paidServiceFee]] as [string, number][]).forEach(([label, value], i) => {
        const rowY = y + 13 + i * 9;
        text(label, rightX + 3, rowY, { size: 8, color: colors.n500 });
        text(money(value), rightX + 34, rowY, { size: 8, bold: true });
        line(rightX, rowY + 3.5, rightX + rightW, rowY + 3.5, colors.n100);
      });
      fill(rightX, y + 39, rightW, 11, colors.n50);
      text('Total Pembayaran', rightX + 3, y + 46, { size: 8, bold: true });
      text(money(paidTotal), rightX + 33, y + 46, { size: 10, bold: true, color: colors.primary });
      y += 56;

      section('Ketentuan');
      const policyA = ['Tunjukkan voucher dan identitas asli saat check-in.', 'Waktu check-in dan check-out mengikuti kebijakan hotel.'];
      const policyB = [
        (room.refundable ? 'Reservasi dapat dibatalkan sesuai batas waktu kebijakan hotel.' : 'Reservasi ini tidak dapat dibatalkan.'),
        'Perubahan jadwal bergantung pada ketersediaan kamar.',
      ];
      policyA.forEach((item, i) => text(`- ${item}`, x + 8, y + 9 + i * 6, { size: 7.5, maxWidth: 78 }));
      policyB.forEach((item, i) => text(`- ${item}`, x + 100, y + 9 + i * 6, { size: 7.5, maxWidth: 80 }));

      pdf.save(`e-voucher-${bookingRef}.pdf`);
      setDownloaded(true);
    } finally {
      setGeneratingPdf(false);
    }
  };

  return (
    <div style={{ minHeight: '100vh', background: DS.surface, padding: isNarrow ? '16px 12px 72px' : '32px 20px 80px' }}>
      <div style={{ maxWidth: 960, margin: '0 auto' }}>
        <div style={{ background: DS.white, border: `1px solid ${DS.n100}`, borderRadius: 8, padding: isNarrow ? '18px 16px' : '22px 28px', marginBottom: 18, display: 'flex', alignItems: isNarrow ? 'flex-start' : 'center', flexDirection: isNarrow ? 'column' : 'row', gap: 16, boxShadow: '0 6px 18px rgba(15,23,42,0.04)' }}>
          <div style={{ width: 44, height: 44, borderRadius: '50%', background: DS.successBg, color: DS.successText, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M5 13l4 4L19 7" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" /></svg>
          </div>
          <div>
            <h1 style={{ fontFamily: 'Helvetica Neue', fontWeight: 700, fontSize: isNarrow ? 20 : 24, color: DS.dark, margin: '0 0 4px' }}>Hotel berhasil dipesan</h1>
            <p style={{ fontFamily: 'Helvetica Neue', fontSize: 14, color: DS.n500, margin: 0, lineHeight: 1.45 }}>
              E-Voucher dan detail pembayaran telah dikirim ke <strong style={{ color: DS.dark }}>{(form?.bookerEmail as string) || 'email@example.com'}</strong>
            </p>
          </div>
        </div>

        <div style={{ background: DS.white, border: `1px solid ${DS.n200}`, borderRadius: 8, overflow: 'hidden', boxShadow: '0 8px 24px rgba(15,23,42,0.06)' }}>
          <div style={{ padding: isNarrow ? '22px 18px 18px' : '32px 32px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexDirection: isNarrow ? 'column' : 'row', gap: 18, flexWrap: 'wrap' }}>
            <div>
              <div style={{ fontFamily: 'Helvetica Neue', fontWeight: 700, fontSize: isNarrow ? 24 : 30, color: DS.dark, marginBottom: 4 }}>Hotel Voucher</div>
              <div style={{ fontFamily: 'Helvetica Neue', fontSize: 13, color: DS.n400, fontStyle: 'italic' }}>Voucher Hotel</div>
            </div>
            <div style={{ textAlign: isNarrow ? 'left' : 'right', width: isNarrow ? '100%' : 'auto' }}>
              <div style={{ display: 'inline-flex', alignItems: 'center', background: DS.primaryLight, color: DS.primary, borderRadius: 6, padding: '9px 14px', fontFamily: 'Helvetica Neue', fontWeight: 700, fontSize: 13, marginBottom: 10 }}>
                Order ID: {bookingRef}
              </div>
              <div>
                <span style={{ display: 'inline-flex', background: DS.successBg, color: DS.successText, border: `1px solid ${DS.success}33`, borderRadius: 999, padding: '5px 10px', fontFamily: 'Helvetica Neue', fontWeight: 700, fontSize: 12 }}>
                  Paid
                </span>
              </div>
            </div>
          </div>

          <div style={sectionTitleStyle}>Detail Pemesan</div>
          <div style={{ padding: isNarrow ? '16px 18px 18px' : '18px 32px 20px', display: 'grid', gridTemplateColumns: isNarrow ? '1fr' : 'repeat(3, minmax(0, 1fr))', gap: isNarrow ? 14 : 28 }}>
            <div><div style={infoLabelStyle}>Nama Lengkap</div><div style={infoValueStyle}>{(form?.bookerName as string) || '-'}</div></div>
            <div><div style={infoLabelStyle}>Email</div><div style={infoValueStyle}>{(form?.bookerEmail as string) || '-'}</div></div>
            <div><div style={infoLabelStyle}>Nomor HP</div><div style={infoValueStyle}>{(form?.bookerPhone as string) || '-'}</div></div>
          </div>

          <div style={sectionTitleStyle}>Detail Hotel</div>
          <div style={{ padding: isNarrow ? '18px' : '22px 32px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 24, marginBottom: 22, flexWrap: 'wrap' }}>
              <div>
                <div style={{ fontFamily: 'Helvetica Neue', fontWeight: 700, fontSize: 22, color: DS.dark, marginBottom: 6 }}>{hotel.name as string}</div>
                <div style={{ fontFamily: 'Helvetica Neue', fontSize: 13, color: DS.n600, lineHeight: 1.5, maxWidth: 560 }}>{hotelLocation}</div>
              </div>
              <div style={{ fontFamily: 'Helvetica Neue', fontWeight: 700, fontSize: 13, color: DS.warningText, background: DS.warningBg, border: `1px solid ${DS.warning}`, borderRadius: 999, padding: '6px 12px' }}>
                {n} malam
              </div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: isNarrow ? 16 : 36 }}>
              <div style={{ borderLeft: `4px solid ${DS.primary}`, paddingLeft: 12 }}>
                <div style={infoLabelStyle}>Check-in</div>
                <div style={infoValueStyle}>{formatDate(stayCheckIn)}</div>
                <div style={{ fontFamily: 'Helvetica Neue', fontSize: 12, color: DS.primary, marginTop: 4 }}>Mulai 14:00</div>
              </div>
              <div style={{ borderLeft: `4px solid ${DS.primary}`, paddingLeft: 12 }}>
                <div style={infoLabelStyle}>Check-out</div>
                <div style={infoValueStyle}>{formatDate(stayCheckOut)}</div>
                <div style={{ fontFamily: 'Helvetica Neue', fontSize: 12, color: DS.primary, marginTop: 4 }}>Sebelum 12:00</div>
              </div>
            </div>
          </div>

          <div style={sectionTitleStyle}>Detail Booking</div>
          <div style={{ padding: isNarrow ? '0 18px 18px' : '0 32px 20px', overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontFamily: 'Helvetica Neue', fontSize: 13, color: DS.dark }}>
              <thead>
                <tr style={{ borderBottom: `1px solid ${DS.n200}` }}>
                  {['No', 'Nama Kamar', 'Tamu', 'Tamu per Kamar', 'Sarapan'].map(label => (
                    <th key={label} style={{ textAlign: 'left', padding: '13px 12px', fontWeight: 700, color: DS.n600 }}>{label}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                <tr style={{ borderBottom: `1px solid ${DS.n200}` }}>
                  <td style={{ padding: '13px 12px' }}>1</td>
                  <td style={{ padding: '13px 12px', fontWeight: 700 }}>{room.name as string}</td>
                  <td style={{ padding: '13px 12px', fontWeight: 700 }}>{guestName}</td>
                  <td style={{ padding: '13px 12px' }}>{adults} dewasa</td>
                  <td style={{ padding: '13px 12px' }}>{room.breakfastIncluded ? 'Ya' : 'Tidak'}</td>
                </tr>
              </tbody>
            </table>
          </div>

          <div style={sectionTitleStyle}>Detail Pembayaran</div>
          <div style={{ padding: isNarrow ? '18px 18px 24px' : '20px 32px 32px', display: 'grid', gridTemplateColumns: isNarrow ? '1fr' : 'minmax(0, 1fr) 320px', gap: isNarrow ? 16 : 28, alignItems: 'start' }}>
            <div style={{ border: `1px solid ${DS.n200}`, borderRadius: 6, overflow: 'hidden', minHeight: 132 }}>
              <div style={{ overflowX: 'auto' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '52px 1fr 72px 132px', minWidth: 360, background: DS.n50, borderBottom: `1px solid ${DS.n200}`, fontFamily: 'Helvetica Neue', fontWeight: 700, fontSize: 12, color: DS.n600 }}>
                  <div style={{ padding: '10px 8px' }}>No</div>
                  <div style={{ padding: '10px 8px' }}>Deskripsi</div>
                  <div style={{ padding: '10px 8px', textAlign: 'center' }}>Qty</div>
                  <div style={{ padding: '10px 8px', textAlign: 'right' }}>Total</div>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '52px 1fr 72px 132px', minWidth: 360, fontFamily: 'Helvetica Neue', fontSize: 13, color: DS.dark }}>
                  <div style={{ padding: '12px 8px' }}>1</div>
                  <div style={{ padding: '12px 8px' }}><strong>Hotel</strong><div style={{ color: DS.n500, marginTop: 4 }}>{hotel.name as string}, {room.name as string}, {n} malam</div></div>
                  <div style={{ padding: '12px 8px', textAlign: 'center' }}>{roomQty}</div>
                  <div style={{ padding: '12px 8px', textAlign: 'right' }}>Rp {paidSubtotal.toLocaleString('id-ID')}</div>
                </div>
              </div>
            </div>
            <div style={{ border: `1px solid ${DS.n200}`, borderRadius: 6, overflow: 'hidden', fontFamily: 'Helvetica Neue', fontSize: 13 }}>
              {([['Subtotal', paidSubtotal], ['Pajak', paidTax], ['Biaya layanan', paidServiceFee]] as [string, number][]).map(([label, value]) => (
                <div key={label} style={{ display: 'flex', justifyContent: 'space-between', gap: 12, padding: '12px 14px', borderBottom: `1px solid ${DS.n100}` }}>
                  <span style={{ color: DS.n600 }}>{label}</span>
                  <strong style={{ color: DS.dark }}>Rp {Number(value).toLocaleString('id-ID')}</strong>
                </div>
              ))}
              <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, padding: '16px 14px', background: DS.n50 }}>
                <span style={{ fontWeight: 700, color: DS.dark }}>Total Pembayaran</span>
                <strong style={{ color: DS.primary, fontSize: 16 }}>Rp {paidTotal.toLocaleString('id-ID')}</strong>
              </div>
            </div>
          </div>

          <div style={sectionTitleStyle}>Ketentuan</div>
          <div style={{ padding: isNarrow ? '18px 18px 24px' : '20px 32px 30px', display: 'grid', gridTemplateColumns: isNarrow ? '1fr' : '1fr 1fr', gap: isNarrow ? 0 : 32, fontFamily: 'Helvetica Neue', fontSize: 13, color: DS.n700, lineHeight: 1.7 }}>
            <ul style={{ margin: 0, paddingLeft: 18 }}>
              <li>Tunjukkan voucher dan identitas asli saat check-in.</li>
              <li>Waktu check-in dan check-out mengikuti kebijakan hotel.</li>
            </ul>
            <ul style={{ margin: 0, paddingLeft: 18 }}>
              <li>{room.refundable ? 'Reservasi dapat dibatalkan sesuai batas waktu kebijakan hotel.' : 'Reservasi ini tidak dapat dibatalkan.'}</li>
              <li>Perubahan jadwal bergantung pada ketersediaan kamar.</li>
            </ul>
          </div>
        </div>

        <div style={{ marginTop: isNarrow ? 20 : 32, display: 'flex', gap: 12, justifyContent: 'center', flexDirection: isNarrow ? 'column' : 'row', flexWrap: 'wrap' }}>
          <button onClick={handleHotelTicketDownload} disabled={generatingPdf} style={{ width: isNarrow ? '100%' : 'auto', padding: '14px 28px', borderRadius: 999, border: `1.5px solid ${DS.primary}`, background: DS.white, color: DS.primary, cursor: generatingPdf ? 'not-allowed' : 'pointer', opacity: generatingPdf ? 0.7 : 1, fontFamily: 'Helvetica Neue', fontWeight: 700, fontSize: 14 }}>
            {generatingPdf ? 'Menyiapkan PDF...' : downloaded ? 'E-Voucher Tersimpan' : 'Unduh E-Voucher'}
          </button>
          <button onClick={onBackHome} style={{ width: isNarrow ? '100%' : 'auto', padding: '14px 28px', borderRadius: 999, border: 'none', background: DS.accent, color: DS.white, cursor: 'pointer', fontFamily: 'Helvetica Neue', fontWeight: 700, fontSize: 14, boxShadow: '0 4px 16px rgba(53,107,166,0.24)' }}>
            Selesai &amp; Ke Beranda
          </button>
        </div>
      </div>
    </div>
  );
}
