export function cleanText(value: string, maxLength = 2000) {
  return value
    .replace(/[<>]/g, "")
    .replace(/javascript:/gi, "")
    .replace(/on\w+=/gi, "")
    .trim()
    .slice(0, maxLength);
}

export function cleanNickname(value: string) {
  return cleanText(value, 24) || "思考者";
}

export function cleanEditCode(value: string) {
  return value.replace(/[^\dA-Za-z]/g, "").slice(0, 8);
}
