// CommercialVehicle/comprehensive/Comprehensive.tsx

import { Card } from "@/components/ui/card";
import { ChevronLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";

type CommercialCategory = {
  data: string;
  value: string;
  icon: string;
  title: string;
  description: string;
  badge: string;
  to: string;
};

const CATEGORIES: CommercialCategory[] = [
  {
    data: "3",
    value: "Commercial Vehicle Normal Good Carrying Policy",
    icon: "/normal-goods.svg",
    title: "Normal Goods Carrying",
    description: "Comprehensive insurance for normal goods carrying vehicles.",
    badge: "Goods",
    to: "/motor/commercial-vehicle/comprehensive/normal-goods",
  },
  {
    data: "4",
    value: "Commercial Vehicle Hazardous Good Carrying Policy",
    icon: "/hazardous-svgrepo-com.svg",
    title: "Hazardous Goods Carrying",
    description: "Comprehensive insurance for hazardous goods carrying vehicles.",
    badge: "Hazard",
    to: "/motor/commercial-vehicle/comprehensive/hazardous-goods",
  },
  {
    data: "5",
    value: "Commercial Vehicle Passenger Carrying Policy",
    icon: "/bus.svg",
    title: "Passenger Carrying",
    description: "Comprehensive insurance for passenger carrying vehicles.",
    badge: "Passenger",
    to: "/motor/commercial-vehicle/comprehensive/passenger-carrying",
  },
  {
    data: "6",
    value: "Taxi Policy",
    icon: "/taxi-4-svgrepo-com.svg",
    title: "Taxi Policy",
    description: "Comprehensive insurance for taxi and public hire vehicles.",
    badge: "Taxi",
    to: "/motor/commercial-vehicle/comprehensive/taxi",
  },
  {
    data: "7",
    value: "Tempo/E-Rikshwa Policy",
    icon: "/tempo.svg",
    title: "Tempo / E-Rikshaw",
    description: "Comprehensive insurance for tempo and e-rikshaw vehicles.",
    badge: "Tempo",
    to: "/motor/commercial-vehicle/comprehensive/tempo-e-rikshaw",
  },
  {
    data: "9",
    value: "Construction Equipment Vehicle",
    icon: "/transportationwhite.svg",
    title: "Construction Equipment",
    description: "Comprehensive insurance for construction equipment vehicles.",
    badge: "Construction",
    to: "/motor/commercial-vehicle/comprehensive/construction-equipment",
  },
];

export const Comprehensive = () => {
  const navigate = useNavigate();

  const handleCategoryClick = (category: CommercialCategory) => {
    localStorage.setItem("motor.vehicleType", "commercial");
    localStorage.setItem("motor.insurancePlan", "comprehensive");

    localStorage.setItem(
      "motor.selectedCommercialCategory",
      JSON.stringify({
        data: category.data,
        value: category.value,
        additional_value: "CV",
        title: category.title,
        route: category.to,
      })
    );

    localStorage.removeItem("motor.coverageForm");
    localStorage.removeItem("motor.premiumResponse");

    navigate(category.to);
  };

  return (
    <>
      <div className="mb-8 flex items-center gap-3">
        <button
          type="button"
          className="flex h-8 w-8 items-center justify-center rounded-full hover:bg-gray-100"
          onClick={() => navigate("/motor/commercial-vehicle")}
        >
          <ChevronLeft className="h-5 w-5 text-black" />
        </button>

        <div>
          <h1 className="text-2xl font-bold text-black">
            Comprehensive Commercial Vehicle
          </h1>

          <p className="mt-1 text-sm text-muted-foreground">
            Select your commercial vehicle category to continue.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 xl:grid-cols-3">
        {CATEGORIES.map((category) => (
          <Card
            key={category.data}
            onClick={() => handleCategoryClick(category)}
            className="
              group flex h-[275px] cursor-pointer flex-col items-center justify-center
              rounded-md border border-gray-100 bg-white p-8 text-center shadow-sm
              transition-all duration-300 hover:-translate-y-1 hover:border-red-500 hover:shadow-xl
            "
          >
            <div className="mb-10 flex items-center justify-center">
              <img
                src={category.icon}
                alt={category.title}
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

            <h3 className="max-w-[260px] text-center text-lg font-extrabold uppercase leading-7 tracking-wide text-red-600">
              {category.title}
            </h3>
          </Card>
        ))}
      </div>
    </>
  );
};

export default Comprehensive;