import { useState, useRef, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';

interface ImageGalleryProps {
  images: string[];
  alt: string;
  aspectRatio?: string;
}

/**
 * Sample the average brightness of a horizontal strip at the bottom-center of an image.
 * Returns a value 0–255 (0 = black, 255 = white).
 */
function sampleBottomBrightness(src: string): Promise<number> {
  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      const canvas = document.createElement('canvas');
      // Sample a small strip: 60% of width, 12% of height, at the bottom-center
      const sampleW = Math.round(img.naturalWidth * 0.6);
      const sampleH = Math.max(1, Math.round(img.naturalHeight * 0.12));
      canvas.width = sampleW;
      canvas.height = sampleH;
      const ctx = canvas.getContext('2d');
      if (!ctx) { resolve(128); return; }

      // Draw just the bottom-center strip
      const sx = Math.round((img.naturalWidth - sampleW) / 2);
      const sy = img.naturalHeight - sampleH;
      ctx.drawImage(img, sx, sy, sampleW, sampleH, 0, 0, sampleW, sampleH);

      const data = ctx.getImageData(0, 0, sampleW, sampleH).data;
      let totalLuminance = 0;
      const pixelCount = data.length / 4;
      for (let i = 0; i < data.length; i += 4) {
        // Perceived luminance: 0.299R + 0.587G + 0.114B
        totalLuminance += 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];
      }
      resolve(totalLuminance / pixelCount);
    };
    img.onerror = () => resolve(128); // fallback to mid-tone
    img.src = src;
  });
}

export function ImageGallery({ images, alt, aspectRatio = '1 / 1' }: ImageGalleryProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isHovering, setIsHovering] = useState(false);
  const [isLightBg, setIsLightBg] = useState(true); // assume light by default
  const containerRef = useRef<HTMLDivElement>(null);

  // Sample brightness of current image's bottom area
  const checkBrightness = useCallback(async (src: string) => {
    const brightness = await sampleBottomBrightness(src);
    // Threshold: above 160 is "light" → use dark dots
    setIsLightBg(brightness > 160);
  }, []);

  // Re-check brightness when current image changes
  useEffect(() => {
    if (images[currentIndex]) {
      checkBrightness(images[currentIndex]);
    }
  }, [currentIndex, images, checkBrightness]);

  // Auto-rotation every 3 seconds when not hovering
  useEffect(() => {
    if (isHovering || images.length <= 1) return;
    
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % images.length);
    }, 3000);
    
    return () => clearInterval(interval);
  }, [isHovering, images.length]);

  // Handle hover zones - divide image into sections for each image
  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!containerRef.current || images.length <= 1) return;
    
    const rect = containerRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const sectionWidth = rect.width / images.length;
    const newIndex = Math.min(Math.floor(x / sectionWidth), images.length - 1);
    
    if (newIndex !== currentIndex) {
      setCurrentIndex(newIndex);
    }
  };

  if (images.length === 0) return null;

  // Single image - no gallery needed
  if (images.length === 1) {
    return (
      <div className="relative w-full overflow-hidden" style={{ aspectRatio }}>
        <img 
          src={images[0]} 
          alt={alt}
          className="w-full h-full object-cover"
          style={{ objectPosition: 'top center' }}
        />
      </div>
    );
  }

  // Dot colors: dark on light backgrounds, light on dark backgrounds
  const dotActive = isLightBg ? 'rgba(9, 14, 21, 0.8)' : 'rgba(255, 255, 255, 1)';
  const dotInactive = isLightBg ? 'rgba(9, 14, 21, 0.25)' : 'rgba(255, 255, 255, 0.5)';

  return (
    <div 
      ref={containerRef}
      className="relative w-full overflow-hidden cursor-pointer"
      style={{ aspectRatio }}
      onMouseMove={handleMouseMove}
      onMouseEnter={() => setIsHovering(true)}
      onMouseLeave={() => setIsHovering(false)}
    >
      {/* All images stacked, only current one visible - smoother than AnimatePresence */}
      {images.map((src, index) => (
        <motion.img
          key={index}
          src={src}
          alt={`${alt} - view ${index + 1}`}
          className="absolute inset-0 w-full h-full object-cover"
          style={{ objectPosition: 'top center' }}
          initial={false}
          animate={{ 
            opacity: index === currentIndex ? 1 : 0,
            scale: index === currentIndex ? 1 : 1.02,
          }}
          transition={{ 
            duration: 0.3, 
            ease: [0.4, 0, 0.2, 1]
          }}
        />
      ))}

      {/* Page indicator - no background, adaptive dot color, bottom-aligned with CTA at 12px */}
      <div 
        className="absolute left-1/2 -translate-x-1/2 flex items-end gap-1.5"
        style={{ bottom: '12px' }}
      >
        {images.map((_, index) => (
          <button
            key={index}
            onClick={(e) => {
              e.stopPropagation();
              setCurrentIndex(index);
            }}
            aria-label={`Go to image ${index + 1}`}
          >
            <motion.div
              initial={false}
              animate={{
                width: index === currentIndex ? 16 : 6,
                backgroundColor: index === currentIndex ? dotActive : dotInactive,
              }}
              transition={{ 
                duration: 0.25,
                ease: [0.4, 0, 0.2, 1]
              }}
              style={{
                height: 6,
                borderRadius: 3,
              }}
            />
          </button>
        ))}
      </div>
    </div>
  );
}
