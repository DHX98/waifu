// === config.js ===
export const BLINK_ATLAS_JSON = "assets/sprites/blinking.json";
export const BLINK_IMAGE = "assets/sprites/blinking.png";
export const SPEAK_ATLAS_JSON = "assets/sprites/speaking.json";
export const SPEAK_IMAGE = "assets/sprites/speaking.png";

export const EXPRESSIONS = {
  angry: "assets/expressions/angry.png",
  comfort: "assets/expressions/comfort.png",
  curious: "assets/expressions/curious.png",
  flirting: "assets/expressions/flirting.png",
  lookingLeft: "assets/expressions/lookingLeft.png",
  worried: "assets/expressions/worried.png",
  contempt: "assets/expressions/contempt.png",
  happy: "assets/expressions/happy.png",
  encourage: "assets/expressions/encourage.png",
  shock: "assets/expressions/shock.png"
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
