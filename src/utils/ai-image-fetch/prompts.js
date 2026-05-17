// 13 题的 AI 生图 prompt 模板
// 统一 STYLE_PREFIX + STYLE_SUFFIX 保证风格一致
//
// prompt 条目可以是两种格式：
//   1. 字符串：纯文生图
//   2. 对象 { prompt: string, references: string[] }：图生图，把参考图喂给模型
//      references 是相对 PROJECT_ROOT 的路径

const STYLE_PREFIX = `
Chinese opera (Peking opera) style chibi illustration,
hand-drawn watercolor texture, vibrant red/blue/gold color palette,
traditional opera makeup and headdress on characters,
child-friendly cute proportions, flat design with soft shadows,
big eyes, expressive faces.
`.trim();

const STYLE_SUFFIX = `
Consistent character design matching the reference image style closely.
No text, no watermark, no signature.
Clean composition, isolated subject. 1024x1024.
`.trim();

const wrap = (subject) => `${STYLE_PREFIX}\n\n${subject}\n\n${STYLE_SUFFIX}`;

// 三宫格场景生成器：一张图分成上中下三个等高面板，每个面板底部带选项文字牌
// panels: [{ scene: string, text: string }, ...]  恰好 3 条
const TRIPTYCH_SUFFIX = `
Layout: single 1024x1024 illustration split into THREE equal horizontal panels,
stacked top-to-bottom (A on top, B in middle, C on bottom), separated by
thin gold opera-style decorative bands.
Unified background color tone across panels so it reads as one artwork.
Each panel keeps its action centered with breathing room.

Text plaques: at the bottom of each panel, render the EXACT Chinese text
specified in large bold legible printed Chinese characters
on a semi-transparent dark-red plaque with thin gold border.
Text must be perfectly clear, no garbled or decorative ligatures,
no extra characters, no English, no pinyin.

No other text, no watermark, no signature.
`.trim();

function wrapTriptych(panels, extraNotes = '') {
  if (!Array.isArray(panels) || panels.length !== 3) {
    throw new Error('wrapTriptych: panels must be an array of exactly 3 items');
  }
  const [a, b, c] = panels;
  const body = `
Top panel (Option A): ${a.scene.trim()}
Text plaque at the bottom of the top panel reads exactly: "${a.text}"

Middle panel (Option B): ${b.scene.trim()}
Text plaque at the bottom of the middle panel reads exactly: "${b.text}"

Bottom panel (Option C): ${c.scene.trim()}
Text plaque at the bottom of the bottom panel reads exactly: "${c.text}"

${extraNotes.trim()}
`.trim();
  return `${STYLE_PREFIX}\n\n${body}\n\n${TRIPTYCH_SUFFIX}`;
}

// 田字格场景生成器：一张图分成 2x2 四个等大面板，
// 用于 Q11-Q13 多选题（A/B/C/D 四种行为同框对照）
const QUAD_SUFFIX = `
Layout: single 1024x1024 illustration split into FOUR equal panels in a
2x2 grid (top-left = A, top-right = B, bottom-left = C, bottom-right = D),
separated by a thin gold opera-style cross divider through the middle.
Unified background color tone across all four panels so it reads as one
artwork. Each panel keeps its action centered with breathing room.

Text plaques: at the bottom of each panel, render the EXACT Chinese text
specified in large bold legible printed Chinese characters
on a semi-transparent dark-red plaque with thin gold border.
Text must be perfectly clear, no garbled or decorative ligatures,
no extra characters, no English, no pinyin.

No other text, no watermark, no signature.
`.trim();

function wrapQuad(panels, extraNotes = '') {
  if (!Array.isArray(panels) || panels.length !== 4) {
    throw new Error('wrapQuad: panels must be an array of exactly 4 items');
  }
  const [a, b, c, d] = panels;
  const body = `
Top-left panel (Option A): ${a.scene.trim()}
Text plaque at the bottom of this panel reads exactly: "${a.text}"

Top-right panel (Option B): ${b.scene.trim()}
Text plaque at the bottom of this panel reads exactly: "${b.text}"

Bottom-left panel (Option C): ${c.scene.trim()}
Text plaque at the bottom of this panel reads exactly: "${c.text}"

Bottom-right panel (Option D): ${d.scene.trim()}
Text plaque at the bottom of this panel reads exactly: "${d.text}"

${extraNotes.trim()}
`.trim();
  return `${STYLE_PREFIX}\n\n${body}\n\n${QUAD_SUFFIX}`;
}

// 角色参考图：群像（风格基调）+ 各自单人特写（精确外貌）
const GROUP_REF = 'scripts/references/character_design.png';
const NEZHA_REFS = [GROUP_REF, 'scripts/references/nezha_solo.png'];
const MAZU_REFS = [GROUP_REF, 'scripts/references/mazu_solo.png'];
const AOBING_REFS = [GROUP_REF, 'scripts/references/aobing_solo.png'];

// 三个主角的统一外貌锚点（嵌进每个角色 prompt 里，保持跨图一致）
const NEZHA_LOOK = `
Nezha character (refer to the solo reference image with the spear):
chibi child warrior, fierce determined expression,
black hair pulled up into two flower-bun tufts on top of head
decorated with bright pink peony flower clusters,
sharp opera-style red eye makeup with upturned outer corners,
red bindi dot on forehead, rosy cheeks,
red sleeveless cropped top (Chinese 肚兜 style),
golden yellow silk sash tied at waist with long trailing ends,
red knee-length pants, fire-wheel motifs at the feet.
`.trim();

