import React from "react"

interface BadgeProps {
  color: 'green'|'blue'|'yellow'|'red'
  children?: React.ReactNode
}

export const Badge: React.FC<BadgeProps> = ({ color, children }) => {
  const colorStyles = {
    green: 'bg-green-100 text-green-800 border-green-200',
    blue: 'bg-blue-100 text-blue-800 border-blue-200',
    yellow: 'bg-yellow-100 text-yellow-800 border-yellow-200',
    red: 'bg-red-100 text-red-800 border-red-200'
  }

  return (
    <span className={`rounded-full px-2 py-0.5 text-xs text-shadow-gray-800 items-center flex flex-row gap-1 border-2 ${colorStyles[color]}`}>
      <div className={`${colorStyles[color]} border-6 rounded-full w-3 h-3`}></div>
      {children}
    </span>
  )
}

export default Badge
