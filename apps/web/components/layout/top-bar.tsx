'use client';
import { useRouter } from 'next/navigation';

interface TopBarProps {
  title: string;
  onBack?: () => void;
  rightAction?: React.ReactNode;
}

const ChevronLeft = () => (
  <svg
    width="20"
    height="20"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2.5"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M15 18l-6-6 6-6" />
  </svg>
);

export function TopBar({ title, onBack, rightAction }: TopBarProps) {
  const router = useRouter();

  const handleBack = () => {
    if (onBack) {
      onBack();
    } else {
      router.back();
    }
  };

  return (
    <div
      className="sticky top-0 z-50 flex h-16 w-full items-center justify-between border-b border-stone-2/50 px-4"
      style={{
        background: 'rgba(253,252,251,0.85)',
        backdropFilter: 'blur(20px) saturate(180%)',
        WebkitBackdropFilter: 'blur(20px) saturate(180%)',
      }}
    >
      <div className="flex flex-1 items-center">
        <button
          onClick={handleBack}
          className="flex h-10 w-10 items-center justify-center rounded-xl bg-stone/40 text-ink-2 active:scale-90 transition-transform"
          aria-label="Kembali"
        >
          <ChevronLeft />
        </button>
      </div>

      <h1 className="flex-[2] text-center font-heading text-[17px] font-extrabold tracking-tight text-ink">
        {title}
      </h1>

      <div className="flex flex-1 justify-end">{rightAction}</div>
    </div>
  );
}
