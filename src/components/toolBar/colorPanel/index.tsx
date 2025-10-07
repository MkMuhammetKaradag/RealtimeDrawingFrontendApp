import React, {
  useContext,
  useState,
  useEffect,
  type FC,
  type JSX,
} from 'react';
import { SketchPicker } from 'react-color';
import type { ColorResult, RGBColor } from 'react-color';

import { ColorContext } from '../../../context';
import type { ColorType } from '../../../util/toolType';
import { ColorValue } from '../../../util/toolType';
import CustomPopover from './CustomPopover';
import { FaPalette, FaExchangeAlt } from 'react-icons/fa';

interface ColorPanelProps {
  className?: string;
}

const colors: { title: string; value: string }[] = [
  { title: 'Siyah', value: '000000ff' },
  { title: 'Gri %50', value: '7f7f7fff' },
  { title: 'Koyu Kırmızı', value: '880015ff' },
  { title: 'Kırmızı', value: 'ed1c24ff' },
  { title: 'Turuncu', value: 'ff7f27ff' },
  { title: 'Sarı', value: 'fff200ff' },
  { title: 'Yeşil', value: '22b14cff' },
  { title: 'Turkuaz (Mavi-Yeşil)', value: '00a2e8ff' },
  { title: 'Çivit Mavisi', value: '3f48ccff' },
  { title: 'Mor', value: 'a349a4ff' },
  { title: 'Beyaz', value: 'ffffffff' },
  { title: 'Gri %25', value: 'c3c3c3ff' },
  { title: 'Kahverengi', value: 'b97a57ff' },
  { title: 'Gül Rengi', value: 'ffaec9ff' },
  { title: 'Altın Sarısı', value: 'ffc90eff' },
  { title: 'Açık Sarı', value: 'efe4b0ff' },
  { title: 'Limon Yeşili', value: 'b5e61dff' },
  { title: 'Zeytin Yeşili', value: '808000ff' },
  { title: 'Açık Cam Göbeği', value: '99d9eaff' },
  { title: 'Mavi Gri', value: '7092beff' },
  { title: 'Açık Mor', value: 'c8bfe7ff' },
];

const initialRGBColor: RGBColor = { r: 0, g: 0, b: 0, a: 1 };
const initialColorResult: ColorResult = {
  hex: '#000000',
  rgb: initialRGBColor,
  hsl: { h: 0, s: 0, l: 0, a: 1 },
};

