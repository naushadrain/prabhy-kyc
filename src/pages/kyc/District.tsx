import React from "react";
import data from "@/data/nepal_location.json";

type Municipality = { id: number; name: string };
type District = { id: number; name: string; municipalityList: Municipality[] };
type Province = {
  id: number;
  data: string;
  value: string;
  districtList: District[];
};

const locations = data as { provinceList: Province[] };

export default function Districts({
  provinceId,
  label,
}: {
  provinceId?: number;
  label?: string; // optional: "Koshi Province" etc
}) {
  const province =
    (typeof provinceId === "number"
      ? locations.provinceList.find((p) => p.id === provinceId)
      : undefined) ??
    (label
      ? locations.provinceList.find(
          (p) =>
            p.value.toLowerCase() === label.toLowerCase() ||
            p.data.toLowerCase() === label.toLowerCase()
        )
      : undefined);

  const districts = province?.districtList ?? [];

  return (
    <div className="space-y-1">
      {districts.length === 0 ? (
        <p className="text-sm opacity-70">No districts found</p>
      ) : (
        districts.map((d) => (
          <div key={d.id} className="text-sm">
            {d.name}
          </div>
        ))
      )}
    </div>
  );
}
