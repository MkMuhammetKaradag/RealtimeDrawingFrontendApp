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

const useIsDesktop = (breakpoint = 768) => {
  const [isDesktop, setIsDesktop] = useState(window.innerWidth >= breakpoint);

  useEffect(() => {
    const handleResize = () => {
      setIsDesktop(window.innerWidth >= breakpoint);
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [breakpoint]);

  return isDesktop;
};

const ColorPanel: FC<ColorPanelProps> = (props): JSX.Element => {
  const { className } = props;
  const isDesktop = useIsDesktop();

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

  const swapColors = () => {
    if (colorContext.swapColors) {
      colorContext.swapColors();
    }
  };

  return (
    <div className={`${className} w-full`}>
      {/* Mobil: Kompakt renk seçimi - Renk kartları + Özel renk butonu */}
      <div className="md:hidden flex  gap-2">
        {/* Renk Seçim Kartları - Mobilde daha kompakt */}
        <div className="flex items-center justify-between gap-2">
          {/* Ana Renk */}
          <button
            onClick={() => colorContext.setActiveColor(ColorValue.MAIN)}
            title="Ana Rengi Seç"
            className={`flex-1 flex flex-col items-center p-1 rounded-lg transition-all duration-200 border-2 ${
              activeColorType === ColorValue.MAIN
                ? 'border-blue-500 bg-blue-50 scale-105'
                : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
            }`}
          >
            <div
              className="w-8 h-8 rounded-md border border-gray-300"
              style={{
                backgroundColor: colorContext.mainColor.substring(0, 7),
              }}
            />
            <span className="text-xs text-gray-700 mt-1 font-medium">1</span>
          </button>

          {/* Değiştirme Butonu */}
          <button
            onClick={swapColors}
            className="p-2 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-600 transition-all duration-200 hover:rotate-180 flex items-center justify-center"
            title="Renkleri Değiştir"
          >
            <FaExchangeAlt className="text-sm" />
          </button>

          {/* İkincil Renk */}
          <button
            onClick={() => colorContext.setActiveColor(ColorValue.SUB)}
            title="İkincil Rengi Seç"
            className={`flex-1 flex flex-col items-center p-1 rounded-lg transition-all duration-200 border-2 ${
              activeColorType === ColorValue.SUB
                ? 'border-blue-500 bg-blue-50 scale-105'
                : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
            }`}
          >
            <div
              className="w-8 h-8 rounded-md border border-gray-300"
              style={{ backgroundColor: colorContext.subColor.substring(0, 7) }}
            />
            <span className="text-xs text-gray-700 mt-1 font-medium">2</span>
          </button>
        </div>

        {/* Özel Renk Seçici Butonu - Mobil */}
        <button
          onClick={handleOpenPicker}
          title="Özel Renk Seç"
          className="w-full flex items-center justify-center gap-2 py-2 px-3 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white text-sm font-medium rounded-lg shadow hover:shadow-md transition-all duration-200"
        >
          <FaPalette className="text-sm" />
          renk
        </button>
      </div>

      {/* Masaüstü: Tam renk paneli */}
      <div className="hidden md:flex flex-col items-center gap-3 w-full">
        {/* Renk Seçim Kartları */}
        <div className="flex items-center gap-3 w-full justify-center">
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
                style={{
                  backgroundColor: colorContext.subColor.substring(0, 7),
                }}
              />
            </div>
            <div className="bg-white/90 py-1 text-center border-t border-gray-200">
              <span className="text-xs font-medium text-gray-700">Renk 2</span>
            </div>
          </button>
        </div>

        {/* Ön Tanımlı Renk Paleti */}
        <div className="grid grid-cols-6 gap-2 w-full">
          {colors.map((color) => (
            <button
              onClick={() => colorContext.setColor('#' + color.value)}
              key={color.value}
              title={color.title}
              className="w-6 h-6 rounded border border-gray-300 hover:border-gray-500 hover:scale-110 active:scale-95 transition-all duration-150 shadow-sm hover:shadow-md"
              style={{ backgroundColor: '#' + color.value.substring(0, 6) }}
            />
          ))}
        </div>

        {/* Özel Renk Seçici Butonu */}
        <button
          onClick={handleOpenPicker}
          title="Özel Renk Seç"
          className="w-full flex items-center justify-center gap-2 py-2 px-3 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white text-sm font-medium rounded-lg shadow hover:shadow-md transition-all duration-200"
        >
          <FaPalette className="text-sm" />
          Özel Renk
        </button>
      </div>

      {/* Sketch Renk Seçici (Her iki durumda da ortak) */}
      <CustomPopover
        open={isPickerOpen}
        onClose={() => setIsPickerOpen(false)}
        anchorEl={anchorEle}
      >
        <div className="p-0">
          <SketchPicker
            color={pickerColor.rgb}
            onChange={handleCompleteChange}
          />
        </div>
      </CustomPopover>
    </div>
  );
};

export default ColorPanel;
