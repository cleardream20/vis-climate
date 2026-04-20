/**
 * 地图标注与搜索：按缩放分级（全国要点 → 省会 → 地级市 → 县/县级市）
 * 数据为静态内置，可后续接 Nominatim / 自有 API。
 */

export type PlaceTier = 'national' | 'province' | 'prefecture' | 'county'

export type Place = {
  name: string
  lon: number
  lat: number
  country: string
  province: string
  tier: PlaceTier
}

/** 该级别起在地图上绘制标注（zoom 越大显示越多） */
export function minZoomForTier(tier: PlaceTier): number {
  switch (tier) {
    case 'national':
      return 2.35
    case 'province':
      return 3.85
    case 'prefecture':
      return 5.35
    case 'county':
      return 6.75
    default:
      return 99
  }
}

/** 搜索后 flyTo 的目标缩放（受地图 maxZoom 限制） */
export function flyZoomForTier(tier: PlaceTier): number {
  switch (tier) {
    case 'national':
      return 5.6
    case 'province':
      return 6.6
    case 'prefecture':
      return 7.5
    case 'county':
      return 8.35
    default:
      return 6
  }
}

/** 当前缩放级别下应显示的地标点 */
export function placesVisibleAtZoom(zoom: number): Place[] {
  return PLACES.filter((p) => zoom >= minZoomForTier(p.tier))
}

function norm(s: string): string {
  return s.trim().toLowerCase()
}

/** 名称 / 省名 子串匹配（简体） */
export function searchPlaces(query: string, limit = 20): Place[] {
  const q = norm(query)
  if (!q) return []
  const scored: { p: Place; s: number }[] = []
  for (const p of PLACES) {
    const n = norm(p.name)
    const pv = norm(p.province)
    if (n.includes(q) || pv.includes(q) || norm(p.country).includes(q)) {
      let s = 0
      if (n === q) s += 100
      else if (n.startsWith(q)) s += 50
      else if (n.includes(q)) s += 20
      if (pv.includes(q)) s += 5
      scored.push({ p, s })
    }
  }
  scored.sort((a, b) => b.s - a.s || a.p.name.localeCompare(b.p.name, 'zh-Hans-CN'))
  return scored.slice(0, limit).map((x) => x.p)
}

function P(
  name: string,
  lon: number,
  lat: number,
  province: string,
  tier: PlaceTier,
  country = '中国',
): Place {
  return { name, lon, lat, country, province, tier }
}

/**
 * 行格式：名称, 经度, 纬度, 省级行政区, 级别
 * 经纬度为概略中心，与底图对齐即可。
 */
