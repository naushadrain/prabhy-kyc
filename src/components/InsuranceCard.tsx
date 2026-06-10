import { useNavigate } from "react-router-dom";
import { Card } from "@/components/ui/card";

interface InsuranceCardProps {
  title: string;
  subtitle?: string;
  icon: string;
  to?: string;
  onClick?: () => void;
}

export const InsuranceCard = ({
  title,
  subtitle,
  icon,
  to,
  onClick,
}: InsuranceCardProps) => {
  const navigate = useNavigate();

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
      onClick={handleClick}
      className="
        group flex h-[275px] cursor-pointer flex-col items-center justify-center
        rounded-md border border-gray-100 bg-white p-8 text-center shadow-sm
        transition-all duration-300 hover:-translate-y-1 hover:border-red-500 hover:shadow-xl
      "
    >
      {/* Icon Top */}
      <div className="mb-12 flex items-center justify-center">
        <img
          src={icon}
          alt={title}
          className="
            h-28 w-28 object-contain transition-transform duration-300
            group-hover:scale-110
          "
          style={{
            filter:
              "brightness(0) saturate(100%) invert(18%) sepia(97%) saturate(3205%) hue-rotate(348deg) brightness(96%) contrast(95%)",
          }}
        />
      </div>

      {/* Title Center */}
      <h3 className="max-w-[260px] text-center text-lg font-extrabold uppercase leading-7 tracking-wide text-red-600">
        {title}
      </h3>

      {subtitle && (
        <p className="mt-3 text-center text-sm leading-5 text-muted-foreground">
          {subtitle}
        </p>
      )}
    </Card>
  );
};