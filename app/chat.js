// === chat.js ===
import { OLLAMA_URL, OLLAMA_MODEL, SYSTEM_PROMPT } from './config.js';

export class ChatUI {
  constructor({ messagesEl, inputEl, sendBtn, onTyping, onExpression }){
    this.$messages = messagesEl;
    this.$input = inputEl;
    this.$send = sendBtn;
    this.onTyping = onTyping || (()=>{});
    this.onExpression = onExpression || (()=>{});

    // 仅保留“上一条用户输入”作为上下文
    this._prevUser = null;

    this.$send.addEventListener('click', ()=> this.send());
    this.$input.addEventListener('keydown', (e)=>{
      if (e.key === 'Enter' && !e.shiftKey){ e.preventDefault(); this.send(); }
    });
  }

  // ===== UI =====
  pushMsg(text, who){
    const div = document.createElement('div');
    div.className = 'msg ' + (who || 'ai');
    div.textContent = text;
    this.$messages.appendChild(div);
    this.$messages.scrollTop = this.$messages.scrollHeight;
    return div;
  }

  // ===== 表情解析（极简）：支持 [EXP:xxx]（] 可缺）与 xxx] 两种形态 =====
  _normalizeExp(name){
    if (!name) return null;
    const key = String(name).trim();
    const ok = new Set(['contempt','happy','encourage','shock','angry','comfort','curious','flirting','lookingLeft','worried','speaking','blinking']);
    return ok.has(key) ? key : null;
  }

  _tryDetectExp(buffer){
    // A: [EXP:worried] / [EXP:worried   （右括号可缺）
    const m1 = buffer.match(/^\s*\[(?:EXP|exp)\s*:\s*([A-Za-z]{2,32})\s*\]?/);
    if (m1){
      const exp = this._normalizeExp(m1[1]);
      if (exp) return { exp, consumed: m1[0].length };
    }
    // B: speaking] / flirting] （只有右括号）
    const m2 = buffer.match(/^\s*([A-Za-z]{2,32})\s*\]/);
    if (m2){
      const exp = this._normalizeExp(m2[1]);
      if (exp) return { exp, consumed: m2[0].length };
    }
    return { exp: null, consumed: 0 };
  }

  // ===== 交互入口 =====
  async send(){
    const text = this.$input.value.trim();
    if (!text) return;

    this.pushMsg(text, 'user');
    this.$input.value = '';

    await this.chat(text);

    // 聊天完成后，把“当前这条”记为上一次上下文
    this._prevUser = text;
  }

  // ===== 核心：仅带上一个 prompt 作为上下文 =====
  async chat(currentUserText){
    const aiDiv = this.pushMsg('（唔…在想啦~）', 'ai');

    // 只保留上一个 prompt：把“上一次 + 当前”合并为一个 user 消息（避免连续两个 user 角色）
    const userContent = this._prevUser
      ? `Previous message:\n${this._prevUser}\n\nCurrent message:\n${currentUserText}`
      : currentUserText;

    try{
      const resp = await fetch(OLLAMA_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: OLLAMA_MODEL,
          stream: true,
          messages: [
            { role:'system', content: SYSTEM_PROMPT },
            { role:'user', content: userContent }
          ]
        })
      });

      if (!resp.ok || !resp.body){
        aiDiv.textContent = `请求失败：${resp.status} ${resp.statusText}。请确认 Ollama 已就绪（${OLLAMA_MODEL}）。`;
        return;
      }

      // —— 流式渲染（不改原始流；在副本上做一次表情解析并吞掉标签） ——
      this.onTyping(true);
      aiDiv.textContent = '';

      const reader = resp.body.getReader();
      const decoder = new TextDecoder();

      let assistantRaw = '';      // 原始累计（含潜在标签）
      let expResolved = false;
      let expConsumed = 0;        // 吞掉的标签长度
      let buf = '';

      const flushLine = (line) => {
        if (!line) return;
        const s = line.startsWith('data:') ? line.slice(5).trim() : line.trim();
        let obj; try{ obj = JSON.parse(s); }catch{ return; }
        const chunk = obj?.message?.content ?? obj?.response ?? '';
        if (!chunk) return;

        assistantRaw += chunk;

        // 仅在前 200 字内尝试一次解析，命中后不再尝试
        if (!expResolved){
          const probe = assistantRaw.slice(0, 200);
          const { exp, consumed } = this._tryDetectExp(probe);
          if (exp){
            expResolved = true;
            expConsumed = consumed;
            this.onExpression(exp);
          }
        }

        aiDiv.textContent = assistantRaw.slice(expConsumed);
        this.$messages.scrollTop = this.$messages.scrollHeight;
      };

      while(true){
        const { value, done } = await reader.read();
        if (done) break;

        buf += decoder.decode(value, { stream:true });
        let idx;
        while((idx = buf.indexOf('\n')) >= 0){
          const line = buf.slice(0, idx);
          buf = buf.slice(idx+1);
          flushLine(line);
        }
      }
      if (buf) flushLine(buf);

      // 没解析到表情也无妨（不兜底，不加复杂度）
    }catch(e){
      aiDiv.textContent = '连接失败：' + e.message;
    }finally{
      this.onTyping(false);
    }
  }
}