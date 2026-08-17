export function formatDate(d: string | Date) {
  const date = typeof d === "string" ? new Date(d) : d;
  return date.toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
}
export function formatTime(d: Date) {
  return d.toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" });
}
export function generateScript(botId: string, name: string) {
  return `<!-- ${name} chatbot widget -->\n<script async src="https://cdn.rover-chatbot.com/widget.js" data-bot-id="${botId}"></script>`;
}
