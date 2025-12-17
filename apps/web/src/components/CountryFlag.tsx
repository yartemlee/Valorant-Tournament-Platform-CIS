interface CountryFlagProps {
    code?: string;
    size?: number;
    className?: string;
}

export function CountryFlag({ code, size = 20, className = "" }: CountryFlagProps) {
    if (!code) return null;

    const normalized = code.toLowerCase();

    return (
        <span
            className={`fi fi-${normalized} ${className}`}
            style={{ width: size, height: size, borderRadius: 4 }}
        ></span>
    );
}