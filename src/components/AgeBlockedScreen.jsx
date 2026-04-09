// src/components/AgeBlockedScreen.jsx
// Full-screen splash shown when age verification fails (user is under 21).
// Replaces the entire app render. Reload resets state and gives another try.

export function AgeBlockedScreen() {
  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      background: '#0E0B08',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '40px 32px',
      textAlign: 'center',
      fontFamily: "'Courier Prime', monospace",
    }}>
      {/* Bottle icon */}
      <svg
        width="48"
        height="48"
        viewBox="0 0 48 48"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        style={{ marginBottom: 24, opacity: 0.5 }}
        aria-hidden="true"
      >
        <path
          d="M18 6h12v6l4 8v18a2 2 0 01-2 2H16a2 2 0 01-2-2V20l4-8V6z"
          stroke="#7A6845"
          strokeWidth="2"
          strokeLinejoin="round"
        />
        <path
          d="M14 28h20"
          stroke="#7A6845"
          strokeWidth="2"
        />
        <rect x="20" y="2" width="8" height="4" rx="1" fill="#7A6845" opacity="0.6" />
      </svg>

      <div style={{
        fontFamily: "'Cormorant Garamond', serif",
        fontWeight: 700,
        fontSize: 11,
        letterSpacing: '0.25em',
        color: '#C17D0E',
        marginBottom: 14,
      }}>
        DRAM SCOUT
      </div>

      <div style={{
        fontFamily: "'Cormorant Garamond', serif",
        fontWeight: 700,
        fontSize: 30,
        color: '#F0E2C8',
        lineHeight: 1.2,
        marginBottom: 16,
      }}>
        Access Restricted
      </div>

      <div style={{
        fontFamily: "'Courier Prime', monospace",
        fontSize: 13,
        color: '#7A6845',
        lineHeight: 1.7,
        maxWidth: 280,
      }}>
        You must be 21 years of age or older to access Dram Scout. This site contains
        content related to the purchase and consumption of alcohol.
      </div>
    </div>
  )
}
