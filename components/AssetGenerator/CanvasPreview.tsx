import { useRef, useEffect, useState, useCallback } from "react";
import { TextElement, loadImage, drawTextOnCanvas } from "@/lib/canvas-utils";
import { DragState, initialDragState, constrainPosition, getMousePositionInCanvas } from "@/lib/drag-utils";

interface CanvasPreviewProps {
  templatePath: string;
  textElements: TextElement[];
  onTextPositionChange: (id: string, x: number, y: number) => void;
  onCanvasReady: (canvas: HTMLCanvasElement) => void;
}

export default function CanvasPreview({
  templatePath,
  textElements,
  onTextPositionChange,
  onCanvasReady,
}: CanvasPreviewProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [canvasRect, setCanvasRect] = useState<DOMRect | null>(null);
  const [dragState, setDragState] = useState<DragState>(initialDragState);
  const [templateImage, setTemplateImage] = useState<HTMLImageElement | null>(null);

  // Load template image
  useEffect(() => {
    loadImage(templatePath).then(setTemplateImage).catch(console.error);
  }, [templatePath]);

  // Update canvas rect on resize
  useEffect(() => {
    const updateCanvasRect = () => {
      if (canvasRef.current) {
        setCanvasRect(canvasRef.current.getBoundingClientRect());
      }
    };

    updateCanvasRect();
    window.addEventListener("resize", updateCanvasRect);
    return () => window.removeEventListener("resize", updateCanvasRect);
  }, [templateImage]);

  // Render canvas
  const renderCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx || !templateImage) return;

    // Set canvas size to match template
    canvas.width = templateImage.width;
    canvas.height = templateImage.height;

    // Clear and draw template
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(templateImage, 0, 0);

    // Don't draw text here - let the draggable overlays handle it
    // We'll draw text only when exporting
    onCanvasReady(canvas);
  }, [templateImage, textElements, onCanvasReady]);

  useEffect(() => {
    renderCanvas();
  }, [renderCanvas]);

  // Drag handlers
  const handleDragStart = useCallback((elementId: string) => (e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault();
    const canvas = canvasRef.current;
    if (!canvas) return;

    const pos = getMousePositionInCanvas(e.nativeEvent, canvas);
    const element = textElements.find((el) => el.id === elementId);
    if (!element) return;

    setDragState({
      isDragging: true,
      elementId,
      startX: pos.x,
      startY: pos.y,
      offsetX: pos.x - element.x,
      offsetY: pos.y - element.y,
    });
  }, [textElements]);

  const handleDragMove = useCallback((e: MouseEvent | TouchEvent) => {
    if (!dragState.isDragging || !dragState.elementId || !canvasRef.current) return;

    const pos = getMousePositionInCanvas(e, canvasRef.current);
    const newX = pos.x - dragState.offsetX;
    const newY = pos.y - dragState.offsetY;

    const constrained = constrainPosition(
      newX,
      newY,
      canvasRef.current.width,
      canvasRef.current.height
    );

    onTextPositionChange(dragState.elementId, constrained.x, constrained.y);
  }, [dragState, onTextPositionChange]);

  const handleDragEnd = useCallback(() => {
    setDragState(initialDragState);
  }, []);

  // Global mouse/touch event listeners
  useEffect(() => {
    if (dragState.isDragging) {
      window.addEventListener("mousemove", handleDragMove);
      window.addEventListener("mouseup", handleDragEnd);
      window.addEventListener("touchmove", handleDragMove);
      window.addEventListener("touchend", handleDragEnd);

      return () => {
        window.removeEventListener("mousemove", handleDragMove);
        window.removeEventListener("mouseup", handleDragEnd);
        window.removeEventListener("touchmove", handleDragMove);
        window.removeEventListener("touchend", handleDragEnd);
      };
    }
  }, [dragState.isDragging, handleDragMove, handleDragEnd]);

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h3 className="text-lg font-semibold mb-4">Preview</h3>
      <div 
        ref={containerRef}
        className="relative mx-auto"
        style={{ maxWidth: "100%", aspectRatio: templateImage ? `${templateImage.width}/${templateImage.height}` : "1" }}
      >
        <canvas
          ref={canvasRef}
          className="w-full h-full border border-gray-200 rounded"
          style={{ display: 'block' }}
        />
        <div 
          className="absolute inset-0 pointer-events-none"
          style={{ 
            width: canvasRect?.width || '100%', 
            height: canvasRect?.height || '100%' 
          }}
        >
          {canvasRect && textElements.map((element) => {
            // Calculate position as percentage of canvas size
            const xPercent = (element.x / (templateImage?.width || 1000)) * 100;
            const yPercent = (element.y / (templateImage?.height || 1000)) * 100;
            
            return (
              <div
                key={element.id}
                className={`absolute pointer-events-auto ${
                  dragState.isDragging && dragState.elementId === element.id
                    ? "cursor-grabbing z-20 opacity-80"
                    : "cursor-grab z-10 hover:opacity-80"
                } focus:outline-2 focus:outline-blue-500/50 rounded transition-opacity`}
                style={{
                  left: `${xPercent}%`,
                  top: `${yPercent}%`,
                  transform: 'translate(-50%, -50%)',
                  fontFamily: "'Montserrat', sans-serif",
                  fontSize: `${element.fontSize * (canvasRect.width / (templateImage?.width || 1000))}px`,
                  fontWeight: element.fontWeight,
                  color: element.color,
                  lineHeight: element.lineHeight ? `${element.lineHeight * (canvasRect.width / (templateImage?.width || 1000))}px` : undefined,
                  whiteSpace: element.id === 'djnames' ? 'pre-line' : 'nowrap',
                  textAlign: 'center',
                  width: 'max-content',
                }}
                onMouseDown={handleDragStart(element.id)}
                onTouchStart={handleDragStart(element.id)}
                onKeyDown={(e) => {
                  const step = e.shiftKey ? 10 : 1;
                  switch (e.key) {
                    case "ArrowUp":
                      e.preventDefault();
                      onTextPositionChange(element.id, element.x, element.y - step);
                      break;
                    case "ArrowDown":
                      e.preventDefault();
                      onTextPositionChange(element.id, element.x, element.y + step);
                      break;
                    case "ArrowLeft":
                      e.preventDefault();
                      onTextPositionChange(element.id, element.x - step, element.y);
                      break;
                    case "ArrowRight":
                      e.preventDefault();
                      onTextPositionChange(element.id, element.x + step, element.y);
                      break;
                  }
                }}
                tabIndex={0}
                role="button"
                aria-label={`Draggable text: ${element.text}`}
              >
                {element.text}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}