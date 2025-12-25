// src/pages/kyc/ProvinceDistrictMunicipality.tsx
import React, { useEffect, useMemo, useState } from "react";
import { getCatalogue } from "@/api/kyc/getcatalogue/getcatalogue";
import { Label } from "@/components/ui/label";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";

type CatalogueItem = {
    data: string;              // e.g. "STATE 6" OR "Jumla"
    value: string;             // display label
    additional_value?: string; // e.g. "STATE 6" (for district), or district name/code (for municipality)
};

const PROVINCE_TYPE = 11;
const DISTRICT_TYPE = 12;
const MUNICIPALITY_TYPE = 13; // keep if your API exists

async function fetchCatalogueList(catalogueType: number, id: string | number) {
    const res = await getCatalogue(catalogueType, id);
    return (res?.catalogue_list ?? []) as CatalogueItem[];
}

export type PdmValue = {
    province: string;
    district: string;
    local_level: string;
};

export function ProvinceDistrictMunicipality(props: {
    value: PdmValue;
    onChange: (next: PdmValue) => void;
    labels?: { province?: string; district?: string; local_level?: string };
    disabled?: boolean;
}) {
    const { value, onChange, labels, disabled } = props;

    const [provinces, setProvinces] = useState<CatalogueItem[]>([]);
    const [allDistricts, setAllDistricts] = useState<CatalogueItem[]>([]);
    const [allMunicipalities, setAllMunicipalities] = useState<CatalogueItem[]>([]);

    const [loadingProvince, setLoadingProvince] = useState(false);
    const [loadingDistrict, setLoadingDistrict] = useState(false);
    const [loadingMunicipality, setLoadingMunicipality] = useState(false);

    const [errProvince, setErrProvince] = useState("");
    const [errDistrict, setErrDistrict] = useState("");
    const [errMunicipality, setErrMunicipality] = useState("");

    /** 1) Load provinces */
    useEffect(() => {
        let alive = true;
        (async () => {
            try {
                setLoadingProvince(true);
                setErrProvince("");
                const list = await fetchCatalogueList(PROVINCE_TYPE, 1);
                if (alive) setProvinces(list);
            } catch (e: any) {
                if (alive) setErrProvince(e?.message || "Failed to load provinces");
            } finally {
                if (alive) setLoadingProvince(false);
            }
        })();
        return () => {
            alive = false;
        };
    }, []);

    /** 2) Load ALL districts once (id=1) */
    useEffect(() => {
        let alive = true;
        (async () => {
            try {
                setLoadingDistrict(true);
                setErrDistrict("");
                const list = await fetchCatalogueList(DISTRICT_TYPE, 1);
                if (alive) setAllDistricts(list);
            } catch (e: any) {
                if (alive) setErrDistrict(e?.message || "Failed to load districts");
            } finally {
                if (alive) setLoadingDistrict(false);
            }
        })();
        return () => {
            alive = false;
        };
    }, []);

    /** 3) Load ALL municipalities once (optional) */
    useEffect(() => {
        let alive = true;
        (async () => {
            try {
                setLoadingMunicipality(true);
                setErrMunicipality("");
                const list = await fetchCatalogueList(MUNICIPALITY_TYPE, 1);
                if (alive) setAllMunicipalities(list);
            } catch (e: any) {
                // if API not exists you can ignore
                if (alive) setErrMunicipality(e?.message || "Failed to load municipalities");
            } finally {
                if (alive) setLoadingMunicipality(false);
            }
        })();
        return () => {
            alive = false;
        };
    }, []);

    /** Filter districts by province: district.additional_value must equal provinceCode */
    const districts = useMemo(() => {
        if (!value.province) return [];
        const pv = value.province.trim();
        return allDistricts.filter((d) => (d.additional_value || "").trim() === pv);
    }, [allDistricts, value.province]);

    /** Filter municipalities by district (based on your API pattern) */
    const municipalities = useMemo(() => {
        if (!value.district) return [];
        const dist = value.district.trim();
        return allMunicipalities.filter((m) => (m.additional_value || "").trim() === dist);
    }, [allMunicipalities, value.district]);

    /** When province changes: reset district + local_level if they no longer match */
    useEffect(() => {
        if (!value.province) {
            if (value.district || value.local_level) {
                onChange({ province: "", district: "", local_level: "" });
            }
            return;
        }

        // if selected district isn't in filtered list, clear it
        if (value.district && !districts.some((d) => d.data === value.district)) {
            onChange({ province: value.province, district: "", local_level: "" });
            return;
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [value.province, districts]);

    /** When district changes: reset local_level if invalid */
    useEffect(() => {
        if (!value.district) {
            if (value.local_level) onChange({ ...value, local_level: "" });
            return;
        }

        if (value.local_level && !municipalities.some((m) => m.data === value.local_level)) {
            onChange({ ...value, local_level: "" });
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [value.district, municipalities]);

    return (
        <>
            {/* Province */}
            <div>
                <Label>{labels?.province ?? "Province"}</Label>
                <Select
                    value={value.province}
                    onValueChange={(v) => onChange({ province: v, district: "", local_level: "" })}
                    disabled={disabled || loadingProvince}
                >
                    <SelectTrigger className="mt-2">
                        <SelectValue placeholder={loadingProvince ? "Loading..." : "Select province"} />
                    </SelectTrigger>
                    <SelectContent>
                        {errProvince ? (
                            <div className="px-3 py-2 text-sm text-red-500">{errProvince}</div>
                        ) : (
                            provinces.map((p) => (
                                <SelectItem key={p.data} value={p.data}>
                                    {p.value}
                                </SelectItem>
                            ))
                        )}
                    </SelectContent>
                </Select>
            </div>

            {/* District */}
            <div>
                <Label>{labels?.district ?? "District"}</Label>
                <Select
                    value={value.district}
                    onValueChange={(v) => onChange({ ...value, district: v, local_level: "" })}
                    disabled={disabled || !value.province || loadingDistrict}
                >
                    <SelectTrigger className="mt-2">
                        <SelectValue
                            placeholder={
                                !value.province
                                    ? "Select province first"
                                    : loadingDistrict
                                        ? "Loading..."
                                        : districts.length
                                            ? "Select district"
                                            : "No district found"
                            }
                        />
                    </SelectTrigger>
                    <SelectContent>
                        {errDistrict ? (
                            <div className="px-3 py-2 text-sm text-red-500">{errDistrict}</div>
                        ) : (
                            districts.map((d) => (
                                <SelectItem key={`${d.data}-${d.additional_value}`} value={d.data}>
                                    {d.value}
                                </SelectItem>
                            ))
                        )}
                    </SelectContent>
                </Select>
            </div>

            {/* Municipality / Local level */}
            <div>
                <Label>{labels?.local_level ?? "Municipality"}</Label>
                <Select
                    value={value.local_level}
                    onValueChange={(v) => onChange({ ...value, local_level: v })}
                    disabled={disabled || !value.district || loadingMunicipality}
                >
                    <SelectTrigger className="mt-2">
                        <SelectValue
                            placeholder={
                                !value.district
                                    ? "Select district first"
                                    : loadingMunicipality
                                        ? "Loading..."
                                        : municipalities.length
                                            ? "Select municipality"
                                            : "No municipality found"
                            }
                        />
                    </SelectTrigger>
                    <SelectContent>
                        {errMunicipality ? (
                            <div className="px-3 py-2 text-sm text-red-500">{errMunicipality}</div>
                        ) : (
                            municipalities.map((m) => (
                                <SelectItem key={`${m.data}-${m.additional_value}`} value={m.data}>
                                    {m.value}
                                </SelectItem>
                            ))
                        )}
                    </SelectContent>
                </Select>
            </div>
        </>
    );
}
