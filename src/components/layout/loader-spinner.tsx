interface SpinnerProps {
    className?: string;
    size?: "sm" | "md" | "lg";
}

export function LoaderSpinner({ className = "", size = "md" }: SpinnerProps) {
    const sizeClasses = {
        sm: "w-4 h-4",
        md: "w-8 h-8",
        lg: "w-12 h-12",
    };

    return (
        <div className={`flex items-center justify-center ${className}`}>
            <div className={`animate-spin rounded-full border-4 border-primary/30 border-t-primary ${sizeClasses[size]}`} />
        </div>
    );
}
