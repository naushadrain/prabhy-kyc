import React, { useEffect, useState } from "react";
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

const HONOUR_TYPE = "08";

async function fetchCatalogueList(catalogueType: string | number, id: string | number) {
    const res = await getCatalogue(catalogueType, id);
    return (res?.catalogue_list ?? []) as CatalogueItem[];
}

type HonourProps = {
    value?: string;
    onChange?: (value: string) => void;
    label?: string;
};

export function Honour({ value, onChange, label = "Honour" }: HonourProps) {
    const [items, setItems] = useState<CatalogueItem[]>([]);
    const [selected, setSelected] = useState<string>(value ?? "");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    // sync if parent controls value
    useEffect(() => {
        if (value !== undefined) setSelected(value);
    }, [value]);

    useEffect(() => {
        let alive = true;

        (async () => {
            try {
                setLoading(true);
                setError("");
                const list = await fetchCatalogueList(HONOUR_TYPE, 1);
                if (alive) setItems(list);
            } catch (e: any) {
                if (alive) setError(e?.message || "Failed to load honour list");
            } finally {
                if (alive) setLoading(false);
            }
        })();

        return () => {
            alive = false;
        };
    }, []);

    const handleChange = (v: string) => {
        setSelected(v);
        onChange?.(v);
    };

    return (
        <div>
            <Label>{label}</Label>

            <Select value={selected} onValueChange={handleChange}>
                <SelectTrigger className="mt-2">
                    <SelectValue placeholder={loading ? "Loading..." : "Select honour"} />
                </SelectTrigger>

                <SelectContent>
                    {error ? (
                        <div className="px-3 py-2 text-sm text-red-500">{error}</div>
                    ) : items.length === 0 ? (
                        <div className="px-3 py-2 text-sm text-muted-foreground">
                            {loading ? "Loading..." : "No data"}
                        </div>
                    ) : (
                        items.map((it) => (
                            <SelectItem key={it.data} value={it.data}>
                                {it.value}
                            </SelectItem>
                        ))
                    )}
                </SelectContent>
            </Select>
        </div>
    );
}
