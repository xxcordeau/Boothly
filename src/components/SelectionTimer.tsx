import { Clock } from 'lucide-react';
import { useTranslation } from '../hooks/useTranslation';

interface SelectionTimerProps {
  timeRemaining: number;
}

export const SelectionTimer = ({ timeRemaining }: SelectionTimerProps) => {
  const { t } = useTranslation();

  return (
    <div className={`px-3 py-1.5 rounded-lg flex items-center gap-2 ${
      timeRemaining <= 20 ? 'bg-red-50 border-red-200' : 'bg-white border-slate-200'
    } border`}>
      <Clock className={`w-4 h-4 ${timeRemaining <= 20 ? 'text-red-600' : 'text-blue-600'}`} />
      <span className={`text-sm ${timeRemaining <= 20 ? 'text-red-600' : 'text-slate-700'}`}>
        {timeRemaining}{t.frameColor.seconds}
      </span>
    </div>
  );
};
