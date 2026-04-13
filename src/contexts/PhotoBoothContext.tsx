import { createContext, useContext, useState, ReactNode } from 'react';
import { TemplateConfig, CapturedPhoto, FilterType, PrintOption, ModeType } from '../types/photobooth';
import { FrameColorOption } from '../components/FrameColorSelector';
import { UploadedFrame } from '../utils/frameStorage';
import { useCamera } from '../hooks/useCamera';

interface PhotoBoothContextType {
  // Mode & Template
  selectedMode: ModeType | null;
  setSelectedMode: (mode: ModeType | null) => void;
  selectedTemplate: TemplateConfig | null;
  setSelectedTemplate: (template: TemplateConfig | null) => void;
  selectedTheme: { 
    overlays: string[]; // Array of overlay URLs for each cut
    frame: UploadedFrame | null; // Final composite frame
  } | null;
  setSelectedTheme: (theme: { 
    overlays: string[];
    frame: UploadedFrame | null;
  } | null) => void;
  
  // Print & Payment
  selectedPrintOption: PrintOption;
  setSelectedPrintOption: (option: PrintOption) => void;
  
  // Photos
  capturedPhotos: CapturedPhoto[];
  setCapturedPhotos: (photos: CapturedPhoto[]) => void;
  currentCut: number;
  setCurrentCut: (cut: number) => void;
  
  // Frame & Filter
  selectedFrameColor: FrameColorOption | null;
  setSelectedFrameColor: (color: FrameColorOption | null) => void;
  selectedFilter: FilterType;
  setSelectedFilter: (filter: FilterType) => void;
  
  // Final Result
  finalImageUrl: string | null;
  setFinalImageUrl: (url: string | null) => void;
  
  // Camera
  videoRef: React.RefObject<HTMLVideoElement>;
  stream: MediaStream | null;
  isDemoMode: boolean;
  startCamera: () => Promise<void>;
  stopCamera: () => void;
  captureFrame: () => string | null;
  cameraError: string | null;
  
  // Capture State
  countdown: number | null;
  setCountdown: (count: number | null) => void;
  isCapturing: boolean;
  setIsCapturing: (capturing: boolean) => void;
  
  // Selection Timer
  selectionTimeRemaining: number | null;
  setSelectionTimeRemaining: (time: number | null) => void;
  
  // Reset
  resetAll: () => void;
}

const PhotoBoothContext = createContext<PhotoBoothContextType | undefined>(undefined);

export const usePhotoBoothContext = () => {
  const context = useContext(PhotoBoothContext);
  if (!context) {
    throw new Error('usePhotoBoothContext must be used within PhotoBoothProvider');
  }
  return context;
};

interface PhotoBoothProviderProps {
  children: ReactNode;
}

export const PhotoBoothProvider = ({ children }: PhotoBoothProviderProps) => {
  const [selectedMode, setSelectedMode] = useState<ModeType | null>(null);
  const [selectedTemplate, setSelectedTemplate] = useState<TemplateConfig | null>(null);
  const [selectedTheme, setSelectedTheme] = useState<{ 
    overlays: string[];
    frame: UploadedFrame | null;
  } | null>(null);
  const [selectedPrintOption, setSelectedPrintOption] = useState<PrintOption>({ count: 4, price: 10000 });
  const [capturedPhotos, setCapturedPhotos] = useState<CapturedPhoto[]>([]);
  const [currentCut, setCurrentCut] = useState(0);
  const [selectedFrameColor, setSelectedFrameColor] = useState<FrameColorOption | null>(null);
  const [selectedFilter, setSelectedFilter] = useState<FilterType>('normal');
  const [finalImageUrl, setFinalImageUrl] = useState<string | null>(null);
  const [countdown, setCountdown] = useState<number | null>(null);
  const [isCapturing, setIsCapturing] = useState(false);
  const [selectionTimeRemaining, setSelectionTimeRemaining] = useState<number | null>(null);

  const { videoRef, stream, isDemoMode, startCamera, stopCamera, captureFrame, error: cameraError } = useCamera();

  const resetAll = () => {
    setSelectedMode(null);
    setSelectedTemplate(null);
    setSelectedTheme(null);
    setSelectedPrintOption({ count: 4, price: 10000 });
    setCapturedPhotos([]);
    setCurrentCut(0);
    setSelectedFrameColor(null);
    setSelectedFilter('normal');
    setFinalImageUrl(null);
    setCountdown(null);
    setIsCapturing(false);
    setSelectionTimeRemaining(null);
    stopCamera();
  };

  const value: PhotoBoothContextType = {
    selectedMode,
    setSelectedMode,
    selectedTemplate,
    setSelectedTemplate,
    selectedTheme,
    setSelectedTheme,
    selectedPrintOption,
    setSelectedPrintOption,
    capturedPhotos,
    setCapturedPhotos,
    currentCut,
    setCurrentCut,
    selectedFrameColor,
    setSelectedFrameColor,
    selectedFilter,
    setSelectedFilter,
    finalImageUrl,
    setFinalImageUrl,
    videoRef,
    stream,
    isDemoMode,
    startCamera,
    stopCamera,
    captureFrame,
    cameraError,
    countdown,
    setCountdown,
    isCapturing,
    setIsCapturing,
    selectionTimeRemaining,
    setSelectionTimeRemaining,
    resetAll,
  };

  return (
    <PhotoBoothContext.Provider value={value}>
      {children}
    </PhotoBoothContext.Provider>
  );
};
