export default function ShopLoading() {
  return (
    <div
      style={{
        flex: 1,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: '#F5F3F0',
        padding: 40,
      }}
    >
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
        <div
          style={{
            width: 36,
            height: 36,
            borderRadius: '50%',
            background: 'var(--color-orange)',
            animation: 'pulse 1.2s ease-in-out infinite',
          }}
        />
        <div
          style={{
            width: 80,
            height: 6,
            borderRadius: 9999,
            background: '#D8D4CE',
            animation: 'pulse 1.2s ease-in-out infinite 0.2s',
          }}
        />
      </div>
    </div>
  );
}
