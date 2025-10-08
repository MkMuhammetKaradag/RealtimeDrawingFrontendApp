import React, { useRef, useEffect, useCallback, type FC } from 'react';
import { createPortal } from 'react-dom';

/**
 * Bileşen özellikleri (Props) tanımı.
 */
interface CustomPopoverProps {
  children: React.ReactNode;
  open: boolean;
  anchorEl?: HTMLElement | null; // Popover'ın konumlandırılacağı DOM elemanı
  onClose: () => void;
  /**
   * Popover'ın Anchor'a göre konumunu belirler.
   * 'bottom': Anchor'ın altında açılır (Varsayılan / Mobil).
   * 'right': Anchor'ın sağında açılır (Masaüstü dikey menüye uyum).
   */
  positioning?: 'bottom' | 'right';
}

/**
 * Tıklama olaylarının belirtilen ref dışında gerçekleşip gerçekleşmediğini algılayan Hook.
 */
const useClickOutside = (
  ref: React.RefObject<HTMLElement | null>,
  handler: (event: MouseEvent) => void
) => {
  const memoizedHandler = useCallback(handler, [handler]);

  useEffect(() => {
    const listener = (event: MouseEvent) => {
      // Tıklama, popover'ın içinde ise görmezden gel
      if (!ref.current || ref.current.contains(event.target as Node)) {
        return;
      }

      // Dışa tıklamayı tetikle
      memoizedHandler(event);
    };

    document.addEventListener('mousedown', listener);
    // Temizleme: Dinleyiciyi kaldır
    return () => {
      document.removeEventListener('mousedown', listener);
    };
  }, [ref, memoizedHandler]);
};

// ----------------------------------------------------------------------

const CustomPopover: FC<CustomPopoverProps> = ({
  children,
  open,
  anchorEl,
  onClose,
  positioning = 'bottom', // Varsayılan: Altında açıl
}) => {
  // Açık değilse veya konumlandırma elemanı yoksa bileşeni render etme
  if (!open || !anchorEl) return null;

  const popoverRef = useRef<HTMLDivElement | null>(null);
  useClickOutside(popoverRef, onClose);

  const anchorRect = anchorEl.getBoundingClientRect();
  const screenWidth = window.innerWidth;
  const screenHeight = window.innerHeight;

  // ----------------------------------------------------------------------
  // KRİTİK DÜZENLEME: KONUMLANDIRMA MANTIĞI
  // ----------------------------------------------------------------------

  let topPosition: number;
  let leftPosition: number;
  const offset = 8; // Anchor ile Popover arasındaki boşluk

  if (positioning === 'right') {
    // Masaüstü (Dikey Toolbar): Anchor'ın sağında açıl

    // Y ekseni: Popover'ı Anchor'ın üst kenarıyla hizala
    topPosition = anchorRect.top + window.scrollY;

    // X ekseni: Popover'ı Anchor'ın sağında aç
    leftPosition = anchorRect.right + window.scrollX + offset;

    // *Ekran dışına taşma kontrolü (Basitlik adına yatay taşmayı kontrol ediyoruz)*
    // Not: Popover genişliğini bilmediğimiz için tam kontrol zor, ancak basit bir koruma ekleyebiliriz.
    // Eğer sağ kenar çok yakınsa, solunda açmayı düşünebiliriz. (Şimdilik varsayılanı koruyoruz)
  } else {
    // Mobil (Yatay Toolbar) veya varsayılan: Anchor'ın altında açıl

    // Y ekseni: Popover'ı Anchor'ın altından başlat
    topPosition = anchorRect.bottom + window.scrollY + offset;

    // X ekseni: Popover'ı Anchor'ın sol kenarıyla hizala
    leftPosition = anchorRect.left + window.scrollX;

    // *Ekran dışına taşma kontrolü (Sağ kenar):*
    // Popover'ın genişliğini bilmediğimiz için sağa hizalama yapamayız.
    // En iyi ihtimalle, sol konumu ekranın dışına taşmayacak şekilde ayarlayabiliriz.
    // (Örn: Popover'ın genişliği 250px olsun farazi)
    const assumedPopoverWidth = 250;
    if (leftPosition + assumedPopoverWidth > screenWidth) {
      // Popover'ı sağ kenardan içeri kaydır
      leftPosition = screenWidth - assumedPopoverWidth - offset;
    }
    // Negatif olmasını engelle
    leftPosition = Math.max(offset, leftPosition);
  }

  const style: React.CSSProperties = {
    position: 'absolute',
    top: topPosition,
    left: leftPosition,
  };

  // Tailwind sınıfları: Arka plan beyaz, büyük gölge, yuvarlak köşeler, yüksek z-index
  const tailwindClasses =
    'bg-white shadow-xl rounded-lg p-2 z-50 transform origin-top'; // Shadow ve rounded biraz daha büyütüldü

  return createPortal(
    <div
      ref={popoverRef}
      style={style}
      className={`custom-popover-root ${tailwindClasses}`}
    >
      {children}
    </div>,
    document.body
  );
};

export default CustomPopover;
