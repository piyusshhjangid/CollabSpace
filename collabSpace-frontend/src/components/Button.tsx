import React from "react";

interface ButtonProps {
  variant: "primary" | "secondary" | "danger";
  children: React.ReactNode;
  disabled: boolean;
  onClick: () => void;
}

export const Button: React.FC<ButtonProps> = ({
  variant,
  children,
  onClick,
  disabled = false,
}) => {
  const baseStyle =
    "px-6 py-2 rounded-md font-medium transition-colors duration-200";
  const variantStyle = {
    primary: 'bg-purple-600 text-white hover:bg-purple-700',
    secondary: 'bg-gray-100 text-blue-500 hover:bg-gray-200 border-1 border-bluw-400',
    danger: 'bg-red-500 text-white hover:bg-red-600',
  };

  return (
    <div>
      <button
        className={`${baseStyle} ${variantStyle[variant]}`}
        onClick={onClick}
        disabled={disabled}
      >
        {children}
      </button>
    </div>
  );
};
