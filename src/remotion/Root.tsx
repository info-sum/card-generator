import { Composition } from 'remotion'
import { AutoGenerationVideo } from './AutoGenerationVideo'
import { CardNewsVideo } from './CardNewsVideo'
import { AUTO_GENERATION_STAGE_COUNT, AUTO_GENERATION_STAGE_DURATION_IN_FRAMES } from './autoGenerationStoryboard'
import { getCardNewsVideoDurationInFrames } from './videoTiming'

export function RemotionRoot() {
  return (
    <>
      <Composition
        component={CardNewsVideo}
        durationInFrames={getCardNewsVideoDurationInFrames(8)}
        fps={30}
        height={1350}
        id="CardNewsVideo"
        width={1080}
      />
      <Composition
        component={AutoGenerationVideo}
        durationInFrames={AUTO_GENERATION_STAGE_COUNT * AUTO_GENERATION_STAGE_DURATION_IN_FRAMES}
        fps={30}
        height={720}
        id="AutoGenerationVideo"
        width={1280}
      />
    </>
  )
}
