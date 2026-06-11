import { Composition } from 'remotion'
import { CardNewsVideo } from './CardNewsVideo'
import { getCardNewsVideoDurationInFrames } from './videoTiming'

export function RemotionRoot() {
  return (
    <Composition
      component={CardNewsVideo}
      durationInFrames={getCardNewsVideoDurationInFrames(8)}
      fps={30}
      height={1350}
      id="CardNewsVideo"
      width={1080}
    />
  )
}
