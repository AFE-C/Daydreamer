import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from 'react'

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>
  userChoice: Promise<{
    outcome: 'accepted' | 'dismissed'
    platform: string
  }>
}

type StandaloneNavigator = Navigator & {
  standalone?: boolean
}

function isStandaloneMode() {
  if (typeof window === 'undefined') return false

  return (
    window.matchMedia('(display-mode: standalone)').matches ||
    Boolean((window.navigator as StandaloneNavigator).standalone)
  )
}

function isIosDevice() {
  if (typeof navigator === 'undefined') return false

  const userAgent = navigator.userAgent.toLowerCase()
  const isAppleTouchDevice = navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1

  return /iphone|ipad|ipod/.test(userAgent) || isAppleTouchDevice
}

export function useOnlineStatus() {
  const [isOnline, setIsOnline] = useState(() => {
    if (typeof navigator === 'undefined') return true
    return navigator.onLine
  })

  useEffect(() => {
    const handleOnline = () => setIsOnline(true)
    const handleOffline = () => setIsOnline(false)

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [])

  return isOnline
}

type PwaInstallContextValue = {
  canInstall: boolean
  isInstalled: boolean
  isIos: boolean
  promptInstall: () => Promise<boolean>
}

const PwaInstallContext = createContext<PwaInstallContextValue | null>(null)

function usePwaInstallState(): PwaInstallContextValue {
  const [installEvent, setInstallEvent] = useState<BeforeInstallPromptEvent | null>(null)
  const [isInstalled, setIsInstalled] = useState(isStandaloneMode)
  const [isIos] = useState(isIosDevice)

  useEffect(() => {
    const handleBeforeInstallPrompt = (event: Event) => {
      event.preventDefault()
      setInstallEvent(event as BeforeInstallPromptEvent)
    }
    const handleAppInstalled = () => {
      setInstallEvent(null)
      setIsInstalled(true)
    }

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
    window.addEventListener('appinstalled', handleAppInstalled)

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
      window.removeEventListener('appinstalled', handleAppInstalled)
    }
  }, [])

  const promptInstall = useCallback(async () => {
    if (!installEvent) return false

    const currentEvent = installEvent
    await currentEvent.prompt()
    const choice = await currentEvent.userChoice
    setInstallEvent(null)

    if (choice.outcome === 'accepted') {
      setIsInstalled(true)
      return true
    }

    return false
  }, [installEvent])

  return {
    canInstall: Boolean(installEvent),
    isInstalled,
    isIos,
    promptInstall,
  }
}

export function PwaInstallProvider({ children }: { children: ReactNode }) {
  const value = usePwaInstallState()

  return <PwaInstallContext.Provider value={value}>{children}</PwaInstallContext.Provider>
}

export function usePwaInstall() {
  const context = useContext(PwaInstallContext)

  if (!context) {
    throw new Error('usePwaInstall must be used within PwaInstallProvider')
  }

  return context
}
