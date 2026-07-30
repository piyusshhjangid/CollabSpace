import {  ArrowUp} from "lucide-react";
import React from "react";

interface StatCardProps {
  icon: React.ElementType;
  title: string;
  value: string | number;
  subtitle?: string;
  color?: string;
  bgColor?: string;
}

const StatCard: React.FC<StatCardProps> = ({
  icon: Icon,
  title,
  value,
  subtitle,
  color = "text-violet-600",
  bgColor = "bg-violet-100",
}) => {
  return (
    <div className="rounded-3xl border border-zinc-200 bg-white px-8 py-6 shadow-sm hover:shadow-lg transition-all duration-300 hover:-translate-y-1">
      <div className="flex items-start flex-col gap-3.5">
        <div
          className={`flex h-14.5 w-14.5 items-center justify-center rounded-3xl ${bgColor}`}
        >
          <Icon className={color} size={35} />
        </div>
        <h3 className="text-xl font-medium text-zinc-700">{title}</h3>
      </div>

      <div className="mt-2">
        <p className="text-3xl font-bold text-zinc-900">{value}</p>
        {subtitle && (
          <p className={`mt-4 gap-3 flex flex-row items-center text-sm ${color}`}>
            {subtitle}
            <ArrowUp className={`${color} w-4 h-4`} />
          </p>
        )}
      </div>
    </div>
  );
};
export default StatCard;
