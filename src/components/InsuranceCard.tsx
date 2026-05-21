import { useNavigate } from "react-router-dom";
import { Card } from "@/components/ui/card";

import motorIcon from "@/assets/motor-icon.svg";
import travelIcon from "@/assets/travel-icon.svg";
import homeIcon from "@/assets/home-icon.svg";

type InsuranceType =
  | "motor"
  | "two-wheeler"
  | "private-vehicle"
  | "commercial-vehicle"
  | "accident"
  | "travel"
  | "home";

interface InsuranceCardProps {
  type: InsuranceType;
  title: string;
  subtitle: string;
  to?: string;
  onClick?: () => void;
}

export const InsuranceCard = ({
  type,
  title,
  subtitle,
  to,
  onClick,
}: InsuranceCardProps) => {
  const navigate = useNavigate();

  const imageIcons: Partial<Record<InsuranceType, string>> = {
    motor: motorIcon,
    travel: travelIcon,
    home: homeIcon,
  };

  const emojiIcons: Partial<Record<InsuranceType, string>> = {
    "two-wheeler": "🏍️",
    "private-vehicle": "🚗",
    "commercial-vehicle": "🚚",
    accident: "🛡️",
  };

  const iconSrc = imageIcons[type];
  const emojiIcon = emojiIcons[type];

  const handleClick = () => {
    if (onClick) {
      onClick();
      return;
    }

    if (to) {
      navigate(to);
    }
  };

  return (
    <Card
      className="group h-full cursor-pointer border-2 p-6 text-center transition-all hover:-translate-y-1 hover:border-primary hover:shadow-lg"
      onClick={handleClick}
    >
      <div className="mb-4">
        <h3 className="text-lg font-bold text-black">{title}</h3>
      </div>

      <p className="mb-6 min-h-[40px] text-sm leading-5 text-muted-foreground">
        {subtitle}
      </p>

      <div className="flex items-center justify-center py-6">
        {iconSrc ? (
          <img
            src={iconSrc}
            alt={title}
            className="h-20 w-20 object-contain"
            style={{
              filter:
                "brightness(0) saturate(100%) invert(25%) sepia(100%) saturate(7491%) hue-rotate(345deg) brightness(95%) contrast(91%)",
            }}
          />
        ) : (
          <div className="flex items-center justify-center text-7xl leading-none transition-transform group-hover:scale-110">
            {emojiIcon}
          </div>
        )}
      </div>


    </Card>
  );
};