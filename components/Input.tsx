import React from "react";

type InputProps = React.InputHTMLAttributes<HTMLInputElement> & {
  label?: string;
  error?: string;
};

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, className = "", id, ...props }, ref) => {
    const defaultId = React.useId();
    const inputId = id || defaultId;

    return (
      <div className="w-full flex flex-col gap-1.5">
        {label && (
          <label htmlFor={inputId} className="text-sm font-medium text-slate-700">
            {label}
          </label>
        )}
        <input
          id={inputId}
          ref={ref}
          className={`w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-text-main placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-brand focus:border-transparent transition-shadow disabled:bg-slate-50 disabled:opacity-50 ${
            error ? "border-red-500 focus:ring-red-500" : ""
          } ${className}`}
          {...props}
        />
        {error && <span className="text-xs text-red-500">{error}</span>}
      </div>
    );
  }
);

Input.displayName = "Input";