const MAZU_LOOK = `
Mazu goddess character (the left figure in the reference image):
chibi girl with closed peaceful smiling eyes, gentle expression,
wearing a tall golden tasseled imperial crown decorated with red flowers,
pearls, and a row of black-and-white circular beaded ornaments hanging
across the forehead, red opera robe with golden ribbon tied at neck,
pink floral patterned underlayer.
`.trim();

const AOBING_LOOK = `
Aobing dragon prince character (the right figure in the reference image):
chibi boy with short black hair, red bindi dot on forehead, slight smirk,
wearing a silver-blue opera crown decorated with white pearl-flower
medallions, hanging pearls, and small red flower clusters at temples,
white robe with pale blue dragon-wave patterns and curling cloud motifs.
`.trim();

export const prompts = {
  // === 角色（3 主角，多姿势） ===
  'characters/nezha_idle': {
    prompt: wrap(`
      ${NEZHA_LOOK}
      Pose: standing confidently with arms crossed in front of chest,
      looking forward, slight smirk. Full body, front view, empty hands.
    `),
    references: NEZHA_REFS,
  },
  'characters/nezha_run': {
    prompt: wrap(`
      ${NEZHA_LOOK}
      Pose: running sideways urgently, one arm forward one back,
      golden sash and red ribbons trailing behind, motion lines,
      alarmed widened eyes. Full body, side view, empty hands.
    `),
    references: NEZHA_REFS,
  },
  'characters/nezha_fall': {
    prompt: wrap(`
      ${NEZHA_LOOK}
      Pose: comedic opera-style falling backwards on the ground,
      dizzy spiral eyes, cartoon yellow stars circling around head,
      golden sash and red ribbons scattered. Full body, empty hands.
    `),
    references: NEZHA_REFS,
  },

  'characters/mazu_idle': {
    prompt: wrap(`
      ${MAZU_LOOK}
      Pose: standing gracefully facing forward, hands clasped at waist,
      serene smile. Full body, front view.
    `),
    references: MAZU_REFS,
  },
  'characters/mazu_hurt': {
    prompt: wrap(`
      ${MAZU_LOOK}
      Pose: looking at her left arm in worried shock, arm showing
      red swelling jellyfish sting marks, slight tears in eyes,
      eyes now open with concern. Full body.
    `),
    references: MAZU_REFS,
  },

  // === Q03 场景图：玲玲在沙滩被水母蜇伤的完整故事画面 ===
  'characters/linglin_hurt': {
    prompt: wrap(`
      A complete narrative SCENE illustration that tells the story of
      Question 3 — "被水母蜇伤后，玲玲应该立即怎么做". Square 1024x1024
      composition that fully fills the canvas with a beach-and-shallow-
      water scene (NO white background, NO transparent background).

      SETTING:
      - Foreground: warm golden sandy beach with a few seashells and
        scattered tiny pebbles, soft footprints in the sand.
      - Middle ground / right side: the edge of calm clear turquoise
        shallow sea water lapping gently onto the sand, water only
        ankle-deep visible.
      - Background: soft warm afternoon sky with light pastel clouds,
        a hint of distant horizon line.
      - Color palette: warm golden-orange sand + soft turquoise water,
        matching the existing opera-style game palette.

      CENTRAL CHARACTER — Linglin (small girl, opera chibi style,
      MUST match the same Chinese opera Peking-opera chibi style as
      the reference character_design.png image):
      - Sitting on the sand near the water's edge, body slightly turned
        toward the camera. Her right hand rests behind her on the sand
        for support. Her LEFT arm is extended forward and clearly
        visible to the viewer, palm facing slightly up, showing her
        forearm prominently in the center area of the canvas.
      - On that LEFT FOREARM there is a clearly visible bright RED
        swollen jellyfish sting wound — a cluster of red welts with
        small bumps and a soft red glow around it. This wound must be
        clearly readable as the focal point of the image, large enough
        to be tapped/targeted (size roughly 15% of canvas width).
      - Face: pained worried tearful expression, eyebrows furrowed up
        in the middle, glistening tears welling in big almond eyes,
        small mouth slightly open in a pained "uu" expression.
      - Look: about 8 years old, black hair in two side pigtails with
        small red silk ribbon bows, opera-style rosy cheeks + subtle
        red outer-corner eye accent + tiny red bindi dot, child-sized
        pink 肚兜 top with gold-trimmed embroidered peony pattern,
        short jade-green silk skirt, white leggings, small embroidered
        cloth shoes.

      STORY CONTEXT (visually reinforce the question):
      - In the shallow water to her right, a translucent pale-blue
        moon jellyfish is floating just at the surface with long
        ribbon-like tentacles trailing — clearly the culprit that
        stung her.
      - On the sand near her right side: a small bamboo bucket of
        seashells tipped over (suggesting she dropped it when stung).

      COMPOSITION RULES:
      - Linglin's body occupies roughly the LEFT-CENTER 60% of the
        canvas; the water + jellyfish are on the RIGHT 40%.
      - Her wounded LEFT FOREARM should be in approximately the
        horizontal center of the canvas at about 50-60% vertical
        position — easy to locate as a drag target.
      - Camera at eye-level, slight three-quarter angle, no awkward
        cropping; whole character body visible from head to feet.
      - Soft warm late-afternoon lighting, gentle drop shadow under
        the character on the sand.

      Style: Chinese opera (Peking opera) chibi illustration,
      hand-drawn watercolor texture, consistent with the rest of the
      game artwork. NO TEXT, no captions, no UI elements anywhere.
    `),
    references: [GROUP_REF],
  },

  'characters/aobing_idle': {
    prompt: wrap(`
      ${AOBING_LOOK}
      Pose: standing heroically facing forward, one hand on hip,
      confident slight smile. Full body, front view.
    `),
    references: AOBING_REFS,
  },

  // === 场景背景 ===
  'scenes/wave_reef': wrap(`
    Coastal scene: rocky reef foreground with retreating seawater,
    distant beach on the right side, sky in the morning.
    Chinese ink-wash watercolor waves, no characters.
    Composition leaves center space for character placement.
  `),
  'scenes/wave_tsunami': wrap(`
    A massive tsunami wave crashing from the left side, dark blue and white,
    Chinese ink-wash dragon-like wave silhouette in the wave crest.
    Dramatic disaster scene, no characters.
  `),
  'scenes/beach': wrap(`
    A peaceful beach scene with golden sand, calm blue sea,
    small fishing boats in distance, sunny sky.
    Chinese watercolor style, no characters.
  `),
  'scenes/boat_deck': wrap(`
    First-person view from a small fishing boat deck,
    wooden planks, life jacket hanging on the side, fishing nets.
    Watercolor style, calm sea visible.
  `),
  'scenes/reef_underwater': wrap(`
    Underwater rocky crevice scene with colorful coral,
    a vivid red-striped lionfish hiding in the crack.
    Chinese watercolor style, danger atmosphere.
  `),
  'scenes/storm_sky': wrap(`
    Dramatic sky with morning red glow (sunrise) followed by
    dark storm clouds gathering, Chinese ink-wash dragon shape in clouds.
    No characters.
  `),

  // === 道具 ===
  'props/life_jacket': wrap(`
    Orange life jacket icon, opera-style decorative buckles in gold,
    isolated on transparent background.
  `),
  'props/sand_shovel': wrap(`
    Cute toy sand shovel, red handle with opera-style golden patterns,
    isolated on transparent background.
  `),
  'props/swim_ring': wrap(`
    Pink flamingo-shaped inflatable swim ring,
    isolated on transparent background.
  `),
  'props/jellyfish': wrap(`
    A translucent blue jellyfish illustration with long tentacles,
    Chinese ink-wash style, isolated on transparent background.
  `),
  'props/lion_fish': `
    A realistic photograph of a lionfish (Pterois volitans),
    with its iconic long fan-like venomous pectoral fins and bold red-white-brown vertical stripes,
    sharp dorsal spines extending upward, side profile view, mouth slightly open,
    swimming in clear water, soft natural underwater lighting, sharp focus,
    high detail on stripes and fin rays, photo-realistic, 4K quality.
    Isolated subject on a clean blurred dark blue underwater background,
    no text, no watermark.
  `.trim(),
  'props/freshwater_bottle': wrap(`
    A clear water bottle labeled "淡水" (freshwater), opera decorative label.
  `),
  'props/seawater_bottle': wrap(`
    A blue water bottle labeled "海水" (seawater), opera decorative label.
  `),
  'props/phone': wrap(`
    A vintage red emergency phone with opera-style gold patterns.
  `),
  'props/horn': wrap(`
    A traditional conch shell horn, golden with opera decorative bands.
  `),
  'props/moon_new': wrap(`
    Single new moon (almost dark moon with thin glowing edge),
    Chinese opera ink-wash style with red & gold decorative cloud border,
    isolated centered on transparent / clean background, icon design.
  `),
  'props/moon_crescent': wrap(`
    Single crescent moon icon, curved like a slim banana shape,
    glowing gold colored, Chinese opera ink-wash style,
    with red and gold cloud pattern border decoration,
    centered isolated icon on plain background.
  `),
  'props/moon_half': wrap(`
    Single first-quarter (half) moon, right half illuminated bright gold,
    Chinese opera ink-wash style with red & gold decorative cloud border,
    isolated centered on transparent / clean background, icon design.
  `),
  'props/moon_full': wrap(`
    Single bright full moon glowing golden,
    Chinese opera ink-wash style with red & gold decorative cloud border,
    isolated centered on transparent / clean background, icon design.
  `),
  'props/scrape_card': wrap(`
    A rigid plastic scraper card (like a credit card) used for removing
    jellyfish tentacles, opera-style red and gold decorative edge,
    isolated on transparent background, icon design.
  `),

  // === 特效 ===
  'effects/red_sleeve': wrap(`
    Red Peking opera water sleeve (long flowing red silk sleeve)
    sweeping diagonally across frame, semi-transparent edges.
  `),
  'effects/dragon_king': wrap(`
    Mythical Chinese dragon king face emerging from clouds,
    dramatic, opera mask style.
  `),
  'effects/gold_stamp': wrap(`
    Round golden seal with red center, opera style,
    Chinese character "中" in the center.
  `),

  // === Q04 单题：场景图 + 3 个透明 PNG 图标（前端定位 + 点击判定） ===
  'scenes/q04_lionfish_scene': {
    prompt: wrap(`
      ${NEZHA_LOOK}
      ${AOBING_LOOK}
      Underwater rocky reef scene viewed from the side, dappled blue sunlight
      filtering through water, soft bubbles rising. In the LEFT-CENTER of the
      composition, a vivid red-and-white striped lionfish (狮子鱼) hides in a
      dark rocky crevice with its venomous fan-like spines spread out, faint
      red danger glow around it. The Nezha chibi character stands on the reef
      floor in the MIDDLE of the scene, facing the lionfish from the right side
      with a curious yet cautious expression, body slightly leaning forward.
      The Aobing chibi character stands a bit behind Nezha on the right,
      looking at the same direction, one hand mid-gesture as if about to
      speak.
      Leave clean breathing room (low-detail water/sand) in three areas where
      tap targets will be overlaid: (1) lower-left near the lionfish,
      (2) center near Nezha's outstretched hand, (3) right side near Aobing.
      No icons, no UI elements, no text, no watermark in the image itself.
    `),
    references: [GROUP_REF, 'scripts/references/nezha_solo.png', 'scripts/references/aobing_solo.png'],
  },

  // 三个动作图标：扁平 emoji 风，透明背景，单色描边 + 简单填色
  'icons/q04_branch': wrap(`
    Single flat vector-style icon of a small wooden tree branch with two
    green leaves, slightly diagonal, friendly cartoon look,
    bold dark outline, simple fill colors (warm brown branch + bright
    green leaves), no shading detail, no texture noise.
    Centered subject, fully transparent background, square 1024x1024
    composition with the icon occupying ~70% of the canvas. Sticker style.
  `),
  'icons/q04_glove': wrap(`
    Single flat vector-style icon of a thick yellow rubber/work glove
    facing palm-out with five fingers spread, friendly cartoon look,
    bold dark outline, simple two-tone fill (bright yellow with darker
    yellow shadow), no texture noise.
    Centered subject, fully transparent background, square 1024x1024
    composition with the icon occupying ~70% of the canvas. Sticker style.
  `),
  'icons/q04_retreat': wrap(`
    Single flat vector-style icon: a waving cartoon hand with a backward-pointing
    arrow curving behind it, signifying "step back and warn",
    bold dark outline, simple fill colors (skin-tone hand + bright red
    arrow), friendly cartoon look, no shading detail, no texture noise.
    Centered subject, fully transparent background, square 1024x1024
    composition with the icon occupying ~70% of the canvas. Sticker style.
  `),

  'scenes/q05_boat_safety': {
    prompt: wrapTriptych([
      {
        scene: `
          The Nezha chibi character sitting on a wooden fishing-boat deck
          using a bright orange life jacket as a cushion under his bottom
          (jacket clearly NOT worn on body, lying flat under him),
          legs crossed, looking carefree and unaware of the danger,
          ocean waves visible behind the boat railing.
        `,
        text: '把救生衣垫在屁股下当坐垫',
      },
      {
        scene: `
          The Nezha chibi character standing upright on a fishing-boat deck,
          wearing a bright orange life jacket properly on his body with all
          buckles and straps clearly fastened tight across chest and waist,
          giving a confident thumbs-up, calm sunny sea behind the railing.
        `,
        text: '穿好救生衣并扣紧带子',
      },
      {
        scene: `
          The Nezha chibi character on a fishing-boat deck struggling to pull
          in a heavy wet fishing net (much bigger than himself), losing balance,
          a tall fisherman father in opera-style clothes nearby looking alarmed,
          rough sea behind, danger atmosphere.
        `,
        text: '帮爸爸收渔网证明自己厉害',
      },
    ]),
    references: NEZHA_REFS,
  },

  'scenes/q06_horn_signal': {
    prompt: wrapTriptych([
      {
        scene: `
          A calm sunset harbor scene with fishing boats sailing back toward the
          dock, a fisherman on the lead boat holding a big golden conch horn
          giving one short happy honk, seagulls in the orange sky, baskets of
          fish on deck. Peaceful "coming home" atmosphere.
        `,
        text: '渔船要返航了',
      },
      {
        scene: `
          Open sea scene with rough waves, a person fallen into the water
          (only head and waving arm visible above the waves with a help bubble),
          a fishing boat nearby where a fisherman blows three loud long blasts
          on a big golden conch horn (clearly show three concentric sound waves),
          another villager pointing urgently at the water, alarmed dramatic
          atmosphere, red SOS feeling.
        `,
        text: '有人落水急需救援',
      },
      {
        scene: `
          Daytime open sea scene, a school of silver fish swirling beneath the
          surface visible as a dense glittering mass, a fisherman on his boat
          excitedly blowing a conch horn while pointing at the fish school,
          other boats steering toward him, sunny calm "good catch" atmosphere.
        `,
        text: '发现鱼群聚集区',
      },
    ]),
    references: NEZHA_REFS,
  },

  'scenes/q07_sand_pit': {
    prompt: wrapTriptych([
      {
        scene: `
          The Nezha chibi character standing happily inside a small shallow
          round sand pit on a sunny beach, the sand level reaching exactly
          his knees (clearly visible knee-height marker), holding a small
          plastic shovel, giving a thumbs-up. Safe cheerful atmosphere.
        `,
        text: '坑深不超过自己膝盖',
      },
      {
        scene: `
          Two chibi children (Nezha and a friend with similar opera-style
          look) energetically competing in two side-by-side deep sand pits,
          both pits already much deeper than their own height, only their
          heads visible, walls of one pit cracking and starting to collapse,
          sand falling, scared expressions, tense competitive atmosphere.
        `,
        text: '和伙伴比赛谁挖得深',
      },
      {
        scene: `
          The Nezha chibi character on his knees gluing colorful seashells
          and starfish onto the inner walls of a sand pit to decorate it,
          but the pit itself has already been dug well past his waist depth
          (clearly too deep), absorbed in decoration unaware of the danger,
          dappled sunlight on beach.
        `,
        text: '用贝壳装饰坑壁更漂亮',
      },
    ]),
    references: NEZHA_REFS,
  },

  // Q08 用作"拖到正确区域"的小游戏背景：一张图，三横区分三种水域
  'scenes/q08_water_zones': {
    prompt: wrap(`
      Single 1024x1024 illustration split into THREE equal horizontal zones
      stacked top-to-bottom (no text, no UI elements, no characters), separated
      by thin gold opera-style decorative bands.

      TOP zone: a fishing harbor pier scene from above; deep dark-blue sea
      water lapping against weathered wooden dock pillars and a moored fishing
      boat; visible sea depth gradient from teal to dark navy; lonely empty
      atmosphere, no people.

      MIDDLE zone: a sunny shallow swimming pool seen from above; clear
      turquoise water with the smiling Mazu goddess chibi adult sitting at
      the poolside watching attentively (gentle parent presence), sun
      umbrellas and sand toys around; safe cheerful daylight.

      BOTTOM zone: a stormy ocean scene; dark grey sky with lightning bolts,
      enormous black waves with white crests crashing, heavy rain streaks,
      red typhoon warning flag whipping in the wind; dangerous dramatic
      atmosphere, no people.

      Unified illustration style across the three zones so it reads as one
      artwork. No text overlays, no captions, no characters in top or bottom
      zones (only the adult Mazu in middle zone).
    `),
    references: [GROUP_REF, 'scripts/references/mazu_solo.png'],
  },

  // 火烈鸟泳圈图标：透明背景，玩家从托盘里拖出来
  'icons/q08_flamingo_ring': wrap(`
    Single flat vector-style icon of a pink inflatable flamingo pool float
    swim ring viewed from a slight 3/4 top angle: a circular pink ring with
    a cute cartoon flamingo head + curved neck rising from one side,
    white belly, orange beak, big friendly eye, bright pink body,
    bold dark outline, simple two-tone fill (bright pink + light pink
    shadow), friendly cartoon look, no shading detail, no texture noise.
    Centered subject, fully transparent background, square 1024x1024
    composition with the icon occupying ~75% of the canvas. Sticker style.
  `),

  // Q08 答对后的庆祝画面：哪吒坐在火烈鸟泳圈上，在妈祖看护的浅水池里玩水
  'scenes/q08_success_pool': {
    prompt: wrap(`
      Single 1024x1024 cheerful celebratory illustration: a sunny shallow
      backyard-style swimming pool with clear bright turquoise water and a
      sandy poolside.

      In the very center of the pool: chibi Nezha boy floating happily on a
      large pink inflatable flamingo swim ring (the flamingo head with
      curved neck rises behind him), arms raised in a victorious cheer,
      big proud smile, water splashing playfully around him.

      Standing at the poolside on the right: chibi adult Mazu goddess
      smiling warmly with one hand raised in a thumbs-up gesture, watching
      and protecting him.

      Background details: a yellow sun umbrella, a small beach ball,
      sand toys, a few floating petals, soft sun rays from the upper-left
      corner, golden sparkle particles in the air to convey "correct
      answer" celebration.

      Bright cheerful daylight color palette (turquoise pool, warm yellow
      sun, pink flamingo, soft pastel poolside). No text, no captions,
      no UI elements. Square 1024x1024 composition with the scene
      filling the canvas edge-to-edge.
    `),
    references: [GROUP_REF, 'scripts/references/nezha_solo.png', 'scripts/references/mazu_solo.png'],
  },

  'scenes/q09_foam_band': {
    prompt: wrapTriptych([
      {
        scene: `
          A funny cartoon ocean view: a big container ship with a leaky
          hole in its side spilling out a long stream of pure-white laundry
          detergent foam onto the sea, a giant box labeled with a soap-bubble
          icon (no text) tilted on the deck, a few seagulls puzzled,
          bright sunny silly atmosphere.
        `,
        text: '有轮船漏洗衣粉了',
      },
      {
        scene: `
          A dramatic ocean view from a beach: the sea has retreated abnormally
          far revealing wet sand and stranded fish, a long ominous white foam
          band stretches across the entire horizon, dark thick clouds gathering,
          red TSUNAMI warning flag whipping on the shore, the Nezha chibi
          character running urgently away from the water toward higher ground,
          alarmed expression. Tense dangerous atmosphere.
        `,
        text: '可能要发生海啸',
      },
      {
        scene: `
          A peaceful underwater-cross-section ocean view: a happy school of
          colorful chibi cartoon fish underwater blowing many round bubbles
          upward, the bubbles rising to the surface and forming a soft
          short white foamy patch, calm sunny shallow blue water, playful
          friendly atmosphere.
        `,
        text: '鱼群在水下吐泡泡',
      },
    ]),
    references: NEZHA_REFS,
  },

  // Q10 时光快进游戏的初始画面：宁静朝霞，将由 CSS 动画转为暴风雨
  'scenes/q10_dawn_calm': {
    prompt: wrap(`
      Single 1024x1024 illustration, peaceful early dawn scene over the ocean.

      Top 65% of the canvas: a vast dramatic dawn sky completely filled
      with vivid glowing red, orange and pink clouds (朝霞), the sun just
      rising at the horizon casting golden rays through the clouds.
      Rich saturated warm colors, beautiful but with a subtle hint of
      drama — light wispy high cirrus streaks. The sky is the main hero
      of the composition, intentionally taking most of the frame so it
      can later be visually transformed.

      Bottom 35% of the canvas: a calm dawn sea reflecting the red sky
      with gentle ripples; a small wooden fishing boat tied at a short
      stone pier on the right side; on the left foreground beach, the
      chibi Nezha boy stands next to a chibi elderly fisherman grandpa
      (long white beard, straw hat, weathered short red robe, sandals,
      kind wrinkled face); both look up at the colorful sky with curious
      expressions, grandpa stroking his beard thoughtfully.

      Quiet anticipatory atmosphere — the kind of suspiciously beautiful
      morning that tricks fishermen into going out. Soft volumetric
      light rays, opera-illustrated style consistent with the rest of
      the game. No text, no captions, no UI elements. Edge-to-edge
      composition with strong horizon line at 35% from bottom.
    `),
    references: NEZHA_REFS,
  },

  // ===========================================================================
  // 章节过场视频用的「首尾帧」（喂给海螺 AI 做图生视频）
  // 每个章节 2 张图：frame_start = 平静起点；frame_end = 危险/转折时刻
  // 视频在两帧之间过渡，作为进入新章节的预告
  // ===========================================================================

  // —— 第一章·海浪陷阱类（Q01-Q02）：海啸前的退潮欺骗 ——
  'video-img/wave/cover': {
    prompt: wrap(`
      Cinematic wide-angle illustration: a sunny calm beach with a rocky
      tidal zone in the foreground; chibi Nezha boy crouching on the
      wet rocks with a small bamboo bucket, happily picking up sea
      shells, completely relaxed and smiling. The sea behind him is at
      normal tide level, gentle small waves lapping against the rocks.
      Bright clear blue sky with a few white clouds. Composition has
      lots of empty horizon space so a tsunami can later appear.
      Square 1024x1024, edge-to-edge composition, opera-illustrated
      style. No text, no captions.
    `),
    references: NEZHA_REFS,
  },

  // —— 第二章·海洋生物类（Q03-Q04）：美丽下的毒刺 ——
  'video-img/creature/cover': {
    prompt: wrap(`
      Cinematic close-up illustration of a sunlit coral reef tide pool:
      crystal-clear shallow water reveals colorful staghorn coral, pink
      anemones, tiny tropical fish swimming peacefully. Chibi Nezha boy
      lying belly-down on a flat rock at the pool's edge, chin propped
      on hands, eyes wide with wonder, smiling at the beautiful
      underwater scene. Warm dappled sunlight, peaceful joy.
      Composition leaves space within the pool for hidden creatures
      to later emerge. Square 1024x1024, opera-illustrated style,
      magical curiosity atmosphere. No text.
    `),
    references: NEZHA_REFS,
  },

  // —— 第三章·渔船活动类（Q05-Q06）：上船前的安全准备 ——
  'video-img/boat/cover': {
    prompt: wrap(`
      Cinematic medium shot illustration: a wooden fishing pier in the
      late afternoon golden hour. Chibi Nezha boy stands barefoot on
      the dock looking longingly at a small wooden fishing boat tied at
      the pier, hands clasped behind his back excitedly. His elderly
      fisherman grandpa (long white beard, straw hat, weathered red
      robe) stands beside him smiling kindly, holding out an orange
      child-sized life vest. The boat sits calmly at the dock, fishing
      nets and a conch horn resting on its deck. Warm sunset sky,
      peaceful anticipation. Square 1024x1024, opera-illustrated
      style. No text.
    `),
    references: NEZHA_REFS,
  },

  // —— 第四章·沙滩游戏类（Q07-Q08）：暗藏危险瞬间 ——
  'video-img/beach/cover': {
    prompt: wrap(`
      Cinematic eye-level wide shot illustration: a sunlit beach scene
      that LOOKS cheerful but contains TWO clear hidden dangers, set
      against a tense warm-orange tinted sky.

      LEFT SIDE — DANGER ONE (deep sand pit): chibi Nezha boy stands
      INSIDE a sand pit that is dug WAY TOO DEEP, the pit's edge
      reaching above his chest near his shoulders, only his head and
      arms visible above the rim. Loose sand crumbles down the steep
      walls suggesting imminent collapse. A yellow shovel lies
      discarded at the rim. Nezha's face shows alarmed realization.

      RIGHT SIDE — DANGER TWO (flamingo ring drifting to deep water):
      a friend kid sits inside a pink inflatable flamingo swim ring
      that has already drifted PAST the shallow zone toward darker
      deep blue water near distant dock pilings, no adult nearby in
      the water. The kid waves arms looking small and isolated.

      MIDDLE — chibi adult Mazu goddess on the beach in the middle
      ground, half-risen from the beach mat under the striped
      umbrella, one arm outstretched urgently toward both kids,
      worried expression, mouth open calling out. A beach ball lies
      forgotten in the foreground sand. Warning amber-orange cast
      over the whole scene, slightly desaturated to feel tense.
      Square 1024x1024, opera-illustrated style. No text.
    `),
    references: [GROUP_REF, 'scripts/references/nezha_solo.png', 'scripts/references/mazu_solo.png'],
  },

  // —— 第五章·极端天气类（Q09-Q10）：朝霞前的宁静警示 ——
  'video-img/weather/cover': {
    prompt: wrap(`
      Cinematic wide-angle illustration: a peaceful early dawn coastal
      scene. Vast vivid red and orange dawn sky filling the upper 65%
      of the canvas with glowing 朝霞 clouds, sun just rising on the
      horizon casting golden shimmer on calm sea. Chibi Nezha boy
      stands beside his elderly fisherman grandpa on a small beach
      cliff in the lower-left foreground, both looking up at the
      colorful sky with curious thoughtful expressions; grandpa
      strokes his white beard. Quiet anticipatory atmosphere — the
      kind of suspiciously beautiful morning that worries old
      fishermen. Square 1024x1024, opera-illustrated style. No text.
    `),
    references: NEZHA_REFS,
  },

  // —— 终章·终极忠告（Q11-Q13）：安全小卫士的三件守护使命 ——
  // 以 Q13 为主：A 教知识 / B 插警示牌 / C 查救生装备 / D 台风冲浪（被否决）
  'video-img/final/cover': {
    prompt: wrap(`
      Cinematic hero-shot illustration of chibi Nezha boy standing
      proudly at the center of a sunlit seaside cliff at warm golden
      hour, posed as a young SAFETY GUARDIAN. He wears a bright red
      ceremonial sash across his chest with golden Chinese characters
      "安全小卫士" clearly embroidered on it (render this exact text
      crisply, bold opera-calligraphy style). Around him three symbolic
      vignettes show his three guardian duties — composed as a unified
      single artwork, not separate panels:

      LOWER-LEFT vignette — TEACHING SIBLINGS (Q13-A): a smaller chibi
      kid (younger brother/sister) sits cross-legged on the grass
      looking up adoringly; Nezha gestures toward a small wooden
      teaching board that shows a simple drawing of a swimmer with a
      buddy + a sun icon (suggesting safety rules being taught).

      RIGHT-MIDGROUND vignette — PLANTING WARNING SIGN (Q13-B): a
      sturdy wooden warning sign planted at the cliff edge facing the
      sea, with a red triangle danger symbol and large clear Chinese
      character "危" painted on it; tall grass at its base; a small
      flag flutters on top.

      FOREGROUND-RIGHT vignette — RESCUE GEAR CHECK (Q13-C): an open
      wooden emergency chest at Nezha's feet containing a neatly
      arranged orange life vest, coiled rope, a red life ring, a
      whistle and a small first-aid kit, each item gleaming as if
      freshly inspected; a paper checklist with three visible green
      check marks rests on top.

      UPPER-LEFT BACKGROUND — REJECTED behavior (Q13-D): a small
      floating phone/tablet screen shows a tiny surfer figure being
      thrown by huge dark stormy typhoon waves; a bold red CIRCLE-AND-
      SLASH (禁止符号) is overlaid on the screen, clearly marking
      this as forbidden. The screen is slightly cracked.

      Behind Nezha rises a tall stone tablet glowing with golden Chinese
      characters "海岛守护" (render this text very clearly in bold
      opera-calligraphy carved into stone, glowing gold). Faint warm
      ghostly silhouettes of chibi adult Mazu goddess (left back) and
      chibi Aobing dragon prince (right back) stand approvingly behind
      him, half-transparent like guardian spirits. Soft golden particles
      float in the air, warm sunset rays, triumphant heroic atmosphere.
      Square 1024x1024, opera-illustrated style. Every Chinese text
      element listed above must be rendered clearly and legibly.
    `),
    references: [GROUP_REF, 'scripts/references/nezha_solo.png', 'scripts/references/mazu_solo.png', 'scripts/references/aobing_solo.png'],
  },

  // Q12 码头救援：场景图（哪吒在码头边惊呆 + 水里小伙伴溺水挣扎）
  'scenes/q12_dock_rescue': {
    prompt: wrap(`
      Single 1024x1024 illustration, urgent rescue scene at a fishing
      pier in late afternoon.

      Left 35% of canvas: a wooden plank dock platform extending out
      over the water; on the dock edge, the chibi Nezha boy (small,
      see reference) stands frozen with a horrified expression, both
      hands raised to his open mouth in shock; the wooden planks have
      empty clear space on them where rescue items will be placed
      (DO NOT draw any rescue items, ropes, life rings, poles, or
      phones in the image — leave the dock surface clean and empty).

      Right 65% of canvas: choppy blue-green sea water; in the middle
      of this water area, a chibi child friend is drowning — only the
      head, two flailing hands and a green short-sleeve shirt collar
      visible above the water, mouth wide open crying for help, tears
      streaming, panicked wide eyes, splashing water droplets and
      bubbles around him; the friend has short black hair and a yellow
      hairband (so he is visually distinct from Nezha).

      Background: soft warm sunset sky with orange and pink clouds,
      distant calm shoreline silhouette, a few seagulls circling.
      Dramatic urgent atmosphere. No text, no captions, no UI elements.
      Edge-to-edge composition. The dock surface MUST remain visually
      empty so items can be overlaid on top later.
    `),
    references: NEZHA_REFS,
  },

  // Q12 救援道具：四个透明背景的扁平贴纸图标
  'icons/q12_goggles': wrap(`
    Single flat sticker-style icon of a pair of pink children's swim
    goggles viewed from the front: bright pink frame, clear blue-tinted
    lenses, white elastic strap, bold dark outline, simple two-tone
    fill, no shading details. Centered subject, fully transparent
    background, square 1024x1024, icon occupies ~75% of canvas.
  `),

  'icons/q12_lifesaver': wrap(`
    Single flat sticker-style icon of a classic life preserver ring
    viewed from a slight 3/4 top angle: alternating red-and-white
    quarter sections around a ring shape, white rope wrapping around
    the outside, bold dark outline, simple two-tone fill, no shading
    details. Centered subject, fully transparent background, square
    1024x1024, icon occupies ~75% of canvas.
  `),

  'icons/q12_pole': wrap(`
    Single flat sticker-style icon of a long bamboo rescue pole shown
    diagonally from bottom-left to top-right: tan-yellow bamboo with
    visible green segment joints, slight gentle curve, bold dark
    outline, simple two-tone fill (warm tan + darker shadow), no
    shading details. Centered subject, fully transparent background,
    square 1024x1024, the pole length spans ~85% of the canvas
    diagonally.
  `),

  'icons/q12_walkie': wrap(`
    Single flat sticker-style icon of a children's walkie-talkie radio
    viewed from the front: bright blue rectangular body with rounded
    corners, short black antenna pointing up, large round speaker grid
    on top half, big push-to-talk button below, small red recording
    light, bold dark outline, simple two-tone fill, no shading
    details. Centered subject, fully transparent background, square
    1024x1024, icon occupies ~70% of canvas.
  `),

  // Q13 终关·小卫士授勋：戏曲风金边大勋章背景，中央 3 个空槽待嵌入
  'scenes/q13_medal_frame': wrap(`
    Single 1024x1024 illustration: a grand Chinese opera-style award
    medal displayed on a deep crimson velvet background with rich
    folds; long golden tassels hanging from the four corners of the
    canvas; subtle radial golden light glow emanating from the center.

    Centered on the canvas: a large round medal frame about 80% of
    the canvas width, with an ornate thick golden curved outer frame
    featuring traditional dragon and phoenix scroll motifs, multiple
    layered decorative gold rings, a small ornamental gold ribbon at
    the very top of the medal.

    Inside the medal frame: a deep dark-red velvet interior with
    THREE perfectly round empty glowing slots arranged in a triangle:
      • TOP slot: centered at roughly 35% from top of canvas
      • BOTTOM-LEFT slot: centered at roughly 65% from top, 35% from left
      • BOTTOM-RIGHT slot: centered at roughly 65% from top, 65% from left
    Each empty slot is a clearly visible circular socket about 18% of
    the canvas width, with an inset ring rim and a soft cyan-and-gold
    inner glow pulsing inside, indicating "empty, waiting to be filled"
    — like an empty gem socket with light shining through.

    DO NOT draw any badges, icons, characters, symbols or text inside
    the slots — they must remain visibly empty so badge icons can be
    overlaid by the frontend later. No text anywhere in the image.
    Ceremonial, formal, golden glow atmosphere, opera award aesthetic.
  `),

  // Q13 四枚能力徽章：透明背景圆形戏曲徽章
  'icons/q13_teach': wrap(`
    Single flat sticker-style round opera medallion badge (gold
    ornate frame around a deep red center): inside the badge, a
    flat-design icon of an open book with golden pages, a small
    pointing finger above and a glowing light bulb floating up,
    suggesting "passing on knowledge". Bold dark outline, simple
    two-tone fill, no shading detail. Centered subject, fully
    transparent background, square 1024x1024, badge occupies ~85%
    of canvas. Sticker style, ornate but readable.
  `),

  'icons/q13_warning_sign': wrap(`
    Single flat sticker-style round opera medallion badge (gold
    ornate frame around a deep red center): inside the badge, a
    flat-design icon of a yellow triangle warning sign with a bold
    black exclamation mark, planted on a small patch of sand with
    grass tufts, suggesting "marking a danger zone". Bold dark
    outline, simple two-tone fill, no shading detail. Centered
    subject, fully transparent background, square 1024x1024, badge
    occupies ~85% of canvas. Sticker style.
  `),

  'icons/q13_checklist': wrap(`
    Single flat sticker-style round opera medallion badge (gold
    ornate frame around a deep red center): inside the badge, a
    flat-design icon of a brown clipboard with a checklist showing
    three green checkmarks, with a tiny orange life vest pictogram
    on the side, suggesting "checking safety equipment". Bold dark
    outline, simple two-tone fill, no shading detail. Centered
    subject, fully transparent background, square 1024x1024, badge
    occupies ~85% of canvas. Sticker style.
  `),

  // D 是诱饵：色调更暗、带闪电与裂痕暗示危险
  'icons/q13_typhoon_surf': wrap(`
    Single flat sticker-style round opera medallion badge with a
    DARKER, MENACING palette (cracked dark gold frame around an
    ominous purple-red center, faint hairline cracks across the
    frame): inside the badge, a flat-design icon of a smartphone
    showing a red "LIVE" recording dot in the corner, with a small
    surfer figure on a surfboard riding a giant black storm wave
    crested with white foam, lightning bolts striking down from
    dark clouds above. The whole badge subtly looks dangerous and
    wrong. Bold dark outline, simple fill, no shading detail.
    Centered subject, fully transparent background, square 1024x1024,
    badge occupies ~85% of canvas. Sticker style.
  `),

  // Q11 三不原则：田字格 4 个行为场景，玩家给前 3 个盖红"不"印
  'scenes/q11_three_nos': {
    prompt: wrapQuad([
      {
        scene: `
          Chibi Nezha boy alone on a darkening dusk beach walking forward
          into the surf where waves rise above his waist; no other people
          in sight; a setting orange sun on the horizon casting long
          lonely shadows; risky isolated atmosphere.
        `,
        text: '不单独下海',
      },
      {
        scene: `
          Chibi Nezha boy on a sunny beach hiding a scraped bleeding knee
          behind his back with a guilty nervous expression; his elderly
          fisherman grandpa (long white beard, straw hat, weathered red
          robe) standing right beside him looking concerned but unable to
          see the wound; a small bandage box visible on a beach mat
          nearby unused.
        `,
        text: '不隐瞒受伤',
      },
      {
        scene: `
          Chibi Nezha boy showing off in deep dark blue water far from
          shore, waving both arms boastfully with a cocky grin and one
          leg kicking up a splash; two awed kid friends standing on the
          distant shore watching with wide eyes and open mouths;
          dangerous show-off atmosphere.
        `,
        text: '不炫耀泳技',
      },
      {
        scene: `
          Chibi Nezha boy covering his ears tightly with both hands and
          scrunching his face shut; right beside him a wall-mounted TV
          screen clearly displaying a typhoon weather warning UI with
          big lightning bolt icon, dark storm clouds, and a red
          exclamation mark; his refusal to listen is comically stubborn.
        `,
        text: '不听天气预报',
      },
    ]),
    references: NEZHA_REFS,
  },
};
