import type { CSSProperties } from 'react';

interface EmptyStateAction {
  label: string;
  href?: string;
  onClick?: () => void;
}

interface EmptyStateProps {
  title: string;
  description?: string;
  action?: EmptyStateAction;
}

const PawIcon = () => (
  <svg
    width="48"
    height="48"
    viewBox="0 0 24 24"
    fill="none"
    stroke="#D8D4CE"
    strokeWidth="1.5"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <circle cx="11" cy="4" r="2" />
    <circle cx="18" cy="8" r="2" />
    <circle cx="20" cy="16" r="2" />
    <path d="M9 10a5 5 0 015 5v3.5a3.5 3.5 0 01-6.84 1.045Q6.52 17.48 4.46 16.84A3.5 3.5 0 018 13.5V13a5 5 0 011-3z" />
  </svg>
);

const actionStyle: CSSProperties = {
  background: '#E07B39',
  color: 'white',
  padding: '12px 24px',
  borderRadius: 9999,
  fontFamily: 'var(--font-heading)',
  fontWeight: 700,
  fontSize: 14,
  textDecoration: 'none',
  display: 'inline-flex',
  alignItems: 'center',
};

export function EmptyState({ title, description, action }: EmptyStateProps) {
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '48px 24px',
        gap: 16,
        textAlign: 'center',
      }}
    >
      <PawIcon />
      <div>
        <p
          style={{
            fontFamily: 'var(--font-heading)',
            fontWeight: 700,
            fontSize: 16,
            color: '#1A1714',
            marginBottom: 6,
          }}
        >
          {title}
        </p>
        {description && (
          <p
            style={{
              fontFamily: 'var(--font-sans)',
              fontSize: 14,
              color: '#6B6460',
              lineHeight: 1.5,
            }}
          >
            {description}
          </p>
        )}
      </div>
      {action &&
        (action.href ? (
          <a href={action.href} style={actionStyle}>
            {action.label}
          </a>
        ) : (
          <button
            onClick={action.onClick}
            style={{ ...actionStyle, border: 'none', cursor: 'pointer' }}
          >
            {action.label}
          </button>
        ))}
    </div>
  );
}
