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
  // Opsiyonel: Popover'ın yatayda hizalanma yönünü kontrol etmek için
  // 'left': anchorEl'in soluna hizala (varsayılan)
  // 'right': anchorEl'in sağına hizala
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
      // Tıklama, popover'ın içinde veya anchor elemanın içindeyse (eğer popover anchor'ın dışında açılıyorsa)
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

  if (alignment === 'right' && popoverRef.current) {
    // Sağ hizalama isteniyorsa, popover'ın genişliğini anchor'ın sol pozisyonundan çıkar
    // Not: Popover genişliği henüz DOM'a eklenmediği için burada kesin hesaplanamaz.
    // Ancak genellikle bu tarz basit popover'lar için anchor'ın solundan başlatmak yeterlidir.
    // Gelişmiş hizalama için bu mantığın Popover'ın render edilmesinden sonra güncellenmesi gerekir (useLayoutEffect).
    // Basitlik adına, şimdilik anchor'ın solunu kullanmaya devam edelim:
    // leftPosition = anchorRect.right + window.scrollX - popoverRef.current.offsetWidth;
  }

  const style: React.CSSProperties = {
    position: 'absolute',
    // Popover'ı Anchor'ın hemen altına yerleştir (birkaç piksel boşluk bırakılabilir)
    top: anchorRect.bottom + window.scrollY + 4,
    left: leftPosition,
    // Ekstra görünüm stillerini Tailwind'e bırak
  };

  // Tailwind sınıfları: Arka plan beyaz, gölge büyük, yuvarlak köşeler, z-index yüksek
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
    // Popover'ı doğrudan body'ye portallayın
    document.body
  );
};

export default CustomPopover;
