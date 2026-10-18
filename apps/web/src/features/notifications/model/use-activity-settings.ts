import { useEffect, useRef, useState, useCallback } from "react"
import type { ActivityPreference, ActivitySettings } from "@amautai/contracts"
import { activityApi } from "../api/activity-api"
export function useActivitySettings() {
  const [data, setData] = useState<ActivitySettings | null>(null),
    [busy, setBusy] = useState(false),
    [error, setError] = useState(""),
    [notice, setNotice] = useState("")
  const mounted = useRef(false),
    locked = useRef(false)
  const load = useCallback(async (signal?: AbortSignal) => {
    try {
      const value = await activityApi.overview(signal)
      if (mounted.current && !signal?.aborted) {
        setData(value)
        setError("")
      }
    } catch (e) {
      if (mounted.current && !signal?.aborted) setError((e as Error).message)
    }
  }, [])
  useEffect(() => {
    mounted.current = true
    const c = new AbortController()
    activityApi
      .overview(c.signal)
      .then((value) => {
        if (!c.signal.aborted) setData(value)
      })
      .catch((e) => {
        if (!c.signal.aborted) setError(e.message)
      })
    return () => {
      mounted.current = false
      c.abort()
    }
  }, [load])
  async function save(preference: ActivityPreference) {
    if (locked.current) return
    locked.current = true
    setBusy(true)
    setError("")
    setNotice("")
    try {
      await activityApi.save(preference)
      if (mounted.current) {
        setData((previous) =>
          previous
            ? {
                preferences: previous.preferences.map((p) =>
                  p.type === preference.type ? preference : p
                ),
              }
            : null
        )
        setNotice("Preferencia guardada.")
      }
    } catch (e) {
      if (mounted.current) setError((e as Error).message)
    } finally {
      locked.current = false
      if (mounted.current) setBusy(false)
    }
  }
  return { data, busy, error, notice, save, refresh: () => load() }
}
