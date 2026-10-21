import React from "react";

interface ButtonProps {
  variant: "primary" | "secondary" | "danger";
  children: React.ReactNode;
  disabled?: boolean;
  onClick?: React.MouseEventHandler<HTMLButtonElement>;
  type?: "button" | "submit" | "reset";
}

export const Button: React.FC<ButtonProps> = ({
  variant,
  children,
  onClick,
  disabled = false,
  type = "button",
}) => {
  const baseStyle =
    "inline-flex items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-xs font-semibold transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-300 disabled:cursor-not-allowed";

  const variantStyle = {
    primary: "bg-violet-600 text-white shadow-sm hover:bg-violet-700 disabled:bg-violet-300",
    secondary:
      "border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 disabled:bg-slate-100 disabled:text-slate-400",
    danger: "bg-rose-600 text-white hover:bg-rose-700 disabled:bg-rose-300",
  };

  return (
    <button
      className={`${baseStyle} ${variantStyle[variant]}`}
      type={type}
      onClick={onClick}
      disabled={disabled}
    >
      {children}
    </button>
  );
};
