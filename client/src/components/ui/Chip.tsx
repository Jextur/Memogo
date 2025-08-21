import { cn } from "@/lib/utils";

interface ChipProps {
  children: React.ReactNode;
  variant?: "default" | "secondary" | "outline" | "muted";
  size?: "sm" | "md";
  className?: string;
}

export function Chip({ 
  children, 
  variant = "default", 
  size = "sm",
  className 
}: ChipProps) {
  const baseStyles = "inline-flex items-center rounded-full font-medium transition-colors";
  
  const sizeStyles = {
    sm: "text-xs px-2 py-0.5",
    md: "text-sm px-3 py-1"
  };
  
  const variantStyles = {
    default: "bg-purple-100 text-purple-700 border-0",
    secondary: "bg-gray-100 text-gray-700 border-0",
    outline: "border border-gray-300 text-gray-600 bg-transparent",
    muted: "bg-gray-50 text-gray-500 border border-gray-200"
  };
  
  return (
    <span 
      className={cn(
        baseStyles,
        sizeStyles[size],
        variantStyles[variant],
        className
      )}
    >
      {children}
    </span>
  );
}