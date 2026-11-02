import { ArrowRight, type LucideIcon } from "lucide-react";
import React from "react";
import { Link } from "react-router-dom";

interface StatCardProps {
  icon: LucideIcon;
  title: string;
  value: string | number;
  subtitle?: string;
  color?: string;
  bgColor?: string;
  to: string;
}

const StatCard: React.FC<StatCardProps> = ({
  icon: Icon,
  title,
  value,
  subtitle,
  color = "text-violet-600",
  bgColor = "bg-violet-100",
  to,
}) => {
  return (
    <Link
      to={to}
      className="group relative block min-h-52 rounded-3xl border border-zinc-200 bg-white px-7 py-6 shadow-sm transition duration-200 hover:-translate-y-1 hover:border-violet-200 hover:shadow-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500 focus-visible:ring-offset-2"
      aria-label={`${title}: ${value}. ${subtitle ?? ""} Open ${title.toLowerCase()}.`}
    >
      <div className="flex items-center justify-between">
        <div className={`flex h-14 w-14 items-center justify-center rounded-2xl ${bgColor}`}>
          <Icon className={color} size={28} strokeWidth={2.1} />
        </div>
        <span className="flex h-9 w-9 items-center justify-center rounded-full text-zinc-400 transition group-hover:bg-violet-50 group-hover:text-violet-700">
          <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
        </span>
      </div>

      <div className="mt-5">
        <p className="text-sm font-medium text-zinc-500">{title}</p>
        <p className="mt-1 text-3xl font-bold tracking-tight text-zinc-900">{value}</p>
        <p className="mt-2 text-sm text-zinc-500">{subtitle}</p>
      </div>
    </Link>
  );
};
export default StatCard;
