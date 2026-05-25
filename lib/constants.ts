import type { AvatarId, CourseContentType, TopicCategory } from "./types";

export const avatars: Array<{ id: AvatarId; label: string; mark: string; bg: string }> = [
  { id: "seed", label: "种子", mark: "芽", bg: "bg-[#dfe9d7]" },
  { id: "lamp", label: "灯", mark: "灯", bg: "bg-[#f1dfbb]" },
  { id: "book", label: "书", mark: "书", bg: "bg-[#d9e2ee]" },
  { id: "moon", label: "月", mark: "月", bg: "bg-[#e8dcec]" },
  { id: "compass", label: "罗盘", mark: "辨", bg: "bg-[#d7e8e3]" },
  { id: "spark", label: "火花", mark: "问", bg: "bg-[#f0d8cf]" }
];

export const weekdays = ["周一", "周二", "周三", "周四", "周五", "周六", "周日"];

export const contentTypeLabels: Record<CourseContentType, string> = {
  tool: "工具",
  method: "方法",
  case: "案例"
};

export const topicCategoryLabels: Record<TopicCategory, string> = {
  controversy: "争议话题",
  learning: "学习困扰",
  relationship: "人际关系",
  career: "职业选择",
  other: "其他"
};

export const blindBoxLines = [
  "批判性思维不是先反对，而是先问：我凭什么相信它？",
  "一个好问题，常常比一个漂亮答案更接近真相。",
  "当观点让你很舒服时，尤其值得检查它的证据。",
  "把“我觉得”暂时放下，试着问“还有哪些解释同样可能？”",
  "立场可以鲜明，证据最好谦逊。",
  "判断信息时，先看来源、动机、证据链，再看情绪冲击。",
  "真正的思辨不是赢过别人，而是不轻易输给自己的偏见。",
  "一个观点越流行，越需要被温柔而认真地追问。"
];
