// 13 题题库 + 章节元数据
// 每题对应一个 src/components/games/Q*.vue 组件

export const chapters = [
  { key: 'wave',     title: '海浪陷阱类', color: '#3B82F6', introVideo: 'images/video/海浪陷阱类危险闯关.mp4' },
  { key: 'creature', title: '海洋生物类', color: '#10B981', introVideo: 'images/video/海洋生物类危险闯关.mp4' },
  { key: 'boat',     title: '渔船活动类', color: '#F59E0B', introVideo: 'images/video/渔船活动类危险闻关.mp4' },
  { key: 'beach',    title: '沙滩游戏类', color: '#EC4899', introVideo: 'images/video/沙滩游戏类危险闯关.mp4' },
  { key: 'weather',  title: '极端天气类', color: '#8B5CF6', introVideo: 'images/video/极端天气类危险闯关.mp4' },
  { key: 'final',    title: '终极忠告',   color: '#EF4444', introVideo: 'images/video/终章.mp4' },
];

export const questions = [
  {
    id: 'Q01',
    chapter: 'wave',
    component: 'Q01_TidalRetreat',
    title: '小强在礁石区捡海螺时，发现海水突然"哗啦啦"后退很远，这时他应该',
    options: [
      { key: 'A', text: '趁机跑向更远处捡贝壳' },
      { key: 'B', text: '立刻横向跑向岸边沙滩' },
      { key: 'C', text: '站在原地等海水回来' },
    ],
    correct: 'B',
    knowledge: '海水异常后退是海啸前兆，必须立刻横向远离海岸跑向高地。',
    gameConfig: { countdown: 5 },
  },
  {
    id: 'Q02',
    chapter: 'wave',
    component: 'Q02_TidePhase',
    title: '渔民谚语"初一十五响午潮"的意思是',
    options: [
      { key: 'A', text: '初一十五会有响声' },
      { key: 'B', text: '初一中午海面最平静' },
      { key: 'C', text: '农历初一(新月)、十五(满月)前后潮位最大' },
    ],
    correct: 'C',
    knowledge: '农历初一(新月)和十五(满月)时，地、月、日三者近似一条直线，引潮力最强，形成"大潮"。',
    gameConfig: { countdown: 25 },
  },
  {
    id: 'Q03',
    chapter: 'creature',
    component: 'Q03_JellyfishSting',
    title: '被水母蜇伤后，玲玲应该立即',
    options: [
      { key: 'A', text: '用淡水冲洗伤口' },
      { key: 'B', text: '拿沙子用力搓皮肤' },
      { key: 'C', text: '用海水冲洗并找大人' },
    ],
    correct: 'C',
    knowledge: '淡水会让水母刺胞释放更多毒液；沙子用力搓会把毒刺压得更深、加重伤口。正确做法：先用海水冲洗伤口，再立刻找大人/拨打 120，绝不能自己挑刺或继续玩水。',
    gameConfig: { countdown: 14 },
  },
  {
    id: 'Q04',
    chapter: 'creature',
    component: 'Generic_IconHotspot',
    title: '礁石缝里发现色彩鲜艳的狮子鱼，你要',
    options: [
      { key: 'A', text: '用树枝轻轻拨开观察' },
      { key: 'B', text: '戴手套抓回家养' },
      { key: 'C', text: '立刻后退并提醒伙伴' },
    ],
    correct: 'C',
    knowledge: '狮子鱼背鳍含强烈神经毒素，毒刺能穿透手套和树枝。正确做法：立刻后退到安全距离，并大声提醒同伴远离。',
    gameConfig: {
      scene: 'images/scenes/q04_lionfish_scene.png',
      countdown: 12,
      coverDesc: '点击图中的图标做出选择',
      icons: [
        // 锚点：A 在狮子鱼洞下方，B 在哪吒脚边，C 在阿丙脚边
        // 留出图标下方约 22px 给常显文字标签
        { key: 'A', src: 'images/icons/q04_branch.png',  top: '70%', left: '22%', size: '54px' },
        { key: 'B', src: 'images/icons/q04_glove.png',   top: '80%', left: '48%', size: '54px' },
        { key: 'C', src: 'images/icons/q04_retreat.png', top: '70%', left: '78%', size: '54px' },
      ],
    },
  },
  {
    id: 'Q05',
    chapter: 'boat',
    component: 'Generic_ImageHotspot',
    title: '上渔船玩耍时，必须做的是',
    options: [
      { key: 'A', text: '把救生衣垫在屁股下当坐垫' },
      { key: 'B', text: '穿好救生衣并扣紧带子' },
      { key: 'C', text: '帮爸爸收渔网证明自己厉害' },
    ],
    correct: 'B',
    knowledge: '救生衣必须穿在身上、扣紧所有带子才能在落水时把人浮起来。垫屁股、不穿、或在船上做大人的危险活儿（如收渔网）都可能让你瞬间落水溺水。',
    gameConfig: {
      image: 'images/scenes/q05_boat_safety.png',
      countdown: 15,
      coverDesc: '点击图中正确做法',
    },
  },
  {
    id: 'Q06',
    chapter: 'boat',
    component: 'Generic_ImageHotspot',
    title: '听到"嘟—嘟—嘟—"三声长螺号代表',
    options: [
      { key: 'A', text: '渔船要返航了' },
      { key: 'B', text: '有人落水急需救援' },
      { key: 'C', text: '发现鱼群聚集区' },
    ],
    correct: 'B',
    knowledge: '在渔村信号中，连续三声长螺号是国际通用的"人员落水、紧急救援"求救信号。听到后应立刻报告大人或拨打 110/120 求救，绝不可下水营救。',
    gameConfig: {
      image: 'images/scenes/q06_horn_signal.png',
      countdown: 15,
      coverDesc: '点击图中正确含义',
    },
  },
  {
    id: 'Q07',
    chapter: 'beach',
    component: 'Generic_ImageHotspot',
    title: '挖沙坑玩时要注意',
    options: [
      { key: 'A', text: '坑深不超过自己膝盖' },
      { key: 'B', text: '和伙伴比赛谁挖得深' },
      { key: 'C', text: '用贝壳装饰坑壁更漂亮' },
    ],
    correct: 'A',
    knowledge: '沙坑深度超过膝盖就有坍塌掩埋的风险——比赛挖深、装饰坑壁都会让你在不知不觉中越挖越深。安全规则：坑深永远不超过自己的膝盖。',
    gameConfig: {
      image: 'images/scenes/q07_sand_pit.png',
      countdown: 15,
      coverDesc: '点击图中安全做法',
    },
  },
  {
    id: 'Q08',
    chapter: 'beach',
    component: 'Q08_FlamingoRing',
    title: '充气火烈鸟泳圈适合用在',
    options: [
      { key: 'A', text: '码头附近的深水区' },
      { key: 'B', text: '浪小的浅水区且有大人看护' },
      { key: 'C', text: '台风天挑战巨浪' },
    ],
    correct: 'B',
    knowledge: '充气泳圈只是玩具不是救生设备，一阵风浪就会把人带向远海。它只能在浪小、水浅且有大人看护的浅水区使用，深水和台风海绝不能用。',
    gameConfig: {
      background: 'images/scenes/q08_water_zones.png',
      ringIcon: 'images/icons/q08_flamingo_ring.png',
      successImage: 'images/scenes/q08_success_pool.png',
      countdown: 15,
      coverDesc: '把火烈鸟泳圈拖到适合的水域',
    },
  },
  {
    id: 'Q09',
    chapter: 'weather',
    component: 'Generic_ImageHotspot',
    title: '海面突然出现长长的白色泡沫带，说明',
    options: [
      { key: 'A', text: '有轮船漏洗衣粉了' },
      { key: 'B', text: '可能要发生海啸' },
      { key: 'C', text: '鱼群在水下吐泡泡' },
    ],
    correct: 'B',
    knowledge: '海啸来临前，海水会先剧烈倒退再涌回，海面常出现一条长长的白色泡沫带——这是水底剧烈扰动的信号。看到后必须立刻远离海岸，跑向高处，不要去水边围观。',
    gameConfig: {
      image: 'images/scenes/q09_foam_band.png',
      countdown: 15,
      coverDesc: '点击图中正确判断',
    },
  },
  {
    id: 'Q10',
    chapter: 'weather',
    component: 'Q10_DawnOmen',
    title: '爷爷说"朝霞不出门"是因为',
    options: [
      { key: 'A', text: '朝霞预示白天可能变天' },
      { key: 'B', text: '太阳升起前不能赶海' },
      { key: 'C', text: '朝霞会晒伤皮肤' },
    ],
    correct: 'A',
    knowledge: '"朝霞不出门，晚霞行千里"——东方天空的红霞往往是西边低压系统逼近的征兆，预示当天天气将转坏，不宜出海。',
    gameConfig: {
      dawnImage: 'images/scenes/q10_dawn_calm.png',
      countdown: 18,
      coverDesc: '看朝霞猜爷爷的话——选完会自动快进时光，看天气真的怎么变',
    },
  },
  {
    id: 'Q11',
    chapter: 'final',
    component: 'Q11_ThreeNos',
    title: '海边玩必须遵守的"三不原则"',
    options: [
      { key: 'A', text: '不单独下海' },
      { key: 'B', text: '不隐瞒受伤' },
      { key: 'C', text: '不炫耀泳技' },
      { key: 'D', text: '不听天气预报' },
    ],
    correct: ['A', 'B', 'C'],
    knowledge: '"三不原则"是不单独下海、不隐瞒受伤、不炫耀泳技。"不听天气预报"恰恰相反——出海前认真听天气预报才能避开风暴，是一定要做的事。',
    gameConfig: {
      sceneImage: 'images/scenes/q11_three_nos.png',
      countdown: 25,
      coverDesc: '依次盖出三个红"不"字大印——盖错的话就要从头再来！',
    },
  },
  {
    id: 'Q12',
    chapter: 'final',
    component: 'Q12_DockRescue',
    title: '发现伙伴溺水时，你要',
    options: [
      { key: 'A', text: '立刻跳下水救人' },
      { key: 'B', text: '大喊并抛漂浮物' },
      { key: 'C', text: '找长杆或绳子施救' },
      { key: 'D', text: '跑去叫专业救援' },
    ],
    correct: ['B', 'C', 'D'],
    knowledge: '小孩绝不能下水救人——你也会被拖下去！正确做法是岸上施救三步：①大喊呼救并抛救生圈/泡沫块 ②递长竹竿或抛绳子让对方抓住 ③立刻跑去叫大人或拨打110/120请专业救援。',
    gameConfig: {
      scene: 'images/scenes/q12_dock_rescue.png',
      countdown: 18,
      coverDesc: '从码头上拿起 3 件救命工具扔向小伙伴——千万别自己跳下去！',
      // 4 个道具的位置（百分比，相对场景图）+ 飞行目标点（溺水者位置）
      items: [
        { key: 'A', src: 'images/icons/q12_goggles.png',   top: '78%', left: '8%',  size: '54px', label: '游泳镜' },
        { key: 'B', src: 'images/icons/q12_lifesaver.png', top: '78%', left: '24%', size: '60px', label: '救生圈' },
        { key: 'C', src: 'images/icons/q12_pole.png',      top: '62%', left: '12%', size: '72px', label: '长竹竿' },
        { key: 'D', src: 'images/icons/q12_walkie.png',    top: '62%', left: '28%', size: '52px', label: '对讲机' },
      ],
      // 溺水者中心位置（道具飞行的目标）
      victim: { top: '52%', left: '70%' },
    },
  },
  {
    id: 'Q13',
    chapter: 'final',
    component: 'Q13_BadgeOath',
    title: '成为"安全小卫士"需要',
    options: [
      { key: 'A', text: '把知识教给弟弟妹妹' },
      { key: 'B', text: '发现危险区域插警示牌' },
      { key: 'C', text: '每周检查家里救生装备' },
      { key: 'D', text: '台风天直播冲浪' },
    ],
    correct: ['A', 'B', 'C'],
    knowledge: '安全小卫士是把知识传给身边人、发现危险主动警示、定期检查救生装备的小英雄。"台风天直播冲浪"是把生命当流量的极端炫耀，绝不可学。',
    gameConfig: {
      medalImage: 'images/scenes/q13_medal_frame.png',
      countdown: 25,
      coverDesc: '依次嵌入三枚正确能力徽章，点亮"安全小卫士"勋章——别碰那枚危险的诱饵！',
      // 3 个空槽位置（百分比，相对勋章背景图，与 AI 图三角槽位对齐）
      slots: [
        { top: '35%', left: '50%' },  // 顶部
        { top: '65%', left: '35%' },  // 左下
        { top: '65%', left: '65%' },  // 右下
      ],
      // 4 张能力徽章卡（底部托盘）
      badges: [
        { key: 'A', src: 'images/icons/q13_teach.png',         label: '传授知识' },
        { key: 'B', src: 'images/icons/q13_warning_sign.png',  label: '插警示牌' },
        { key: 'C', src: 'images/icons/q13_checklist.png',     label: '检查装备' },
        { key: 'D', src: 'images/icons/q13_typhoon_surf.png',  label: '直播冲浪' },
      ],
      finalTitle: '安全小卫士 · 哪吒',
    },
  },
];

export function getQuestion(id) {
  return questions.find(q => q.id === id);
}

export function getNextQuestionId(currentId) {
  const idx = questions.findIndex(q => q.id === currentId);
  return idx >= 0 && idx < questions.length - 1 ? questions[idx + 1].id : null;
}

// 当前题是否为本章节的第一题（用于触发章节开场视频）
export function isFirstOfChapter(currentId) {
  const idx = questions.findIndex(q => q.id === currentId);
  if (idx === -1) return false;
  const prev = questions[idx - 1];
  return !prev || prev.chapter !== questions[idx].chapter;
}

export function getChapter(key) {
  return chapters.find(c => c.key === key);
}
