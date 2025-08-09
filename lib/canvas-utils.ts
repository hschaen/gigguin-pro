export interface TextElement {
  id: string;
  text: string;
  x: number;
  y: number;
  fontSize: number;
  fontWeight: string;
  color: string;
  lineHeight?: number;
}

export interface CanvasSize {
  width: number;
  height: number;
}

export const loadImage = (src: string): Promise<HTMLImageElement> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
};

export const drawTextOnCanvas = (
  ctx: CanvasRenderingContext2D,
  element: TextElement
) => {
  ctx.save();
  ctx.font = `${element.fontWeight} ${element.fontSize}px 'Montserrat', sans-serif`;
  ctx.fillStyle = element.color;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";

  if (element.text.includes("\n")) {
    const lines = element.text.split("\n");
    const lineHeight = element.lineHeight || element.fontSize * 1.2;
    
    lines.forEach((line, index) => {
      const yOffset = (index - (lines.length - 1) / 2) * lineHeight;
      ctx.fillText(line, element.x, element.y + yOffset);
    });
  } else {
    ctx.fillText(element.text, element.x, element.y);
  }
  
  ctx.restore();
};

export const compressImage = async (
  canvas: HTMLCanvasElement,
  format: "png" | "jpeg",
  quality: number
): Promise<Blob> => {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (blob) {
          resolve(blob);
        } else {
          reject(new Error("Failed to compress image"));
        }
      },
      `image/${format}`,
      quality
    );
  });
};

export const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return "0 Bytes";
  const k = 1024;
  const sizes = ["Bytes", "KB", "MB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
};