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
  data: string;              // internal code (depends API)
  value: string;             // display text
  additional_value?: string; // optional
};

const GENDER_TYPE = 10;

async function fetchCatalogueList(catalogueType: number, id: string | number) {
  const res = await getCatalogue(catalogueType, id);
  return (res?.catalogue_list ?? []) as CatalogueItem[];
}

type GenderProps = {
  value?: string;
  onChange?: (value: string) => void;
  label?: string;
};

export function Gender({ value, onChange, label = "Gender" }: GenderProps) {
  const [genders, setGenders] = useState<CatalogueItem[]>([]);
  const [selected, setSelected] = useState<string>(value ?? "");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // keep in sync if parent controls the value
  useEffect(() => {
    if (value !== undefined) setSelected(value);
  }, [value]);

  useEffect(() => {
    let alive = true;

    (async () => {
      try {
        setLoading(true);
        setError("");
        const list = await fetchCatalogueList(GENDER_TYPE, 1);
        if (alive) setGenders(list);
      } catch (e: any) {
        if (alive) setError(e?.message || "Failed to load gender list");
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
          <SelectValue placeholder={loading ? "Loading..." : "Select gender"} />
        </SelectTrigger>

        <SelectContent>
          {error ? (
            <div className="px-3 py-2 text-sm text-red-500">{error}</div>
          ) : genders.length === 0 ? (
            <div className="px-3 py-2 text-sm text-muted-foreground">
              {loading ? "Loading..." : "No data"}
            </div>
          ) : (
            genders.map((g) => (
              <SelectItem key={g.data} value={g.data}>
                {g.value}
              </SelectItem>
            ))
          )}
        </SelectContent>
      </Select>
    </div>
  );
}
