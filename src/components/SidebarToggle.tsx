'use client'

interface SidebarToggleProps {
  onToggle: () => void
  className?: string
}

const SidebarToggle = ({ onToggle, className = '' }: SidebarToggleProps) => {
  return (
    <button
      onClick={onToggle}
      className={`w-8 h-8 bg-gray-100 hover:bg-gray-200 rounded-lg flex items-center justify-center transition-all duration-200 hover:scale-105 active:scale-95 ${className}`}
      title="فتح/إغلاق الشريط الجانبي (Ctrl+B)"
    >
      <span className="text-gray-600 text-sm">☰</span>
    </button>
  )
}

export default SidebarToggle