import { useEffect, useState } from 'react';
import { Download, Home, AlertCircle } from 'lucide-react';
import { Button } from './ui/button';
import { Card } from './ui/card';
import { getImage } from '../utils/imageStorage';

interface DownloadPageProps {
  imageId: string;
  onBackToHome: () => void;
}

export const DownloadPage = ({ imageId, onBackToHome }: DownloadPageProps) => {
  const [imageData, setImageData] = useState<{ dataUrl: string; templateName: string } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadImage();
  }, [imageId]);

  const loadImage = async () => {
    try {
      setLoading(true);
      setError(null);
      
      console.log('🔍 Loading image:', imageId);
      const image = await getImage(imageId);
      
      if (!image) {
        setError('이미지를 찾을 수 없습니다. 링크가 만료되었거나 잘못된 주소일 수 있습니다.');
        return;
      }
      
      console.log('✅ Image loaded successfully');
      setImageData({
        dataUrl: image.dataUrl,
        templateName: image.templateName,
      });
    } catch (err) {
      console.error('❌ Failed to load image:', err);
      setError('이미지를 불러오는 중 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = async () => {
    if (!imageData) return;
    
    try {
      console.log('📥 Starting download...');
      
      // If it's a URL (from Supabase), fetch and download
      if (imageData.dataUrl.startsWith('http')) {
        const response = await fetch(imageData.dataUrl);
        const blob = await response.blob();
        const url = URL.createObjectURL(blob);
        
        const link = document.createElement('a');
        link.href = url;
        link.download = `photobooth_${imageId}.png`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        // Clean up
        URL.revokeObjectURL(url);
        console.log('✅ Download complete');
      } else {
        // If it's a data URL, download directly
        const link = document.createElement('a');
        link.href = imageData.dataUrl;
        link.download = `photobooth_${imageId}.png`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        console.log('✅ Download complete');
      }
    } catch (error) {
      console.error('❌ Failed to download image:', error);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-50 via-violet-50 to-blue-50">
        <Card className="p-8 max-w-md w-full mx-4 text-center">
          <div className="animate-spin w-12 h-12 border-4 border-indigo-500 border-t-transparent rounded-full mx-auto mb-4" />
          <p className="text-gray-600">이미지를 불러오는 중...</p>
        </Card>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-50 via-violet-50 to-blue-50 p-4">
        <Card className="p-8 max-w-md w-full text-center">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <AlertCircle className="w-8 h-8 text-red-500" />
          </div>
          <h2 className="mb-4 text-red-800">오류 발생</h2>
          <p className="text-gray-600 mb-6">{error}</p>
          <Button onClick={onBackToHome} variant="outline" className="gap-2">
            <Home className="w-4 h-4" />
            홈으로 돌아가기
          </Button>
        </Card>
      </div>
    );
  }

  if (!imageData) return null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-violet-50 to-blue-50 p-4">
      <div className="max-w-3xl mx-auto pt-8">
        <Card className="p-8">
          <div className="text-center mb-6">
            <h1 className="mb-2 text-purple-400">포토부스 사진</h1>
            <p className="text-gray-600">{imageData.templateName}</p>
          </div>

          <div className="relative mb-6 rounded-lg md:rounded-2xl overflow-hidden shadow-lg bg-white">
            <img 
              src={imageData.dataUrl} 
              alt="Photobooth result"
              className="w-full h-auto"
            />
          </div>

          <div className="flex flex-col sm:flex-row gap-3">
            <Button 
              onClick={handleDownload} 
              className="flex-1 gap-2 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700"
            >
              <Download className="w-4 h-4" />
              이미지 다운로드
            </Button>
            <Button 
              onClick={onBackToHome} 
              variant="outline" 
              className="gap-2"
            >
              <Home className="w-4 h-4" />
              새로 촬영하기
            </Button>
          </div>

          <div className="mt-6 p-4 bg-purple-50 rounded-lg">
            <p className="text-sm text-purple-700 text-center">
              💡 이 링크는 30일 후 자동으로 만료됩니다.
            </p>
          </div>
        </Card>
      </div>
    </div>
  );
};
