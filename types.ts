
// FIX: Removed self-import of CanvasElement.
export type ElementType = 'text' | 'image' | 'group' | 'shape';

export interface BaseElement {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
  rotation: number;
  locked?: boolean;
  opacity?: number;
}

export interface TextElement extends BaseElement {
  type: 'text';
  content: string;
  fontSize: number;
  fontWeight: 'normal' | 'bold';
  fontStyle: 'normal' | 'italic';
  color: string;
  fontFamily: string;
  textAlign: 'left' | 'center' | 'right';
  lineHeight: number;
  letterSpacing: number;
  textTransform: 'none' | 'uppercase' | 'lowercase';
  underline?: boolean;
  strikethrough?: boolean;
}

export interface ImageElement extends BaseElement {
  type: 'image';
  src: string;
  flipHorizontal: boolean;
  flipVertical: boolean;
}

export interface GroupElement extends BaseElement {
    type: 'group';
    elements: CanvasElement[];
}

export type ShapeType = 'rectangle' | 'ellipse' | 'triangle' | 'polygon' | 'star' | 'line';

export interface ShapeElement extends BaseElement {
  type: 'shape';
  shapeType: ShapeType;
  fill: string;
  stroke: string;
  strokeWidth: number;
  strokeDash?: 'solid' | 'dashed' | 'dotted';
  // For polygon
  sides?: number;
  // For star
  points?: number;
  innerRadiusRatio?: number;
}


export type CanvasElement = TextElement | ImageElement | GroupElement | ShapeElement;

export interface Guide {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  type: 'snap' | 'grid';
}