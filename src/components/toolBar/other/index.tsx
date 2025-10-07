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
 * DispatcherContext aracılığıyla olayları tetikler.
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

  // Tailwind sınıfları: Ana Kapsayıcı
  const panelClasses = `${className} relative p-2 pt-0 w-20 flex flex-col items-center`;

  // Tailwind sınıfları: Tekrar kullanılabilir buton stili
  const itemBaseClasses =
    'operator-item text-xl cursor-pointer w-6 h-6 flex justify-center items-center rounded border border-transparent transition-colors';
  const itemHoverClasses = 'hover:bg-blue-100 hover:border-blue-400';

  return (
    <div className={panelClasses}>
      {/* İşlem İçeriği Kapsayıcı - operator-content */}
      <div className="flex justify-between w-full">
        {/* Tuvali Temizle Butonu */}
        <span
          title="Tuvali Temizle"
          className={`${itemBaseClasses} ${itemHoverClasses}`}
        >
          <MdClearAll onClick={clearCanvas} />
        </span>

        {/* Geri Al (Undo) Butonu */}
        <span
          title="Geri Al"
          className={`${itemBaseClasses} ${itemHoverClasses}`}
        >
          <IoMdUndo onClick={undo} />
        </span>

        {/* Yinele (Redo) Butonu */}
        <span
          title="Yinele"
          className={`${itemBaseClasses} ${itemHoverClasses}`}
        >
          <IoMdRedo onClick={redo} />
        </span>
      </div>

      {/* Panel Başlığı - title */}
      {/* Absolute konumlandırma ile altta ortalanmış başlık */}
      <span className="absolute bottom-0 w-full text-center text-xs font-semibold text-gray-600 pt-1">
        İşlemler
      </span>
    </div>
  );
};

export default OtherOperator;