const ColorPanel: FC<ColorPanelProps> = (props): JSX.Element => {
  const { className } = props;

  const colorContext = useContext(ColorContext);
  const activeColorType: ColorType = colorContext.activeColor;

  const [isPickerOpen, setIsPickerOpen] = useState(false);
  const [anchorEle, setAnchorEle] = useState<HTMLElement | null>(null);
  const [pickerColor, setPickerColor] =
    useState<ColorResult>(initialColorResult);

  const handleChange = (color: ColorResult): void => {
    setPickerColor(color);
  };

  const handleCompleteChange = (color: ColorResult): void => {
    setPickerColor(color);

    if (!color || !color.rgb || !color.hex) return;

    const a = color.rgb.a;
    const hex = color.hex.replace('#', '');

    const alphaHex =
      a !== undefined
        ? Math.round(a * 255)
            .toString(16)
            .padStart(2, '0')
        : 'ff';

    const newColorValue = `#${hex}${alphaHex}`;
    colorContext.setColor(newColorValue);
  };

  useEffect(() => {
    const activeColorHex =
      activeColorType === ColorValue.MAIN
        ? colorContext.mainColor
        : colorContext.subColor;

    if (activeColorHex && activeColorHex.length >= 7) {
      const currentHexWithoutHash = pickerColor.hex
        ? pickerColor.hex.replace('#', '')
        : '';
      const activeHexWithoutHash = activeColorHex.replace('#', '');

      if (
        activeHexWithoutHash.substring(0, 6) !==
        currentHexWithoutHash.substring(0, 6)
      ) {
        setPickerColor({ hex: activeColorHex } as ColorResult);
      }
    }
  }, [
    activeColorType,
    colorContext.mainColor,
    colorContext.subColor,
    pickerColor.hex,
  ]);

  const handleOpenPicker: React.MouseEventHandler<HTMLElement> = (event) => {
    setAnchorEle(event.currentTarget);
    setIsPickerOpen(true);
  };

  // Swap colors fonksiyonu - Context'ten kullan
  const swapColors = () => {
    if (colorContext.swapColors) {
      colorContext.swapColors();
    }
  };

  const panelClasses = `${className} relative p-3 w-auto flex items-start gap-3`;

  return (
    <div className={panelClasses}>
      {/* Sol Taraf: Renk Seçim Kartları */}
      <div className="flex  items-center gap-2">
        {/* Ana Renk */}
        <button
          onClick={() => colorContext.setActiveColor(ColorValue.MAIN)}
          title="Ana Rengi Seç (Renk 1)"
          className={`group relative overflow-hidden rounded-lg transition-all duration-200 ${
            activeColorType === ColorValue.MAIN
              ? 'ring-2 ring-blue-500 ring-offset-1 scale-105'
              : 'hover:scale-105 hover:shadow-md'
          }`}
        >
          <div className="w-12 h-12 relative">
            <div
              className="absolute inset-0 transition-transform duration-200 group-hover:scale-110"
              style={{
                backgroundColor: colorContext.mainColor.substring(0, 7),
              }}
            />
          </div>
          <div className="bg-white/90 py-1 text-center border-t border-gray-200">
            <span className="text-xs font-medium text-gray-700">Renk 1</span>
          </div>
        </button>

        {/* Değiştirme Butonu */}
        <button
          onClick={swapColors}
          className="p-2 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-600 transition-all duration-200 hover:rotate-180"
          title="Renkleri Değiştir"
        >
          <FaExchangeAlt className="text-sm" />
        </button>

        {/* İkincil Renk */}
        <button
          onClick={() => colorContext.setActiveColor(ColorValue.SUB)}
          title="İkincil Rengi Seç (Renk 2)"
          className={`group relative overflow-hidden rounded-lg transition-all duration-200 ${
            activeColorType === ColorValue.SUB
              ? 'ring-2 ring-blue-500 ring-offset-1 scale-105'
              : 'hover:scale-105 hover:shadow-md'
          }`}
        >
          <div className="w-12 h-12 relative">
            <div
              className="absolute inset-0 transition-transform duration-200 group-hover:scale-110"
              style={{ backgroundColor: colorContext.subColor.substring(0, 7) }}
            />
          </div>
          <div className="bg-white/90 py-1 text-center border-t border-gray-200">
            <span className="text-xs font-medium text-gray-700">Renk 2</span>
          </div>
        </button>
      </div>

      {/* Sağ Taraf: Palet ve Özel Renk Seçici */}
      <div className="flex flex-col gap-3">
        {/* Ön Tanımlı Renk Paleti */}
        <div className="grid grid-cols-10 gap-1">
          {colors.map((color) => (
            <button
              onClick={() => colorContext.setColor('#' + color.value)}
              key={color.value}
              title={color.title}
              className="w-4 h-4 rounded border border-gray-300 hover:border-gray-500 hover:scale-110 active:scale-95 transition-all duration-150 shadow-sm hover:shadow-md"
              style={{ backgroundColor: '#' + color.value.substring(0, 6) }}
            />
          ))}
        </div>

        {/* Renk Seçiciyi Açma Butonu */}
        <button
          onClick={handleOpenPicker}
          title="Özel Renk Seç"
          className="w-full flex items-center justify-center gap-2 py-2 px-3 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white text-sm font-medium rounded-lg shadow hover:shadow-md transition-all duration-200"
        >
          <FaPalette className="text-sm" />
          Özel Renk
        </button>
      </div>

      {/* Sketch Renk Seçici */}
      <CustomPopover
        open={isPickerOpen}
        onClose={() => setIsPickerOpen(false)}
        anchorEl={anchorEle}
      >
        <div className="p-0">
          <SketchPicker
            color={pickerColor.rgb}
            onChange={handleCompleteChange}
            // onChangeComplete={handleCompleteChange}
          />
        </div>
      </CustomPopover>

      {/* Panel Başlığı */}
      <div className="absolute bottom-0 left-0 right-0 text-center text-xs font-semibold text-gray-600 pt-1">
        Renkler
      </div>
    </div>
  );
};

export default ColorPanel;
