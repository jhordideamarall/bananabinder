export default function Loading() {
  return (
    <div
      className="flex min-h-screen items-center justify-center"
      style={{ background: 'var(--color-stone)' }}
    >
      <div className="flex flex-col items-center gap-3">
        <div
          className="h-10 w-10 rounded-full animate-pulse"
          style={{ background: 'var(--color-orange)' }}
        />
        <div
          className="h-2 w-24 rounded-full animate-pulse"
          style={{ background: 'var(--color-stone-3)' }}
        />
      </div>
    </div>
  );
}
