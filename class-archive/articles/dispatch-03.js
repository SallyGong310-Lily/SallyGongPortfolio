/* ==================================================== */
/* dispatch-03 · 莎士比亚全集——分享贴                   */
/* 百科式原文改写为刊物导语；画像待放入                  */
/* assets/images/dispatch-03/01-cover.png                */
/* ==================================================== */

registerDispatch({
  id: 'dispatch-03',
  date: '2019.10.20', // ⚠ 精确发布日期待核实（发布月份为 2019 年 10 月）
  featured: false,
  tag: 'Autumn Ledger · 阅读分享',
  title: '莎士比亚全集——分享贴',
  subhead: '一部面向全班的莎翁全集资源帖：他的剧本被译成所有主要语言，演出次数远超任何剧作家。',
  byline: { author: '宣传委员 · 龚晓莉', wordCount: '约 350 字' },
  wechatUrl: 'https://mp.weixin.qq.com/s/Be8tywtbWGOMBW7sWkNlsA',
  audio: {
    src: 'assets/audio/dispatch-03/theme.mp3',
    title: '背景音乐胶囊',
    caption: '起风了 · 纯钢琴版（原推文配乐）',
    duration: '4:04'
  },
  readTime: '1 min read',
  cover: { src: 'assets/images/dispatch-03/01-cover.png', alt: '威廉·莎士比亚画像' },
  card: {
    number: 'No. 03',
    tag: '阅读分享',
    blurb: '一部面向全班的莎翁全集资源帖：三十八部剧本、一百五十四首十四行诗，与一条网盘链接。'
  },
  body: `
    <p class="first-letter:float-left first-letter:text-5xl first-letter:leading-[0.8] first-letter:font-normal first-letter:pr-3 first-letter:pt-1">
      威廉·莎士比亚（William Shakespeare，1564 年 4 月 — 1616 年 4 月 23 日），华人社会亦常尊称为莎翁。他被许多人认为是英国文学史和戏剧史上最杰出的诗人和剧作家，也是西方文艺史上最杰出的作家之一，被誉为英国的民族诗人与「艾芬河的吟游诗人」。
    </p>

    <aside class="margin-note xl:absolute xl:-right-[210px] xl:top-20 xl:w-44 my-4 xl:my-0 p-2.5 xl:border-none rotate-0 xl:rotate-2 text-[var(--ink)] font-['Caveat'] text-lg leading-snug">
      <span class="block text-[10px] font-sans tracking-widest uppercase text-[var(--accent)] font-semibold mb-0.5">✎ 作品谱系</span>
      38 部剧本<br>
      154 首十四行诗<br>
      2 首长叙事诗 · 诗作若干
    </aside>

    <figure class="my-4">
      <div class="min-h-48 sm:min-h-64 bg-[var(--photo-mat)] overflow-hidden shadow-xs">
        <img src="assets/images/dispatch-03/01-cover.png" alt="威廉·莎士比亚画像" loading="lazy" class="relative w-full h-auto darkroom-img" onerror="this.outerHTML='<span class=frame-empty>[ 莎翁画像 · 待冲洗 ]</span>'">
      </div>
      <figcaption class="font-sans text-[9px] text-[var(--muted)] mt-1.5 text-center">威廉·莎士比亚画像（分享帖原图）</figcaption>
    </figure>

    <p>
      他流传下来的作品包括 38 部剧本、154 首十四行诗、两首长叙事诗和其他诗作。他的剧本被翻译成所有主要使用着的语言，并且表演次数远远超过其他任何剧作家。
    </p>

    <blockquote class="my-10 py-5 border-y border-[var(--rule)] text-center text-xl italic leading-relaxed text-[var(--ink)] px-4">
      “英国的民族诗人——<span class="ink-highlight">艾芬河的吟游诗人</span>。”
    </blockquote>

    <aside class="margin-note my-4 p-2.5 rotate-0 xl:rotate-1 text-[var(--ink)] font-['Caveat'] text-lg leading-snug">
      <span class="block text-[10px] font-sans tracking-widest uppercase text-[var(--accent)] font-semibold mb-0.5">☁ 资源存档</span>
      网盘：<a href="https://pan.baidu.com/s/1bACJyoklrWnc8uTKJhhb3g" target="_blank" rel="noopener" class="underline underline-offset-2">莎翁全集</a><br>
      提取码：5b27
    </aside>
  `
});
