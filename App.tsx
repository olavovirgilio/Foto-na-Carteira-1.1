
import React, { useState, useEffect, useCallback } from 'react';
import { PhotoSlot } from './components/PhotoSlot.tsx';
import { Header } from './components/Header.tsx';
import { Footer } from './components/Footer.tsx';
import { DetailView } from './components/DetailView.tsx';
import type { Photo, WalletSlot } from './types.ts';

const App: React.FC = () => {
  const [photos, setPhotos] = useState<WalletSlot[]>([]);
  const [activeSlotIndex, setActiveSlotIndex] = useState<number | null>(null);
  const [isLoaded, setIsLoaded] = useState<boolean>(false);

  const getInitialState = (): WalletSlot[] => {
    return Array.from({ length: 4 }, () => ({ main: null, sub: Array(3).fill(null) }));
  };

  useEffect(() => {
    try {
      const savedPhotos = localStorage.getItem('walletPhotos');
      if (savedPhotos) {
        const parsed = JSON.parse(savedPhotos);
        // Check if it's the old format (array of strings) and migrate it
        if (Array.isArray(parsed) && (parsed.length === 0 || typeof parsed[0] === 'string' || parsed[0] === null)) {
          const newStructure = getInitialState();
          parsed.forEach((photo, index) => {
            if (index < 4 && photo) {
              newStructure[index].main = photo;
            }
          });
          setPhotos(newStructure);
        } else if (Array.isArray(parsed) && (parsed.length === 0 || typeof parsed[0] === 'object')) {
          // It's the new format, validate and use it
          const validatedPhotos: WalletSlot[] = parsed
            .map(p => ({
              main: p?.main || null,
              sub: Array.isArray(p?.sub) ? [...p.sub, null, null, null].slice(0, 3) : Array(3).fill(null),
            }))
            .slice(0, 4);
          
          while (validatedPhotos.length < 4) {
            validatedPhotos.push({ main: null, sub: Array(3).fill(null) });
          }
          setPhotos(validatedPhotos);
        } else {
          setPhotos(getInitialState());
        }
      } else {
        setPhotos(getInitialState());
      }
    } catch (error) {
      console.error("Failed to load photos from localStorage", error);
      setPhotos(getInitialState());
    } finally {
      setIsLoaded(true);
    }
  }, []);

  useEffect(() => {
    if (isLoaded) {
      try {
        localStorage.setItem('walletPhotos', JSON.stringify(photos));
      } catch (error) {
        console.error("Failed to save photos to localStorage", error);
      }
    }
  }, [photos, isLoaded]);

  const handleMainPhotoSelect = useCallback((index: number, dataUrl: string) => {
    setPhotos(prevPhotos => {
      const newPhotos = [...prevPhotos];
      newPhotos[index].main = dataUrl;
      return newPhotos;
    });
  }, []);

  const handleSubPhotoSelect = useCallback((mainIndex: number, subIndex: number, dataUrl: string) => {
    setPhotos(prevPhotos => {
        const newPhotos = [...prevPhotos];
        newPhotos[mainIndex].sub[subIndex] = dataUrl;
        return newPhotos;
    });
  }, []);

  const handleClearPhotos = useCallback(() => {
    const confirmClear = window.confirm("Are you sure you want to remove all photos?");
    if (confirmClear) {
        setPhotos(getInitialState());
        setActiveSlotIndex(null);
        localStorage.removeItem('walletPhotos');
    }
  }, []);
  
  const handleExpandSlot = (index: number) => {
    setActiveSlotIndex(index);
  };

  const activeSlot = activeSlotIndex !== null ? photos[activeSlotIndex] : null;

  return (
    <div className="flex flex-col min-h-screen font-sans bg-gray-100 text-gray-800">
      <Header />
      <main className="flex-grow flex items-center justify-center p-4 sm:p-6 md:p-8 transition-opacity duration-300 ease-in-out">
        {activeSlot && activeSlotIndex !== null ? (
            <DetailView
                slot={activeSlot}
                mainIndex={activeSlotIndex}
                onBack={() => setActiveSlotIndex(null)}
                onMainPhotoSelect={handleMainPhotoSelect}
                onSubPhotoSelect={handleSubPhotoSelect}
            />
        ) : (
            <div className="w-full max-w-4xl">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6 md:gap-8">
                {photos.map((slot, index) => (
                  <PhotoSlot 
                    key={index} 
                    photoUrl={slot.main} 
                    onPhotoSelect={(dataUrl) => handleMainPhotoSelect(index, dataUrl)}
                    onExpand={() => handleExpandSlot(index)}
                  />
                ))}
              </div>
            </div>
        )}
      </main>
      <Footer onClear={handleClearPhotos} />
    </div>
  );
};

export default App;