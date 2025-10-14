// src/components/canvas/useResizeObserver.ts (veya Canvas.tsx'in en üstü)

import React, { useEffect } from 'react';

/**
 * Bir DOM elementinin boyut değişikliklerini dinler ve callback fonksiyonunu tetikler.
 * @param ref - Dinlenecek elementin referansı.
 * @param callback - Boyut değiştiğinde çağrılacak parametresiz fonksiyon.
 */
const useResizeObserver = (
  ref: React.RefObject<HTMLDivElement | null>,
  callback: () => void
) => {
  useEffect(() => {
    const element = ref.current;
    if (!element) return;

    // ResizeObserver, (entries) => void tipinde bir callback bekler.
    // Bizim parametresiz callback'imizi çağırması için anonim fonksiyon kullanıyoruz.
    const observer = new ResizeObserver(() => {
      callback();
    });

    observer.observe(element);

    return () => {
      observer.unobserve(element);
      observer.disconnect();
    };
    // useCallback kullandığınız için callback bağımlılığı güvenlidir.
  }, [ref, callback]);
};


