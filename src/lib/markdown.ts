import { esc } from "./esc";

export function mdInline(s: string): string {
  return esc(s)
    .replace(/\[\[([^\]|]+)(?:\|([^\]]+))?\]\]/g, (_, label: string, title: string | undefined) => {
      const t = title ?? label;
      return `<a href="#" class="al-em-breve" data-modal-title="${t}">${label}</a>`;
    })
    .replace(/\[([^\]]+)\]\(([^)]+)\)/g, (_, text: string, url: string) => {
      const href = url.replace(/&amp;/g, "&").replace(/&#39;/g, "'").replace(/&quot;/g, '"');
      const external = /^https?:\/\//.test(href);
      return `<a href="${href}"${external ? ' target="_blank" rel="noopener"' : ""}>${text}</a>`;
    })
    .replace(/\*([^*\n]+)\*/g, "<em>$1</em>");
}
