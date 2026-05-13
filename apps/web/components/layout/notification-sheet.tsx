'use client';
import { m, AnimatePresence } from 'framer-motion';
import { X, BellOff, LogIn } from 'lucide-react';
import { useAuth } from '@/components/providers/auth-provider';
import Link from 'next/link';

interface Notification {
  id: string;
  title: string;
  desc: string;
  time: string;
  type: 'order' | 'promo' | 'info';
  read: boolean;
}

const DUMMY_NOTIFS: Notification[] = [
  {
    id: '1',
    title: 'Pesanan Dikirim!',
    desc: 'Binder Aesthetic A5 kamu sedang dalam perjalanan bersama kurir Biteship.',
    time: '2 jam yang lalu',
    type: 'order',
    read: false,
  },
  {
    id: '2',
    title: 'Promo Flash Sale!',
    desc: 'Diskon hingga 50% untuk semua koleksi stiker & washi tape hari ini saja.',
    time: '5 jam yang lalu',
    type: 'promo',
    read: false,
  },
  {
    id: '3',
    title: 'Update Stok!',
    desc: 'Binder Transparan yang kamu incar sudah tersedia kembali. Cek sekarang!',
    time: 'Kemarin',
    type: 'order',
    read: true,
  },
];

interface NotificationSheetProps {
  isOpen: boolean;
  onClose: () => void;
}

export function NotificationSheet({ isOpen, onClose }: NotificationSheetProps) {
  const { user } = useAuth();
  const isGuest = !user;

  // Guests only see promos
  const displayNotifs = isGuest ? DUMMY_NOTIFS.filter((n) => n.type === 'promo') : DUMMY_NOTIFS;

  return (
    <AnimatePresence>
      {isOpen && (
        <m.div
          key="notif-backdrop"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 z-[290] bg-black/40 backdrop-blur-sm"
        />
      )}
      {isOpen && (
        <m.div
          key="notif-sheet"
          initial={{ x: '100%' }}
          animate={{ x: 0 }}
          exit={{ x: '100%' }}
          transition={{
            type: 'spring',
            damping: 22,
            stiffness: 280,
            mass: 1,
          }}
          className="fixed right-[-100px] top-0 z-[300] h-full bg-[#FDFCFB] shadow-2xl"
          style={{
            width: 'calc(min(430px, 100%) + 100px)',
            paddingRight: 100,
            paddingTop: 'calc(12px + env(safe-area-inset-top))',
            paddingBottom: 'env(safe-area-inset-bottom)',
          }}
        >
            {/* Header */}
            <m.div
              initial={{ opacity: 0, x: -30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ type: 'spring', damping: 25, stiffness: 300, delay: 0.1 }}
              className="flex items-center justify-between border-b border-stone-2 px-6 py-4"
            >
              <div>
                <h2 className="font-heading text-lg font-bold text-ink">
                  {isGuest ? 'Halo, Binder Lovers!' : 'Notifikasi'}
                </h2>
                <p className="font-sans text-xs text-ink-3">
                  {isGuest ? 'Masuk buat liat update pesananmu' : 'Info terbaru buat kamu'}
                </p>
              </div>
              <m.button
                whileTap={{ scale: 0.9 }}
                onClick={onClose}
                className="flex h-10 w-10 items-center justify-center rounded-full bg-stone hover:bg-stone-2"
              >
                <X size={20} className="text-ink" />
              </m.button>
            </m.div>

            {/* List */}
            <div className="h-full overflow-y-auto pb-32 no-scrollbar">
              {isGuest && (
                <m.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ type: 'spring', damping: 20, stiffness: 300, delay: 0.1 }}
                  className="mx-6 mt-6 mb-2 overflow-hidden rounded-2xl border border-[#7EC8E3]/20 bg-[#7EC8E3]/5 p-5"
                >
                  <h4 className="font-heading text-sm font-bold text-ink">Pantau Pesananmu</h4>
                  <p className="mt-1 font-sans text-xs leading-relaxed text-ink-3">
                    Login sekarang untuk melihat status pengiriman, koleksi terbaru, dan info loyalty
                    point.
                  </p>
                  <Link href="/login" onClick={onClose}>
                    <m.button
                      whileTap={{ scale: 0.96 }}
                      className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl bg-[#FFD54C] py-2.5 font-heading text-xs font-bold text-ink shadow-lg shadow-[#FFD54C]/20"
                    >
                      <LogIn size={14} /> Masuk Sekarang
                    </m.button>
                  </Link>
                </m.div>
              )}

              {displayNotifs.length > 0 ? (
                <div className="divide-y divide-stone-2">
                  {displayNotifs.map((notif, index) => (
                    <m.div
                      key={notif.id}
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{
                        type: 'spring',
                        damping: 25,
                        stiffness: 300,
                        delay: (isGuest ? 0.2 : 0.1) + index * 0.06,
                      }}
                      className={`relative flex gap-4 px-6 py-5 transition-colors ${
                        !notif.read ? 'bg-[#7EC8E3]/5' : 'hover:bg-stone/30'
                      }`}
                    >
                      <div
                        className={`w-1.5 flex-shrink-0 rounded-full my-1 ${
                          notif.type === 'order'
                            ? 'bg-[#FFD54C]'
                            : notif.type === 'promo'
                              ? 'bg-[#7EC8E3]'
                              : 'bg-[#A09890]'
                        }`}
                      />

                      <div className="flex-1">
                        <div className="flex items-start justify-between gap-2">
                          <h3
                            className={`font-heading text-[14px] font-bold leading-tight ${
                              !notif.read ? 'text-ink' : 'text-ink-2'
                            }`}
                          >
                            {notif.title}
                          </h3>
                          <span className="flex-shrink-0 font-sans text-[10px] text-ink-4">
                            {notif.time}
                          </span>
                        </div>
                        <p className="mt-1 font-sans text-[13px] leading-relaxed text-ink-3">
                          {notif.desc}
                        </p>
                      </div>

                      {!notif.read && (
                        <div className="absolute right-6 top-6 h-2 w-2 rounded-full bg-[#7EC8E3]" />
                      )}
                    </m.div>
                  ))}
                </div>
              ) : (
                <div className="flex h-[40vh] flex-col items-center justify-center px-10 text-center">
                  <div className="mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-stone">
                    <BellOff size={32} className="text-ink-4" />
                  </div>
                  <h3 className="font-heading text-lg font-bold text-ink">Belum ada kabar</h3>
                  <p className="mt-2 font-sans text-sm text-ink-3">
                    Notifikasi tentang pesanan dan promo bakal muncul di sini.
                  </p>
                </div>
              )}
            </div>

            {/* No Footer - Force individual clicks */}
          </m.div>
      )}
    </AnimatePresence>
  );
}
