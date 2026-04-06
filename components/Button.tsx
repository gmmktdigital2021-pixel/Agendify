import React from "react";

type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "secondary" | "danger" | "ghost";
  fullWidth?: boolean;
};

export function Button({ variant = "primary", fullWidth, className = "", children, ...props }: ButtonProps) {
  const baseStyles = "inline-flex items-center justify-center font-medium transition-colors rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand focus:ring-offset-1 disabled:opacity-50 disabled:cursor-not-allowed";
  
  const variants = {
    primary: "bg-brand text-white hover:bg-purple-700 border border-transparent",
    secondary: "bg-white text-text-main hover:bg-slate-50 border border-slate-200",
    danger: "bg-status-cancelado text-white hover:bg-red-600 border border-transparent",
    ghost: "bg-transparent text-slate-600 hover:text-text-main hover:bg-slate-100 border border-transparent",
  };

  const safeVariant = variant === 'primary' ? variants.primary 
                    : variant === 'secondary' ? variants.secondary 
                    : variant === 'danger' ? variants.danger 
                    : variant === 'ghost' ? variants.ghost 
                    : variants.primary;

  return (
    <button
      className={`${baseStyles} ${safeVariant} ${fullWidth ? "w-full" : ""} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}
