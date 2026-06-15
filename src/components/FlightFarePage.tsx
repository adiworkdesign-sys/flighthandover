'use client';
import { useState, useEffect } from 'react';
import { DS, layout } from '../lib/ds';
import { ArrowLeft, ArrowRight, Luggage, RotateCcw, RefreshCw, Plane, Check } from 'lucide-react';
import type { FlightType, SearchParams } from './FlightResultsPage';
import { AIRPORT_NAMES } from './FlightResultsPage';

function useBreakpoint() {
  const [w, setW] = useState(typeof window !== 'undefined' ? window.innerWidth : 1280);
  useEffect(() => {
    const fn = () => setW(window.innerWidth);
    window.addEventListener('resize', fn);
    return () => window.removeEventListener('resize', fn);
  }, []);
  return { isMobile: w < 768 };
}

export type FareType = {
  id: string; name: string; price: number;
  cabin: number; checkin: number; refund: string; reschedule: string; popular: boolean;
};

const FARES: FareType[] = [
  { id: 'lite',  name: 'Lite',  price: 0,      cabin: 7, checkin: 0,  refund: 'Tidak bisa refund',              reschedule: 'Tidak bisa reschedule',             popular: false },
  { id: 'value', name: 'Value', price: 120000,  cabin: 7, checkin: 20, refund: 'Refund maks. 70%',               reschedule: '1x reschedule (Rp 150.000)',         popular: true  },
  { id: 'flex',  name: 'Flexi', price: 280000,  cabin: 7, checkin: 30, refund: 'Refund maks. 90%',               reschedule: 'Reschedule gratis (unlimited)',      popular: false },
];

function FareCard({ fare, onPick, basePrice }: { fare: FareType; onPick: (f: FareType) => void; basePrice: number }) {
  const fmt = (p: number) => 'Rp ' + p.toLocaleString('id-ID');
  const totalPrice = basePrice + fare.price;
  const [hov, setHov] = useState(false);
  const features = [
    { icon: <Luggage size={13} />, label: `Kabin ${fare.cabin}kg`, ok: true },
    { icon: <Luggage size={13} />, label: fare.checkin > 0 ? `Check-in ${fare.checkin}kg` : 'Tidak ada bagasi check-in', ok: fare.checkin > 0 },
    { icon: <RotateCcw size={13} />, label: fare.refund, ok: fare.id !== 'lite' },
    { icon: <RefreshCw size={13} />, label: fare.reschedule, ok: fare.id !== 'lite' },
  ];
  return (
    <div
      style={{ borderRadius: 14, border: `2px solid ${hov ? DS.primary : DS.n100}`, padding: 20, transition: 'all 0.18s', background: hov ? `${DS.primary}05` : DS.white, position: 'relative', display: 'flex', flexDirection: 'column', height: '100%' }}
      onMouseEnter={() => setHov(true)} onMouseLeave={() => setHov(false)}>
      <div style={{ marginBottom: 12 }}>
        <div style={{ fontFamily: 'Helvetica Neue', fontWeight: 700, fontSize: 17, color: DS.dark }}>{fare.name}</div>
        {fare.price > 0 && <div style={{ fontFamily: 'Helvetica Neue', fontSize: 11, color: DS.n400 }}>+{fmt(fare.price)} dari harga dasar</div>}
      </div>
      <div style={{ fontFamily: 'Helvetica Neue', fontWeight: 700, fontSize: 22, color: DS.primary, marginBottom: 16 }}>
        {fmt(totalPrice)}<span style={{ fontSize: 12, fontWeight: 400, color: DS.n400 }}>/pax</span>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8, flex: 1 }}>
        {features.map(({ icon, label, ok }) => (
          <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{ color: ok ? DS.primary : DS.n300, flexShrink: 0 }}>{icon}</div>
            <span style={{ fontFamily: 'Helvetica Neue', fontSize: 12, color: ok ? DS.dark : DS.n400 }}>{label}</span>
          </div>
        ))}
      </div>
      <button onClick={() => onPick(fare)}
        style={{ marginTop: 16, width: '100%', padding: '10px', borderRadius: 999, border: `1.5px solid ${DS.primary}`, background: 'transparent', color: DS.primary, fontFamily: 'Helvetica Neue', fontWeight: 700, fontSize: 13, cursor: 'pointer', transition: 'all 0.15s' }}
        onMouseEnter={e => { e.currentTarget.style.background = DS.primary; e.currentTarget.style.color = '#fff'; }}
        onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = DS.primary; }}>
        Pilih Tarif Ini
      </button>
    </div>
  );
}

