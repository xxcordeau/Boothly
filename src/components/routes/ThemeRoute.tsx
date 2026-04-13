import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ThemeSelector } from '../ThemeSelector';
import { usePhotoBoothContext } from '../../contexts/PhotoBoothContext';
import { UploadedFrame } from '../../utils/frameStorage';

export const ThemeRoute = () => {
  const navigate = useNavigate();
  const { selectedMode, selectedTemplate, setSelectedTheme } = usePhotoBoothContext();

  // Redirect if no template selected or not in special mode
  useEffect(() => {
    if (!selectedTemplate || selectedMode !== 'special') {
      navigate('/');
    }
  }, [selectedTemplate, selectedMode, navigate]);

  if (!selectedTemplate || selectedMode !== 'special') return null;

  const handleSelect = (theme: { overlays: string[]; frame: UploadedFrame | null }) => {
    setSelectedTheme(theme);
    navigate('/print-count');
  };

  return (
    <ThemeSelector
      selectedTemplate={selectedTemplate.id}
      templateCuts={selectedTemplate.cuts}
      onSelect={handleSelect}
      onBack={() => navigate('/template')}
    />
  );
};
