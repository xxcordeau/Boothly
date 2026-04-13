import { useNavigate } from 'react-router-dom';
import { ModeSelector } from '../ModeSelector';
import { usePhotoBoothContext } from '../../contexts/PhotoBoothContext';
import { ModeType } from '../../types/photobooth';

export const ModeRoute = () => {
  const navigate = useNavigate();
  const { setSelectedMode, resetAll } = usePhotoBoothContext();

  const handleSelect = (mode: ModeType) => {
    resetAll();
    setSelectedMode(mode);
    navigate('/template');
  };

  return <ModeSelector onSelect={handleSelect} />;
};
