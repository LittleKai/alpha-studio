import React, { useRef, useState, useEffect, useCallback } from 'react';
import { useTranslation } from '../../i18n/context';

interface ImageEditorCanvasProps {
  imageUrl: string | null;
  onMaskChange: (maskDataUrl: string | null) => void;
  maskEnabled: boolean;
}

const ImageEditorCanvas: React.FC<ImageEditorCanvasProps> = ({ imageUrl, onMaskChange, maskEnabled }) => {
  const { t } = useTranslation();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const maskCanvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [brushSize, setBrushSize] = useState(30);
  const [canvasSize, setCanvasSize] = useState({ width: 0, height: 0 });
  const [imageLoaded, setImageLoaded] = useState(false);

  // Load image onto canvas
  useEffect(() => {
    if (!imageUrl || !canvasRef.current || !maskCanvasRef.current || !containerRef.current) return;

    const canvas = canvasRef.current;
    const maskCanvas = maskCanvasRef.current;
    const ctx = canvas.getContext('2d');
    const maskCtx = maskCanvas.getContext('2d');
    if (!ctx || !maskCtx) return;

    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      const containerWidth = containerRef.current?.clientWidth || 512;
      const aspectRatio = img.width / img.height;
      const displayWidth = containerWidth;
      const displayHeight = displayWidth / aspectRatio;

      setCanvasSize({ width: displayWidth, height: displayHeight });

      canvas.width = img.width;
      canvas.height = img.height;
      maskCanvas.width = img.width;
      maskCanvas.height = img.height;

      ctx.drawImage(img, 0, 0);
      maskCtx.fillStyle = 'black';
      maskCtx.fillRect(0, 0, maskCanvas.width, maskCanvas.height);

      setImageLoaded(true);
      onMaskChange(null);
    };
    img.src = imageUrl;
  }, [imageUrl, onMaskChange]);

  // Get canvas coordinates from mouse event
  const getCanvasCoords = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    return {
      x: (e.clientX - rect.left) * scaleX,
      y: (e.clientY - rect.top) * scaleY,
    };
  }, []);

  // Draw on mask
  const draw = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing || !maskEnabled || !maskCanvasRef.current) return;
    const maskCtx = maskCanvasRef.current.getContext('2d');
    if (!maskCtx) return;

    const { x, y } = getCanvasCoords(e);
    const scaledBrushSize = brushSize * (maskCanvasRef.current.width / (canvasSize.width || 1));

    maskCtx.globalCompositeOperation = 'source-over';
    maskCtx.fillStyle = 'white';
    maskCtx.beginPath();
    maskCtx.arc(x, y, scaledBrushSize / 2, 0, Math.PI * 2);
    maskCtx.fill();
  }, [isDrawing, maskEnabled, brushSize, canvasSize.width, getCanvasCoords]);

  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!maskEnabled) return;
    setIsDrawing(true);
    draw(e);
  };

  const handleMouseUp = () => {
    if (isDrawing && maskCanvasRef.current) {
      setIsDrawing(false);
      const maskDataUrl = maskCanvasRef.current.toDataURL('image/png');
      onMaskChange(maskDataUrl);
    }
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    draw(e);
  };

  const clearMask = () => {
    if (!maskCanvasRef.current) return;
    const maskCtx = maskCanvasRef.current.getContext('2d');
    if (!maskCtx) return;
    maskCtx.fillStyle = 'black';
    maskCtx.fillRect(0, 0, maskCanvasRef.current.width, maskCanvasRef.current.height);
    onMaskChange(null);
  };

  if (!imageUrl) {
    return (
      <div className="w-full aspect-square bg-[var(--bg-secondary)] rounded-lg flex items-center justify-center text-[var(--text-tertiary)]">
        <p>{t('imageEditor.noImage')}</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <div ref={containerRef} className="relative w-full bg-[var(--bg-secondary)] rounded-lg overflow-hidden">
        <canvas
          ref={canvasRef}
          className="w-full h-auto block"
          style={{ width: canvasSize.width || '100%', height: canvasSize.height || 'auto' }}
        />
        {maskEnabled && imageLoaded && (
          <canvas
            ref={maskCanvasRef}
            className="absolute top-0 left-0 cursor-crosshair"
            style={{
              width: canvasSize.width || '100%',
              height: canvasSize.height || 'auto',
              opacity: 0.5,
              mixBlendMode: 'multiply',
            }}
            onMouseDown={handleMouseDown}
            onMouseUp={handleMouseUp}
            onMouseMove={handleMouseMove}
            onMouseLeave={handleMouseUp}
          />
        )}
      </div>

      {maskEnabled && imageLoaded && (
        <div className="flex items-center gap-4 p-3 bg-[var(--bg-secondary)] rounded-lg">
          <div className="flex items-center gap-2 flex-1">
            <label className="text-sm text-[var(--text-secondary)] whitespace-nowrap">
              {t('imageEditor.brushSize')}:
            </label>
            <input
              type="range"
              min="5"
              max="100"
              value={brushSize}
              onChange={(e) => setBrushSize(Number(e.target.value))}
              className="flex-1 h-2 bg-[var(--bg-tertiary)] rounded-lg appearance-none cursor-pointer accent-[var(--accent-primary)]"
            />
            <span className="text-sm text-[var(--text-secondary)] w-8">{brushSize}</span>
          </div>
          <button
            onClick={clearMask}
            className="px-3 py-1.5 text-sm bg-red-500/20 text-red-400 rounded-md hover:bg-red-500/30 transition-colors"
          >
            {t('imageEditor.clearMask')}
          </button>
        </div>
      )}
    </div>
  );
};

export default ImageEditorCanvas;
