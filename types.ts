export type ElementType = 'text' | 'image' | 'group';

export interface BaseElement {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
  rotation: number;
  locked?: boolean;
}

export interface TextElement extends BaseElement {
  type: 'text';
  content: string;
  fontSize: number;
  fontWeight: 'normal' | 'bold';
  color: string;
  fontFamily: string;
  textAlign: 'left' | 'center' | 'right';
  lineHeight: number;
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

export type CanvasElement = TextElement | ImageElement | GroupElement;

export interface Guide {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
}