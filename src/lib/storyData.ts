import marketImg from '../assets/stroryline/market.png'
import practiceImg from '../assets/stroryline/practice.png'
import wtoImg from '../assets/stroryline/WTO.png'
import floodSceneImg from '../assets/stroryline/98洪水.png'
import floodFightImg from '../assets/stroryline/98抗洪.png'

export type StoryCo2Mode =
  | { kind: 'range'; from: number; to: number; playable?: boolean }
  | { kind: 'forecast' }
  | { kind: 'marker'; year: number }

export type StoryMilestone = {
  id: string
  year: number
  label: string
  subtitle?: string
  paragraphs: string[]
  images?: { src: string; alt: string }[]
  co2?: StoryCo2Mode
  /** 侧栏中展示全国温度折线并标出该年 */
  showNationalTempCharts?: boolean
}

export type StoryEra = {
  id: string
  range: string
  playFrom: number
  playTo: number
  theme: string
  contextLines: string[]
  milestoneIds: string[]
}

export const STORY_MILESTONES: Record<string, StoryMilestone> = {
  'reform-1978': {
    id: 'reform-1978',
    year: 1978,
    label: '改革开放启动',
    subtitle: '真理标准讨论 · 农村改革起步',
    paragraphs: [
      '1978年5月11日，《光明日报》头版发表特约评论员文章《实践是检验真理的唯一标准》，在全国范围内引发了一场关于真理标准问题的大讨论。在邓小平等老一辈无产阶级革命家的领导和支持下，这场讨论冲破“两个凡是”的束缚，为党的十一届三中全会重新确立马克思主义的思想路线作了理论和舆论上的准备。',
      '1978年12月十一届三中全会后，中国开始实行对内改革、对外开放。农村从安徽小岗村“大包干”起步，城市则逐步扩大国营企业自主经营权。1979年中央批准粤闽两省实行特殊经济政策，对外开放成为基本国策，社会主义市场经济体制在随后几十年逐步建立并深化。',
    ],
    images: [{ src: practiceImg, alt: '改革开放相关报道示意' }],
    co2: { kind: 'range', from: 1974, to: 1990, playable: true },
  },
  'market-1992': {
    id: 'market-1992',
    year: 1992,
    label: '市场经济体制确立',
    subtitle: '邓小平南方谈话 · 十四大',
    paragraphs: [
      '1992年1月18日至2月21日，邓小平视察武昌、深圳、珠海、上海等地并发表南方谈话，在国内外引发强烈反响，掀起新一轮改革开放热潮。',
      '1992年10月，党的十四大正式提出：中国经济体制改革的目标是建立“社会主义市场经济体制”。',
    ],
    images: [{ src: marketImg, alt: '市场经济体制改革相关示意' }],
  },
  'flood-1998': {
    id: 'flood-1998',
    year: 1998,
    label: '长江特大洪水',
    subtitle: '全流域性洪涝 · 生态警示',
    paragraphs: [
      '1998年长江发生自1954年以来又一次全流域性大洪水。6月中旬起，洞庭湖、鄱阳湖连降暴雨，长江流量迅速增加；7月下旬至9月中旬，上游连续洪峰与中游支流汇流叠加，大通站流量8月2日达82300立方米/秒，为历史第二位。',
      '长江洪水与上游森林覆盖率下降、中下游湖泊萎缩等人为因素密切相关，也与1997–1998年强厄尔尼诺—拉尼娜事件带来的极端降水有关。专家担心：若大气 CO₂ 浓度倍增，全球降水可能增加 3%–15%，洪涝风险将与变暖并行上升。',
      '1998年洪灾警示：长江流域生态环境已十分脆弱，气候变暖背景下的极端降水值得高度警惕。',
    ],
    images: [
      { src: floodSceneImg, alt: '1998年长江洪水现场' },
      { src: floodFightImg, alt: '1998年抗洪救灾' },
    ],
    co2: { kind: 'range', from: 1991, to: 1998, playable: true },
  },
  'wto-2001': {
    id: 'wto-2001',
    year: 2001,
    label: '加入 WTO',
    subtitle: '十五年谈判 · 工业化加速',
    paragraphs: [
      '中国入世谈判历时约15年，经历酝酿准备、审议经贸体制、实质性市场准入与多边法律文件起草等阶段；中美谈判25轮、中欧15轮，农业与服务业开放是长期难点。',
      '2001年11月11日，中国在卡塔尔首都多哈签署加入世界贸易组织议定书，承诺遵守国际规则、逐步开放市场。入世后制造业与能源消耗快速增长，化石燃料排放进入新一轮上升通道。',
    ],
    images: [{ src: wtoImg, alt: '中国加入世贸组织' }],
    co2: { kind: 'range', from: 2001, to: 2010, playable: true },
  },
  'dual-carbon-2020': {
    id: 'dual-carbon-2020',
    year: 2020,
    label: '碳达峰、碳中和承诺',
    subtitle: '2030 达峰 · 2060 中和（示意预测）',
    paragraphs: [
      '2020年9月，中国在第七十五届联合国大会一般性辩论上宣布：力争2030年前实现碳达峰、2060年前实现碳中和。碳达峰指排放由增转降的拐点；碳中和指人为排放与吸收汇大体平衡。',
      '在“双碳”目标驱动下，能源补给设施正从单一加油站转向“油—电—氢—光”等综合枢纽；交通、工业等领域也在探索绿色低碳转型。下图右侧为教学用示意曲线（非官方预测），用于讨论排放可能的路径。',
    ],
    co2: { kind: 'forecast' },
  },
  'heat-2022': {
    id: 'heat-2022',
    year: 2022,
    label: '极端高温破纪录',
    subtitle: '1961年以来最强夏秋高温过程',
    paragraphs: [
      '国家气候中心：2022年全国平均高温日数（16.4天）为1961年以来最多；全国平均气温10.5℃，为1961年以来次高（仅次于2021年）。甘肃、湖北、四川、新疆等省区平均气温均为1961年以来最高。',
      '2022年6月13日至8月30日，中东部出现持续79天的大范围高温，361个国家气象站日最高气温达或破历史极值，综合强度为1961年以来最强。',
    ],
    co2: { kind: 'marker', year: 2022 },
    showNationalTempCharts: true,
  },
  'hottest-2023': {
    id: 'hottest-2023',
    year: 2023,
    label: '有记录最热一年',
    subtitle: '全国平均气温破纪录',
    paragraphs: [
      '国家气候中心：2023年全国平均气温10.7℃，较常年偏高0.8℃，为1961年以来最高，打破2021年纪录。山东、辽宁、新疆等13个省（市、区）气温均为1961年以来最高，127个站日最高气温破历史极值。',
      '2023年1月22日黑龙江漠河劲涛最低 −53℃，7月16日新疆吐鲁番三堡乡最高52.2℃，分别刷新我国实测最冷与最热纪录。',
    ],
    co2: { kind: 'marker', year: 2023 },
    showNationalTempCharts: true,
  },
}

