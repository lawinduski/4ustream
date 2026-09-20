'use client';

import {
  useEffect,
  useMemo,
  useState,
} from 'react';

import {
  X,
  ExternalLink,
  Megaphone,
  ChevronLeft,
} from 'lucide-react';

import { createPortal } from 'react-dom';

import type { AdBanner } from '@/lib/types';

export function AdRotator({
  ads,
}: {
  ads: AdBanner[];
}) {
  const banners = useMemo(() => {
    return ads.filter((ad) => {
      const placement = String(
        ad.placement || 'banner',
      ).toLowerCase();

      return (
        placement === 'banner' ||
        placement === 'top' ||
        placement === 'home' ||
        placement === 'homepage'
      );
    });
  }, [ads]);

  const popups = useMemo(() => {
    return ads.filter((ad) => {
      const placement = String(
        ad.placement || '',
      ).toLowerCase();

      return placement === 'popup';
    });
  }, [ads]);

  const [index, setIndex] = useState(0);
  const [popupIndex, setPopupIndex] = useState(0);
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  /*
   * Make sure Portal only runs in browser.
   */
  useEffect(() => {
    setMounted(true);
  }, []);

  /*
   * Banner rotation.
   */
  useEffect(() => {
    if (banners.length <= 1) return;

    const timer = window.setInterval(() => {
      setIndex(
        (current) =>
          (current + 1) % banners.length,
      );
    }, 5000);

    return () => {
      window.clearInterval(timer);
    };
  }, [banners.length]);

  /*
   * Popup every 15 seconds.
   */
  useEffect(() => {
    if (!popups.length) return;

    const timer = window.setInterval(() => {
      setPopupIndex(
        (current) =>
          (current + 1) % popups.length,
      );

      setOpen(true);
    }, 15000);

    return () => {
      window.clearInterval(timer);
    };
  }, [popups.length]);

  /*
   * Lock background scroll while popup is open.
   */
  useEffect(() => {
    if (!open) return;

    const body = document.body;
    const html = document.documentElement;

    const scrollY = window.scrollY;

    const oldBodyOverflow = body.style.overflow;
    const oldBodyPosition = body.style.position;
    const oldBodyTop = body.style.top;
    const oldBodyWidth = body.style.width;
    const oldHtmlOverflow = html.style.overflow;

    html.style.overflow = 'hidden';

    body.style.overflow = 'hidden';
    body.style.position = 'fixed';
    body.style.top = -${scrollY}px;
    body.style.width = '100%';

    return () => {
      html.style.overflow = oldHtmlOverflow;

      body.style.overflow = oldBodyOverflow;
      body.style.position = oldBodyPosition;
      body.style.top = oldBodyTop;
      body.style.width = oldBodyWidth;

      window.scrollTo(0, scrollY);
    };
  }, [open]);

  const banner = banners[index];
  const popup = popups[popupIndex];

  const closePopup = () => {
    setOpen(false);
  };

  if (!banner && !popup) {
    return null;
  }

  const popupElement =
    mounted && popup && open
      ? createPortal(
          <div
            className="fixed inset-0 z-[9999] flex min-h-[100dvh] items-center justify-center bg-black/75 px-4 py-4 backdrop-blur-md"
            role="dialog"
            aria-modal="true"
            onMouseDown={(event) => {
              if (
                event.target ===
                event.currentTarget
              ) {
                closePopup();
              }
            }}
            onTouchStart={(event) => {
              if (
                event.target ===
                event.currentTarget
              ) {
                closePopup();
              }
            }}
          >
            <div className="relative flex max-h-[85dvh] w-full max-w-3xl flex-col overflow-y-auto overscroll-contain rounded-[2rem] border border-white/15 bg-slate-950 shadow-[0_30px_120px_rgba(0,0,0,.6)]">

              <button
                type="button"
                onClick={closePopup}
                aria-label="Close"className="absolute end-3 top-3 z-20 grid h-10 w-10 place-items-center rounded-full border border-white/10 bg-black/65 text-white backdrop-blur-xl"
              >
                <X size={18} />
              </button>

              <a
                href={popup.link || '#'}
                target={
                  popup.link
                    ? '_blank'
                    : undefined
                }
                rel="noopener noreferrer"
                onClick={closePopup}
                className="block shrink-0 bg-black"
              >
                <picture>
                  <source
                    media="(max-width: 640px)"
                    srcSet={
                      popup.mobileImage ||
                      popup.image
                    }
                  />

                  <img
                    src={popup.image}
                    alt={popup.title}
                    className="block max-h-[60dvh] w-full object-contain"
                    loading="eager"
                    decoding="async"
                  />
                </picture>
              </a>

              <div className="flex shrink-0 items-center justify-between gap-3 p-4 pb-[calc(1rem+env(safe-area-inset-bottom))]">
                <div className="min-w-0 truncate text-sm font-bold text-white">
                  {popup.title}
                </div>

                {popup.link && (
                  <a
                    href={popup.link}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={closePopup}
                    className="inline-flex shrink-0 items-center gap-2 rounded-xl bg-white px-4 py-2.5 text-xs font-black text-slate-950"
                  >
                    <ExternalLink size={14} />
                    Open
                  </a>
                )}
              </div>
            </div>
          </div>,
          document.body,
        )
      : null;

  return (
    <>
      {banner && (
        <section className="ad-shell relative overflow-hidden rounded-[1.8rem] border border-white/10 shadow-2xl">

          <a
            href={banner.link || '#'}
            target={
              banner.link
                ? '_blank'
                : undefined
            }
            rel="noopener noreferrer"
            className="group block"
          >
            <picture>
              <source
                media="(max-width: 640px)"
                srcSet={
                  banner.mobileImage ||
                  banner.image
                }
              />

              <img
                src={banner.image}
                alt={banner.title}
                loading="eager"
                decoding="async"
                sizes="100vw"
                className="h-[125px] w-full object-cover transition duration-700 group-hover:scale-[1.02] sm:h-[180px] lg:h-[220px]"
              />
            </picture>

            <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/55 via-transparent to-transparent" />

            <div className="absolute bottom-3 start-3 inline-flex items-center gap-2 rounded-full border border-white/10 bg-black/55 px-3 py-1.5 text-[11px] font-bold backdrop-blur-xl">
              <Megaphone size={13} />
              {banner.title}
            </div>

            <div className="absolute bottom-3 end-3 inline-flex items-center gap-1 rounded-full bg-white/10 px-3 py-1.5 text-[10px] backdrop-blur-xl">
              Open
              <ChevronLeft size={13} />
            </div>
          </a>

          {banners.length > 1 && (
            <div className="absolute end-3 top-3 rounded-full border border-white/10 bg-black/50 px-2.5 py-1 text-[10px] backdrop-blur-xl">
              {index + 1}/{banners.length}
            </div>
          )}

        </section>
      )}

      {popupElement}
    </>
  );
}
