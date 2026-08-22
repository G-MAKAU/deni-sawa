import { ImageResponse } from 'next/og';

export const alt = 'Deni Sawa Partners — From Special Situations to Best-in-Class';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

const ORANGE = '#E8510A';
const GROWTH = '#5A9E28';

export default async function OpengraphImage() {
  // Fetch the OG background image
  let bgDataUrl = '';
  try {
    const bgRes = await fetch(new URL('/images/og-background.webp', import.meta.url).href, {
      next: { revalidate: 86400 },
    });
    if (bgRes.ok) {
      const buf = await bgRes.arrayBuffer();
      bgDataUrl = `data:image/webp;base64,${Buffer.from(buf).toString('base64')}`;
    }
  } catch {
    // Fallback — no background image
  }

  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          backgroundColor: '#111111',
          color: '#ffffff',
          position: 'relative',
          overflow: 'hidden',
          fontFamily: 'sans-serif',
        }}
      >
        {/* Background image with overlay */}
        {bgDataUrl && (
          <img
            src={bgDataUrl}
            alt=""
            style={{
              position: 'absolute',
              inset: 0,
              width: '100%',
              height: '100%',
              objectFit: 'cover',
              opacity: 0.15,
            }}
          />
        )}

        {/* Top accent bar */}
        <div style={{ display: 'flex', width: '100%', height: 10, background: ORANGE, position: 'relative', zIndex: 1 }} />

        {/* Ambient gradients */}
        <div
          style={{
            position: 'absolute',
            top: -140,
            right: -120,
            width: 520,
            height: 520,
            borderRadius: 9999,
            background: `radial-gradient(circle, rgba(232,81,10,0.35), transparent 70%)`,
          }}
        />
        <div
          style={{
            position: 'absolute',
            bottom: -160,
            left: -120,
            width: 480,
            height: 480,
            borderRadius: 9999,
            background: `radial-gradient(circle, rgba(90,158,40,0.28), transparent 70%)`,
          }}
        />

        {/* Content */}
        <div
          style={{
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            padding: '64px 72px',
            position: 'relative',
            zIndex: 1,
          }}
        >
          {/* Brand */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 44 }}>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: 64,
                height: 64,
                borderRadius: 14,
                background: ORANGE,
                color: '#fff',
                fontSize: 28,
                fontWeight: 800,
              }}
            >
              DS
            </div>
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <div style={{ display: 'flex', fontSize: 30, fontWeight: 800, letterSpacing: '0.01em' }}>
                <span>DENI&nbsp;</span>
                <span style={{ color: ORANGE }}>SAWA</span>
              </div>
              <div style={{ fontSize: 13, letterSpacing: '0.42em', color: 'rgba(255,255,255,0.55)', marginTop: 4 }}>
                PARTNERS
              </div>
            </div>
          </div>

          {/* Headline */}
          <div style={{ display: 'flex', fontSize: 58, lineHeight: 1.12, fontWeight: 700, letterSpacing: '-0.02em', maxWidth: 900 }}>
            <span>From Special Situations to&nbsp;</span>
            <span style={{ color: ORANGE }}>Best-in-Class</span>
          </div>

          {/* Subline */}
          <div style={{ marginTop: 24, fontSize: 24, lineHeight: 1.5, color: 'rgba(255,255,255,0.72)', maxWidth: 820 }}>
            Senior-level advisory &amp; fractional business support for professionals, entrepreneurs and investors.
          </div>

          {/* Footer strip */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginTop: 52 }}>
            <span
              style={{
                display: 'flex',
                alignItems: 'center',
                padding: '10px 20px',
                borderRadius: 999,
                background: 'rgba(232,81,10,0.16)',
                color: ORANGE,
                fontSize: 16,
                fontWeight: 700,
                letterSpacing: '0.04em',
              }}
            >
              FREE HEALTH CHECKS
            </span>
            <span style={{ color: 'rgba(255,255,255,0.4)', fontSize: 15 }}>
              Business · Professional Financial
            </span>
          </div>
        </div>

        {/* Bottom accent */}
        <div style={{ display: 'flex', width: '100%', height: 8, background: GROWTH, position: 'relative', zIndex: 1 }} />
      </div>
    ),
    { ...size }
  );
}
