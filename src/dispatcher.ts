const pageMap: Record<string, () => Promise<{ render: () => void }>> = {
    home: () => import("./pages/home"),
    parceiros: () => import("./pages/parceiros"),
    servicos: () => import("./pages/servicos"),
    solucoes: () => import("./pages/solucoes"),
    recursos: () => import("./pages/recursos"),
    infra: () => import("./pages/infra"),
    profile: () => import("./pages/profile"),
    service: () => import("./pages/service"),
    missao: () => import("./pages/missao"),
    poem: () => import("./pages/poem"),
    essay: () => import("./pages/essay"),
    contato: () => import("./pages/contato"),
    entrar: () => import("./pages/entrar"),
    "faca-parte": () => import("./pages/faca-parte"),
};

function dispatch(): void {
    const page = document.body.dataset["page"];
    const fn = page !== undefined ? pageMap[page] : undefined;
    if (!fn) {
        if (page !== undefined) console.warn(`No renderer for page: ${page}`);
        return;
    }
    void (async () => {
        try {
            const mod = await fn();
            mod.render();
        } catch (e) {
            console.error("render falhou:", e);
            document.body.innerHTML = `<main class="main"><p>Algo quebrou. <a href="/">voltar</a></p></main>`;
        }
    })();
}

// readyState check (L-001): se DOM já carregou, despacha direto;
// senão aguarda DOMContentLoaded.
if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", dispatch);
} else {
    dispatch();
}
