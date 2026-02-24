// src/components/CountrySelect.tsx
import React, { useState, useEffect } from 'react';
import { UseFormRegisterReturn } from 'react-hook-form';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { getTravelCountries } from '@/api/travels/getTravelCountries';

interface TravelCountry {
  value: string;
  data: string;
}

interface CountrySelectProps {
  register: UseFormRegisterReturn;
  error?: { message?: string };
  value?: string;
  onChange?: (value: string) => void;
  label?: string;
  required?: boolean;
  placeholder?: string;
}

export const CountrySelect: React.FC<CountrySelectProps> = ({
  register,
  error,
  value,
  onChange,
  label = "Country Code",
  required = false,
  placeholder = "Select a country"
}) => {
  const [countries, setCountries] = useState<TravelCountry[]>([]);
  const [loading, setLoading] = useState(false);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [selectedValue, setSelectedValue] = useState(value || '');

  // Fetch countries on component mount
  useEffect(() => {
    const fetchCountries = async () => {
      try {
        setLoading(true);
        setFetchError(null);
        const response = await getTravelCountries();
        if (response.process_result && response.catalogue_list) {
          setCountries(response.catalogue_list);
        } else {
          setFetchError('Failed to load countries');
        }
      } catch (err: any) {
        setFetchError(err.message || 'Failed to load countries');
      } finally {
        setLoading(false);
      }
    };

    fetchCountries();
  }, []);

  const handleChange = (newValue: string) => {
    setSelectedValue(newValue);
    // Create a synthetic event for react-hook-form
    const event = {
      target: {
        name: register.name,
        value: newValue
      }
    };
    register.onChange(event);
    if (onChange) onChange(newValue);
  };

  return (
    <div>
      <Label>
        {label} {required && <span className="text-red-500">*</span>}
      </Label>
      
      <Select
        value={selectedValue}
        onValueChange={handleChange}
        disabled={loading}
      >
        <SelectTrigger className={`mt-2 ${error ? "border-red-500" : ""}`}>
          <SelectValue placeholder={loading ? "Loading countries..." : placeholder} />
        </SelectTrigger>
        <SelectContent>
          {loading && (
            <SelectItem value="loading" disabled>
              Loading countries...
            </SelectItem>
          )}
          
          {fetchError && (
            <SelectItem value="error" disabled>
              Error loading countries
            </SelectItem>
          )}
          
          {!loading && !fetchError && countries.length === 0 && (
            <SelectItem value="empty" disabled>
              No countries available
            </SelectItem>
          )}
          
          {!loading && !fetchError && countries.map((country) => (
            <SelectItem key={country.value} value={country.value}>
              {country.data}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {/* Hidden input for react-hook-form registration */}
      <input type="hidden" {...register} value={selectedValue} />

      {error && (
        <p className="mt-1 text-xs text-red-600">{error.message}</p>
      )}
      
      {fetchError && !error && (
        <p className="mt-1 text-xs text-amber-600">{fetchError}</p>
      )}
    </div>
  );
};