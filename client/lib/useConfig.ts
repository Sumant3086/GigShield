/**
 * useConfig — fetches all platform configuration from /api/config
 * Replaces every hardcoded value in the frontend.
 * Cached in module scope so it only fetches once per session.
 */
import { useState, useEffect } from 'react'
import api from './api'

export interface TierConfig {
  key: string
  name: string
  icon: string
  weeklyPremium: number
  maxWeeklyPayout: number
  description: string
  color: string
  popular?: boolean
}

export interface PlatformConfig {
  value: string
  label: string
  icon: string
  riskScore: number
}

export interface CityConfig {
  name: string
  zones: string[]
  riskProfile: string
}

export interface TriggerType {
  key: string
  label: string
  icon: string
  source: string
  threshold: string
  severityMultipliers: Record<string, number>
}

export interface AppConfig {
  tiers: TierConfig[]
  platforms: PlatformConfig[]
  cities: CityConfig[]
  triggerTypes: TriggerType[]
  fraudReportReasons: { value: string; label: string }[]
  bcsThresholds: { autoApprove: number; softHold: number; humanReview: number }
  premiumAdjustments: Record<string, number>
  payoutMultipliers: Record<string, number>
  currentSeason: { months: number[]; score: number; label: string }
  zoneRiskScores: Record<string, number>
  coverageItems: { icon: string; text: string }[]
  exclusions: string[]
  stats: { gigWorkersIndia: string; avgPayoutTime: string; minWeeklyPremium: string; maxWeeklyPayout: string }
}

let cachedConfig: AppConfig | null = null

export function useConfig() {
  const [config, setConfig] = useState<AppConfig | null>(cachedConfig)
  const [loading, setLoading] = useState(!cachedConfig)

  useEffect(() => {
    if (cachedConfig) return
    api.get('/config').then(r => {
      cachedConfig = r.data
      setConfig(r.data)
    }).catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  return { config, loading }
}

// Helper: get trigger icon from config
export function getTriggerIcon(config: AppConfig | null, type: string): string {
  return config?.triggerTypes.find(t => t.key === type)?.icon || '⚡'
}

// Helper: get platform label
export function getPlatformLabel(config: AppConfig | null, value: string): string {
  return config?.platforms.find(p => p.value === value)?.label || value
}

// Helper: get zones for a city
export function getZonesForCity(config: AppConfig | null, city: string): string[] {
  return config?.cities.find(c => c.name === city)?.zones || []
}
