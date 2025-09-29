// === avatar.js ===
import { BLINK_ATLAS_JSON, BLINK_IMAGE, SPEAK_ATLAS_JSON, SPEAK_IMAGE, EXPRESSIONS } from './config.js';

async function loadAtlas(jsonUrl, imageUrl){
  const atlas = await fetch(jsonUrl).then(r=>r.json());
  const img = new Image(); img.src = imageUrl;
  const keys = Object.keys(atlas.frames).sort();
  const frames = keys.map(k => atlas.frames[k].frame);
  await new Promise(res => { if (img.complete) res(); else img.onload = res; });
  return { img, frames };
}

async function loadExpressions(map){
  const out = {};
  await Promise.all(Object.entries(map).map(([k,src]) => new Promise(res=>{
    const img = new Image(); img.onload = ()=>{ out[k]=img; res(); }; img.onerror = ()=>res(); img.src = src;
  })));
  return out;
}

export class Avatar {
  constructor(canvas){
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.scale = 2;
    this.fps = 10;

    this.state = 'idle'; // 'idle' (blink), 'talk' (speak)
    this.frameI = 0; this.acc = 0; this.last = performance.now();
    this.stickerName = null;
    this.sticker = null;
    this.stickerUntil = 0;

    // 记录当前角色帧绘制的矩形，供表情 PNG 覆盖使用（对齐到同一位置尺寸）
    this._lastRect = { dx:0, dy:0, dw:0, dh:0 };

    this.assetsReady = false;
    this.assets = { blink:null, speak:null, expr:{} };

    this._init();
  }

  async _init(){
    const [blink, speak, expr] = await Promise.all([
      loadAtlas(BLINK_ATLAS_JSON, BLINK_IMAGE),
      loadAtlas(SPEAK_ATLAS_JSON,  SPEAK_IMAGE),
      loadExpressions(EXPRESSIONS)
    ]);
    this.assets.blink = blink; this.assets.speak = speak; this.assets.expr = expr;
    this.assetsReady = true;
    requestAnimationFrame(this.tick.bind(this));
  }

  /** Set expression image. If same as current, extend its life. */
  setExpression(name, durationMs=6000){
    const now = performance.now();
    if (name === 'neutral'){
      this.stickerName = null; this.sticker = null; this.stickerUntil = 0; return;
    }
    if (name && this.assets.expr[name]){
      if (this.stickerName === name && this.sticker){
        this.stickerUntil = now + durationMs; // extend
      } else {
        this.stickerName = name;
        this.sticker = this.assets.expr[name];
        this.stickerUntil = now + durationMs;
      }
    }
  }

  setTalking(on){ this.state = on ? 'talk' : 'idle'; this.frameI = 0; }

  boostDuring(ms=900, add=6){
    const old = this.fps; this.fps = Math.min(24, old + add);
    setTimeout(()=>{ this.fps = old; }, ms);
  }

  /** 绘制一帧并记录矩形 */
  _drawFrame(sprite, frame){
    const {img, frames} = sprite;
    const f = frames[frame % frames.length];
    const dw = f.w * this.scale, dh = f.h * this.scale;
    const dx = (this.canvas.width - dw)/2, dy = (this.canvas.height - dh)/2;
    this._lastRect = { dx, dy, dw, dh };
    this.ctx.drawImage(img, f.x, f.y, f.w, f.h, dx, dy, dw, dh);
  }

  tick(now){
    if (!this.assetsReady) { requestAnimationFrame(this.tick.bind(this)); return; }
    const dt = (now - this.last)/1000; this.last = now; this.acc += dt;

    const frameDur = 1/Math.max(1,this.fps);
    while (this.acc >= frameDur){
      this.acc -= frameDur;
      this.frameI = (this.frameI + 1) % (this.state === 'talk' ? this.assets.speak.frames.length
                                                               : this.assets.blink.frames.length);
    }

    // 先画底层动作（眨眼/说话）
    this.ctx.clearRect(0,0,this.canvas.width,this.canvas.height);
    if (this.state === 'talk') this._drawFrame(this.assets.speak, this.frameI);
    else this._drawFrame(this.assets.blink, this.frameI);

    // 再用表情 PNG 覆盖同一矩形（与 atlas 对齐，不再画在右下角）。
    if (this.sticker && performance.now() < this.stickerUntil){
      const img = this.sticker;
      const { dx, dy, dw, dh } = this._lastRect; // 与角色相同的缩放与居中
      this.ctx.save();
      this.ctx.globalAlpha = 1.0; // 完全覆盖（PNG 自身透明区域保留）
      // 将整张表情 PNG 按角色绘制矩形缩放，保证对齐
      this.ctx.drawImage(img, dx, dy, dw, dh);
      this.ctx.restore();
    } else {
      this.sticker = null; this.stickerName = null; this.stickerUntil = 0;
    }

    requestAnimationFrame(this.tick.bind(this));
  }
}
