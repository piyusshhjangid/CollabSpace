import React from "react";

interface ButtonProps {
  variant: "primary" | "secondary" | "danger";
  children: React.ReactNode;
  disabled?: boolean;
  onClick?: React.MouseEventHandler<HTMLButtonElement>;
}

export const Button: React.FC<ButtonProps> = ({
  variant,
  children,
  onClick,
  disabled = false,
}) => {
  const baseStyle =
    "px-6 py-2 rounded-md font-medium transition-colors duration-200 flex items-center gap-2";

  const variantStyle = {
    primary: "bg-purple-600 text-white hover:bg-purple-700 disabled:bg-purple-300",
    secondary:
      "bg-gray-100 text-blue-600 hover:bg-gray-200 border border-blue-400 disabled:bg-gray-200 disabled:text-gray-400",
    danger: "bg-red-500 text-white hover:bg-red-600 disabled:bg-red-300",
  };

  return (
    <button
      className={`${baseStyle} ${variantStyle[variant]}`}
      onClick={onClick}
      disabled={disabled}
    >
      {children}
    </button>
  );
};
