import type { ReactNode } from 'react'

interface IconProps {
  size?: number
  className?: string
}

// lucide 아이콘들 (currentColor 기반)
function base(size: number, className: string | undefined, children: ReactNode) {
  return (
    <svg
      className={className}
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {children}
    </svg>
  )
}

export function Heart({
  size = 13,
  className,
  filled = true,
}: IconProps & { filled?: boolean }) {
  // filled=true면 색칠, false면 외곽선(빈 하트)
  return (
    <svg
      className={className}
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill={filled ? 'currentColor' : 'none'}
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z" />
    </svg>
  )
}

export function Search({ size = 18, className }: IconProps) {
  return base(size, className, (
    <>
      <circle cx="11" cy="11" r="8" />
      <path d="m21 21-4.3-4.3" />
    </>
  ))
}

export function SortIcon({ size = 16, className }: IconProps) {
  return base(size, className, (
    <>
      <path d="m21 16-4 4-4-4" />
      <path d="M17 20V4" />
      <path d="m3 8 4-4 4 4" />
      <path d="M7 4v16" />
    </>
  ))
}

export function ChevronLeft({ size = 18, className }: IconProps) {
  return base(size, className, <path d="m15 18-6-6 6-6" />)
}

export function ChevronRight({ size = 18, className }: IconProps) {
  return base(size, className, <path d="m9 18 6-6-6-6" />)
}

export function Menu({ size = 24, className }: IconProps) {
  return base(size, className, (
    <>
      <path d="M4 6h16" />
      <path d="M4 12h16" />
      <path d="M4 18h16" />
    </>
  ))
}

export function Square({ size = 16, className }: IconProps) {
  return base(size, className, (
    <rect width="18" height="18" x="3" y="3" rx="2" />
  ))
}

export function LayoutGrid({ size = 16, className }: IconProps) {
  return base(size, className, (
    <>
      <rect width="7" height="7" x="3" y="3" rx="1" />
      <rect width="7" height="7" x="14" y="3" rx="1" />
      <rect width="7" height="7" x="14" y="14" rx="1" />
      <rect width="7" height="7" x="3" y="14" rx="1" />
    </>
  ))
}

export function Loader({ size = 16, className }: IconProps) {
  return base(size, className, <path d="M21 12a9 9 0 1 1-6.219-8.56" />)
}

export function ArrowLeft({ size = 18, className }: IconProps) {
  return base(size, className, (
    <>
      <path d="M19 12H5" />
      <path d="m12 19-7-7 7-7" />
    </>
  ))
}

export function Book({ size = 16, className }: IconProps) {
  return base(size, className, (
    <path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1 0-5H20" />
  ))
}

export function Bookmark({ size = 18, className }: IconProps) {
  return base(
    size,
    className,
    <path d="m19 21-7-4-7 4V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />,
  )
}

export function Share({ size = 18, className }: IconProps) {
  return base(size, className, (
    <>
      <circle cx="18" cy="5" r="3" />
      <circle cx="6" cy="12" r="3" />
      <circle cx="18" cy="19" r="3" />
      <line x1="8.59" x2="15.42" y1="13.51" y2="17.49" />
      <line x1="15.41" x2="8.59" y1="6.51" y2="10.49" />
    </>
  ))
}

export function PenLine({ size = 20, className }: IconProps) {
  return base(size, className, (
    <>
      <path d="M12 20h9" />
      <path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z" />
    </>
  ))
}

export function Check({ size = 16, className }: IconProps) {
  return base(size, className, <path d="M20 6 9 17l-5-5" />)
}

export function Trash({ size = 16, className }: IconProps) {
  return base(size, className, (
    <>
      <path d="M3 6h18" />
      <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
      <line x1="10" x2="10" y1="11" y2="17" />
      <line x1="14" x2="14" y1="11" y2="17" />
    </>
  ))
}

export function Plus({ size = 16, className }: IconProps) {
  return base(size, className, (
    <>
      <path d="M5 12h14" />
      <path d="M12 5v14" />
    </>
  ))
}

export function X({ size = 16, className }: IconProps) {
  return base(size, className, (
    <>
      <path d="M18 6 6 18" />
      <path d="M6 6l12 12" />
    </>
  ))
}

export function Bold({ size = 16, className }: IconProps) {
  return base(size, className, (
    <>
      <path d="M6 12h8a4 4 0 0 0 0-8H6v8Z" />
      <path d="M6 12h9a4 4 0 0 1 0 8H6v-8Z" />
    </>
  ))
}

export function Italic({ size = 16, className }: IconProps) {
  return base(size, className, (
    <>
      <path d="M19 4h-9" />
      <path d="M14 20H5" />
      <path d="M15 4 9 20" />
    </>
  ))
}

export function AlignLeft({ size = 16, className }: IconProps) {
  return base(size, className, (
    <>
      <path d="M15 12H3" />
      <path d="M17 6H3" />
      <path d="M21 18H3" />
    </>
  ))
}

export function AlignCenter({ size = 16, className }: IconProps) {
  return base(size, className, (
    <>
      <path d="M17 12H7" />
      <path d="M19 6H5" />
      <path d="M21 18H3" />
    </>
  ))
}

export function AlignRight({ size = 16, className }: IconProps) {
  return base(size, className, (
    <>
      <path d="M21 12H9" />
      <path d="M21 6H7" />
      <path d="M21 18H3" />
    </>
  ))
}

export function Image({ size = 16, className }: IconProps) {
  return base(size, className, (
    <>
      <rect width="18" height="18" x="3" y="3" rx="2" ry="2" />
      <circle cx="9" cy="9" r="2" />
      <path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21" />
    </>
  ))
}
