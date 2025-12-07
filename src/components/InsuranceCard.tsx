import { useNavigate } from 'react-router-dom';
import { Card } from '@/components/ui/card';
import motorIcon from '@/assets/motor-icon.svg';
import travelIcon from '@/assets/travel-icon.svg';
import homeIcon from '@/assets/home-icon.svg';

interface InsuranceCardProps {
  type: 'motor' | 'travel' | 'home';
  title: string;
  subtitle: string;
  to?: string;
}

export const InsuranceCard = ({ type, title, subtitle, to }: InsuranceCardProps) => {
  const navigate = useNavigate();
  
  const icons = {
    motor: motorIcon,
    travel: travelIcon,
    home: homeIcon,
  };

  const iconSrc = icons[type];

  const handleClick = () => {
    if (to) {
      navigate(to);
    }
  };

  return (
    <Card 
      className="p-6 hover:shadow-lg transition-shadow cursor-pointer h-full" 
      onClick={handleClick}
    >
      <div className="mb-4">
        <h3 className="text-lg font-bold">{title}</h3>
      </div>
      <p className="text-sm text-muted-foreground mb-6">{subtitle}</p>
      <div className="flex items-center justify-center py-6">
        <img src={iconSrc} alt={type} className="w-20 h-20" style={{ filter: 'brightness(0) saturate(100%) invert(25%) sepia(100%) saturate(7491%) hue-rotate(345deg) brightness(95%) contrast(91%)' }} />
      </div>
    </Card>
  );
};
