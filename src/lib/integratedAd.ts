import { loadFullScreenAd, showFullScreenAd } from '@apps-in-toss/web-framework'
import type { ShowFullScreenAdEvent } from '@apps-in-toss/types'

export type EarnedReward = { unitType: string; unitAmount: number }

export function isIntegratedAdSupported() {
  try {
    return loadFullScreenAd.isSupported() && showFullScreenAd.isSupported()
  } catch {
    return false
  }
}

export async function loadFullScreenAdOnce(adGroupId: string, timeoutMs = 15_000) {
  if (!isIntegratedAdSupported() || !loadFullScreenAd.isSupported()) {
    throw new Error('IntegratedAd is not supported in this environment.')
  }

  return await new Promise<void>((resolve, reject) => {
    const timeout = setTimeout(() => {
      unsubscribe?.()
      reject(new Error('Failed to load ad (timeout).'))
    }, timeoutMs)

    let unsubscribe: (() => void) | null = null
    unsubscribe = loadFullScreenAd({
      options: { adGroupId },
      onEvent: (event) => {
        if (event.type !== 'loaded') return
        clearTimeout(timeout)
        unsubscribe?.()
        resolve()
      },
      onError: (error) => {
        clearTimeout(timeout)
        unsubscribe?.()
        reject(error instanceof Error ? error : new Error('Failed to load ad.'))
      },
    })
  })
}

export async function showFullScreenAdOnce(adGroupId: string, timeoutMs = 60_000) {
  if (!isIntegratedAdSupported() || !showFullScreenAd.isSupported()) {
    throw new Error('IntegratedAd is not supported in this environment.')
  }

  return await new Promise<{ earnedReward: EarnedReward | null }>((resolve, reject) => {
    const timeout = setTimeout(() => {
      unsubscribe?.()
      reject(new Error('Failed to show ad (timeout).'))
    }, timeoutMs)

    let earnedReward: EarnedReward | null = null
    let unsubscribe: (() => void) | null = null

    unsubscribe = showFullScreenAd({
      options: { adGroupId },
      onEvent: (event: ShowFullScreenAdEvent) => {
        if (event.type === 'userEarnedReward') {
          earnedReward = event.data
          return
        }

        // End of flow signals.
        if (event.type === 'dismissed' || event.type === 'failedToShow') {
          clearTimeout(timeout)
          unsubscribe?.()
          resolve({ earnedReward })
        }
      },
      onError: (error) => {
        clearTimeout(timeout)
        unsubscribe?.()
        reject(error instanceof Error ? error : new Error('Failed to show ad.'))
      },
    })
  })
}
