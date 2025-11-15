import React, { useState, useRef, useCallback } from "react";

function TinderCard({ children, onSwipe, onCardLeftScreen, preventSwipe = [] }) {
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const startPosRef = useRef(null);
  const [isDragging, setIsDragging] = useState(false);
  const cardRef = useRef(null);

  const handleStart = useCallback((clientX, clientY) => {
    startPosRef.current = { x: clientX, y: clientY };
    setIsDragging(true);
  }, []);

  const handleMove = useCallback((clientX, clientY) => {
    if (!isDragging || !startPosRef.current) return;

    const deltaX = clientX - startPosRef.current.x;
    const deltaY = clientY - startPosRef.current.y;

    // Prevent vertical swipes if needed
    if (preventSwipe.includes('up') && deltaY < -50) return;
    if (preventSwipe.includes('down') && deltaY > 50) return;

    setOffset({ x: deltaX, y: deltaY });
  }, [isDragging, preventSwipe]);

  const handleEnd = useCallback(() => {
    if (!isDragging) return;

    const threshold = 100;
    let direction = null;

    if (Math.abs(offset.x) > threshold) {
      direction = offset.x > 0 ? 'right' : 'left';
    } else if (Math.abs(offset.y) > threshold) {
      direction = offset.y > 0 ? 'down' : 'up';
    }

    if (direction && !preventSwipe.includes(direction)) {
      // Animate out
      const finalX = direction === 'right' ? 1000 : -1000;
      setOffset({ x: finalX, y: 0 });
      
      setTimeout(() => {
        onSwipe?.(direction);
        onCardLeftScreen?.();
        setOffset({ x: 0, y: 0 });
      }, 300);
    } else {
      // Snap back
      setOffset({ x: 0, y: 0 });
    }

    setIsDragging(false);
    startPosRef.current = null;
  }, [isDragging, offset, preventSwipe, onSwipe, onCardLeftScreen]);

  React.useEffect(() => {
    const card = cardRef.current;
    if (!card) return;

    const handleMouseDown = (e) => {
      e.preventDefault();
      handleStart(e.clientX, e.clientY);
    };
    const handleMouseMove = (e) => {
      if (isDragging) {
        e.preventDefault();
        handleMove(e.clientX, e.clientY);
      }
    };
    const handleMouseUp = (e) => {
      if (isDragging) {
        e.preventDefault();
        handleEnd();
      }
    };

    const handleTouchStart = (e) => {
      e.preventDefault();
      const touch = e.touches[0];
      handleStart(touch.clientX, touch.clientY);
    };
    const handleTouchMove = (e) => {
      if (isDragging) {
        e.preventDefault();
        const touch = e.touches[0];
        handleMove(touch.clientX, touch.clientY);
      }
    };
    const handleTouchEnd = (e) => {
      if (isDragging) {
        e.preventDefault();
        handleEnd();
      }
    };

    card.addEventListener('mousedown', handleMouseDown);
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);

    card.addEventListener('touchstart', handleTouchStart, { passive: false });
    card.addEventListener('touchmove', handleTouchMove, { passive: false });
    card.addEventListener('touchend', handleTouchEnd);

    return () => {
      card.removeEventListener('mousedown', handleMouseDown);
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      card.removeEventListener('touchstart', handleTouchStart);
      card.removeEventListener('touchmove', handleTouchMove);
      card.removeEventListener('touchend', handleTouchEnd);
    };
  }, [isDragging, handleStart, handleMove, handleEnd]);

  const rotation = offset.x * 0.1;
  const opacity = 1 - Math.abs(offset.x) / 300;

  return (
    <div
      ref={cardRef}
      className="absolute w-full h-full cursor-grab active:cursor-grabbing select-none"
      style={{
        transform: `translate(${offset.x}px, ${offset.y}px) rotate(${rotation}deg)`,
        opacity: Math.max(0.5, opacity),
        transition: isDragging ? 'none' : 'transform 0.3s ease-out, opacity 0.3s ease-out',
        zIndex: 1000 - Math.abs(offset.x)
      }}
    >
      {children}
    </div>
  );
}

export default TinderCard;

