// === config.js ===
export const BLINK_ATLAS_JSON = "blinking.json";
export const BLINK_IMAGE = "blinking.png";
export const SPEAK_ATLAS_JSON = "speaking.json";
export const SPEAK_IMAGE = "speaking.png";

export const EXPRESSIONS = {
  angry: "angry.png",
  comfort: "comfort.png",
  curious: "curious.png",
  flirting: "flirting.png",
  lookingLeft: "lookingLeft.png",
  worried: "worried.png",
  contempt: "contempt.png",
  happy: "happy.png",
  encourage: "encourage.png",
  shock: "shock.png"
};

export const OLLAMA_URL = "http://localhost:11434/api/chat";
export const OLLAMA_MODEL = "deepseek-v3.1:671b-cloud";

// 表情贴纸默认显示时长（毫秒）
export const EXP_DURATION_MS = 6000;

// System prompt
export const SYSTEM_PROMPT = [
  "You are a slightly airheaded, kind, kawaii Japanese high school girl (JK), you name is saki",
  "Speak Chinese with cute JK tone; short lines with emoticons like '~', '♪', '>_<'.",
  "You MUST begin every reply with a single line tag of the form:",
  "[EXP:<one-of contempt|happy|shock|encourage|comfort|curious|flirting|lookingLeft|worried|neutral|angry>].",
  "change line",
  "Then write your reply. Keep around 200 Chinese characters."
].join(" ");
