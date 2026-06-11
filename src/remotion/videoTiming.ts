export const SLIDE_DURATION_IN_FRAMES = 96
export const TRANSITION_IN_FRAMES = 14

export function getCardNewsVideoDurationInFrames(slideCount = 8) {
  return SLIDE_DURATION_IN_FRAMES * slideCount
}
