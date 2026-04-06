import React from "react";

type CardProps = React.HTMLAttributes<HTMLDivElement>;

export function Card({ className = "", children, ...props }: CardProps) {
  return (
    <div
      className={`bg-white rounded-xl border border-slate-100 shadow-sm ${className}`}
      {...props}
    >
      {children}
    </div>
  );
}
