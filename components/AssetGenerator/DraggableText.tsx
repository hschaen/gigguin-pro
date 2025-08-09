import { useRef, useEffect } from "react";
import { TextElement } from "@/lib/canvas-utils";
import { Move } from "lucide-react";

interface DraggableTextProps {
  element: TextElement;
  canvasRect: DOMRect | null;
  isDragging: boolean;
  onDragStart: (e: React.MouseEvent | React.TouchEvent) => void;
  onPositionChange: (x: number, y: number) => void;
}

export default function DraggableText({
  element,
  canvasRect,
  isDragging,
  onDragStart,
  onPositionChange,
}: DraggableTextProps) {
  const textRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!canvasRect || !textRef.current) return;

    // Get the actual canvas dimensions from the parent
    const canvas = canvasRect;
    const canvasParent = canvas.width;
    
    // Calculate scale factor
    const scaleX = canvas.width / canvasParent;
    const scaleY = canvas.height / canvas.height;
    
    // Position based on actual canvas dimensions
    const left = (element.x * scaleX) - (textRef.current.offsetWidth / 2);
    const top = (element.y * scaleY) - (textRef.current.offsetHeight / 2);

    textRef.current.style.left = `${left}px`;
    textRef.current.style.top = `${top}px`;
  }, [element.x, element.y, canvasRect]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    const step = e.shiftKey ? 10 : 1;
    switch (e.key) {
      case "ArrowUp":
        e.preventDefault();
        onPositionChange(element.x, element.y - step);
        break;
      case "ArrowDown":
        e.preventDefault();
        onPositionChange(element.x, element.y + step);
        break;
      case "ArrowLeft":
        e.preventDefault();
        onPositionChange(element.x - step, element.y);
        break;
      case "ArrowRight":
        e.preventDefault();
        onPositionChange(element.x + step, element.y);
        break;
    }
  };

  return (
    <div
      ref={textRef}
      className={`absolute select-none ${
        isDragging ? "cursor-grabbing z-20" : "cursor-grab z-10"
      } hover:bg-blue-500/10 focus:bg-blue-500/10 rounded px-2 py-1 transition-colors`}
      style={{
        fontFamily: "'Montserrat', sans-serif",
        fontSize: `${element.fontSize * (canvasRect?.width || 1000) / 1000}px`,
        fontWeight: element.fontWeight,
        color: element.color,
        lineHeight: element.lineHeight ? `${element.lineHeight}px` : undefined,
      }}
      onMouseDown={onDragStart}
      onTouchStart={onDragStart}
      onKeyDown={handleKeyDown}
      tabIndex={0}
      role="button"
      aria-label={`Draggable text: ${element.text}`}
    >
      <div className="flex items-center gap-2">
        <Move className="w-4 h-4 opacity-50" />
        <div className="whitespace-pre-line text-center">
          {element.text}
        </div>
      </div>
    </div>
  );
}