export default async function CategoryPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;

  return (
    <div
      style={{
        minHeight: '100vh',
        background: '#F5F3F0',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <p
        style={{
          fontFamily: 'var(--font-heading)',
          fontSize: 14,
          color: '#6B6460',
        }}
      >
        Kategori: {slug} — Coming in Phase 3
      </p>
    </div>
  );
}
