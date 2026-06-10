// CommercialVehicle/thirdparty/ThirdPrty.tsx

import { Card } from "@/components/ui/card";
import { ChevronLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";

type CommercialCategory = {
  data: string;
  value: string;
  additional_value: string;
  icon: string;
  title: string;
  description: string;
  badge: string;
  to: string;
};

const thirdPartyCommercialCategories: CommercialCategory[] = [
  {
    data: "3",
    value: "Commercial Vehicle Normal Good Carrying Policy",
    additional_value: "CV",
    icon: "/normal-goods.svg",
    title: "Normal Goods Carrying",
    description: "Third-party insurance for normal goods carrying commercial vehicles.",
    badge: "Goods",
    to: "/motor/commercial-vehicle/third-party/normal-goods",
  },
  {
    data: "4",
    value: "Commercial Vehicle Hazardous Good Carrying Policy",
    additional_value: "CV",
    icon: "/hazardous-svgrepo-com.svg",
    title: "Hazardous Goods Carrying",
    description: "Third-party insurance for vehicles carrying hazardous or sensitive goods.",
    badge: "Hazard",
    to: "/motor/commercial-vehicle/third-party/hazardous-goods",
  },
  {
    data: "5",
    value: "Commercial Vehicle Passenger Carrying Policy",
    additional_value: "CV",
    icon: "/bus.svg",
    title: "Passenger Carrying",
    description: "Third-party insurance for commercial passenger carrying vehicles.",
    badge: "Passenger",
    to: "/motor/commercial-vehicle/third-party/passenger-carrying",
  },
  {
    data: "6",
    value: "Taxi Policy",
    additional_value: "CV",
    icon: "/taxi-4-svgrepo-com.svg",
    title: "Taxi Policy",
    description: "Third-party insurance for taxi and public hire vehicles.",
    badge: "Taxi",
    to: "/motor/commercial-vehicle/third-party/taxi",
  },
  {
    data: "7",
    value: "Tempo/E-Rikshwa Policy",
    additional_value: "CV",
    icon: "/tempo.svg",
    title: "Tempo / E-Rikshaw",
    description: "Third-party insurance for tempo, e-rikshaw, and small transport vehicles.",
    badge: "Tempo",
    to: "/motor/commercial-vehicle/third-party/tempo-e-rikshaw",
  },
  {
    data: "9",
    value: "Construction Equipment Vehicle",
    additional_value: "CV",
    icon: "/transportationwhite.svg",
    title: "Construction Equipment",
    description: "Third-party insurance for construction equipment and heavy machines.",
    badge: "Construction",
    to: "/motor/commercial-vehicle/third-party/construction-equipment",
  },
];

export const ThirdPrty = () => {
  const navigate = useNavigate();

  const handleCategoryClick = (category: CommercialCategory) => {
    localStorage.setItem("motor.vehicleType", "commercial");
    localStorage.setItem("motor.insurancePlan", "third-party");

    localStorage.setItem(
      "motor.selectedCommercialCategory",
      JSON.stringify({
        data: category.data,
        value: category.value,
        additional_value: category.additional_value,
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
            Third Party Commercial Vehicle
          </h1>

          <p className="mt-1 text-sm text-muted-foreground">
            Select your commercial vehicle category to continue.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 xl:grid-cols-3">
        {thirdPartyCommercialCategories.map((category) => (
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

export default ThirdPrty;