export const STORY_ERAS: StoryEra[] = [
  {
    id: 'era-1974-1990',
    range: '1974–1990',
    playFrom: 1974,
    playTo: 1990,
    theme: '缓慢起步 · 二氧化碳积累',
    contextLines: ['北方沙尘暴高发期', '80 年代冷事件频发'],
    milestoneIds: ['reform-1978'],
  },
  {
    id: 'era-1991-2010',
    range: '1991–2010',
    playFrom: 1991,
    playTo: 2010,
    theme: '加速变暖 · 化石能源消耗激增',
    contextLines: [],
    milestoneIds: ['market-1992', 'flood-1998', 'wto-2001'],
  },
  {
    id: 'era-2011-2023',
    range: '2011–2023',
    playFrom: 2011,
    playTo: 2023,
    theme: '高烧新常态 · 气候系统惯性',
    contextLines: [],
    milestoneIds: ['dual-carbon-2020', 'heat-2022', 'hottest-2023'],
  },
]

export function getStoryMilestone(id: string): StoryMilestone | undefined {
  return STORY_MILESTONES[id]
}

/** 里程碑所属的故事阶段（用于同步播放区间） */
export function getEraForMilestone(milestoneId: string): StoryEra | undefined {
  return STORY_ERAS.find((era) => era.milestoneIds.includes(milestoneId))
}
