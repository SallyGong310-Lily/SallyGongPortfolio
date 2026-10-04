/* ============================================================
   版本3的交互版 · 星云向导共享引擎（pet-nebula.js）
   portfolio_web_cn / portfolio_web / index 三个页面共用：
   - PetNebula.initCorner(cfg)     右下角向导：渲染 + 睡眠/唤醒 +
                                   快捷导航面板 + 到站气泡 + 点击星爆
   - PetNebula.initBackground(cfg) index 背景大星云：纯装饰 + 环境流星
   - PetNebula.CFG                 全局可调参数（页面可在 cfg.overrides 覆盖）
   设计语言：柔雾气团 + 差速旋臂星尘 + 背景星 + 极淡径向晕/细金环。
   ============================================================ */
(function (window) {
  "use strict";

  /* ================= 全局可调参数 ================= */
  var CFG = {
    fpsMs: 33,              /* 帧间隔（~30fps）；低配设备自动放宽 */
    dprMax: 2,
    mobileBreak: 768,
    cornerSize: 56,         /* 向导画布边长（px） */
    cornerSizeMobile: 44,
    discR: 0.42,            /* 轮廓半径（×画布边长） */
    bodyR: 0.62,            /* 星尘盘半径（×轮廓半径） */
    dustCount: 15,          /* 星尘数量（低配 12） */
    hazeCount: 5,           /* 柔雾气团数量（低配 3） */
    starCount: 3,           /* 背景星数量 */
    ridgeCount: 2,          /* 亮脊数量（低配 0） */
    spinBase: 0.34,         /* 星尘角速度基数（rad/s，内圈） */
    tilt: 0.42,             /* 轨道盘俯视角 */
    scrollBoostMax: 1.5,    /* 滚动时旋臂加速上限（×1 = 不加速） */
    gravityRadius: 150,     /* 光标引力作用半径（px） */
    gravityMax: 3.2,        /* 光标引力最大位移（px） */
    pulse: 0.02,            /* 整体呼吸幅度 */
    pulseMs: 2400,
    burstCount: 6,          /* 点击星爆粒子数 */
    burstMs: 420,
    haloA: 0.30,            /* 径向晕中心透明度 */
    ringA: 0.38,            /* 细金环透明度 */
    shadowA: 0.13,          /* 悬浮投影透明度 */
    coreGlowA: 0.14,        /* 核心辉光透明度 */
    blinkMinMs: 2800,       /* 眨眼间隔下限 */
    blinkVarMs: 2400,       /* 眨眼间隔随机量 */
    blinkMs: 150,           /* 眨眼历时 */
    hopMs: 420,             /* 跳跃历时 */
    bobAmp: 1.1,            /* 悬浮起伏幅度（px） */
    meteorDurMs: 520,       /* 流星历时 */
    meteorMinMs: 18000,     /* 环境流星最小间隔 */
    meteorMaxMs: 36000,     /* 环境流星最大间隔 */
    lowTierFpsMs: 50
  };

  /* ================= 工具 ================= */
  function clamp(v, a, b){ return v < a ? a : (v > b ? b : v); }

  function safeHex(v, fb){ return /^#[0-9a-fA-F]{6}$/.test(v) ? v : fb; }

  function cssVar(name, fb){
    var v = getComputedStyle(document.documentElement).getPropertyValue(name).trim();
    return safeHex(v, fb);
  }

  /* k>0 向白提亮，k<0 向黑压暗 */
  function shade(hex, k){
    if (!/^#[0-9a-fA-F]{6}$/.test(hex)) return hex;
    var n = parseInt(hex.slice(1), 16);
    var r = (n >> 16) & 255, g = (n >> 8) & 255, b = n & 255;
    if (k > 0.5) k = 0.5; if (k < -0.9) k = -0.9;
    function mix(c){
      if (k >= 0) return Math.round(c + (255 - c) * k);
      return Math.round(c * (1 + k));
    }
    return "rgb(" + mix(r) + "," + mix(g) + "," + mix(b) + ")";
  }

  function rgbaOf(hex, a){
    if (!/^#[0-9a-fA-F]{6}$/.test(hex)) hex = "#232D26";
    var n = parseInt(hex.slice(1), 16);
    return "rgba(" + ((n >> 16) & 255) + "," + ((n >> 8) & 255) + "," + (n & 255) + "," + a + ")";
  }

  function rndFactory(seed){
    var s = seed;
    return function(){
      s = (s * 16807) % 2147483647;
      return (s - 1) / 2147483646;
    };
  }

  function isLowTier(){
    try {
      if (navigator.hardwareConcurrency && navigator.hardwareConcurrency <= 4) return true;
      if (navigator.deviceMemory && navigator.deviceMemory <= 4) return true;
    } catch (e) {}
    return false;
  }

  /* 预渲染精灵：带高光的立体小球 + 大而软的柔雾气团 */
  function makeSprites(colors){
    var out = { ball: {}, puff: {} };
    var defs = [["ink", colors.ink], ["terra", colors.terra], ["gold", colors.gold], ["white", "#FFFFFF"]];
    for (var k = 0; k < defs.length; k++){
      var name = defs[k][0], col = defs[k][1];
      var b = document.createElement("canvas");
      var br = 10;
      b.width = b.height = br * 2 + 2;
      var bc = b.getContext("2d");
      var bg = bc.createRadialGradient(br * 0.62, br * 0.58, 0.5, br, br, br);
      bg.addColorStop(0, shade(col, 0.45));
      bg.addColorStop(0.55, col);
      bg.addColorStop(1, shade(col, -0.32));
      bc.fillStyle = bg;
      bc.beginPath(); bc.arc(br, br, br, 0, Math.PI * 2); bc.fill();
      out.ball[name] = b;

      var p = document.createElement("canvas");
      var pr = 32;
      p.width = p.height = pr * 2;
      var pc = p.getContext("2d");
      var pg = pc.createRadialGradient(pr, pr, 0, pr, pr, pr);
      pg.addColorStop(0, rgbaOf(col, 0.5));
      pg.addColorStop(0.45, rgbaOf(col, 0.2));
      pg.addColorStop(1, rgbaOf(col, 0));
      pc.fillStyle = pg;
      pc.fillRect(0, 0, pr * 2, pr * 2);
      out.puff[name] = p;
    }
    return out;
  }

  /* ================= 星云渲染核心 =================
     view(t) 返回当前几何：{w, h, cx, cy, bodyY, rise, ringR, bodyR, u, eye} */
  function createNebula(ctx, view, opts){
    var cfg = opts.cfg, rnd = opts.rnd, colors = opts.colors, sp = opts.sprites;
    var reduce = opts.reduceMotion;
    var low = cfg.lowTier;

    /* 星尘：差速旋转的斜盘（内圈快、外圈慢 → 旋臂剪切），内密外疏 */
    var dCount = low ? cfg.dustCountLow : cfg.dustCount;
    var dust = [];
    for (var di = 0; di < dCount; di++){
      var r0 = 0.14 + Math.pow(di / (dCount - 1), 0.72) * 0.9 + (rnd() - 0.5) * 0.1;
      var dcol = "ink";
      if (di === Math.round(dCount * 0.47)) dcol = "terra";
      else if (di === Math.round(dCount * 0.2) || di === Math.round(dCount * 0.73)) dcol = "gold";
      dust.push({
        r0: Math.max(r0, 0.12),
        a0: rnd() * Math.PI * 2,
        om: (cfg.spinBase / Math.sqrt(r0 + 0.12)) / 1000,
        orbP: 1600 + rnd() * 1400,
        ph: rnd() * Math.PI * 2,
        r: 1.5 + rnd() * 1.9,
        ga: 0.8 + rnd() * 0.4,
        color: dcol
      });
    }

    /* 柔雾气团 + 亮脊（更小更亮的压缩带） */
    var hCount = low ? cfg.hazeCountLow : cfg.hazeCount;
    var haze = [];
    var hdefs = [
      ["ink", 0.18, 0.52, 0.75], ["ink", 0.14, 0.85, 0.60], ["ink", 0.12, 0.30, 0.66],
      ["gold", 0.12, 0.62, 0.50], ["terra", 0.10, 0.40, 0.58], ["ink", 0.20, 0.42, 0.50]
    ];
    for (var hi = 0; hi < hdefs.length && haze.length < hCount; hi++){
      haze.push({
        col: hdefs[hi][0], orb: hdefs[hi][1], size: hdefs[hi][2],
        al: hdefs[hi][3] * 0.28, a0: rnd() * Math.PI * 2,
        om2: 0.00025 * (0.18 / hdefs[hi][1]),
        spd: 9000 + rnd() * 6000, bp: rnd() * Math.PI * 2, ridge: false
      });
    }
    if (!low){
      for (var rj = 0; rj < cfg.ridgeCount; rj++){
        var rorb = 0.5 + rnd() * 0.25;
        haze.push({
          col: rj === 0 ? "gold" : "ink", orb: rorb,
          size: 0.28 + rnd() * 0.12, al: 0.34, a0: rnd() * Math.PI * 2,
          om2: 0.00025 * (0.18 / rorb),
          spd: 7000 + rnd() * 3000, bp: rnd() * Math.PI * 2, ridge: true
        });
      }
    }

    /* 背景星 */
    var stars = [];
    for (var si = 0; si < cfg.starCount; si++){
      stars.push({
        a0: rnd() * Math.PI * 2, rr: 1.08 + rnd() * 0.32,
        sz: 0.9 + rnd() * 0.6, tw: rnd() * Math.PI * 2,
        col: si === 0 ? "gold" : "white"
      });
    }

    /* 运行状态 */
    var spinPhase = 0, lastT = -1, scrollEnergy = 0;
    var gravX = 0, gravY = 0, gravTX = 0, gravTY = 0, hasPointer = false;
    var lookX = 0, lookY = 0, lookTX = 0, lookTY = 0;
    var burst = [];
    var meteor = null;
    var nextMeteorAt = Infinity;
    var blinkAt = 2600 + rnd() * 1000;

    function setPointer(px, py){ gravTX = px; gravTY = py; hasPointer = true; }
    function kick(v){ scrollEnergy = Math.min(cfg.scrollBoostMax, scrollEnergy + v); }
    function spawnBurst(x, y){
      if (low) return;
      for (var i = 0; i < cfg.burstCount; i++){
        var a = (i / cfg.burstCount) * Math.PI * 2 + rnd() * 0.6;
        var v = 0.05 + rnd() * 0.05;
        burst.push({
          x: x, y: y, vx: Math.cos(a) * v, vy: Math.sin(a) * v - 0.02,
          born: performance.now(),
          col: i % 3 === 0 ? "gold" : (i % 3 === 1 ? "ink" : "terra"),
          sz: 0.9 + rnd() * 0.8
        });
      }
    }
    function spawnMeteor(x0, y0, x1, y1){
      meteor = { x0: x0, y0: y0, x1: x1, y1: y1, born: performance.now(), dur: cfg.meteorDurMs };
    }
    function scheduleAmbientMeteor(t){
      nextMeteorAt = t + cfg.meteorMinMs + rnd() * (cfg.meteorMaxMs - cfg.meteorMinMs);
    }

    function draw(t, forceSleep){
      var v = view(t);
      var dt = lastT < 0 ? 16 : clamp(t - lastT, 0, 100);
      lastT = t;
      if (!reduce && !forceSleep) spinPhase += dt * (1 + scrollEnergy);
      scrollEnergy *= 0.94;

      var cx = v.cx, bodyY = v.bodyY, bodyR = v.bodyR * (1 + (reduce ? 0 : cfg.pulse * Math.sin(t / cfg.pulseMs)));
      var ringR = v.ringR, u = v.u;

      /* 光标引力 + 眼神跟随（阻尼跟随；reduced-motion 时归零）
         gravTX/gravTY 已是相对视线中心（view 中心）的坐标，方向归一化后
         再按距离衰减幅值——保证任意距离下方向都准确指向光标 */
      if (hasPointer && !reduce){
        var gl = Math.sqrt(gravTX * gravTX + gravTY * gravTY);
        if (gl > 0.001){
          var gk = Math.min(gl / cfg.gravityRadius, 1) * cfg.gravityMax;
          var tgx = (gravTX / gl) * gk, tgy = (gravTY / gl) * gk;
          gravX += (tgx - gravX) * 0.08;
          gravY += (tgy - gravY) * 0.08;
          var lk = v.eye.lookMax;
          lookTX = (gravTX / gl) * lk;
          lookTY = (gravTY / gl) * lk;
        }
      } else {
        gravX *= 0.9; gravY *= 0.9;
        lookTX *= 0.9; lookTY *= 0.9;
      }
      lookX += (lookTX - lookX) * 0.12;
      lookY += (lookTY - lookY) * 0.12;

      ctx.clearRect(0, 0, v.w, v.h);

      /* 悬浮投影（仅角落向导） */
      if (opts.shadow){
        var shA = Math.max(cfg.shadowA - v.rise * 0.012, 0.05);
        ctx.globalAlpha = shA;
        ctx.beginPath();
        ctx.ellipse(cx + 1.5, v.cy + ringR * 0.98 + v.rise * 0.35,
                    ringR * (0.92 - v.rise * 0.03), ringR * 0.2, 0, 0, Math.PI * 2);
        ctx.fillStyle = colors.ink; ctx.fill();
        ctx.globalAlpha = 1;
      }

      /* 极淡径向晕 + 细金环 */
      if (opts.halo){
        var hg = ctx.createRadialGradient(
          cx - ringR * 0.2, bodyY - ringR * 0.25, ringR * 0.05,
          cx, bodyY, ringR * 1.15);
        hg.addColorStop(0, rgbaOf(colors.cream, cfg.haloA));
        hg.addColorStop(0.6, rgbaOf(colors.cream, cfg.haloA * 0.43));
        hg.addColorStop(1, rgbaOf(colors.cream, 0));
        ctx.beginPath(); ctx.arc(cx, bodyY, ringR * 1.15, 0, Math.PI * 2);
        ctx.fillStyle = hg; ctx.fill();
      }
      if (opts.ring){
        ctx.beginPath(); ctx.arc(cx, bodyY, ringR, 0, Math.PI * 2);
        ctx.strokeStyle = "rgba(176,141,62," + cfg.ringA + ")";
        ctx.lineWidth = 1; ctx.stroke();
      }

      /* 柔雾气团 + 亮脊：绕中心极缓漂移，叠出不规则云絮 */
      var i, p2, pa, px, py, sz;
      for (i = 0; i < haze.length; i++){
        p2 = haze[i];
        pa = p2.a0 + spinPhase * p2.om2;
        px = cx + Math.cos(pa) * p2.orb * bodyR + gravX * 0.35;
        py = bodyY + Math.sin(pa) * p2.orb * bodyR * 0.62 + gravY * 0.35;
        sz = p2.size * bodyR * (1 + (reduce ? 0 : 0.07 * Math.sin(t / 1500 + p2.bp)));
        ctx.globalAlpha = p2.al * (1 + (reduce ? 0 : 0.2 * Math.sin(t / 2100 + p2.bp))) * (p2.ridge ? 1.5 : 1);
        ctx.drawImage(sp.puff[p2.col], px - sz, py - sz, sz * 2, sz * 2);
      }

      /* 核心辉光：双眼后方的亮核 */
      var cga = cfg.coreGlowA * (1 + (reduce ? 0 : 0.15 * Math.sin(t / 1800)));
      var cs = bodyR * 0.85;
      ctx.globalAlpha = cga;
      ctx.drawImage(sp.puff.gold, cx - cs + gravX * 0.6, bodyY - bodyR * 0.08 - cs + gravY * 0.6, cs * 2, cs * 2);
      cs = bodyR * 0.5;
      ctx.globalAlpha = cga * 0.8;
      ctx.drawImage(sp.puff.white, cx - cs + gravX * 0.6, bodyY - bodyR * 0.06 - cs + gravY * 0.6, cs * 2, cs * 2);

      /* 星尘（两遍：背面 → 正面） */
      var dpass, d2, ang, rr0, sx2, sz2, sy2, depth, prD, edge, rr;
      for (dpass = 0; dpass < 2; dpass++){
        for (i = 0; i < dust.length; i++){
          d2 = dust[i];
          ang = d2.a0 + spinPhase * d2.om;
          rr0 = d2.r0 * bodyR * (1 + (reduce ? 0 : 0.07 * Math.sin(t / d2.orbP + d2.ph)));
          sx2 = Math.cos(ang) * rr0;
          sz2 = Math.sin(ang) * rr0;
          sy2 = sz2 * Math.sin(cfg.tilt);
          if ((dpass === 0) === (sz2 >= 0)) continue;
          depth = (sz2 * Math.cos(cfg.tilt) / bodyR + 1) / 2;
          px = cx + sx2 + gravX;
          py = bodyY + sy2 + gravY;
          prD = Math.sqrt(sx2 * sx2 + sy2 * sy2) / bodyR;
          edge = 1 - clamp((prD - 0.72) / 0.55, 0, 1) * 0.45;
          rr = d2.r * u * (0.72 + depth * 0.5) * (0.82 + 0.18 * edge);
          ctx.globalAlpha = (0.42 + depth * 0.58) * edge * d2.ga;
          ctx.drawImage(sp.ball[d2.color], px - rr, py - rr, rr * 2, rr * 2);
        }
      }

      /* 背景星：云外缘的闪烁小星 */
      for (i = 0; i < stars.length; i++){
        p2 = stars[i];
        var tw = reduce ? 0.7 : 0.55 + 0.45 * Math.sin(t / 1300 + p2.tw);
        pa = spinPhase * 0.00004 + p2.a0;
        px = cx + Math.cos(pa) * p2.rr * bodyR + gravX * 0.5;
        py = bodyY + Math.sin(pa) * p2.rr * bodyR * 0.62 + gravY * 0.5;
        sz = p2.sz * (opts.isCorner ? 3.2 * u : 4);
        ctx.globalAlpha = 0.5 * tw;
        ctx.drawImage(sp.puff.gold, px - sz * 2, py - sz * 2, sz * 4, sz * 4);
        ctx.globalAlpha = 0.9 * tw;
        ctx.beginPath();
        ctx.arc(px, py, p2.sz * (opts.isCorner ? u * 0.9 : 1.1), 0, Math.PI * 2);
        ctx.fillStyle = p2.col === "gold" ? colors.gold : "#FFFFFF";
        ctx.fill();
      }

      /* 点击星爆 */
      for (i = burst.length - 1; i >= 0; i--){
        var b = burst[i];
        var be = (t - b.born) / cfg.burstMs;
        if (be >= 1){ burst.splice(i, 1); continue; }
        var bEase = 1 - Math.pow(1 - be, 2);
        px = b.x + b.vx * be * cfg.burstMs;
        py = b.y + b.vy * be * cfg.burstMs;
        rr = b.sz * u * (1 - be * 0.5);
        ctx.globalAlpha = (1 - be) * 0.9;
        ctx.drawImage(sp.ball[b.col], px - rr, py - rr, rr * 2, rr * 2);
      }

      /* 流星 */
      if (opts.ambientMeteor && t >= nextMeteorAt && !meteor){
        var mx0 = v.w * (0.15 + rnd() * 0.6);
        var my0 = v.h * (0.08 + rnd() * 0.3);
        var mlen = opts.isCorner ? size0() * 0.9 : v.w * 0.16;
        var mdir = rnd() < 0.5 ? 1 : -1;
        spawnMeteor(mx0, my0, mx0 + mdir * mlen, my0 + mlen * 0.35);
        scheduleAmbientMeteor(t);
      }
      if (meteor){
        var me = (t - meteor.born) / meteor.dur;
        if (me >= 1) meteor = null;
        else {
          var hx = meteor.x0 + (meteor.x1 - meteor.x0) * me;
          var hy = meteor.y0 + (meteor.y1 - meteor.y0) * me;
          var te = Math.max(me - 0.3, 0);
          var tx2 = meteor.x0 + (meteor.x1 - meteor.x0) * te;
          var ty2 = meteor.y0 + (meteor.y1 - meteor.y0) * te;
          var mg = ctx.createLinearGradient(tx2, ty2, hx, hy);
          mg.addColorStop(0, rgbaOf(colors.gold, 0));
          mg.addColorStop(1, rgbaOf(colors.gold, 0.85 * Math.sin(Math.PI * me)));
          ctx.globalAlpha = 1;
          ctx.strokeStyle = mg;
          ctx.lineWidth = opts.isCorner ? 1.4 : 2;
          ctx.lineCap = "round";
          ctx.beginPath(); ctx.moveTo(tx2, ty2); ctx.lineTo(hx, hy); ctx.stroke();
          var mglow = opts.isCorner ? 3 : 5;
          ctx.globalAlpha = 0.55 * Math.sin(Math.PI * me);
          ctx.drawImage(sp.puff.gold, hx - mglow * 2, hy - mglow * 2, mglow * 4, mglow * 4);
        }
      }

      /* 眼睛：带体积的眼白 + 渐变瞳孔 + 高光点；闭眼是一条下弯小弧 */
      var openEye = 1;
      if (forceSleep) openEye = 0;
      else if (!reduce){
        if (t >= blinkAt && t < blinkAt + cfg.blinkMs) openEye = 0.12;
        else if (t >= blinkAt + cfg.blinkMs) blinkAt = t + cfg.blinkMinMs + rnd() * cfg.blinkVarMs;
      }
      var er = v.eye.r, pr = v.eye.pupil;
      var lookXs = clamp(lookX, -v.eye.lookMax, v.eye.lookMax);
      var lookYs = clamp(lookY, -v.eye.lookMax, v.eye.lookMax);
      for (var s = -1; s <= 1; s += 2){
        var ex = cx + s * v.eye.dx, ey = bodyY + v.eye.dy;
        if (openEye > 0.5){
          var eg = ctx.createRadialGradient(ex - er * 0.3, ey - er * 0.35, er * 0.1, ex, ey, er);
          eg.addColorStop(0, "#FFFFFF");
          eg.addColorStop(0.72, "#FFFFFF");
          eg.addColorStop(1, shade(colors.cream, -0.28));
          ctx.beginPath();
          ctx.ellipse(ex, ey, er, er, 0, 0, Math.PI * 2);
          ctx.fillStyle = eg; ctx.fill();
          var pg = ctx.createRadialGradient(
            ex + lookXs - pr * 0.3, ey + lookYs - pr * 0.35, pr * 0.1,
            ex + lookXs, ey + lookYs, pr);
          pg.addColorStop(0, shade(colors.ink, 0.4));
          pg.addColorStop(0.6, colors.ink);
          pg.addColorStop(1, shade(colors.ink, -0.25));
          ctx.beginPath();
          ctx.arc(ex + lookXs, ey + lookYs, pr, 0, Math.PI * 2);
          ctx.fillStyle = pg; ctx.fill();
          ctx.beginPath();
          ctx.arc(ex + lookXs - pr * 0.32, ey + lookYs - pr * 0.34, pr * 0.3, 0, Math.PI * 2);
          ctx.fillStyle = "rgba(255,255,255,.92)"; ctx.fill();
        } else {
          ctx.beginPath();
          ctx.arc(ex, ey - er * 0.2, er * 0.72, Math.PI * 0.18, Math.PI * 0.82);
          ctx.strokeStyle = shade(colors.ink, -0.05);
          ctx.lineWidth = Math.max(er * 0.12, 1); ctx.lineCap = "round"; ctx.stroke();
        }
      }
      ctx.globalAlpha = 1;
    }

    /* index 用：画布边长（流星长度基准），由包装层注入 */
    var size0 = function(){ return v0w; };
    var v0w = 0;
    function setW(w){ v0w = w; }

    return {
      draw: draw,
      setPointer: setPointer,
      getLook: function(){ return { x: lookX, y: lookY, tx: lookTX, ty: lookTY, has: hasPointer }; },
      kick: kick,
      spawnBurst: spawnBurst,
      spawnMeteor: spawnMeteor,
      scheduleAmbientMeteor: scheduleAmbientMeteor,
      setW: setW
    };
  }

  /* ================= 右下角向导 ================= */
  function initCorner(cfg){
    var root = document.getElementById(cfg.ids.root);
    var canvas = document.getElementById(cfg.ids.canvas);
    if (!root || !canvas) return;
    var btn = document.getElementById(cfg.ids.btn);
    var bubble = document.getElementById(cfg.ids.bubble);
    var panel = document.getElementById(cfg.ids.panel);
    var hideBtn = document.getElementById(cfg.ids.hide);
    var ctx = canvas.getContext("2d");
    if (!ctx) return;

    var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    var low = isLowTier();

    var cfg2 = {};
    for (var k in CFG) cfg2[k] = CFG[k];
    if (cfg.overrides) for (var k2 in cfg.overrides) cfg2[k2] = cfg.overrides[k2];
    cfg2.lowTier = low;
    if (low) cfg2.fpsMs = CFG.lowTierFpsMs;

    var colors = {
      ink: cssVar(cfg.colorVars.ink[0], cfg.colorVars.ink[1]),
      cream: cssVar(cfg.colorVars.cream[0], cfg.colorVars.cream[1]),
      terra: cssVar(cfg.colorVars.terra[0], cfg.colorVars.terra[1]),
      gold: cssVar(cfg.colorVars.gold[0], cfg.colorVars.gold[1])
    };

    var dpr = Math.min(window.devicePixelRatio || 1, cfg2.dprMax);
    var size = cfg2.cornerSize;
    function sizeCanvas(){
      size = window.innerWidth < cfg2.mobileBreak ? cfg2.cornerSizeMobile : cfg2.cornerSize;
      canvas.style.width = size + "px";
      canvas.style.height = size + "px";
      canvas.width = Math.round(size * dpr);
      canvas.height = Math.round(size * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }
    sizeCanvas();

    var hopStart = -1, blinkGuard = false;
    var btnRect = null;
    function cacheRect(){ btnRect = btn.getBoundingClientRect(); }

    var neb = createNebula(ctx, function (t){
      var u = size / CFG.cornerSize;
      var cx = size / 2, cyBase = size * 0.46;
      var ringR = size * CFG.discR;
      var hop = 0;
      if (!reduceMotion && hopStart >= 0){
        var hk = (t - hopStart) / CFG.hopMs;
        if (hk >= 1) hopStart = -1;
        else hop = Math.sin(Math.PI * hk) * size * 0.10;
      }
      var bob = reduceMotion ? 0 : Math.sin(t / 1300) * CFG.bobAmp;
      var rise = bob + hop;
      return {
        w: size, h: size, cx: cx, cy: cyBase,
        bodyY: cyBase - rise, rise: rise,
        ringR: ringR, bodyR: ringR * CFG.bodyR, u: u,
        eye: { dx: 5.2 * u, dy: -2.4 * u, r: 3.4 * u, pupil: 1.8 * u, lookMax: 1.3 }
      };
    }, {
      cfg: cfg2, rnd: rndFactory(7), colors: colors,
      sprites: makeSprites(colors),
      reduceMotion: reduceMotion,
      halo: true, ring: true, shadow: true, isCorner: true
    });

    /* 睡眠状态：本次访问内跨页面记忆（旧隐藏标记按睡眠处理） */
    var SLEEP_KEY = cfg.sessionKey;
    var isSleeping = false;
    try {
      var st0 = sessionStorage.getItem(SLEEP_KEY);
      if (st0 === "sleeping" || st0 === "1") isSleeping = true;
    } catch (e) {}
    root.hidden = false;
    document.body.classList.add("pet-on");

    var REST_LABEL = cfg.labels.rest, WAKE_LABEL = cfg.labels.wake;
    var ARIA_AWAKE = cfg.labels.ariaAwake, ARIA_SLEEP = cfg.labels.ariaSleep;

    /* 眼神跟随光标（fixed 元素的 rect 不随滚动变，缓存即可） */
    window.addEventListener("pointermove", function(e){
      if (!btnRect) cacheRect();
      neb.setPointer(
        e.clientX - (btnRect.left + btnRect.width / 2),
        e.clientY - (btnRect.top + btnRect.height / 2)
      );
    }, { passive: true });

    /* 滚动 → 旋臂轻微加速 */
    window.addEventListener("scroll", function(){ neb.kick(0.12); }, { passive: true });

    /* 帧循环：低配自动放宽；标签页隐藏暂停；睡眠/休息时停 */
    var rafId = 0, lastFrame = -1, running = false;
    function frame(t){
      rafId = window.requestAnimationFrame(frame);
      if (t - lastFrame < cfg2.fpsMs) return;
      lastFrame = t;
      neb.draw(t, false);
    }
    function startLoop(){
      if (running || reduceMotion || isSleeping) return;
      running = true;
      rafId = window.requestAnimationFrame(frame);
    }
    function stopLoop(){ running = false; window.cancelAnimationFrame(rafId); }
    document.addEventListener("visibilitychange", function(){
      if (document.hidden) stopLoop(); else startLoop();
    });

    /* 到站气泡：每板块只说一次；面板打开/睡眠时不插话 */
    var bubbleTimer = 0;
    function showTip(text){
      if (isSleeping || root.classList.contains("open")) return;
      bubble.textContent = text;
      bubble.classList.add("show");
      clearTimeout(bubbleTimer);
      bubbleTimer = setTimeout(function(){ bubble.classList.remove("show"); }, 4600);
    }
    var seen = {};
    var tipIO = new IntersectionObserver(function(entries){
      entries.forEach(function(en){
        if (!en.isIntersecting || seen[en.target.id]) return;
        seen[en.target.id] = true;
        if (en.target.id === "contact" && !reduceMotion && !isSleeping){
          /* 到达联系区：一次流星收尾 */
          neb.spawnMeteor(-6, size * 0.3, size + 6, size * 0.55);
        }
        showTip(cfg.tips[en.target.id]);
      });
    }, { rootMargin: "-40% 0px -55% 0px" });
    Object.keys(cfg.tips).forEach(function(id){
      var el = document.getElementById(id);
      if (el) tipIO.observe(el);
    });
    setTimeout(function(){
      if (!seen.hero){ seen.hero = true; showTip(cfg.tips.hero); }
    }, 1800);

    /* 面板开合 */
    function setPanel(open, returnFocus){
      root.classList.toggle("open", open);
      btn.setAttribute("aria-expanded", open ? "true" : "false");
      if (open){
        bubble.classList.remove("show");
        var first = panel.querySelector(".pet-links a");
        if (first) first.focus();
      } else if (returnFocus){
        btn.focus();
      }
    }
    btn.addEventListener("click", function(){
      var open = !root.classList.contains("open");
      setPanel(open, false);
      if (!isSleeping && !reduceMotion){
        hopStart = performance.now();
        neb.spawnBurst(size / 2, size * 0.46);
      }
    });
    document.addEventListener("click", function(e){
      if (!root.classList.contains("open")) return;
      if (!root.contains(e.target)) setPanel(false, false);
    });
    document.addEventListener("keydown", function(e){
      if (e.key !== "Escape" || !root.classList.contains("open")) return;
      var lb = document.getElementById(cfg.lightboxId);
      var pw = document.getElementById(cfg.pwModalId);
      if ((lb && lb.classList.contains("open")) || (pw && pw.classList.contains("open"))) return;
      setPanel(false, true);
    });
    Array.prototype.forEach.call(panel.querySelectorAll(".pet-links a"), function(a){
      a.addEventListener("click", function(){ setPanel(false, false); });
    });

    /* 睡眠 / 唤醒 */
    function enterSleep(){
      isSleeping = true;
      root.classList.add("sleeping");
      stopLoop();
      hopStart = -1;
      neb.draw(0, true);
      hideBtn.textContent = WAKE_LABEL;
      btn.setAttribute("aria-label", ARIA_SLEEP);
      try { sessionStorage.setItem(SLEEP_KEY, "sleeping"); } catch (e) {}
    }
    function wakeUp(){
      isSleeping = false;
      root.classList.remove("sleeping");
      startLoop();
      hideBtn.textContent = REST_LABEL;
      btn.setAttribute("aria-label", ARIA_AWAKE);
      try { sessionStorage.removeItem(SLEEP_KEY); } catch (e) {}
      if (!reduceMotion) hopStart = performance.now();
    }
    hideBtn.addEventListener("click", function(){
      if (isSleeping){ wakeUp(); }
      else { enterSleep(); setPanel(false, false); }
    });

    /* 尺寸变化：重设画布；睡眠/无动画补一帧静态 */
    var resizeTimer = 0;
    window.addEventListener("resize", function(){
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(function(){
        sizeCanvas(); cacheRect();
        if (reduceMotion || isSleeping) neb.draw(0, isSleeping);
      }, 160);
    });
    cacheRect();

    if (isSleeping) enterSleep(); else startLoop();
    window.__petNebulaCorner = neb;   /* 调试句柄（只读） */
  }

  /* ================= index 背景大星云 ================= */
  function initBackground(cfg){
    var canvas = document.getElementById(cfg.canvasId);
    if (!canvas) return;
    var ctx = canvas.getContext("2d");
    if (!ctx) return;

    var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    var low = isLowTier();

    var cfg2 = {};
    for (var k in CFG) cfg2[k] = CFG[k];
    if (cfg.overrides) for (var k2 in cfg.overrides) cfg2[k2] = cfg.overrides[k2];
    cfg2.lowTier = low;
    if (low) cfg2.fpsMs = CFG.lowTierFpsMs;

    var colors = {
      ink: cssVar(cfg.colorVars.ink[0], cfg.colorVars.ink[1]),
      cream: cssVar(cfg.colorVars.cream[0], cfg.colorVars.cream[1]),
      terra: cssVar(cfg.colorVars.terra[0], cfg.colorVars.terra[1]),
      gold: cssVar(cfg.colorVars.gold[0], cfg.colorVars.gold[1])
    };

    var dpr = Math.min(window.devicePixelRatio || 1, cfg2.dprMax);
    var W = 0, H = 0;
    function sizeCanvas(){
      W = window.innerWidth; H = window.innerHeight;
      canvas.width = Math.round(W * dpr);
      canvas.height = Math.round(H * dpr);
      canvas.style.width = W + "px";
      canvas.style.height = H + "px";
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      neb.setW(W);
    }

    var neb = createNebula(ctx, function (t){
      var R = Math.min(W, H) * cfg.sizeRatio / 2;
      var cx = W / 2 + Math.sin(t / 5200) * W * 0.006;
      var cy = H / 2 + Math.cos(t / 6100) * H * 0.008;
      return {
        w: W, h: H, cx: cx, cy: cy, bodyY: cy, rise: 0,
        ringR: R, bodyR: R, u: R / 150,
        eye: { dx: R * 0.32, dy: -R * 0.06, r: R * 0.085, pupil: R * 0.085 * 0.5, lookMax: R * 0.03 }
      };
    }, {
      cfg: cfg2, rnd: rndFactory(11), colors: colors,
      sprites: makeSprites(colors),
      reduceMotion: reduceMotion,
      halo: false, ring: false, shadow: false, isCorner: false,
      ambientMeteor: !!cfg.meteor
    });

    sizeCanvas();
    window.addEventListener("pointermove", function(e){
      neb.setPointer(e.clientX - W / 2, e.clientY - H / 2);
    }, { passive: true });
    window.addEventListener("scroll", function(){ neb.kick(0.1); }, { passive: true });
    document.addEventListener("visibilitychange", function(){
      if (document.hidden) neb._stop ? neb._stop() : null; else neb._start ? neb._start() : null;
    });

    var rafId = 0, lastFrame = -1, running = false;
    function frame(t){
      rafId = window.requestAnimationFrame(frame);
      if (t - lastFrame < cfg2.fpsMs) return;
      lastFrame = t;
      neb.draw(t, false);
    }
    function startLoop(){
      if (running || reduceMotion) return;
      running = true;
      rafId = window.requestAnimationFrame(frame);
    }
    function stopLoop(){ running = false; window.cancelAnimationFrame(rafId); }
    neb._stop = stopLoop; neb._start = startLoop;

    if (reduceMotion) neb.draw(0, false); else startLoop();
    if (cfg.meteor) neb.scheduleAmbientMeteor(performance.now() + 8000 + rndOffset());
    window.__petNebulaBackground = neb;   /* 调试句柄（只读） */
    function rndOffset(){ return Math.random() * 7000; }

    var resizeTimer = 0;
    window.addEventListener("resize", function(){
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(function(){
        sizeCanvas();
        if (reduceMotion) neb.draw(0, false);
      }, 160);
    });
  }

  window.PetNebula = { initCorner: initCorner, initBackground: initBackground, CFG: CFG };
})(window);
