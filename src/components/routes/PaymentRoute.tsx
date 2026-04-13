import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { PaymentSelector } from '../PaymentSelector';
import { usePhotoBoothContext } from '../../contexts/PhotoBoothContext';

export const PaymentRoute = () => {
  const navigate = useNavigate();
  const { selectedPrintOption } = usePhotoBoothContext();

  // Redirect if no print option selected
  useEffect(() => {
    if (!selectedPrintOption) {
      navigate('/');
    }
  }, [selectedPrintOption, navigate]);

  if (!selectedPrintOption) return null;

  const handlePaymentSuccess = () => {
    // Camera will be started in CameraRoute
    navigate('/camera');
  };

  return (
    <PaymentSelector
      amount={selectedPrintOption.price}
      onPaymentSuccess={handlePaymentSuccess}
      onBack={() => navigate('/print-count')}
    />
  );
};
