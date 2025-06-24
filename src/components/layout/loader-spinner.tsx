interface SpinnerProps {
    className?: string;
    size?: "xs" | "sm" | "md" | "lg" | "xl";
}

export function LoaderSpinner({ className = "", size = "md" }: SpinnerProps) {
    const sizeClasses = {
        xs: "w-4 h-4",
        sm: "w-6 h-6",
        md: "w-10 h-10",
        lg: "w-14 h-14",
        xl: "w-20 h-20",
    };

    return (
        <div className={`flex items-center justify-center ${className}`}>
            <div className={`animate-spin rounded-full border-4 border-primary/30 border-t-primary ${sizeClasses[size]}`} />
        </div>
    );
}