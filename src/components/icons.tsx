import type { ReactNode } from 'react'

type IconProps = {
  size?: number
  strokeWidth?: number
}

function Icon({ children, size = 20, strokeWidth = 1.8 }: IconProps & { children: ReactNode }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <g stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round">
        {children}
      </g>
    </svg>
  )
}

export function SparklesIcon(props: IconProps) {
  return <Icon {...props}><path d="m12 3-1 4-4 1 4 1 1 4 1-4 4-1-4-1-1-4Z" /><path d="m5 13-.6 2.4L2 16l2.4.6L5 19l.6-2.4L8 16l-2.4-.6L5 13Z" /><path d="m19 15-.5 1.8L17 17.5l1.5.7L19 20l.5-1.8 1.5-.7-1.5-.7L19 15Z" /></Icon>
}

export function SearchIcon(props: IconProps) {
  return <Icon {...props}><circle cx="10.8" cy="10.8" r="6.2" /><path d="m16 16 4.2 4.2" /></Icon>
}

export function PlusIcon(props: IconProps) {
  return <Icon {...props}><path d="M12 5v14M5 12h14" /></Icon>
}

export function HeartIcon({ filled = false, ...props }: IconProps & { filled?: boolean }) {
  return <Icon {...props}><path fill={filled ? 'currentColor' : 'none'} d="M20.8 8.8c0 5.2-8.8 10-8.8 10s-8.8-4.8-8.8-10A4.8 4.8 0 0 1 12 6.4a4.8 4.8 0 0 1 8.8 2.4Z" /></Icon>
}

export function SettingsIcon(props: IconProps) {
  return <Icon {...props}><circle cx="12" cy="12" r="3" /><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.9l.1.1-1.8 1.8-.1-.1a1.7 1.7 0 0 0-1.9-.3 1.7 1.7 0 0 0-1 1.5v.2h-2.6v-.2a1.7 1.7 0 0 0-1-1.5 1.7 1.7 0 0 0-1.9.3l-.1.1-1.8-1.8.1-.1a1.7 1.7 0 0 0 .3-1.9 1.7 1.7 0 0 0-1.5-1H6v-2.6h.2a1.7 1.7 0 0 0 1.5-1 1.7 1.7 0 0 0-.3-1.9l-.1-.1 1.8-1.8.1.1a1.7 1.7 0 0 0 1.9.3 1.7 1.7 0 0 0 1-1.5V5h2.6v.2a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.9-.3l.1-.1 1.8 1.8-.1.1a1.7 1.7 0 0 0-.3 1.9 1.7 1.7 0 0 0 1.5 1h.2v2.6h-.2a1.7 1.7 0 0 0-1.5 1Z" /></Icon>
}

export function DownloadIcon(props: IconProps) {
  return <Icon {...props}><path d="M12 4v11" /><path d="m7.5 11.5 4.5 4.5 4.5-4.5" /><path d="M5 20h14" /></Icon>
}

export function UploadIcon(props: IconProps) {
  return <Icon {...props}><path d="M12 20V9" /><path d="m7.5 12.5 4.5-4.5 4.5 4.5" /><path d="M5 4h14" /></Icon>
}

export function ArrowLeftIcon(props: IconProps) {
  return <Icon {...props}><path d="m14.5 5-7 7 7 7" /><path d="M8 12h13" /></Icon>
}

export function TrashIcon(props: IconProps) {
  return <Icon {...props}><path d="M4 7h16" /><path d="M9 7V4h6v3M7 7l.8 13h8.4L17 7M10 11v5M14 11v5" /></Icon>
}

export function CheckIcon(props: IconProps) {
  return <Icon {...props}><path d="m5 12 4.5 4.5L19 7" /></Icon>
}

export function LinkIcon(props: IconProps) {
  return <Icon {...props}><path d="M10 13.8 14 9.7" /><path d="m7.2 16.6-1.1 1.1a3.2 3.2 0 0 1-4.5-4.5l3.7-3.7a3.2 3.2 0 0 1 4.5 0" /><path d="m16.8 7.4 1.1-1.1a3.2 3.2 0 0 1 4.5 4.5l-3.7 3.7a3.2 3.2 0 0 1-4.5 0" /></Icon>
}
