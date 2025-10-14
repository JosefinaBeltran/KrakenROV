"use client"

import { useEffect } from "react"

interface VideoControlsProps {
  onPlayPause: () => void
  onSeek: (direction: 'forward' | 'backward') => void
  onVolumeChange: (direction: 'up' | 'down') => void
  onToggleMute: () => void
  onToggleFullscreen: () => void
  onToggleFullscreenExit: () => void
}

export function VideoControls({
  onPlayPause,
  onSeek,
  onVolumeChange,
  onToggleMute,
  onToggleFullscreen,
  onToggleFullscreenExit
}: VideoControlsProps) {
  useEffect(() => {
    const handleKeyPress = (event: KeyboardEvent) => {
      // Prevent default behavior for these keys
      if ([' ', 'ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'f', 'F', 'm', 'M'].includes(event.key)) {
        event.preventDefault()
      }

      switch (event.key) {
        case ' ':
          // Spacebar - Play/Pause
          onPlayPause()
          break
        case 'ArrowLeft':
          // Left arrow - Seek backward 10 seconds
          onSeek('backward')
          break
        case 'ArrowRight':
          // Right arrow - Seek forward 10 seconds
          onSeek('forward')
          break
        case 'ArrowUp':
          // Up arrow - Volume up
          onVolumeChange('up')
          break
        case 'ArrowDown':
          // Down arrow - Volume down
          onVolumeChange('down')
          break
        case 'f':
        case 'F':
          // F key - Toggle fullscreen
          onToggleFullscreen()
          break
        case 'm':
        case 'M':
          // M key - Toggle mute
          onToggleMute()
          break
        case 'Escape':
          // Escape - Exit fullscreen
          onToggleFullscreenExit()
          break
      }
    }

    document.addEventListener('keydown', handleKeyPress)
    return () => document.removeEventListener('keydown', handleKeyPress)
  }, [onPlayPause, onSeek, onVolumeChange, onToggleMute, onToggleFullscreen, onToggleFullscreenExit])

  return null // This component doesn't render anything
}
