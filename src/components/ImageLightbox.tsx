import React, { useEffect, useState } from 'react';
import { X, ChevronLeft, ChevronRight, Download, ExternalLink } from 'lucide-react';

interface ImageLightboxProps {
  urls: string[];
  initialIndex?: number;
  onClose: () => void;
}

export const ImageLightbox: React.FC<ImageLightboxProps> = ({
  urls,
  initialIndex = 0,
  onClose,
}) => {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);

  useEffect(() => {
    setCurrentIndex(initialIndex);
  }, [initialIndex]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      } else if (e.key === 'ArrowLeft') {
        setCurrentIndex((prev) => (prev > 0 ? prev - 1 : urls.length - 1));
      } else if (e.key === 'ArrowRight') {
        setCurrentIndex((prev) => (prev < urls.length - 1 ? prev + 1 : 0));
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [urls.length, onClose]);

  if (!urls || urls.length === 0) return null;

  const currentUrl = urls[currentIndex] || urls[0];
  const isDataUrl = currentUrl.startsWith('data:');

  const handlePrev = (e: React.MouseEvent) => {
    e.stopPropagation();
    setCurrentIndex((prev) => (prev > 0 ? prev - 1 : urls.length - 1));
  };

  const handleNext = (e: React.MouseEvent) => {
    e.stopPropagation();
    setCurrentIndex((prev) => (prev < urls.length - 1 ? prev + 1 : 0));
  };

  return (
    <div 
      className="fixed inset-0 z-[99999] bg-black/90 backdrop-blur-xl flex items-center justify-center p-4 animate-fade-in"
      onClick={onClose}
    >
      {/* Top Bar / Counter */}
      <div className="absolute top-4 left-6 right-6 flex items-center justify-between z-50 pointer-events-none">
        <div className="pointer-events-auto flex items-center gap-2 bg-black/70 border border-white/10 px-3.5 py-1.5 rounded-full text-xs font-mono font-bold text-white/90 shadow-lg">
          <span>📷 EVIDENCIA VISUAL</span>
          {urls.length > 1 && (
            <span className="text-[#D32F2F] bg-white/10 px-2 py-0.5 rounded ml-1">
              {currentIndex + 1} / {urls.length}
            </span>
          )}
        </div>

        <div className="pointer-events-auto flex items-center gap-2">
          {!isDataUrl && (
            <a
              href={currentUrl}
              target="_blank"
              rel="noopener noreferrer"
              onClick={(e) => e.stopPropagation()}
              className="bg-black/70 hover:bg-white/20 text-white/80 hover:text-white border border-white/10 p-2.5 rounded-full transition-all flex items-center justify-center shadow-lg cursor-pointer"
              title="Abrir en nueva pestaña"
            >
              <ExternalLink className="w-5 h-5" />
            </a>
          )}
          <a
            href={currentUrl}
            download={`evidencia-${currentIndex + 1}.jpg`}
            onClick={(e) => e.stopPropagation()}
            className="bg-black/70 hover:bg-white/20 text-white/80 hover:text-white border border-white/10 p-2.5 rounded-full transition-all flex items-center justify-center shadow-lg cursor-pointer"
            title="Descargar imagen"
          >
            <Download className="w-5 h-5" />
          </a>
          <button
            type="button"
            onClick={onClose}
            className="bg-[#D32F2F] hover:bg-[#b91c1c] text-white p-2.5 rounded-full transition-all flex items-center justify-center shadow-lg cursor-pointer ml-1"
            title="Cerrar visor (Esc)"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Prev Navigation Button */}
      {urls.length > 1 && (
        <button
          type="button"
          onClick={handlePrev}
          className="absolute left-4 top-1/2 -translate-y-1/2 bg-black/70 hover:bg-[#D32F2F] text-white/80 hover:text-white border border-white/10 hover:border-transparent p-3 rounded-full transition-all shadow-xl cursor-pointer z-50 hover:scale-110"
          title="Imagen anterior (Flecha Izquierda)"
        >
          <ChevronLeft className="w-7 h-7" />
        </button>
      )}

      {/* Next Navigation Button */}
      {urls.length > 1 && (
        <button
          type="button"
          onClick={handleNext}
          className="absolute right-4 top-1/2 -translate-y-1/2 bg-black/70 hover:bg-[#D32F2F] text-white/80 hover:text-white border border-white/10 hover:border-transparent p-3 rounded-full transition-all shadow-xl cursor-pointer z-50 hover:scale-110"
          title="Siguiente imagen (Flecha Derecha)"
        >
          <ChevronRight className="w-7 h-7" />
        </button>
      )}

      {/* Main Image Container */}
      <div 
        className="relative max-w-[92vw] max-h-[85vh] flex items-center justify-center select-none"
        onClick={(e) => e.stopPropagation()}
      >
        <img
          src={currentUrl}
          alt={`Evidencia ${currentIndex + 1}`}
          className="max-w-full max-h-[82vh] object-contain rounded-xl shadow-[0_0_50px_rgba(0,0,0,0.8)] border border-white/10 transition-all duration-300"
          referrerPolicy="no-referrer"
        />
      </div>
    </div>
  );
};
