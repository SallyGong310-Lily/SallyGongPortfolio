# Sally Gong Portfolio — All in One

这是一个可直接部署的静态作品集项目，入口是根目录的 `index.html`。

```text
/
├── index.html        # 总首页
├── internship/       # Robooter 海外数字营销作品集
├── class-archive/    # 1901 翻译班电子刊物
└── app/              # 片羽拾光 Web 版：index.html 为介绍页，app.html 为 Flutter 应用入口
```

## 本地预览

在本目录运行：

```bash
python3 -m http.server 8000
```

打开 <http://localhost:8000>。

macOS 也可以直接双击根目录的 **`启动本地预览.command`**：它会自动启动服务并打开浏览器，端口被占用时会自动顺延。

不要直接双击 `index.html`：这样地址栏是 `file://…`，浏览器不会自动加载子目录里的首页，三个入口都点不动，Flutter Web 也无法运行。

## GitHub 与 Cloudflare Pages

1. 将本目录作为一个新的私有 GitHub repository 推送。
2. 在 Cloudflare Pages 中连接该 repository。
3. Framework preset 选择 **None**。
4. Build command 留空；Build output directory 设为 **`.`**。
5. 部署后确认以下地址都可访问：
   - `/`
   - `/internship/`
   - `/class-archive/`
   - `/app/`（片羽拾光介绍页）
   - `/app/app.html`（片羽拾光应用本体）

`app/` 是已经编译好的 Flutter Web 静态产物，无需在 Cloudflare 重新安装 Flutter 或执行构建。

## 片羽拾光 Web 数据

Web 版会将碎片、分类、回收站及主题设置保存到当前浏览器的本地存储中；刷新或重新打开页面后仍会保留。数据只保存在使用者当前浏览器和当前部署域名下，清除浏览器站点数据或更换浏览器/设备后不会自动同步。