function FlightSummaryRow({ flight, badge }: { flight: FlightType; badge: string }) {
  return (
    <div style={{ padding: '14px 20px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
        <div style={{ flexShrink: 0, background: DS.primary, color: '#fff', borderRadius: 99, padding: '3px 10px', fontFamily: 'Helvetica Neue', fontWeight: 700, fontSize: 11 }}>{badge}</div>
        <div style={{ width: 28, height: 28, borderRadius: 7, background: `${flight.logoColor}18`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, overflow: 'hidden', padding: 3 }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={flight.logo} alt={flight.airline} style={{ width: '100%', height: '100%', objectFit: 'contain' }}
            onError={e => { (e.currentTarget as HTMLImageElement).style.display = 'none'; }} />
        </div>
        <div>
          <div style={{ fontFamily: 'Helvetica Neue', fontWeight: 700, fontSize: 13, color: DS.dark }}>{flight.airline}</div>
          <div style={{ fontFamily: 'Helvetica Neue', fontSize: 11, color: DS.n500 }}>{flight.flightNo} · {flight.direct ? 'Langsung' : '1 Transit'}</div>
        </div>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontFamily: 'Helvetica Neue', fontWeight: 700, fontSize: 22, color: DS.dark }}>{flight.dep}</div>
          <div style={{ fontFamily: 'Helvetica Neue', fontSize: 11, color: DS.n500 }}>{AIRPORT_NAMES[flight.depCode] || flight.depCode}</div>
        </div>
        <div style={{ flex: 1, textAlign: 'center', minWidth: 50 }}>
          <div style={{ fontFamily: 'Helvetica Neue', fontSize: 11, color: DS.n400 }}>{flight.duration}</div>
          <div style={{ height: 2, background: DS.n100, borderRadius: 1, margin: '4px 0', position: 'relative' }}>
            <Plane size={12} color={DS.accent} style={{ position: 'absolute', left: '50%', top: '50%', transform: 'translate(-50%,-50%) rotate(90deg)' }} />
          </div>
          <div style={{ fontFamily: 'Helvetica Neue', fontSize: 11, color: flight.direct ? DS.successText : DS.dark }}>
            {flight.direct ? 'Langsung' : '1 Transit'}
          </div>
        </div>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontFamily: 'Helvetica Neue', fontWeight: 700, fontSize: 22, color: DS.dark }}>{flight.arr}</div>
          <div style={{ fontFamily: 'Helvetica Neue', fontSize: 11, color: DS.n500 }}>{AIRPORT_NAMES[flight.arrCode] || flight.arrCode}</div>
        </div>
      </div>
    </div>
  );
}

