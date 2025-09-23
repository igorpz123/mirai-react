import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// CNPJ utilities
export const onlyDigits = (s: string) => (s || '').replace(/\D+/g, '')

export const formatCNPJ = (value: string) => {
  const v = onlyDigits(value).slice(0, 14)
  const p1 = v.slice(0, 2)
  const p2 = v.slice(2, 5)
  const p3 = v.slice(5, 8)
  const p4 = v.slice(8, 12)
  const p5 = v.slice(12, 14)
  let out = ''
  if (p1) out = p1
  if (p2) out += (out ? '.' : '') + p2
  if (p3) out += (p2 ? '.' : '') + p3
  if (p4) out += (p3 ? '/' : '') + p4
  if (p5) out += (p4 ? '-' : '') + p5
  return out
}

export const validateCNPJ = (cnpjInput: string): boolean => {
  const cnpj = onlyDigits(cnpjInput)
  if (cnpj.length !== 14) return false
  if (/^(\d)\1{13}$/.test(cnpj)) return false
  const calcCheck = (base: string, weights: number[]) => {
    const sum = base.split('').reduce((acc, d, i) => acc + Number(d) * weights[i], 0)
    const r = sum % 11
    return r < 2 ? 0 : 11 - r
  }
  const d1 = calcCheck(cnpj.slice(0, 12), [5,4,3,2,9,8,7,6,5,4,3,2])
  if (d1 !== Number(cnpj[12])) return false
  const d2 = calcCheck(cnpj.slice(0, 13), [6,5,4,3,2,9,8,7,6,5,4,3,2])
  if (d2 !== Number(cnpj[13])) return false
  return true
}
