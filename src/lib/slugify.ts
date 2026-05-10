export function slugify(s: string): string {
  return norm(s).replace(/[^\w\s-]/g, "").trim().replace(/[\s_]+/g, "-");
}

function norm(s: string): string {
  return s.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "");
}
