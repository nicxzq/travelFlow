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
    id: string;
    type: StudyTaskType;
    prompt: string;
    referenceAnswer: string;
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
      {
        id: 'huangyadong-observe-terrain',
        type: 'observe',
        prompt: '找到一处能说明“易守难攻”的地形，并说出原因。',
        referenceAnswer: '可以观察入口较窄、两侧崖壁陡立或视野较高的位置：窄口不利于大量人员同时进入，陡坡不易攀爬，高处也更方便观察。请以现场实际看到的地形为准。',
      },
      {
        id: 'huangyadong-observe-canyon',
        type: 'observe',
        prompt: '记录峡谷里的温度、风、水声或岩壁特点。',
        referenceAnswer: '可以记录最明显的一项，例如阴凉感、风沿峡谷吹动、水流声，或岩壁上的风化纹路、水渍和青苔。不同天气下的观察可能不同。',
      },
      {
        id: 'huangyadong-quiz-location',
        type: 'quiz',
        prompt: '为什么兵工厂不建在平原城市？',
        referenceAnswer: '平原城市目标明显，较容易被发现和攻击；山区地形复杂，更便于隐蔽、防守和保护人员物资，但运输也会更困难。',
      },
      {
        id: 'huangyadong-reflection-history',
        type: 'reflection',
        prompt: '用 3 句话讲清“地形如何影响历史”。',
        referenceAnswer: '可以这样组织：太行山地形险要，适合隐蔽和防守；人们利用地形建设兵工厂；自然条件因此影响了人员、物资和历史事件的发展。请用自己的话表达。',
      },
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
      {
        id: 'shenlongwan-road-observe-slow',
        type: 'observe',
        prompt: '观察洞口、弯道和临崖路段，找一个最需要慢行的位置。',
        referenceAnswer: '可以选择视线受遮挡的急弯、洞口或较窄路段，因为这些位置不容易提前看到对面车辆和行人。观察时请始终留在安全位置。',
      },
      {
        id: 'shenlongwan-road-quiz-route',
        type: 'quiz',
        prompt: '为什么挂壁公路常常开在山体侧面，而不是绕远路？',
        referenceAnswer: '在山体侧面开路能够较直接地连接村庄与外界，减少翻山绕行的距离。施工虽然困难，但通车后能明显缩短日常出行时间。',
      },
      {
        id: 'shenlongwan-road-reflection-life',
        type: 'reflection',
        prompt: '说出这条路给山村生活带来的一个改变。',
        referenceAnswer: '可以从上学、看病、运输农产品或与外界往来中选择一点，例如公路让村民出山更快，也让物资进出更方便。',
      },
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
      {
        id: 'shenlongwan-canyon-observe-stones',
        type: 'observe',
        prompt: '找三块形状不同的石头，观察它们是否被水磨圆。',
        referenceAnswer: '可以比较靠近水流和远离水流的石头：经常被水和沙石碰撞的石头，边角往往更圆滑；较少被冲刷的石头可能棱角更明显。',
      },
      {
        id: 'shenlongwan-canyon-quiz-flow',
        type: 'quiz',
        prompt: '水流变急时，为什么更容易搬动沙石？',
        referenceAnswer: '流速加快时，水对沙石的推动和冲击更强，因此能搬动较大、较重的颗粒；缓慢水流通常只能带走较细的泥沙。',
      },
      {
        id: 'shenlongwan-canyon-reflection-water',
        type: 'reflection',
        prompt: '用一句话写下“今天水流告诉我的事”。',
        referenceAnswer: '例如：水流看起来柔软，但长时间冲刷也能磨圆石头、改变河谷。请写下你自己的现场发现。',
      },
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
      {
        id: 'taihang-music-road-observe-speed',
        type: 'observe',
        prompt: '安全坐在车内听旋律，记录车速变化时声音是否变化。',
        referenceAnswer: '可以比较车辆较快和较慢时旋律的节奏与音调。通常车速变化会改变轮胎经过纹路的频率，请只在安全乘坐时听和记录。',
      },
      {
        id: 'taihang-music-road-quiz-sound',
        type: 'quiz',
        prompt: '为什么车轮压过不同间距的纹路会产生不同声音？',
        referenceAnswer: '纹路间距不同，轮胎经过时振动的频率就不同；不同频率会形成不同音调，有规律地排列纹路便能组成旋律。',
      },
      {
        id: 'taihang-music-road-reflection-explain',
        type: 'reflection',
        prompt: '用“路面、轮胎、振动”三个词解释音乐公路。',
        referenceAnswer: '例如：路面上有规律的纹路，轮胎压过时产生振动，振动传入车内后就成了我们听到的声音。',
      },
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
      {
        id: 'hongdong-observe-roots',
        type: 'observe',
        prompt: '找到一处和“寻根”有关的文字或图案。',
        referenceAnswer: '可以寻找“根”字、移民故事、姓氏或祭祖相关内容，记下它出现的位置和表达的意思。请以景区现场标识为准。',
      },
      {
        id: 'hongdong-quiz-memory',
        type: 'quiz',
        prompt: '人们为什么会把一棵树当成共同记忆？',
        referenceAnswer: '明代许多移民曾在洪洞一带集中办理迁移并从这里出发。后代分散各地后，大槐树逐渐成为共同出发点和故乡记忆的象征。',
      },
      {
        id: 'hongdong-reflection-family',
        type: 'reflection',
        prompt: '问家人一个关于老家或姓氏来源的问题。',
        referenceAnswer: '可以问：“我们家以前住在哪里？”“家里知道姓氏或祖辈迁居的故事吗？”记录家人的真实回答；不知道也可以写下准备继续查找的线索。',
      },
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
      {
        id: 'hukou-observe-waterfall',
        type: 'observe',
        prompt: '观察瀑布水流颜色、水雾和声音的变化。',
        referenceAnswer: '可以比较远近位置看到的颜色、水雾和听到的声音。黄河水常因泥沙呈黄褐色，靠近主要落差处通常水雾更明显、声音更响，但请以当天水量和安全观景位置为准。',
      },
      {
        id: 'hukou-quiz-narrow',
        type: 'quiz',
        prompt: '河道变窄时，水流速度为什么会变快？',
        referenceAnswer: '同样多的水要通过更窄的河道时，水流会更加集中，通常速度也会加快。壶口河床骤然收窄和落差共同形成了壮观水势。',
      },
      {
        id: 'hukou-reflection-metaphor',
        type: 'reflection',
        prompt: '用一个比喻描述你看到的黄河。',
        referenceAnswer: '例如把奔涌水流比作“万马奔腾”，把水雾比作“一层白纱”。没有标准答案，请选择最符合你现场感受的比喻。',
      },
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
      {
        id: 'yunqiu-observe-cave',
        type: 'observe',
        prompt: '比较洞内外温度、湿度和光线，记录一个明显差别。',
        referenceAnswer: '可以从温度、湿润感或亮度中选一项比较，例如洞内更冷、更暗。不同季节和位置会有差异，请记录实际感受。',
      },
      {
        id: 'yunqiu-quiz-cold-cave',
        type: 'quiz',
        prompt: '为什么有些洞穴夏天也会很冷？',
        referenceAnswer: '洞穴内部较少受到阳光直接加热，岩层传热慢，空气交换方式也与洞外不同，因此有些洞穴能长期保持较低温度。具体冰洞的形成还与洞体结构和当地气候有关。',
      },
      {
        id: 'yunqiu-reflection-village',
        type: 'reflection',
        prompt: '说出自然景观和村落生活之间的一个联系。',
        referenceAnswer: '可以观察村落是否利用当地石材建房、顺着山势布局，或自然条件怎样影响取水、种植和出行。选择现场能找到证据的一点来写。',
      },
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
      {
        id: 'guandi-observe-decoration',
        type: 'observe',
        prompt: '找一块匾额或一处屋顶装饰，说出它给你的感觉。',
        referenceAnswer: '可以记录匾额文字、飞檐、脊饰或色彩，并写下“庄严、精美、古朴”等真实感受。请以现场实际看到的内容为准。',
      },
      {
        id: 'guandi-quiz-axis',
        type: 'quiz',
        prompt: '为什么庙宇常常按中轴线展开？',
        referenceAnswer: '中轴线布局让主要建筑前后有序、左右相对对称，能够表现庄重和秩序，也方便人们按一定顺序进入和参观。',
      },
      {
        id: 'guandi-reflection-loyalty',
        type: 'reflection',
        prompt: '用一个词解释你理解的“忠义”。',
        referenceAnswer: '可以选择“守信、担当、可靠、重情义”等词，再用一个生活中的小例子说明自己的理解。没有唯一答案。',
      },
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
      {
        id: 'salt-lake-observe-colors',
        type: 'observe',
        prompt: '记录你看到的两种盐湖颜色，并观察太阳角度。',
        referenceAnswer: '记录当天实际看到的颜色，再写下太阳较高、接近日落或被云遮挡等光线条件。颜色会随季节、天气和观察角度变化。',
      },
      {
        id: 'salt-lake-quiz-colors',
        type: 'quiz',
        prompt: '为什么盐湖不同区域可能呈现不同颜色？',
        referenceAnswer: '不同区域的盐度、藻类和其他盐水生物数量可能不同，加上光照和水深差异，会让湖水呈现不同颜色。',
      },
      {
        id: 'salt-lake-reflection-protection',
        type: 'reflection',
        prompt: '说出盐湖从生产到旅游保护的一点变化。',
        referenceAnswer: '可以从“过去重视产盐和资源利用，现在同时发展观光并重视生态保护”来思考，再写下你认为保护和利用怎样平衡。',
      },
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
      {
        id: 'guanque-observe-view',
        type: 'observe',
        prompt: '登楼后找到黄河方向，并描述远近景物。',
        referenceAnswer: '可以借助现场标识确认方向，分别写近处和远处看到的景物。能否直接看到黄河会受天气、视野和观景位置影响。',
      },
      {
        id: 'guanque-quiz-climb',
        type: 'quiz',
        prompt: '为什么“登高”常常会让人想到更远的目标？',
        referenceAnswer: '站得更高时视野通常更开阔，人也更容易想到远方和更大的目标。“欲穷千里目，更上一层楼”就把登高与追求更远联系在一起。',
      },
      {
        id: 'guanque-reflection-discovery',
        type: 'reflection',
        prompt: '写一句自己的登楼发现。',
        referenceAnswer: '例如：“站得更高以后，远近景物的层次更清楚了。”请写你当时最真实的发现，不必照抄。',
      },
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
      {
        id: 'pujindu-observe-iron-oxen',
        type: 'observe',
        prompt: '观察铁牛的大小、朝向和固定方式。',
        referenceAnswer: '可以记录铁牛与人的大小对比、成组排列方式，以及周围铁柱等构件。具体朝向和结构作用请结合现场说明牌判断。',
      },
      {
        id: 'pujindu-quiz-anchor',
        type: 'quiz',
        prompt: '为什么古代桥梁需要这么重的铁牛？',
        referenceAnswer: '这些沉重的铁牛是蒲津浮桥地锚系统的重要组成部分，用来固定连接浮桥的构件，帮助桥梁抵抗黄河水流的冲击。',
      },
      {
        id: 'pujindu-reflection-engineering',
        type: 'reflection',
        prompt: '说出一个古代工程和现代工程的相同点。',
        referenceAnswer: '例如都要选择合适材料、计算受力、保证稳固，并考虑水流和长期使用。可以选一个共同点，用现场构件作证据。',
      },
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
