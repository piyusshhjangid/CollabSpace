import React from "react";
import { Link } from "react-router-dom";

interface LogoProps {
  size?: "sm" | "md" | "lg";
  showText?: boolean;
  showSubtitle?: boolean;
  subtitle?: string;
  asLink?: boolean;
  to?: string;
  className?: string;
}

export const LogoIcon: React.FC<{ size?: "sm" | "md" | "lg"; className?: string }> = ({
  size = "md",
  className = "",
}) => {
  const containerSizes = {
    sm: "h-8 w-8 rounded-[10px]",
    md: "h-10 w-10 rounded-[13px]",
    lg: "h-12 w-12 rounded-[15px]",
  };

  const iconSizes = {
    sm: 18,
    md: 22,
    lg: 26,
  };

  return (
    <div
      className={`relative flex shrink-0 items-center justify-center overflow-hidden bg-gradient-to-br from-violet-600 via-purple-600 to-indigo-700 text-white shadow-md shadow-violet-500/25 ring-1 ring-white/20 transition-all duration-300 ease-out group-hover:scale-105 group-hover:shadow-lg group-hover:shadow-violet-500/35 ${containerSizes[size]} ${className}`}
    >
      {/* Smooth glass sheen highlight */}
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-tr from-transparent via-white/20 to-transparent" />

      {/* Layered smooth vector mark */}
      <svg
        width={iconSizes[size]}
        height={iconSizes[size]}
        viewBox="0 0 24 24"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="relative z-10 transition-transform duration-300 ease-out group-hover:rotate-[-2deg]"
      >
        <defs>
          <linearGradient id="cs-mark-primary" x1="4" y1="4" x2="20" y2="20" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#FFFFFF" />
            <stop offset="100%" stopColor="#EDE9FE" stopOpacity="0.9" />
          </linearGradient>
          <linearGradient id="cs-mark-secondary" x1="7" y1="3" x2="20" y2="16" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#C4B5FD" />
            <stop offset="100%" stopColor="#818CF8" />
          </linearGradient>
        </defs>

        {/* Back dimensional plane */}
        <rect
          x="7.5"
          y="3.5"
          width="12.5"
          height="12.5"
          rx="3.5"
          fill="url(#cs-mark-secondary)"
          fillOpacity="0.4"
          stroke="#FFFFFF"
          strokeOpacity="0.35"
          strokeWidth="1.2"
        />

        {/* Front collaboration plane */}
        <rect
          x="4"
          y="7.5"
          width="12.5"
          height="12.5"
          rx="3.5"
          fill="url(#cs-mark-primary)"
          stroke="#FFFFFF"
          strokeWidth="1.2"
          className="drop-shadow-sm"
        />

        {/* Sync control node */}
        <circle cx="10.25" cy="13.75" r="2.2" fill="#7C3AED" />
        <path
          d="M10.25 10.25V13.75M10.25 13.75H13.75"
          stroke="#7C3AED"
          strokeWidth="1.4"
          strokeLinecap="round"
        />
      </svg>
    </div>
  );
};

export const Logo: React.FC<LogoProps> = ({
  size = "md",
  showText = true,
  showSubtitle = true,
  subtitle = "Control Plane",
  asLink = false,
  to = "/",
  className = "",
}) => {
  const textSizes = {
    sm: "text-[14px]",
    md: "text-[15.5px]",
    lg: "text-2xl",
  };

  const content = (
    <div className={`group flex items-center gap-3 transition-all duration-200 ${className}`}>
      <LogoIcon size={size} />
      {showText && (
        <div className="min-w-0">
          <span
            className={`block font-bold tracking-tight text-slate-900 transition-colors group-hover:text-violet-950 ${textSizes[size]}`}
          >
            CollabSpace
          </span>
          {showSubtitle && subtitle && (
            <span className="block text-[10px] font-semibold tracking-wider uppercase text-violet-600/90 transition-colors">
              {subtitle}
            </span>
          )}
        </div>
      )}
    </div>
  );

  if (asLink) {
    return (
      <Link
        to={to}
        className="inline-flex items-center rounded-2xl p-1.5 transition-all duration-200 hover:bg-slate-50/80 active:scale-[0.98]"
        aria-label="CollabSpace home"
      >
        {content}
      </Link>
    );
  }

  return content;
};

export default Logo;
