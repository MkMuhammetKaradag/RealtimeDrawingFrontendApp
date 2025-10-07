import Pen from "./pen";
import {ColorValue, ToolValue} from "../toolType";
import { logEraseStart, logEraseMove, logEraseEnd } from '../logger';

class Eraser extends Pen {
    protected lineWidthBase = 3;
    protected drawColorType = ColorValue.SUB;
    protected toolType: string = ToolValue.ERASER;
}

export default Eraser;
