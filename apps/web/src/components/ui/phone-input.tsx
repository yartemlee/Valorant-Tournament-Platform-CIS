import { useState, useEffect, useMemo, useCallback } from "react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { getSortedCountries, getCountryByCode, getCountryFlag } from "@/lib/countries";

interface PhoneInputProps {
    value: string; // Full phone number with country code, e.g., "+79991234567"
    onChange: (value: string) => void;
    defaultCountryCode?: string; // Country code, e.g., "RU"
}

export function PhoneInput({ value, onChange, defaultCountryCode = "RU" }: PhoneInputProps) {
    const sortedCountries = useMemo(() => getSortedCountries(), []);

    // Parse existing value
    const parsePhoneNumber = useCallback((phoneNumber: string) => {
        if (!phoneNumber) return { countryCode: defaultCountryCode, number: "" };

        // Find matching country by phone code
        for (const country of sortedCountries) {
            if (phoneNumber.startsWith(country.phoneCode)) {
                return {
                    countryCode: country.code,
                    number: phoneNumber.substring(country.phoneCode.length),
                };
            }
        }

        return { countryCode: defaultCountryCode, number: phoneNumber };
    }, [defaultCountryCode, sortedCountries]);

    const { countryCode: initialCountryCode, number: initialNumber } = parsePhoneNumber(value);
    const [selectedCountryCode, setSelectedCountryCode] = useState(initialCountryCode);
    const [phoneNumber, setPhoneNumber] = useState(initialNumber);

    // Update when value prop changes
    useEffect(() => {
        const { countryCode, number } = parsePhoneNumber(value);
        setSelectedCountryCode(countryCode);
        setPhoneNumber(number);
    }, [value, parsePhoneNumber]);

    const handleCountryChange = (newCountryCode: string) => {
        setSelectedCountryCode(newCountryCode);
        const country = getCountryByCode(newCountryCode);
        if (country) {
            // Clear the number when changing country
            setPhoneNumber("");
            onChange(country.phoneCode);
        }
    };

    const handleNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const inputValue = e.target.value;
        // Only allow digits
        const digitsOnly = inputValue.replace(/\\D/g, "");

        const country = getCountryByCode(selectedCountryCode);
        if (!country) return;

        // Limit to expected phone length
        const limitedNumber = digitsOnly.slice(0, country.phoneLength);
        setPhoneNumber(limitedNumber);

        // Combine country code and number
        const fullNumber = limitedNumber ? `${country.phoneCode}${limitedNumber}` : "";
        onChange(fullNumber);
    };

    const selectedCountry = getCountryByCode(selectedCountryCode);

    return (
        <div className="space-y-2">
            <Label htmlFor="phone">Телефон</Label>
            <div className="flex gap-2">
                {/* Country Code Selector */}
                <Select value={selectedCountryCode} onValueChange={handleCountryChange}>
                    <SelectTrigger className="w-[200px]">
                        <SelectValue>
                            {selectedCountry && (
                                <div className="flex items-center gap-2">
                                    <span>{getCountryFlag(selectedCountry.code)}</span>
                                    <span>{selectedCountry.phoneCode}</span>
                                </div>
                            )}
                        </SelectValue>
                    </SelectTrigger>
                    <SelectContent className="max-h-[300px]">
                        {sortedCountries.map((country) => (
                            <SelectItem key={country.code} value={country.code}>
                                <div className="flex items-center gap-2">
                                    <span>{getCountryFlag(country.code)}</span>
                                    <span className="font-medium">{country.nameRu}</span>
                                    <span className="text-muted-foreground">{country.phoneCode}</span>
                                </div>
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>

                {/* Phone Number Input */}
                <div className="flex-1 relative">
                    <Input
                        id="phone"
                        type="tel"
                        value={phoneNumber}
                        onChange={handleNumberChange}
                        placeholder={`${"9".repeat(selectedCountry?.phoneLength || 10)}`}
                        className="font-mono"
                    />
                    {selectedCountry && phoneNumber && (
                        <div className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">
                            {phoneNumber.length}/{selectedCountry.phoneLength}
                        </div>
                    )}
                </div>
            </div>
            {selectedCountry && (
                <p className="text-xs text-muted-foreground">
                    Введите {selectedCountry.phoneLength} цифр номера телефона
                </p>
            )}
        </div>
    );
}
