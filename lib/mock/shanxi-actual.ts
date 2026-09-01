import type { JourneyOverlay } from '@/lib/domain/journey';
import type { EventCategory, TransportMode, TripEvent, TripWithDaysAndEvents } from '@/lib/domain/trip';

export const SHANXI_ACTUAL_TRIP_ID = 'shanxi-actual-2026';

type StopSeed = {
  time: string;
  title: string;
  category: EventCategory;
  lat: number;
  lng: number;
  transportMode?: TransportMode;
  tags: string[];
  story: string;
};

type DaySeed = {
  date: string;
  summary: string;
  stops: StopSeed[];
};

const daySeeds: DaySeed[] = [
  {
    date: '2026-08-16',
    summary: '遮光板一路没让打开：抵达长治，取 GL8，直奔黄崖洞，下午临时改成整休。',
    stops: [
      {
        time: '13:30',
        title: '长治王村机场',
        category: 'transport',
        lat: 36.2443,
        lng: 113.12176,
        transportMode: 'flight',
        tags: ['军民合用机场', '旅程起点'],
        story:
          '空姐反复强调关闭遮光板。下飞机走连廊，毛玻璃包着过渡区域；走到一扇门后面，我还是看见了几架军用飞机。取好提前租的 GL8，七个人刚好坐满。',
      },
      {
        time: '15:00',
        title: '黄崖洞文化旅游区',
        category: 'hotel',
        lat: 36.794563,
        lng: 113.383067,
        tags: ['景区住宿', '第一天整休'],
        story:
          '酒店就在景区里。问完前台才发现三点再进景区已经太晚，于是回房补觉。第一天没有真正逛景点，晚饭仍在景区食堂，晚上继续在电脑前改研学行程网站。',
      },
    ],
  },
  {
    date: '2026-08-17',
    summary: '黄崖洞碰到一个不收钱的叔叔：五六小时完整游览，傍晚开车前往平遥。',
    stops: [
      {
        time: '09:00',
        title: '黄崖洞文化旅游区',
        category: 'spot',
        lat: 36.794563,
        lng: 113.383067,
        tags: ['峡谷', '索道', '兵工厂旧址'],
        story:
          '观光车、电梯、索道、装甲车一路串起来。索道前遇到一个地陪导游，他说一个月只有四天假、跟游客一样排队。到黄崖洞终点，又遇到做演出的叔叔，认真帮几个孩子戴帽子、系红领巾、摆枪械拍照，一分钱没要。',
      },
      {
        time: '19:30',
        title: '平遥古城',
        category: 'hotel',
        lat: 37.204136,
        lng: 112.183509,
        tags: ['夜宿古城', '晋商'],
        story:
          '下午四点多从黄崖洞出发。一路被科普：平遥能留下来，某种程度上不是因为当年有钱保护，而是没钱大拆大建。到平遥已经是晚上，城在黑里只剩一个轮廓。',
      },
    ],
  },
  {
    date: '2026-08-18',
    summary: '卖醋的饭店，和一本书：平遥古城步行与观光车，下午离开，晚上住临汾。',
    stops: [
      {
        time: '09:20',
        title: '平遥古城',
        category: 'spot',
        lat: 37.204136,
        lng: 112.183509,
        tags: ['古城墙', '马面', '日昇昌'],
        story:
          '从北大街走到东西街、南大街，在一个免费茶院里翻到一本讲平遥古城的书。书上说城形像一只面朝南的乌龟，也终于弄懂城墙上的"马面"为什么凸出来——守城人可以从侧面攻击靠墙的敌人。',
      },
      {
        time: '12:10',
        title: '天元魁饭店（平遥）',
        category: 'food',
        lat: 37.2019,
        lng: 112.18385,
        tags: ['午餐', '醋体验'],
        story:
          '一百多张桌子的大饭店，表面上是吃饭，卖醋却像真正的主业。苹果醋、蜂蜜醋、桂花、玫瑰，一样一样端上来试喝；吃饭场景本身就变成了天然的销售现场。',
      },
      {
        time: '18:30',
        title: '临汾住宿（大槐树附近）',
        category: 'hotel',
        lat: 36.27,
        lng: 111.675,
        tags: ['连锁酒店', '休整'],
        story:
          '下午三点五十离开平遥，一路开到临汾。我在车上睡了两个多小时。晚上没有再出门，点外卖，饺子、锅贴、面条、羊肉泡馍，结束第三天。',
      },
    ],
  },
  {
    date: '2026-08-19',
    summary: '广胜寺那面光秃秃的墙：大槐树门口短停，重点游广胜寺上寺、下寺、水神庙，晚上入住云丘山。',
    stops: [
      {
        time: '09:30',
        title: '洪洞大槐树寻根祭祖园',
        category: 'spot',
        lat: 36.268753,
        lng: 111.676716,
        tags: ['解手场', '门口短停'],
        story:
          '原本准备进大槐树，但当天演出取消，而这里最有意思的恰恰是寻根主题演艺。我们就在门口看看"解手场"、拍了视频，然后把时间留给广胜寺。',
      },
      {
        time: '11:20',
        title: '广胜寺',
        category: 'spot',
        lat: 36.301391,
        lng: 111.812872,
        tags: ['飞虹塔', '水神庙', '元代壁画'],
        story:
          '上寺看飞虹塔、十二圆觉壁画和地藏殿悬塑；下寺更让我停住脚步：最后那座大殿整面壁画被揭走卖到国外，墙上只剩光秃秃的一大片。站在那面墙前，七十块门票值不值这笔账突然就算不下去了。',
      },
      {
        time: '19:40',
        title: '云丘山康家坪民宿',
        category: 'hotel',
        lat: 35.765406,
        lng: 111.024306,
        tags: ['窑洞大院', '红灯笼'],
        story:
          '车一路开到半山腰，快到酒店时满山红灯笼亮起来，很震撼。入住康家坪窑洞大院，晚上带孩子从一层一路逛到八层，把每个院子都钻了一遍。',
      },
    ],
  },
  {
    date: '2026-08-20',
    summary: '六十多张银票，一个都没换成：云丘山全天，下午放弃壶口，返回长治。',
    stops: [
      {
        time: '09:20',
        title: '云丘山景区',
        category: 'spot',
        lat: 35.7565,
        lng: 111.0186,
        tags: ['NPC互动', '银票', '研学'],
        story:
          '财神道开始，银票成了孩子们一路追逐的游戏货币。划拳、扔瓶子、背古诗都能换银票，后来又坐摆渡车去冰洞。',
      },
      {
        time: '12:30',
        title: '云丘山冰洞群',
        category: 'spot',
        lat: 35.7429,
        lng: 111.0045,
        tags: ['冰洞', '182元门票'],
        story:
          '冰洞确实壮观，但我们逛了十分钟就出来。洞口前还有一段要另外买电梯票，我从旁边楼梯走上去，两分钟到顶。下午身体有点不舒服，只好频繁喝水休息。',
      },
      {
        time: '16:00',
        title: '云丘山景区出口',
        category: 'transport',
        lat: 35.7565,
        lng: 111.0186,
        tags: ['60+银票', '零纪念品'],
        story:
          '四个孩子攒了六十多张银票，想用七十张换四份纪念品，工作人员不同意。他们一气之下一个都没换。我第一反应是"至少先换三个"，后来又觉得，他们那一下比我一路算得失更干净。',
      },
      {
        time: '21:00',
        title: '长治 · 妈妈手（晚餐）',
        category: 'food',
        lat: 36.1954,
        lng: 113.1163,
        tags: ['返程', '排队晚餐'],
        story:
          '壶口时间来不及，只好直接掉头回长治。晚上九点到一家很有名的"妈妈手"仍然要排队，九点半才吃上晚饭，十点多回酒店。',
      },
    ],
  },
  {
    date: '2026-08-21',
    summary: '城隍庙、博物馆，和送出去的啤酒：上午长治城区短游，下午还车，到机场结束六天自驾。',
    stops: [
      {
        time: '09:30',
        title: '潞安府城隍庙',
        category: 'spot',
        lat: 36.183586,
        lng: 113.116378,
        tags: ['木版画', '古建筑'],
        story: '第六天上午在城隍庙慢慢逛，看看古建筑和展出的木版画。旅行最后一天终于回到城区，不再赶长途。',
      },
      {
        time: '11:30',
        title: '长治市博物馆',
        category: 'spot',
        lat: 36.217466,
        lng: 113.071467,
        tags: ['博物馆', '孩子研学'],
        story: '中午陈老师带着孩子去了趟长治市博物馆，我们去把 GL8 还掉。六天自驾到这里基本收尾。',
      },
      {
        time: '16:00',
        title: '长治王村机场',
        category: 'transport',
        lat: 36.2443,
        lng: 113.12176,
        transportMode: 'drive',
        tags: ['返程', '旅行终点'],
        story:
          '下午四点到长治机场。从云丘山带出来的那瓶啤酒过不了安检，我把它送给了安检工作人员。旅程从这个军民合用机场开始，也在这里结束。',
      },
    ],
  },
];

