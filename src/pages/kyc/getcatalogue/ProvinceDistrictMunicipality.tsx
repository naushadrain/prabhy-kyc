// ProvinceDistrictMunicipality.tsx
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
    data: string;
    value: string;
    additional_value?: string;
};

const PROVINCE_TYPE = 11;
const DISTRICT_TYPE = 12;
const MUNICIPALITY_TYPE = 13;

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

    //  add this
    errors?: { province?: string; district?: string; local_level?: string };
}) {
    const { value, onChange, labels, disabled, errors } = props;

    const [provinces, setProvinces] = useState<CatalogueItem[]>([]);
    const [allDistricts, setAllDistricts] = useState<CatalogueItem[]>([]);
    const [allMunicipalities, setAllMunicipalities] = useState<CatalogueItem[]>([]);

    const [loadingProvince, setLoadingProvince] = useState(false);
    const [loadingDistrict, setLoadingDistrict] = useState(false);
    const [loadingMunicipality, setLoadingMunicipality] = useState(false);

    const [errProvince, setErrProvince] = useState("");
    const [errDistrict, setErrDistrict] = useState("");
    const [errMunicipality, setErrMunicipality] = useState("");

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

    useEffect(() => {
        let alive = true;
        (async () => {
            try {
                setLoadingMunicipality(true);
                setErrMunicipality("");
                const list = await fetchCatalogueList(MUNICIPALITY_TYPE, 1);
                if (alive) setAllMunicipalities(list);
            } catch (e: any) {
                if (alive) setErrMunicipality(e?.message || "Failed to load municipalities");
            } finally {
                if (alive) setLoadingMunicipality(false);
            }
        })();
        return () => {
            alive = false;
        };
    }, []);

    const districts = useMemo(() => {
        if (!value.province) return [];
        const pv = value.province.trim();
        return allDistricts.filter((d) => (d.additional_value || "").trim() === pv);
    }, [allDistricts, value.province]);

    const municipalities = useMemo(() => {
        if (!value.district) return [];
        const dist = value.district.trim();
        return allMunicipalities.filter((m) => (m.additional_value || "").trim() === dist);
    }, [allMunicipalities, value.district]);

    useEffect(() => {
        if (!value.province) {
            if (value.district || value.local_level) onChange({ province: "", district: "", local_level: "" });
            return;
        }
        if (value.district && !districts.some((d) => d.data === value.district)) {
            onChange({ province: value.province, district: "", local_level: "" });
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [value.province, districts]);

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
                <Label>{labels?.province ?? "Province"} *</Label>
                <Select
                    value={value.province}
                    onValueChange={(v) => onChange({ province: v, district: "", local_level: "" })}
                    disabled={disabled || loadingProvince}
                >
                    <SelectTrigger className={`mt-2 ${errors?.province ? "border-red-500 focus-visible:ring-red-500" : ""}`}>
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
                {errors?.province && <p className="text-xs text-red-500 mt-1">{errors.province}</p>}
            </div>

            {/* District */}
            <div>
                <Label>{labels?.district ?? "District"} *</Label>
                <Select
                    value={value.district}
                    onValueChange={(v) => onChange({ ...value, district: v, local_level: "" })}
                    disabled={disabled || !value.province || loadingDistrict}
                >
                    <SelectTrigger className={`mt-2 ${errors?.district ? "border-red-500 focus-visible:ring-red-500" : ""}`}>
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
                {errors?.district && <p className="text-xs text-red-500 mt-1">{errors.district}</p>}
            </div>

            {/* Municipality */}
            <div>
                <Label>{labels?.local_level ?? "Municipality"} *</Label>
                <Select
                    value={value.local_level}
                    onValueChange={(v) => onChange({ ...value, local_level: v })}
                    disabled={disabled || !value.district || loadingMunicipality}
                >
                    <SelectTrigger className={`mt-2 ${errors?.local_level ? "border-red-500 focus-visible:ring-red-500" : ""}`}>
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
                {errors?.local_level && <p className="text-xs text-red-500 mt-1">{errors.local_level}</p>}
            </div>
        </>
    );
}
