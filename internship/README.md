# Sally Gong × Robooter — Portfolio Web ｜ 个人作品集网页

> 龚晓莉（Sally Gong）海外数字营销作品集 · Robooter（全球智能辅助出行品牌）实习成果的交互式网页版。
> An interactive, bilingual (中文 / English) portfolio for my overseas-marketing internship at Robooter — a global smart-mobility brand. Aug–Oct 2026.

**Live（在线访问）**
- GitHub Pages：<https://sallygong310-lily.github.io/SALLY-GONG-PORTFOLIO/>
- Cloudflare Pages：<https://sallygong-portfolio.pages.dev>（部署后生效 / enable after deploying）

---

## ✦ 亮点 Highlights

- **星云向导（Nebula Guide）**：一只由柔雾气团 + 差速旋臂星尘构成的 Canvas 2D 小生物，眼神会跟随你的鼠标；点击可唤出快捷导航，还可让它「入睡」（右上角冒 zzz）。
- **双语一键切换**：中文 / English 全内容对照，入口页自动识别浏览器语言。
- **作品集 PDF 下载**：13 页 16:9 深色封面版式，含完整实习证据附录（下载设有密码门，密码随简历/邮件单独提供）。
- **可访问性**：`prefers-reduced-motion` 下全部动效自动降级为静态；向导为纯装饰层（`pointer-events: none`），不遮挡任何内容。
- **零依赖**：无框架、无构建步骤，纯 HTML / CSS / 原生 JS，双击即可本地预览。

## ✦ 页面结构 Structure

```text
├── index.html              语言入口页（含背景星云）
├── portfolio_web_cn.html   中文作品集（7 个章节）
├── portfolio_web.html      English portfolio
├── pet-nebula.js           星云向导共享引擎（三页共用，参数集中于 CFG）
├── pdf_deck.html           作品集 PDF 的 13 页版式源文件（可重新导出）
├── fonts/                  自托管字体（Manrope / Fraunces latin 子集）
├── images/                 原始配图（灯箱放大使用）
│   └── optimized/          网页展示用压缩预览图
└── SallyGong_Robooter_Portfolio_16x9.pdf   可下载作品集（13 页，含附录证据）
```

## ✦ 本地预览 Local Preview

```bash
python3 -m http.server 8765
# 打开 http://127.0.0.1:8765/
```

## ✦ 部署 Deploy

**Cloudflare Pages（推荐）**
1. Cloudflare Dashboard → Workers & Pages → Create → Pages → **Connect to Git**，选择本仓库；
2. 构建命令留空、输出目录留空（纯静态站点，无需构建）；
3. 保存后即获得 `https://<project-name>.pages.dev` 地址。

**GitHub Pages（本仓库已配置）**：Settings → Pages → Source: `main` / `/ (root)`。

## ✦ 重新导出作品集 PDF（可选）

编辑 `pdf_deck.html` 后，用 2560×1440 视口逐页截图（13 页），再以 Pillow 组装：

```python
from PIL import Image
imgs = [Image.open(f"p{n:02d}.png").convert("RGB") for n in range(1, 14)]
imgs[0].save("SallyGong_Robooter_Portfolio_16x9.pdf", save_all=True,
             append_images=imgs[1:], resolution=192.0, quality=92)
```

## ✦ 联系 Contact

龚晓莉 Sally Gong · 上海外国语大学英语语言文学硕士（2027 届）
📮 sallygong310@gmail.com · 上海 · 全球远程
