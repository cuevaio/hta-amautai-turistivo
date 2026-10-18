import type { MarketZone } from "./market-controls"
// A market visit submits once. A new task or API response cannot re-arm it.
export class MarketDeliveryGate {
  private sent = false
  private stoppedAt: number | null = null
  tick(zone: MarketZone, enabled: boolean, stationary: boolean, now: number) {
    if (zone !== "market") {
      this.sent = false
      this.stoppedAt = null
      return false
    }
    if (this.sent) return false
    if (!enabled || !stationary) {
      this.stoppedAt = null
      return false
    }
    if (this.stoppedAt === null) this.stoppedAt = now
    if (now - this.stoppedAt < 200) return false
    this.sent = true
    return true
  }
}