const PLACES: Place[] = [
  // —— 全国级（远距少量）——
  P('北京', 116.4074, 39.9042, '北京市', 'national'),
  P('上海', 121.4737, 31.2304, '上海市', 'national'),
  P('广州', 113.2644, 23.1291, '广东省', 'national'),
  P('深圳', 114.0579, 22.5431, '广东省', 'national'),
  P('成都', 104.0665, 30.5723, '四川省', 'national'),
  P('重庆', 106.5516, 29.563, '重庆市', 'national'),
  P('武汉', 114.3055, 30.5931, '湖北省', 'national'),
  P('西安', 108.9398, 34.3416, '陕西省', 'national'),
  P('杭州', 120.1551, 30.2741, '浙江省', 'national'),
  P('南京', 118.7969, 32.0603, '江苏省', 'national'),
  P('天津', 117.201, 39.0842, '天津市', 'national'),
  P('沈阳', 123.4315, 41.8057, '辽宁省', 'national'),
  P('哈尔滨', 126.5358, 45.8021, '黑龙江省', 'national'),
  P('郑州', 113.6254, 34.7466, '河南省', 'national'),
  P('长沙', 112.9388, 28.2282, '湖南省', 'national'),
  // —— 省会 / 自治区首府（中距）——
  P('石家庄', 114.5149, 38.0428, '河北省', 'province'),
  P('太原', 112.5489, 37.8706, '山西省', 'province'),
  P('呼和浩特', 111.7519, 40.8414, '内蒙古自治区', 'province'),
  P('长春', 125.3235, 43.8171, '吉林省', 'province'),
  P('合肥', 117.2272, 31.8206, '安徽省', 'province'),
  P('福州', 119.2965, 26.0745, '福建省', 'province'),
  P('南昌', 115.8581, 28.6832, '江西省', 'province'),
  P('济南', 117.0009, 36.6758, '山东省', 'province'),
  P('南宁', 108.3669, 22.817, '广西壮族自治区', 'province'),
  P('海口', 110.3308, 20.0221, '海南省', 'province'),
  P('昆明', 102.8329, 24.8801, '云南省', 'province'),
  P('贵阳', 106.6302, 26.6477, '贵州省', 'province'),
  P('拉萨', 91.1409, 29.6456, '西藏自治区', 'province'),
  P('兰州', 103.8236, 36.0581, '甘肃省', 'province'),
  P('西宁', 101.7782, 36.6171, '青海省', 'province'),
  P('银川', 106.2309, 38.4872, '宁夏回族自治区', 'province'),
  P('乌鲁木齐', 87.6168, 43.8256, '新疆维吾尔自治区', 'province'),
  P('台北', 121.5654, 25.033, '台湾省', 'province'),
  P('香港', 114.1694, 22.3193, '香港特别行政区', 'province'),
  P('澳门', 113.5439, 22.1987, '澳门特别行政区', 'province'),
  // —— 地级市 / 计划单列市等（拉近）——
  P('苏州', 120.5853, 31.2989, '江苏省', 'prefecture'),
  P('无锡', 120.3019, 31.5747, '江苏省', 'prefecture'),
  P('宁波', 121.544, 29.8683, '浙江省', 'prefecture'),
  P('厦门', 118.0894, 24.4798, '福建省', 'prefecture'),
  P('青岛', 120.3826, 36.0671, '山东省', 'prefecture'),
  P('大连', 121.6147, 38.914, '辽宁省', 'prefecture'),
  P('珠海', 113.5767, 22.2707, '广东省', 'prefecture'),
  P('佛山', 113.1214, 23.0215, '广东省', 'prefecture'),
  P('东莞', 113.7518, 23.0207, '广东省', 'prefecture'),
  P('中山', 113.3927, 22.517, '广东省', 'prefecture'),
  P('惠州', 114.416, 23.1107, '广东省', 'prefecture'),
  P('温州', 120.6994, 27.9943, '浙江省', 'prefecture'),
  P('烟台', 121.4479, 37.4638, '山东省', 'prefecture'),
  P('枣庄', 117.3167, 34.8, '山东省', 'prefecture'),
  P('潍坊', 119.1619, 36.7069, '山东省', 'prefecture'),
  P('洛阳', 112.454, 34.6197, '河南省', 'prefecture'),
  P('唐山', 118.1802, 39.6309, '河北省', 'prefecture'),
  P('保定', 115.4646, 38.8739, '河北省', 'prefecture'),
  P('徐州', 117.2838, 34.2042, '江苏省', 'prefecture'),
  P('南通', 120.8564, 32.0162, '江苏省', 'prefecture'),
  P('泉州', 118.6757, 24.874, '福建省', 'prefecture'),
  P('常州', 119.9739, 31.8107, '江苏省', 'prefecture'),
  P('绍兴', 120.582, 29.997, '浙江省', 'prefecture'),
  P('嘉兴', 120.7555, 30.7461, '浙江省', 'prefecture'),
  P('金华', 119.6474, 29.0792, '浙江省', 'prefecture'),
  P('台州', 121.4208, 28.6564, '浙江省', 'prefecture'),
  P('芜湖', 118.3765, 31.3263, '安徽省', 'prefecture'),
  P('赣州', 114.9336, 25.8309, '江西省', 'prefecture'),
  P('宜昌', 111.2865, 30.6919, '湖北省', 'prefecture'),
  P('襄阳', 112.1224, 32.009, '湖北省', 'prefecture'),
  P('岳阳', 113.1289, 29.3572, '湖南省', 'prefecture'),
  P('常德', 111.6985, 29.0316, '湖南省', 'prefecture'),
  P('桂林', 110.2993, 25.2742, '广西壮族自治区', 'prefecture'),
  P('柳州', 109.4286, 24.3264, '广西壮族自治区', 'prefecture'),
  P('三亚', 109.5119, 18.2528, '海南省', 'prefecture'),
  P('绵阳', 104.679, 31.46745, '四川省', 'prefecture'),
  P('南充', 106.1107, 30.8378, '四川省', 'prefecture'),
  P('曲靖', 103.7962, 25.4899, '云南省', 'prefecture'),
  P('遵义', 106.9272, 27.7256, '贵州省', 'prefecture'),
  P('咸阳', 108.7093, 34.3334, '陕西省', 'prefecture'),
  P('榆林', 109.7346, 38.2854, '陕西省', 'prefecture'),
  P('喀什', 75.9891, 39.4704, '新疆维吾尔自治区', 'prefecture'),
  // —— 县 / 县级市（高缩放）——
  P('昆山', 120.9819, 31.3846, '江苏省', 'county'),
  P('江阴', 120.2759, 31.9207, '江苏省', 'county'),
  P('义乌', 120.0744, 29.3056, '浙江省', 'county'),
  P('慈溪', 121.2665, 30.1704, '浙江省', 'county'),
  P('晋江', 118.5517, 24.7814, '福建省', 'county'),
  P('福清', 119.3841, 25.7202, '福建省', 'county'),
  P('胶州', 120.0063, 36.2646, '山东省', 'county'),
  P('寿光', 118.7907, 36.8558, '山东省', 'county'),
  P('迁安', 118.7019, 40.0121, '河北省', 'county'),
  P('三河', 117.0723, 39.9836, '河北省', 'county'),
  P('巩义', 112.9822, 34.7522, '河南省', 'county'),
  P('荥阳', 113.3835, 34.7876, '河南省', 'county'),
  P('浏阳', 113.6433, 28.1637, '湖南省', 'county'),
  P('宁乡', 112.5518, 28.2775, '湖南省', 'county'),
  P('肥西', 117.168, 31.7197, '安徽省', 'county'),
  P('长丰', 117.1647, 32.1272, '安徽省', 'county'),
  P('仁怀', 106.401, 27.7919, '贵州省', 'county'),
  P('兴义', 104.8972, 25.092, '贵州省', 'county'),
  P('大理', 100.2259, 25.5894, '云南省', 'county'),
  P('景洪', 100.7979, 22.0094, '云南省', 'county'),
  P('瑞丽', 97.8519, 24.0107, '云南省', 'county'),
  P('库尔勒', 86.1749, 41.7259, '新疆维吾尔自治区', 'county'),
  P('昌吉', 87.304, 44.0145, '新疆维吾尔自治区', 'county'),
  P('伊宁', 81.2779, 43.9088, '新疆维吾尔自治区', 'county'),
  P('敦煌', 94.6616, 40.1421, '甘肃省', 'county'),
  P('格尔木', 94.9285, 36.4064, '青海省', 'county'),
  P('满洲里', 117.4794, 49.5978, '内蒙古自治区', 'county'),
  P('二连浩特', 111.9822, 43.6531, '内蒙古自治区', 'county'),
  P('锡林浩特', 116.086, 43.9334, '内蒙古自治区', 'county'),
  P('林芝', 94.3614, 29.6547, '西藏自治区', 'county'),
  P('米林', 94.2137, 29.2131, '西藏自治区', 'county'),
  P('峨眉山', 103.4845, 29.6012, '四川省', 'county'),
  P('都江堰', 103.6191, 31.0023, '四川省', 'county'),
  P('西昌', 102.2587, 27.8858, '四川省', 'county'),
  P('江油', 104.7458, 31.7781, '四川省', 'county'),
  P('高碑店', 115.8737, 39.3266, '河北省', 'county'),
  P('涿州', 115.9734, 39.4853, '河北省', 'county'),
  P('霸州', 116.391, 39.1257, '河北省', 'county'),
  P('石狮', 118.6479, 24.7322, '福建省', 'county'),
  P('南安', 118.387, 24.9604, '福建省', 'county'),
  P('龙海', 117.8182, 24.4467, '福建省', 'county'),
  P('台山', 112.7939, 22.2515, '广东省', 'county'),
  P('开平', 112.6982, 22.3764, '广东省', 'county'),
  P('鹤山', 112.9643, 22.7654, '广东省', 'county'),
  P('四会', 112.7341, 23.327, '广东省', 'county'),
  P('博罗', 114.2897, 23.1728, '广东省', 'county'),
  P('惠东', 114.7201, 22.9851, '广东省', 'county'),
  P('信宜', 110.9465, 22.3544, '广东省', 'county'),
  P('高州', 110.8542, 21.9182, '广东省', 'county'),
  P('化州', 110.6395, 21.6649, '广东省', 'county'),
  P('廉江', 110.286, 21.6097, '广东省', 'county'),
  P('雷州', 110.0967, 20.9143, '广东省', 'county'),
  P('陆丰', 115.6522, 22.9191, '广东省', 'county'),
  P('普宁', 116.1657, 23.2977, '广东省', 'county'),
  P('揭西', 115.8419, 23.4313, '广东省', 'county'),
  P('饶平', 117.0041, 23.6682, '广东省', 'county'),
  P('澄海', 116.7559, 23.4661, '广东省', 'county'),
  P('潮阳', 116.6026, 23.2649, '广东省', 'county'),
  P('南澳', 117.0234, 23.4221, '广东省', 'county'),
]

export { PLACES }
