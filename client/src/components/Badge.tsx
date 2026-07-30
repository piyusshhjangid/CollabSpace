import React from "react";

interface BadgeProps {
  color: "green" | "blue" | "yellow" | "red";
  children?: React.ReactNode;
}

export const Badge: React.FC<BadgeProps> = ({ color, children }) => {
  const colorStyles = {
    green: "bg-green-100 text-green-800 border-green-200",
    blue: "bg-blue-100 text-blue-800 border-blue-200",
    yellow: "bg-yellow-100 text-yellow-800 border-yellow-200",
    red: "bg-red-100 text-red-800 border-red-200",
  };

  const dotStyles = {
    green: "bg-green-500",
    blue: "bg-blue-500",
    yellow: "bg-yellow-500",
    red: "bg-red-500",
  };

  return (
    <span
      className={`flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs font-medium ${colorStyles[color]}`}
    >
      <span className={`w-2.5 h-2.5 rounded-full ${dotStyles[color]}`} />
      {children}
    </span>
  );
};

export default Badge;
