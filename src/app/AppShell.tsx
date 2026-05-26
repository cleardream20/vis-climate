import { CityDetailDrawer } from '../components/chrome/CityDetailDrawer'
import { HeatmapMap } from '../components/map/HeatmapMap'
import { Legend } from '../components/chrome/Legend'
import { MetricsDrawer } from '../components/chrome/MetricsDrawer'
import { StoryDetailDrawer } from '../components/story/StoryDetailDrawer'
import { Timeline } from '../components/chrome/Timeline'
import { TopBar } from '../components/chrome/TopBar'
import { useAppStore } from '../store/useAppStore'
/**
 * 单一画布：主列占满 dvh 剩余高度，地图容器带 min-h-0 以便 flex 子项正确收缩，
 * 避免 MapLibre 在高度为 0/未计算完成时初始化导致「只有半屏有图」。
 */
export function AppShell() {
  const storyDetailOpen = useAppStore((s) => s.selectedStoryId != null)

  return (
    <div className="flex h-full min-h-0 flex-col">
      <TopBar />
      <div className="relative min-h-0 flex-1 overflow-hidden">
        <HeatmapMap />
        <Legend />
        <div className="pointer-events-none absolute right-0 top-0 z-20 flex h-full max-w-full flex-row-reverse">
          {storyDetailOpen ? <StoryDetailDrawer /> : null}
          {!storyDetailOpen ? <CityDetailDrawer /> : null}
          {!storyDetailOpen ? <MetricsDrawer /> : null}
        </div>
      </div>
      <Timeline />
    </div>
  )
}
