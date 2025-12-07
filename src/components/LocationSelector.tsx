import React, { useState } from "react";
import data from "../data/nepal_location.json";

export default function LocationSelector() {
    const [provinceId, setProvinceId] = useState("");
    const [districtId, setDistrictId] = useState("");

    const provinces = data.provinceList;

    // Get districts of selected province
    const districts =
        provinces.find((p) => p.id === Number(provinceId))?.districtList || [];

    // Get municipalities of selected district
    const municipalities =
        districts.find((d) => d.id === Number(districtId))?.municipalityList || [];

    return (
        <div className="flex flex-col gap-4 w-full max-w-md">

            {/* Province Dropdown */}
            <select
                className="border p-2 rounded"
                value={provinceId}
                onChange={(e) => {
                    setProvinceId(e.target.value);
                    setDistrictId(""); // reset district
                }}
            >
                <option value="">Select Province</option>
                {provinces.map((p) => (
                    <option key={p.id} value={p.id}>
                        {p.name}
                    </option>
                ))}
            </select>

            {/* District Dropdown */}
            <select
                className="border p-2 rounded"
                disabled={!provinceId}
                value={districtId}
                onChange={(e) => setDistrictId(e.target.value)}
            >
                <option value="">Select District</option>
                {districts.map((d) => (
                    <option key={d.id} value={d.id}>
                        {d.name}
                    </option>
                ))}
            </select>

            {/* Municipality Dropdown */}
            <select className="border p-2 rounded" disabled={!districtId}>
                <option value="">Select Municipality</option>
                {municipalities.map((m) => (
                    <option key={m.id} value={m.id}>
                        {m.name}
                    </option>
                ))}
            </select>
        </div>
    );
}
