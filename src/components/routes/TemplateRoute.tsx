import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { TemplateSelector } from '../TemplateSelector';
import { usePhotoBoothContext } from '../../contexts/PhotoBoothContext';
import { TemplateConfig } from '../../types/photobooth';

export const TemplateRoute = () => {
  const navigate = useNavigate();
  const { selectedMode, setSelectedTemplate } = usePhotoBoothContext();

  // Redirect if no mode selected
  useEffect(() => {
    if (!selectedMode) {
      navigate('/');
    }
  }, [selectedMode, navigate]);

  if (!selectedMode) return null;

  const handleSelect = (template: TemplateConfig) => {
    setSelectedTemplate(template);
    if (selectedMode === 'special') {
      navigate('/theme');
    } else {
      navigate('/print-count');
    }
  };

  return (
    <TemplateSelector 
      onSelect={handleSelect}
      onBack={() => navigate('/')}
      mode={selectedMode}
    />
  );
};
