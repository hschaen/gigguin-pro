export interface DragState {
  isDragging: boolean;
  elementId: string | null;
  startX: number;
  startY: number;
  offsetX: number;
  offsetY: number;
}

export const initialDragState: DragState = {
  isDragging: false,
  elementId: null,
  startX: 0,
  startY: 0,
  offsetX: 0,
  offsetY: 0,
};

export const constrainPosition = (
  x: number,
  y: number,
  canvasWidth: number,
  canvasHeight: number,
  margin: number = 0
): { x: number; y: number } => {
  return {
    x: Math.max(0, Math.min(canvasWidth, x)),
    y: Math.max(0, Math.min(canvasHeight, y)),
  };
};

export const getMousePositionInCanvas = (
  e: MouseEvent | TouchEvent,
  canvas: HTMLCanvasElement
): { x: number; y: number } => {
  const rect = canvas.getBoundingClientRect();
  const scaleX = canvas.width / rect.width;
  const scaleY = canvas.height / rect.height;

  let clientX, clientY;
  if ('touches' in e) {
    clientX = e.touches[0].clientX;
    clientY = e.touches[0].clientY;
  } else {
    clientX = e.clientX;
    clientY = e.clientY;
  }

  return {
    x: (clientX - rect.left) * scaleX,
    y: (clientY - rect.top) * scaleY,
  };
};