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
  // Yatay hizalama için opsiyonel prop (Sol'a hizala varsayılan)
  alignment?: 'left' | 'right';
}

/**
 * Tıklama olaylarının belirtilen ref dışında gerçekleşip gerçekleşmediğini algılayan Hook.
 */
const useClickOutside = (
  ref: React.RefObject<HTMLElement | null>,
  handler: (event: MouseEvent) => void
) => {
  // Handler fonksiyonunu useCallback ile sarmalayarak ref bağımlılığını sabitleriz.
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
  alignment = 'left', // Varsayılan sola hizalama
}) => {
  // Açık değilse veya konumlandırma elemanı yoksa bileşeni render etme
  if (!open || !anchorEl) return null;

  const popoverRef = useRef<HTMLDivElement | null>(null);
  useClickOutside(popoverRef, onClose);

  // Popover'ı anchorEl'in altına konumlandırmak için stil hesaplayın
  const anchorRect = anchorEl.getBoundingClientRect();

  // Yatay konumu hesapla
  let leftPosition = anchorRect.left + window.scrollX;

  // Eğer sağ hizalama istiyorsak ve genişlik biliniyorsa (ancak bu zor olduğu için şimdilik sola hizayı koruyalım.)
  // Basitlik ve güvenilirlik adına sol hizayı temel alıyoruz.

  const style: React.CSSProperties = {
    position: 'absolute',
    // Popover'ı Anchor'ın hemen altına yerleştir (+4px boşluk)
    top: anchorRect.bottom + window.scrollY + 4,
    left: leftPosition,
  };

  // Tailwind sınıfları: Arka plan beyaz, büyük gölge, yuvarlak köşeler, yüksek z-index
  const tailwindClasses =
    'bg-white shadow-xl rounded-md p-2 z-50 transform origin-top';

  return createPortal(
    <div
      ref={popoverRef}
      style={style}
      className={`custom-popover-root ${tailwindClasses}`}
    >
      {children}
    </div>,
    // Popover'ı doğrudan body'ye portallayın, böylece diğer her şeyin üzerinde görünür.
    document.body
  );
};

export default CustomPopover;
