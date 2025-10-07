/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-empty-function */
import { createContext } from 'react';
import Dispatcher from '../util/dispatcher';
import type {
  ColorType,
  LineWidthType,
  ShapeOutlineType,
  ShapeToolType,
  ToolType,
} from '../util/toolType';
import {
  ColorValue,
  LineWidthValue,
  ShapeOutlineValue,
  ShapeToolValue,
  ToolValue,
} from '../util/toolType';

interface ToolTypeContextType {
  // 'type' özelliğinin, ToolValue.PEN gibi tek bir string değil,
  // ToolType union tipinden herhangi bir değer olabileceğini belirtiyoruz.
  type: ToolType;
  setType: (type: ToolType) => void;
}

export const ToolTypeContext = createContext<ToolTypeContextType>({
  type: ToolValue.PEN,
  setType: (type: ToolType) => {},
});

interface ShapeTypeContextType {
  // 'type' özelliğinin, ToolValue.PEN gibi tek bir string değil,
  // ToolType union tipinden herhangi bir değer olabileceğini belirtiyoruz.
  type: ShapeToolType;
  setType: (type: ShapeToolType) => void;
}

export const ShapeTypeContext = createContext<ShapeTypeContextType>({
  type: ShapeToolValue.LINE,
  setType: (type: ShapeToolType) => {},
});
interface ShapeOutlineContextType {
  // 'type' özelliğinin, ToolValue.PEN gibi tek bir string değil,
  // ToolType union tipinden herhangi bir değer olabileceğini belirtiyoruz.
  type: ShapeOutlineType;
  setType: (type: ShapeOutlineType) => void;
}

export const ShapeOutlineContext = createContext<ShapeOutlineContextType>({
  type: ShapeOutlineValue.SOLID,
  setType: (type: ShapeOutlineType) => {},
});

interface LineWidthContextType {
  // 'type' özelliğinin, ToolValue.PEN gibi tek bir string değil,
  // ToolType union tipinden herhangi bir değer olabileceğini belirtiyoruz.
  type: LineWidthType;
  setType: (type: LineWidthType) => void;
}

export const LineWidthContext = createContext<LineWidthContextType>({
  type: LineWidthValue.THIN,
  setType: (type: LineWidthType) => {},
});

interface ColorContextType {
  // 'type' özelliğinin, ToolValue.PEN gibi tek bir string değil,
  // ToolType union tipinden herhangi bir değer olabileceğini belirtiyoruz.
  mainColor: string;
  subColor: string;
  activeColor: ColorType;
  setActiveColor: (type: ColorType) => void;
  setColor: (value: string) => void;
  swapColors?: () => void;
}

export const ColorContext = createContext<ColorContextType>({
  mainColor: 'black',
  subColor: 'white',
  activeColor: ColorValue.MAIN,
  setColor: (value: string) => {},
  setActiveColor: (type: ColorType) => {},
  swapColors: () => {},
});

export const DispatcherContext = createContext({
  dispatcher: new Dispatcher(),
});
