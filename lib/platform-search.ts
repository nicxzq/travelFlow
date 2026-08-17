export type SearchScenario = 'attraction' | 'food' | 'hotel';
export type SearchPlatform = 'amap' | 'meituan' | 'dianping' | 'ctrip';

export type PlatformSearchInput = {
  platform: SearchPlatform;
  scenario: SearchScenario;
  placeName: string;
  availableHours: number;
  coordinates?: { lat: number; lng: number };
};

export type PlatformLaunch = {
  platform: SearchPlatform;
  label: string;
  keyword: string;
  url: string;
  directSearch: boolean;
};

const platformEntries: Record<
  Exclude<SearchPlatform, 'amap'>,
  { label: string; url: string }
> = {
  meituan: { label: '美团', url: 'https://www.meituan.com/' },
  dianping: { label: '大众点评', url: 'https://www.dianping.com/' },
  ctrip: { label: '携程', url: 'https://m.ctrip.com/webapp/hotels/' },
};

function normalizePlaceName(placeName: string) {
  return placeName.replace(/\s+/g, ' ').trim() || '当前位置';
}

export function buildPlatformKeyword(
  input: Pick<PlatformSearchInput, 'scenario' | 'placeName' | 'availableHours'>,
) {
  const placeName = normalizePlaceName(input.placeName);

  if (input.scenario === 'food') {
    return `${placeName} 附近 当地特色 适合家庭 性价比 餐厅`;
  }

  if (input.scenario === 'hotel') {
    return `${placeName} 附近 家庭房 停车方便 性价比 酒店`;
  }

  return `${placeName} 附近 ${input.availableHours}小时 亲子 少走路 景点`;
}

export function buildPlatformLaunch(input: PlatformSearchInput): PlatformLaunch {
  const keyword = buildPlatformKeyword(input);

  if (input.platform === 'amap') {
    const url = new URL('https://uri.amap.com/search');
    url.searchParams.set('keyword', keyword);
    url.searchParams.set('view', 'list');
    url.searchParams.set('src', 'travelflow');
    url.searchParams.set('callnative', '1');
    if (input.coordinates) {
      url.searchParams.set('center', `${input.coordinates.lng},${input.coordinates.lat}`);
    }

    return {
      platform: 'amap',
      label: '高德地图',
      keyword,
      url: url.toString(),
      directSearch: true,
    };
  }

  return {
    platform: input.platform,
    label: platformEntries[input.platform].label,
    keyword,
    url: platformEntries[input.platform].url,
    directSearch: false,
  };
}
