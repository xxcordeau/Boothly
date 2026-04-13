import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { PrintCountSelector } from '../PrintCountSelector';
import { usePhotoBoothContext } from '../../contexts/PhotoBoothContext';
import { PrintOption } from '../../types/photobooth';

export const PrintCountRoute = () => {
  const navigate = useNavigate();
  const { selectedMode, selectedTemplate, selectedTheme, setSelectedPrintOption, setSelectedTemplate } = usePhotoBoothContext();

  // Redirect if no template selected
  useEffect(() => {
    if (!selectedTemplate) {
      navigate('/');
    }
  }, [selectedTemplate, navigate]);

  if (!selectedTemplate) return null;

  const handleSelect = async (printOption: PrintOption) => {
    setSelectedPrintOption(printOption);
    
    // If special mode, apply selected theme to template
    if (selectedMode === 'special' && selectedTheme) {
      const updatedTemplate = { ...selectedTemplate };
      
      // Apply theme frame (if exists) to template
      if (selectedTheme.frame) {
        updatedTemplate.compositeFrameUrl = selectedTheme.frame.imageUrl || selectedTheme.frame.dataUrl;
        console.log('🖼️ Applied theme frame to template:', updatedTemplate.compositeFrameUrl?.substring(0, 50));
      }
      
      setSelectedTemplate(updatedTemplate);
    }
    
    navigate('/payment');
  };

  const handleBack = () => {
    if (selectedMode === 'special') {
      navigate('/theme');
    } else {
      navigate('/template');
    }
  };

  return (
    <PrintCountSelector
      onSelect={handleSelect}
      onBack={handleBack}
      templateId={selectedTemplate.id}
      mode={selectedMode || 'basic'}
    />
  );
};