export default function FlightFarePage({
  flight, returnFlight = null, searchParams, onSelectFare, onBack,
}: {
  flight: FlightType;
  returnFlight?: FlightType | null;
  searchParams: SearchParams;
  onSelectFare: (fare: FareType | { outbound: FareType; return: FareType }, withProtection: boolean) => void;
  onBack: () => void;
}) {
  const { isMobile } = useBreakpoint();
  const fmt = (p: number) => 'Rp ' + p.toLocaleString('id-ID');
  const isRoundTrip = !!returnFlight;
  const sameAirline = isRoundTrip && returnFlight && flight.airline === returnFlight.airline;

  const [fareStep, setFareStep] = useState<'outbound' | 'return'>('outbound');
  const [outboundFare, setOutboundFare] = useState<FareType | null>(null);

  if (!flight) return null;

  const basePrice = flight.price - flight.cashback;
  const retBasePrice = returnFlight ? (returnFlight.price - returnFlight.cashback) : 0;

  const handlePickOutbound = (fare: FareType) => {
    if (isRoundTrip && !sameAirline) {
      setOutboundFare(fare);
      setFareStep('return');
      if (typeof window !== 'undefined') window.scrollTo({ top: 0, behavior: 'smooth' });
    } else {
      onSelectFare(fare, false);
    }
  };

  const handlePickReturn = (fare: FareType) => {
    onSelectFare({ outbound: outboundFare!, return: fare }, false);
  };

  const activeFlight = fareStep === 'return' && returnFlight ? returnFlight : flight;
  const activeBasePrice = fareStep === 'return' ? retBasePrice : basePrice;
  const handleBack = fareStep === 'return' ? () => setFareStep('outbound') : onBack;
  void activeFlight;

  return (
    <div style={{ minHeight: '100vh', background: DS.surface }}>
      {/* Sticky header */}
      <div style={{ background: DS.white, borderBottom: `1px solid ${DS.n100}`, position: 'sticky', top: 0, zIndex: 100 }}>
        <div style={{ maxWidth: layout.container['2xl'], margin: '0 auto', padding: isMobile ? '12px 16px' : '16px 24px', display: 'flex', alignItems: 'center', gap: isMobile ? 12 : 20 }}>
          <button onClick={handleBack} aria-label="Kembali" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: 40, height: 40, borderRadius: '50%', background: DS.n50, border: 'none', cursor: 'pointer', flexShrink: 0, transition: 'all 0.15s' }}
            onMouseEnter={e => (e.currentTarget.style.background = DS.n100)}
            onMouseLeave={e => (e.currentTarget.style.background = DS.n50)}>
            <ArrowLeft size={20} color={DS.dark} />
          </button>
          <div style={{ flex: 1, minWidth: 0, border: `1px solid ${DS.n100}`, borderRadius: 12, padding: '6px 12px', display: 'flex', flexDirection: 'column', background: DS.white }}>
            <div style={{ fontFamily: 'Helvetica Neue', fontWeight: 700, fontSize: 14, color: DS.dark, marginBottom: 2, display: 'flex', alignItems: 'center', gap: 6 }}>
              <Plane size={14} color={DS.primary} />
              <span>{searchParams?.fromCity || searchParams?.from}</span>
              <ArrowRight size={14} color={DS.n500} strokeWidth={2.4} />
              <span>{searchParams?.toCity || searchParams?.to}</span>
            </div>
            <div style={{ fontFamily: 'Helvetica Neue', fontSize: 12, color: DS.n500, display: 'flex', alignItems: 'center', gap: 6 }}>
              <span>{searchParams?.adults ?? 1} Penumpang</span>
              <span style={{ color: DS.n300 }}>-</span>
              <span style={{ textTransform: 'capitalize' }}>{searchParams?.cabinClass ?? 'Economy'}</span>
              {isRoundTrip && <><span style={{ color: DS.n300 }}>-</span><span>Pulang Pergi</span></>}
            </div>
          </div>
        </div>
      </div>

      <div style={{ maxWidth: 1200, margin: '0 auto', padding: isMobile ? '16px 16px 60px' : '32px 80px 60px' }}>

        {/* Flight summary */}
        {isRoundTrip && returnFlight ? (
          isMobile ? (
            <div style={{ background: DS.white, borderRadius: 14, border: `1px solid ${DS.n100}`, marginBottom: 24, overflow: 'hidden' }}>
              <FlightSummaryRow flight={flight} badge="Pergi" />
              <div style={{ height: 1, background: DS.n100, margin: '0 20px' }} />
              <FlightSummaryRow flight={returnFlight} badge="Pulang" />
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 24 }}>
              <div style={{ background: DS.white, borderRadius: 14, border: `1px solid ${DS.n100}` }}><FlightSummaryRow flight={flight} badge="Pergi" /></div>
              <div style={{ background: DS.white, borderRadius: 14, border: `1px solid ${DS.n100}` }}><FlightSummaryRow flight={returnFlight} badge="Pulang" /></div>
            </div>
          )
        ) : (
          <div style={{ background: DS.white, borderRadius: 14, border: `1px solid ${DS.n100}`, marginBottom: 24 }}>
            <FlightSummaryRow flight={flight} badge="Pergi" />
          </div>
        )}

        {/* Step indicator — round trip only */}
        {isRoundTrip && returnFlight && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 0, marginBottom: 24, background: DS.white, borderRadius: 14, border: `1px solid ${DS.n100}`, padding: isMobile ? '12px 16px' : '14px 24px', boxShadow: '0 1px 4px rgba(0,0,0,0.05)' }}>
            {/* Step 1 */}
            {(() => {
              const done = fareStep === 'return' && !sameAirline;
              const active = fareStep === 'outbound' || !!sameAirline;
              return (
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div style={{ width: 28, height: 28, borderRadius: '50%', background: done ? DS.successText : active ? DS.primary : DS.n200, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, transition: 'background 0.2s' }}>
                    {done ? <Check size={14} color="#fff" strokeWidth={2.5} /> : <span style={{ fontFamily: 'Helvetica Neue', fontWeight: 700, fontSize: 13, color: '#fff' }}>1</span>}
                  </div>
                  <div>
                    <div style={{ fontFamily: 'Helvetica Neue', fontWeight: 700, fontSize: 13, color: active || done ? DS.dark : DS.n400 }}>Tarif Pergi</div>
                    <div style={{ fontFamily: 'Helvetica Neue', fontSize: 11, color: DS.n500 }}>{flight.depCode} - {flight.arrCode}</div>
                  </div>
                </div>
              );
            })()}

            {/* Connector */}
            <div style={{ flex: 1, height: 2, margin: '0 12px', background: fareStep === 'return' && !sameAirline ? DS.successText : DS.n100, borderRadius: 1, transition: 'background 0.3s', minWidth: 20 }} />

            {/* Step 2 */}
            {sameAirline ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{ width: 28, height: 28, borderRadius: '50%', background: DS.primary, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <span style={{ fontFamily: 'Helvetica Neue', fontWeight: 700, fontSize: 13, color: '#fff' }}>2</span>
                </div>
                <div>
                  <div style={{ fontFamily: 'Helvetica Neue', fontWeight: 700, fontSize: 13, color: DS.dark }}>Tarif Pulang</div>
                  <div style={{ fontFamily: 'Helvetica Neue', fontSize: 11, color: DS.n500 }}>{returnFlight.depCode} - {returnFlight.arrCode}</div>
                </div>
              </div>
            ) : (
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{ width: 28, height: 28, borderRadius: '50%', background: fareStep === 'return' ? DS.primary : DS.n200, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, transition: 'background 0.2s' }}>
                  <span style={{ fontFamily: 'Helvetica Neue', fontWeight: 700, fontSize: 13, color: '#fff' }}>2</span>
                </div>
                <div>
                  <div style={{ fontFamily: 'Helvetica Neue', fontWeight: 700, fontSize: 13, color: fareStep === 'return' ? DS.dark : DS.n400 }}>Tarif Pulang</div>
                  <div style={{ fontFamily: 'Helvetica Neue', fontSize: 11, color: DS.n500 }}>{returnFlight.depCode} - {returnFlight.arrCode}</div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Section title */}
        <div style={{ fontFamily: 'Helvetica Neue', fontWeight: 700, fontSize: isMobile ? 16 : 18, color: DS.dark, marginBottom: 16 }}>
          {isRoundTrip && sameAirline ? 'Pilih Paket Tarif' : isRoundTrip ? `Pilih Tarif ${fareStep === 'outbound' ? 'Pergi' : 'Pulang'}` : 'Pilih Tarif'}
        </div>

        {/* Same-airline note */}
        {isRoundTrip && sameAirline && (
          <div style={{ fontFamily: 'Helvetica Neue', fontSize: 13, color: DS.n500, marginBottom: 16, background: DS.primaryLight, borderRadius: 10, padding: '10px 14px', border: `1px solid ${DS.primary}22` }}>
            Kedua penerbangan oleh {flight.airline} — satu paket tarif berlaku untuk pergi &amp; pulang.
          </div>
        )}

        {/* Fare cards */}
        <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'repeat(3,1fr)', gap: 16, alignItems: 'stretch' }}>
          {FARES.map(fare => {
            const onPick = isRoundTrip && sameAirline
              ? () => onSelectFare(fare, false)
              : isRoundTrip && fareStep === 'return'
              ? handlePickReturn
              : handlePickOutbound;
            const bp = isRoundTrip && sameAirline ? basePrice + retBasePrice : activeBasePrice;
            return <FareCard key={fare.id} fare={fare} onPick={onPick} basePrice={bp} />;
          })}
        </div>
      </div>
    </div>
  );
}
