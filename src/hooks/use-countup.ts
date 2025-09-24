import { useEffect, useState } from 'react'

export default function useCountUp(target: number, duration = 800) {
  const [value, setValue] = useState(0)
  useEffect(() => {
    let raf = 0
    let start: number | null = null
    const loop = (now: number) => {
      if (start === null) start = now
      const elapsed = now - start
      const t = Math.min(1, elapsed / duration)
      setValue(Math.round(t * target))
      if (t < 1) raf = requestAnimationFrame(loop)
    }
    raf = requestAnimationFrame(loop)
    return () => cancelAnimationFrame(raf)
  }, [target, duration])
  return value
}
