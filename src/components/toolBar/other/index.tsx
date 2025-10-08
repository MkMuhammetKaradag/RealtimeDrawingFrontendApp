import React, { useContext, type FC, type JSX } from 'react';

// İkonları içe aktar
import { MdClearAll } from 'react-icons/md'; // Tuvali Temizle
import { IoMdUndo } from 'react-icons/io'; // Geri Al
import { IoMdRedo } from 'react-icons/io'; // Yinele

import {
  CLEAR_EVENT,
  REDO_EVENT,
  UNDO_EVENT,
} from '../../../util/dispatcher/event';
import { DispatcherContext } from '../../../context';

/**
 * Bileşen özellikleri (Props) tanımı.
 */
interface OtherOperatorProps {
  className?: string;
}

/**
 * Diğer İşlemler (Temizle, Geri Al, Yinele) bileşeni.
 */
const OtherOperator: FC<OtherOperatorProps> = (props): JSX.Element => {
  const { className } = props;
  const dispatcherContext = useContext(DispatcherContext);

  const clearCanvas = (): void => {
    dispatcherContext.dispatcher.dispatch(CLEAR_EVENT);
  };

  const undo = (): void => {
    dispatcherContext.dispatcher.dispatch(UNDO_EVENT);
  };

  const redo = (): void => {
    dispatcherContext.dispatcher.dispatch(REDO_EVENT);
  };

  // ----------------------------------------------------------------------
  // KRİTİK DEĞİŞİKLİK: HER ZAMAN YATAY SIRALAMA
  // ----------------------------------------------------------------------

  // Ana Kapsayıcı: Mobil ve Masaüstünde HER ZAMAN yatay (flex-row).
  // `Toolbar` dikey olsa bile bu grup yatay kalır.
  const panelClasses = `${className} relative w-full flex flex-row items-center justify-between space-x-2 p-0`;
  // Not: `justify-between` kullanıldı, böylece butonlar alana yayılır.
  // Not: Dikey mod için (md:) boşluk sınıfları kaldırıldı, sadece yatay boşluk kaldı.

  // Tailwind sınıfları: Tekrar kullanılabilir buton stili
  const itemBaseClasses =
    'operator-item text-xl cursor-pointer w-8 h-8 flex justify-center items-center rounded-md border border-gray-100 transition-all text-gray-700';
  const itemHoverClasses = 'hover:bg-indigo-100 hover:border-indigo-400';

  return (
    <div className={panelClasses}>
      {/* Tuvali Temizle Butonu */}
      <button
        title="Tuvali Temizle (Ctrl+A)"
        onClick={clearCanvas}
        className={`${itemBaseClasses} ${itemHoverClasses}`}
      >
        <MdClearAll size={20} />
      </button>

      {/* Geri Al (Undo) Butonu */}
      <button
        title="Geri Al (Ctrl+Z)"
        onClick={undo}
        className={`${itemBaseClasses} ${itemHoverClasses}`}
      >
        <IoMdUndo size={20} />
      </button>

      {/* Yinele (Redo) Butonu */}
      <button
        title="Yinele (Ctrl+Shift+Z / Ctrl+Y)"
        onClick={redo}
        className={`${itemBaseClasses} ${itemHoverClasses}`}
      >
        <IoMdRedo size={20} />
      </button>
    </div>
  );
};

export default OtherOperator;
