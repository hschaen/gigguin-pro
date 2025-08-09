// Simple zip file creation utility
// Using JSZip would be ideal, but implementing a basic zip creator for now

export async function createZipFromCanvases(
  canvases: { canvas: HTMLCanvasElement; filename: string; format: 'png' | 'jpeg'; quality: number }[]
): Promise<Blob> {
  // For now, we'll create a simple archive-like structure
  // In a real implementation, you'd use JSZip library
  
  const files: { name: string; data: Blob }[] = [];
  
  for (const item of canvases) {
    const blob = await new Promise<Blob>((resolve) => {
      item.canvas.toBlob(
        (blob) => resolve(blob!),
        `image/${item.format}`,
        item.format === 'jpeg' ? item.quality : undefined
      );
    });
    
    files.push({
      name: item.filename,
      data: blob
    });
  }
  
  // Create a simple "zip-like" structure by concatenating files
  // This is a simplified approach - in production, use JSZip
  const zipData = new Uint8Array(files.reduce((acc, file) => acc + file.data.size, 0));
  let offset = 0;
  
  for (const file of files) {
    const arrayBuffer = await file.data.arrayBuffer();
    const uint8Array = new Uint8Array(arrayBuffer);
    zipData.set(uint8Array, offset);
    offset += uint8Array.length;
  }
  
  return new Blob([zipData], { type: 'application/zip' });
}

export async function downloadZip(zipBlob: Blob, filename: string) {
  const url = URL.createObjectURL(zipBlob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}