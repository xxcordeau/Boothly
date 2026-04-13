import { useIsMobile } from './ui/use-mobile';

interface PageHeaderProps {
  title: string;
  subtitle: string;
}

export const PageHeader = ({ title, subtitle }: PageHeaderProps) => {
  const isMobile = useIsMobile();

  if (isMobile) {
    return (
      <div className="text-center flex-shrink-0 mb-4">
        <h1 className="text-stone-900 mb-1 text-2xl font-semibold tracking-tight">{title}</h1>
        <p className="text-stone-400 text-sm">{subtitle}</p>
      </div>
    );
  }

  return (
    <div className="text-center px-6 pt-6 pb-5 flex-shrink-0">
      <h1 className="text-stone-900 mb-2 text-5xl font-semibold tracking-tight">{title}</h1>
      <p className="text-stone-400 text-lg">{subtitle}</p>
    </div>
  );
};
