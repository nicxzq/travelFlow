import type { TripEvent } from '@/lib/domain/trip';

export type StudyTaskType = 'observe' | 'quiz' | 'reflection';

export type StudyCard = {
  id: string;
  eventIds: string[];
  eventTitle: string;
  theme: string;
  roleName: string;
  estimatedMinutes: number;
  badgeName: string;
  story: string;
  imageUrl: string;
  imageAlt: string;
  accent: string;
  links: Array<{
    label: string;
    url: string;
  }>;
  quickSearches: Array<{
    label: string;
    query: string;
  }>;
  tasks: Array<{
    type: StudyTaskType;
    prompt: string;
  }>;
};

function searchUrl(query: string) {
  return `https://www.baidu.com/s?wd=${encodeURIComponent(query)}`;
}

function mapUrl(query: string) {
  return `https://uri.amap.com/search?keyword=${encodeURIComponent(query)}`;
}

const studyCards: StudyCard[] = [
  {
    id: 'study-huangyadong',
    eventIds: ['day-1-event-5'],
    eventTitle: '黄崖洞景区',
    theme: '太行山里的兵工厂',
    roleName: '太行山地形侦察员',
    estimatedMinutes: 25,
    badgeName: '太行山地形徽章',
    story: '黄崖洞位于太行山深处，峡谷、山体和道路让这里成为重要的隐蔽地点。八路军曾在这里建设兵工厂，孩子可以把地形、安全、运输和历史联系起来观察。',
    imageUrl: 'https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=1200&q=80',
    imageAlt: '太行山峡谷地貌',
    accent: 'from-slate-950/75 via-emerald-950/55 to-cyan-950/40',
    links: [
      { label: '兵工厂旧址资料', url: 'https://www.sastind.gov.cn/n10086200/n10086361/n10696722/n10696765/c10699720/content.html' },
      { label: '地图导航', url: mapUrl('黄崖洞景区') },
    ],
    quickSearches: [
      { label: '黄崖洞兵工厂', query: '黄崖洞兵工厂 研学' },
      { label: '黄崖洞保卫战', query: '黄崖洞保卫战 儿童讲解' },
    ],
    tasks: [
      { type: 'observe', prompt: '找到一处能说明“易守难攻”的地形，并说出原因。' },
      { type: 'observe', prompt: '记录峡谷里的温度、风、水声或岩壁特点。' },
      { type: 'quiz', prompt: '为什么兵工厂不建在平原城市？' },
      { type: 'reflection', prompt: '用 3 句话讲清“地形如何影响历史”。' },
    ],
  },
  {
    id: 'study-shenlongwan-road',
    eventIds: ['day-2-event-3'],
    eventTitle: '神龙湾挂壁公路',
    theme: '绝壁上的生命线',
    roleName: '山路工程观察员',
    estimatedMinutes: 20,
    badgeName: '太行筑路徽章',
    story: '神龙湾挂壁公路嵌在太行绝壁中，曾经解决山村出行难题。观察它时，不只看惊险，也要想人为什么要在山体中开路，工程如何改变生活。',
    imageUrl: 'https://images.unsplash.com/photo-1500534314209-a25ddb2bd429?auto=format&fit=crop&w=1200&q=80',
    imageAlt: '山地公路与峡谷',
    accent: 'from-stone-950/75 via-slate-900/55 to-emerald-900/35',
    links: [
      { label: '挂壁公路资料', url: 'https://news.gmw.cn/2018-08/26/content_30780041.htm' },
      { label: '地图导航', url: mapUrl('神龙湾挂壁公路') },
    ],
    quickSearches: [
      { label: '挂壁公路原理', query: '神龙湾挂壁公路 工程 原理' },
      { label: '太行一号旅游公路', query: '太行一号旅游公路 神龙湾' },
    ],
    tasks: [
      { type: 'observe', prompt: '观察洞口、弯道和临崖路段，找一个最需要慢行的位置。' },
      { type: 'quiz', prompt: '为什么挂壁公路常常开在山体侧面，而不是绕远路？' },
      { type: 'reflection', prompt: '说出这条路给山村生活带来的一个改变。' },
    ],
  },
  {
    id: 'study-shenlongwan-canyon',
    eventIds: ['day-2-event-5'],
    eventTitle: '神龙湾大峡谷',
    theme: '峡谷浅滩观察课',
    roleName: '水文小记录员',
    estimatedMinutes: 15,
    badgeName: '峡谷水文徽章',
    story: '峡谷里的浅滩、石头和水声都能说明水流如何塑造地貌。边玩水边观察，重点是安全距离、石头形态和水流方向。',
    imageUrl: 'https://images.unsplash.com/photo-1433086966358-54859d0ed716?auto=format&fit=crop&w=1200&q=80',
    imageAlt: '峡谷溪流和岩石',
    accent: 'from-cyan-950/70 via-blue-950/45 to-emerald-900/35',
    links: [
      { label: '地图导航', url: mapUrl('神龙湾大峡谷') },
      { label: '搜索资料', url: searchUrl('神龙湾大峡谷 太行 地貌') },
    ],
    quickSearches: [
      { label: '峡谷怎么形成', query: '峡谷 地貌 如何形成 小学生' },
      { label: '浅滩安全', query: '儿童 溪流 浅滩 安全 注意事项' },
    ],
    tasks: [
      { type: 'observe', prompt: '找三块形状不同的石头，观察它们是否被水磨圆。' },
      { type: 'quiz', prompt: '水流变急时，为什么更容易搬动沙石？' },
      { type: 'reflection', prompt: '用一句话写下“今天水流告诉我的事”。' },
    ],
  },
  {
    id: 'study-taihang-music-road',
    eventIds: ['day-3-event-2'],
    eventTitle: '太行音乐公路',
    theme: '路面为什么会唱歌',
    roleName: '声学小实验员',
    estimatedMinutes: 15,
    badgeName: '道路声学徽章',
    story: '音乐公路通过路面纹理让轮胎振动，振动频率变化后就会听到旋律。今天把路面、车速、声音三个因素连起来看。',
    imageUrl: 'https://images.unsplash.com/photo-1477959858617-67f85cf4f1df?auto=format&fit=crop&w=1200&q=80',
    imageAlt: '山间道路',
    accent: 'from-indigo-950/70 via-slate-900/50 to-rose-900/35',
    links: [
      { label: '地图导航', url: mapUrl('太行音乐公路') },
      { label: '搜索资料', url: searchUrl('音乐公路 原理') },
    ],
    quickSearches: [
      { label: '音乐公路原理', query: '音乐公路 原理 轮胎 振动' },
      { label: '声音频率', query: '声音 频率 小学生 科普' },
    ],
    tasks: [
      { type: 'observe', prompt: '安全坐在车内听旋律，记录车速变化时声音是否变化。' },
      { type: 'quiz', prompt: '为什么车轮压过不同间距的纹路会产生不同声音？' },
      { type: 'reflection', prompt: '用“路面、轮胎、振动”三个词解释音乐公路。' },
    ],
  },
  {
    id: 'study-hongdong',
    eventIds: ['day-3-event-5'],
    eventTitle: '洪洞大槐树',
    theme: '一棵树和一次迁徙',
    roleName: '寻根小史官',
    estimatedMinutes: 25,
    badgeName: '迁徙故事徽章',
    story: '大槐树承载了移民记忆。这里适合把家族、迁徙和地方文化联系起来，理解为什么一个地方会被很多人称作“根”。',
    imageUrl: 'https://images.unsplash.com/photo-1513836279014-a89f7a76ae86?auto=format&fit=crop&w=1200&q=80',
    imageAlt: '古树枝叶',
    accent: 'from-green-950/75 via-emerald-900/50 to-amber-900/35',
    links: [
      { label: '景区官网', url: 'https://xn--xmq01r3xb08dlwsulcbi85ib9v6juhhaz30d.xn--ses554g/' },
      { label: '地图导航', url: mapUrl('洪洞大槐树寻根祭祖园') },
    ],
    quickSearches: [
      { label: '大槐树移民', query: '洪洞大槐树 明代移民 儿童讲解' },
      { label: '寻根文化', query: '寻根文化 小学生 研学' },
    ],
    tasks: [
      { type: 'observe', prompt: '找到一处和“寻根”有关的文字或图案。' },
      { type: 'quiz', prompt: '人们为什么会把一棵树当成共同记忆？' },
      { type: 'reflection', prompt: '问家人一个关于老家或姓氏来源的问题。' },
    ],
  },
  {
    id: 'study-hukou',
    eventIds: ['day-4-event-3'],
    eventTitle: '壶口瀑布山西侧',
    theme: '黄河为什么在这里变窄',
    roleName: '黄河水文观察员',
    estimatedMinutes: 20,
    badgeName: '黄河水文徽章',
    story: '壶口瀑布的震撼来自水量、河道宽度和地形变化。今天重点观察水流、声音、水雾和岩石形态，理解“壶口”这个名字。',
    imageUrl: 'https://images.unsplash.com/photo-1503424886307-b090341d25d1?auto=format&fit=crop&w=1200&q=80',
    imageAlt: '瀑布水流',
    accent: 'from-blue-950/75 via-cyan-950/55 to-slate-950/40',
    links: [
      { label: '景区官网', url: 'https://www.hhhkpb.com/' },
      { label: '地图导航', url: mapUrl('山西黄河壶口瀑布旅游区') },
    ],
    quickSearches: [
      { label: '壶口瀑布地貌', query: '壶口瀑布 地貌 黄河 为什么变窄' },
      { label: '黄河水文', query: '黄河 水文 小学生 科普' },
    ],
    tasks: [
      { type: 'observe', prompt: '观察瀑布水流颜色、水雾和声音的变化。' },
      { type: 'quiz', prompt: '河道变窄时，水流速度为什么会变快？' },
      { type: 'reflection', prompt: '用一个比喻描述你看到的黄河。' },
    ],
  },
  {
    id: 'study-yunqiu',
    eventIds: ['day-5-event-1'],
    eventTitle: '云丘山深度游',
    theme: '冰洞和古村的自然密码',
    roleName: '山地自然观察员',
    estimatedMinutes: 25,
    badgeName: '冰洞古村徽章',
    story: '云丘山有山地自然资源和古村文化，冰洞群尤其适合观察温度、岩洞和季节之间的关系。今天重点比较“洞内”和“洞外”。',
    imageUrl: 'https://images.unsplash.com/photo-1519681393784-d120267933ba?auto=format&fit=crop&w=1200&q=80',
    imageAlt: '冰雪洞穴感的自然景观',
    accent: 'from-sky-950/75 via-indigo-950/45 to-slate-950/35',
    links: [
      { label: '云丘山线路', url: 'https://www.yunqiushan.cn/zhphone/djyqs/xcglxq.shtml?id=6' },
      { label: '地图导航', url: mapUrl('云丘山景区') },
    ],
    quickSearches: [
      { label: '云丘山冰洞', query: '云丘山 冰洞群 形成 原因' },
      { label: '古村保护', query: '古村落 保护 研学 小学生' },
    ],
    tasks: [
      { type: 'observe', prompt: '比较洞内外温度、湿度和光线，记录一个明显差别。' },
      { type: 'quiz', prompt: '为什么有些洞穴夏天也会很冷？' },
      { type: 'reflection', prompt: '说出自然景观和村落生活之间的一个联系。' },
    ],
  },
  {
    id: 'study-guandi',
    eventIds: ['day-5-event-4'],
    eventTitle: '解州关帝庙',
    theme: '忠义文化和古建筑',
    roleName: '古建礼制观察员',
    estimatedMinutes: 25,
    badgeName: '关公文化徽章',
    story: '解州关帝庙和关公信俗有关，也是一处古建筑观察现场。孩子可以看中轴线、匾额、屋顶和院落，理解建筑如何表达文化秩序。',
    imageUrl: 'https://images.unsplash.com/photo-1528360983277-13d401cdc186?auto=format&fit=crop&w=1200&q=80',
    imageAlt: '传统中式建筑屋顶',
    accent: 'from-red-950/70 via-amber-950/45 to-slate-950/35',
    links: [
      { label: '关帝庙资料', url: 'https://history.sxu.edu.cn/kxyj/kydt/19b4316256794f3bb51700e37109d64b.htm' },
      { label: '地图导航', url: mapUrl('解州关帝庙') },
    ],
    quickSearches: [
      { label: '关庙之祖', query: '解州关帝庙 关庙之祖' },
      { label: '古建筑中轴线', query: '中国古建筑 中轴线 小学生' },
    ],
    tasks: [
      { type: 'observe', prompt: '找一块匾额或一处屋顶装饰，说出它给你的感觉。' },
      { type: 'quiz', prompt: '为什么庙宇常常按中轴线展开？' },
      { type: 'reflection', prompt: '用一个词解释你理解的“忠义”。' },
    ],
  },
  {
    id: 'study-salt-lake',
    eventIds: ['day-5-event-5'],
    eventTitle: '七彩盐湖日落',
    theme: '盐湖为什么有颜色',
    roleName: '盐湖生态观察员',
    estimatedMinutes: 15,
    badgeName: '盐湖生态徽章',
    story: '运城盐湖有很长的盐业历史，也会因为盐分、藻类、卤虫、光照等因素呈现不同颜色。今天重点观察颜色和环境条件。',
    imageUrl: 'https://images.unsplash.com/photo-1500534314209-a25ddb2bd429?auto=format&fit=crop&w=1200&q=80',
    imageAlt: '夕阳下的彩色地貌',
    accent: 'from-fuchsia-950/65 via-rose-950/45 to-amber-900/35',
    links: [
      { label: '新华网盐湖资料', url: 'https://www.news.cn/politics/2023-06/05/c_1129670188.htm' },
      { label: '地图导航', url: mapUrl('运城七彩盐湖') },
    ],
    quickSearches: [
      { label: '七彩盐湖原因', query: '运城七彩盐湖 颜色 原因' },
      { label: '盐湖生态', query: '盐湖 藻类 卤虫 科普' },
    ],
    tasks: [
      { type: 'observe', prompt: '记录你看到的两种盐湖颜色，并观察太阳角度。' },
      { type: 'quiz', prompt: '为什么盐湖不同区域可能呈现不同颜色？' },
      { type: 'reflection', prompt: '说出盐湖从生产到旅游保护的一点变化。' },
    ],
  },
  {
    id: 'study-guanque',
    eventIds: ['day-6-event-3'],
    eventTitle: '鹳雀楼',
    theme: '诗词里的黄河与高楼',
    roleName: '登楼小诗人',
    estimatedMinutes: 15,
    badgeName: '黄河诗词徽章',
    story: '鹳雀楼适合把诗词、地理和视野联系起来。登高以后，试着理解古人为什么会写下壮阔的句子。',
    imageUrl: 'https://images.unsplash.com/photo-1500534314209-a25ddb2bd429?auto=format&fit=crop&w=1200&q=80',
    imageAlt: '登高远眺的山河景色',
    accent: 'from-orange-950/65 via-sky-950/45 to-slate-950/35',
    links: [
      { label: '搜索资料', url: searchUrl('鹳雀楼 王之涣 登鹳雀楼') },
      { label: '地图导航', url: mapUrl('鹳雀楼') },
    ],
    quickSearches: [
      { label: '登鹳雀楼', query: '登鹳雀楼 王之涣 诗词讲解 儿童' },
      { label: '黄河地理', query: '黄河 中游 地理 小学生' },
    ],
    tasks: [
      { type: 'observe', prompt: '登楼后找到黄河方向，并描述远近景物。' },
      { type: 'quiz', prompt: '为什么“登高”常常会让人想到更远的目标？' },
      { type: 'reflection', prompt: '写一句自己的登楼发现。' },
    ],
  },
  {
    id: 'study-pujindu',
    eventIds: ['day-6-event-4'],
    eventTitle: '蒲津渡遗址',
    theme: '大铁牛和古代工程',
    roleName: '古代工程侦探',
    estimatedMinutes: 15,
    badgeName: '古桥工程徽章',
    story: '蒲津渡的大铁牛和古渡口有关。今天重点看古人如何利用材料、重量和位置解决黄河渡桥问题。',
    imageUrl: 'https://images.unsplash.com/photo-1493246507139-91e8fad9978e?auto=format&fit=crop&w=1200&q=80',
    imageAlt: '河岸与古代工程想象场景',
    accent: 'from-zinc-950/75 via-amber-950/45 to-stone-950/35',
    links: [
      { label: '搜索资料', url: searchUrl('蒲津渡遗址 黄河大铁牛') },
      { label: '地图导航', url: mapUrl('蒲津渡遗址') },
    ],
    quickSearches: [
      { label: '黄河大铁牛', query: '蒲津渡 黄河大铁牛 古代工程' },
      { label: '古代桥梁', query: '古代浮桥 铁牛 原理' },
    ],
    tasks: [
      { type: 'observe', prompt: '观察铁牛的大小、朝向和固定方式。' },
      { type: 'quiz', prompt: '为什么古代桥梁需要这么重的铁牛？' },
      { type: 'reflection', prompt: '说出一个古代工程和现代工程的相同点。' },
    ],
  },
];

export function getStudyCardForEvent(event: TripEvent) {
  if (event.category !== 'spot') return undefined;
  return studyCards.find(
    (card) =>
      card.eventIds.includes(event.id) ||
      event.title.includes(card.eventTitle) ||
      card.eventTitle.includes(event.title) ||
      (event.locationName ? card.eventTitle.includes(event.locationName) || event.locationName.includes(card.eventTitle) : false),
  );
}
