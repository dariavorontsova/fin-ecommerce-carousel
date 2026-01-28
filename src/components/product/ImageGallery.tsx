import { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';

interface ImageGalleryProps {
  images: string[];
  alt: string;
  aspectRatio?: string;
}

export function ImageGallery({ images, alt, aspectRatio = '1 / 1' }: ImageGalleryProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isHovering, setIsHovering] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Auto-rotation every 1.5 seconds when not hovering
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
            ease: [0.4, 0, 0.2, 1] // Smooth easing
          }}
        />
      ))}

      {/* Page indicator - matching price tag style: rgba(9, 14, 21, 0.4) with blur(20px) */}
      <div 
        className="absolute bottom-3 left-1/2 -translate-x-1/2 flex items-center gap-1.5 px-2 py-1.5 rounded-full"
        style={{
          backgroundColor: 'rgba(9, 14, 21, 0.4)',
          backdropFilter: 'blur(20px)',
        }}
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
                backgroundColor: index === currentIndex ? 'rgba(255, 255, 255, 1)' : 'rgba(255, 255, 255, 0.5)',
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