function navigationUrl(keyword: string) {
  return `https://uri.amap.com/search?keyword=${encodeURIComponent(keyword)}`;
}

function eventId(dayIndex: number, stopIndex: number) {
  return `actual-day-${dayIndex}-event-${stopIndex + 1}`;
}

export const shanxiActualTrip: TripWithDaysAndEvents = {
  id: SHANXI_ACTUAL_TRIP_ID,
  userId: 'local-user',
  title: '2026 山西六日自驾 · 成行轨迹',
  destination: '山西 · 长治 平遥 临汾 云丘山',
  startDate: '2026-08-16',
  endDate: '2026-08-21',
  status: 'completed',
  days: daySeeds.map((day, dayOffset) => {
    const dayIndex = dayOffset + 1;
    const dayId = `actual-day-${dayIndex}`;

    return {
      id: dayId,
      tripId: SHANXI_ACTUAL_TRIP_ID,
      dayIndex,
      date: day.date,
      summary: day.summary,
      events: day.stops.map<TripEvent>((stop, stopIndex) => ({
        id: eventId(dayIndex, stopIndex),
        dayId,
        tripId: SHANXI_ACTUAL_TRIP_ID,
        startTime: stop.time,
        title: stop.title,
        category: stop.category,
        description: stop.story,
        locationName: stop.title,
        geo: { lat: stop.lat, lng: stop.lng },
        navigationUrl: navigationUrl(stop.title),
        status: 'done',
        isCompleted: true,
        transportMode: stop.transportMode,
      })),
    };
  }),
  todos: [],
};

export const shanxiActualOverlay: JourneyOverlay = Object.fromEntries(
  daySeeds.flatMap((day, dayOffset) =>
    day.stops.map((stop, stopIndex) => [
      eventId(dayOffset + 1, stopIndex),
      { tags: stop.tags },
    ]),
  ),
);
