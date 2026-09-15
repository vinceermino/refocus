'use client'

import { useCallback, useRef } from 'react'

/**
 * Hook that generates alarm tones using the Web Audio API.
 * No external audio files needed — synthesizes a pleasant chime pattern.
 */
export function useAlarm() {
  const audioContextRef = useRef<AudioContext | null>(null)
  const timeoutsRef = useRef<number[]>([])
  const isPlayingRef = useRef(false)

  const getAudioContext = useCallback(() => {
    if (!audioContextRef.current || audioContextRef.current.state === 'closed') {
      audioContextRef.current = new AudioContext()
    }
    return audioContextRef.current
  }, [])

  const playTone = useCallback((ctx: AudioContext, frequency: number, startTime: number, duration: number) => {
    const oscillator = ctx.createOscillator()
    const gainNode = ctx.createGain()

    oscillator.connect(gainNode)
    gainNode.connect(ctx.destination)

    oscillator.type = 'sine'
    oscillator.frequency.setValueAtTime(frequency, startTime)

    // Envelope: fade in, sustain, fade out
    gainNode.gain.setValueAtTime(0, startTime)
    gainNode.gain.linearRampToValueAtTime(0.3, startTime + 0.05)
    gainNode.gain.setValueAtTime(0.3, startTime + duration - 0.1)
    gainNode.gain.linearRampToValueAtTime(0, startTime + duration)

    oscillator.start(startTime)
    oscillator.stop(startTime + duration)
  }, [])

  const playChimePattern = useCallback((ctx: AudioContext) => {
    const now = ctx.currentTime
    // Ascending chime: C5 → E5 → G5 → C6
    const notes = [523.25, 659.25, 783.99, 1046.50]
    notes.forEach((freq, i) => {
      playTone(ctx, freq, now + i * 0.15, 0.3)
    })
  }, [playTone])

  const playAlarm = useCallback(() => {
    if (isPlayingRef.current) return
    isPlayingRef.current = true

    const ctx = getAudioContext()
    if (ctx.state === 'suspended') {
      ctx.resume()
    }

    // Play the chime pattern 3 times with gaps
    for (let repeat = 0; repeat < 3; repeat++) {
      const delay = repeat * 1200 // 1.2 seconds between repeats
      const timeoutId = window.setTimeout(() => {
        if (isPlayingRef.current) {
          playChimePattern(ctx)
        }
      }, delay)
      timeoutsRef.current.push(timeoutId)
    }

    // Auto-stop after all repeats
    const stopTimeout = window.setTimeout(() => {
      isPlayingRef.current = false
    }, 3600) // 3 repeats × 1.2s = 3.6s
    timeoutsRef.current.push(stopTimeout)
  }, [getAudioContext, playChimePattern])

  const stopAlarm = useCallback(() => {
    isPlayingRef.current = false
    timeoutsRef.current.forEach(clearTimeout)
    timeoutsRef.current = []
    if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
      audioContextRef.current.close()
      audioContextRef.current = null
    }
  }, [])

  return { playAlarm, stopAlarm }
}
