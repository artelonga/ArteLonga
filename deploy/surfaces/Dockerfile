FROM node:22-alpine
WORKDIR /app
COPY tools/surfaces-server.mjs /app/tools/surfaces-server.mjs
COPY tools/bake-geo.mjs /app/tools/bake-geo.mjs
COPY yuri /app/yuri
# registro canônico de autores (metadado unificado) — a surface yuri (UI) resolve
# variantes de autor (yuri = "Vieira Sugano" = "Yuri") sobre os próprios entries.
COPY neuro/authors.js /app/neuro/authors.js
# geo é DATA de runtime (não content+form): TODOS os binários são baixados +
# compilados aqui, no build, pra dentro da imagem — NÃO commitados, fora do git e
# do build-context (.dockerignore). País v4+v6 (CC0) + cidade v4 (DB-IP CC-BY).
# Non-fatal: se um dataset falhar, a surface degrada (país sem city / sem geo).
# v6 city (~98MB gz) fica de fora — IPv6 resolve em nível de país.
RUN node --max-old-space-size=2048 tools/bake-geo.mjs        || echo "[geo] country build skipped"; \
    node --max-old-space-size=2048 tools/bake-geo.mjs --city || echo "[geo] city build skipped"
ENV PORT=8080
EXPOSE 8080
CMD ["node", "tools/surfaces-server.mjs"]
