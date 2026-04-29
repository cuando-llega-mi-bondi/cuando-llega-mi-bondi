import { Combobox } from "@/components/Combobox";

interface StepFieldProps {
    labelId: string;
    stepText: string;
    value: string;
    onChange: (value: string) => void;
    options: { value: string; label: string }[];
    placeholder: string;
    loading?: boolean;
    disabled?: boolean;
    className?: string;
    /** Passed to Combobox; default true */
    autoSelectSingleFilterMatch?: boolean;
}

export function StepField({
    labelId,
    stepText,
    value,
    onChange,
    options,
    placeholder,
    loading,
    disabled,
    className,
    autoSelectSingleFilterMatch,
}: StepFieldProps) {
    return (
        <div className={className}>
            <label
                id={labelId}
                className="mb-1.5 block font-mono text-[10px] tracking-[1.4px] text-muted-foreground"
            >
                {stepText}
            </label>
            <Combobox
                aria-labelledby={labelId}
                placeholder={placeholder}
                value={value}
                onChange={onChange}
                options={options}
                loading={loading}
                disabled={disabled}
                autoSelectSingleFilterMatch={autoSelectSingleFilterMatch}
            />
        </div>
    );
}
