const PAGINA_APOS_SAIR = "/";

const PAGINAS_RESTRITAS_A_GERENCIAR_USUARIOS = [
  "gerenciamentoDeUsuarios.html",
  "gerenciamentoDeCargos.html",
];

const PERMISSOES_POR_ITEM_SIDEBAR = {
  Dashboard: ["VISUALIZAR_DASHBOARD", "VISUALIZAR_DASHBOARD_GESTOR"],
  "Relatórios": ["EXPORTAR_RELATORIOS"],
  Usuários: ["GERENCIAR_USUARIOS"],
  Cargos: ["GERENCIAR_USUARIOS"],
  Alertas: ["VISUALIZAR_DASHBOARD"],
  Servidores: ["GERENCIAR_SERVIDORES"],
};

function pegarItensSidebar() {
  return Array.from(document.querySelectorAll("#sidebar .sbItem"));
}

function pegarPermissoesUsuario() {
  const permissoesSalvas = sessionStorage.getItem("PERMISSOES");
  if (!permissoesSalvas) return null;

  try {
    const permissoes = JSON.parse(permissoesSalvas);
    return Array.isArray(permissoes)
      ? permissoes.map((permissao) => String(permissao).toUpperCase())
      : [];
  } catch (erro) {
    console.error("Não foi possível ler as permissões do usuário:", erro);
    return [];
  }
}

function configurarAcessoDashboard(permissoesUsuario) {
  const podeVerAnalista =
    permissoesUsuario?.includes("VISUALIZAR_DASHBOARD") || false;
  const podeVerGestor =
    permissoesUsuario?.includes("VISUALIZAR_DASHBOARD_GESTOR") || false;
  const itemDashboard = pegarItensSidebar().find(
    (item) => item.querySelector(".sbRotulo")?.textContent.trim() === "Dashboard",
  );

  if (itemDashboard) {
    itemDashboard.dataset.dashboardNav = "true";

    if (podeVerAnalista && podeVerGestor) {
      const idSubmenu = "opcoesDashboardSidebar";
      const submenu = document.createElement("div");
      submenu.id = idSubmenu;
      submenu.className = "sbSubmenuDashboard";
      submenu.hidden = true;

      [
        { pagina: "analista.html", rotulo: "Painel do analista" },
        { pagina: "gerente.html", rotulo: "Painel do gestor" },
      ].forEach((opcao) => {
        const link = document.createElement("a");
        link.className = "sbSubitemDashboard";
        link.href = opcao.pagina;
        link.textContent = opcao.rotulo;
        submenu.appendChild(link);
      });

      itemDashboard.href = "#";
      itemDashboard.setAttribute("aria-expanded", "false");
      itemDashboard.setAttribute("aria-controls", idSubmenu);
      itemDashboard.insertAdjacentElement("afterend", submenu);
      itemDashboard.addEventListener("click", (evento) => {
        evento.preventDefault();
        const expandido = itemDashboard.getAttribute("aria-expanded") === "true";
        itemDashboard.setAttribute("aria-expanded", String(!expandido));
        submenu.hidden = expandido;
      });
    } else if (podeVerAnalista || podeVerGestor) {
      itemDashboard.href = podeVerAnalista ? "analista.html" : "gerente.html";
    }
  }

  const paginaAtual = window.location.pathname.split("/").pop();
  const paginasDashboard = ["gerente.html", "analista.html"];
  if (paginasDashboard.includes(paginaAtual)) {
    const podeAcessarPagina =
      paginaAtual === "analista.html" ? podeVerAnalista : podeVerGestor;

    if (!podeAcessarPagina) {
      const paginaPermitida = podeVerAnalista
        ? "analista.html"
        : podeVerGestor
          ? "gerente.html"
          : "gerenciamentoServidor.html";
      window.location.replace(paginaPermitida);
      return;
    }

    document.querySelectorAll(".navegacao a").forEach((link) => {
      const destino = (link.getAttribute("href") || "").split("/").pop();
      link.hidden =
        (destino === "analista.html" && !podeVerAnalista) ||
        (destino === "gerente.html" && !podeVerGestor);
    });
  }
}

function aplicarPermissoesSidebar() {
  const cargoAtual = (sessionStorage.getItem("CARGO") || "")
    .trim()
    .toLowerCase();
  const permissoesUsuario = pegarPermissoesUsuario();
  const cargoSidebar =
    permissoesUsuario === null && cargoAtual !== "administrador"
      ? "analista"
      : cargoAtual;

  pegarItensSidebar().forEach((item) => {
    const cargosPermitidos = (item.dataset.cargos || "")
      .split(",")
      .map((cargo) => cargo.trim())
      .filter(Boolean)
      .map((cargo) => cargo.toLowerCase());

    const rotulo = item.querySelector(".sbRotulo")?.textContent.trim();
    const permissoesNecessarias = PERMISSOES_POR_ITEM_SIDEBAR[rotulo] || [];
    const possuiPermissao =
      permissoesUsuario?.some((permissao) =>
        permissoesNecessarias.includes(permissao),
      ) || false;

    item.hidden =
      rotulo === "Servidores"
        ? false
        : rotulo === "Dashboard" ||
          rotulo === "Usuários" ||
          rotulo === "Cargos"
        ? !possuiPermissao
        : !cargosPermitidos.includes(cargoSidebar) && !possuiPermissao;
  });


  const paginaAtual = window.location.pathname.split("/").pop();
  configurarAcessoDashboard(permissoesUsuario);

  if (
    !permissoesUsuario?.includes("GERENCIAR_USUARIOS") &&
    PAGINAS_RESTRITAS_A_GERENCIAR_USUARIOS.includes(paginaAtual)
  ) {
    window.location.replace("gerenciamentoServidor.html");
  }

}

function marcarItemAtivoSidebar() {
  const paginaAtual = window.location.pathname.split("/").pop();

  pegarItensSidebar().forEach((item) => {
    const destino = (item.getAttribute("href") || "").split("/").pop();
    const ehPaginaAtual =
      destino !== "" && destino !== "#" && destino === paginaAtual;

    item.classList.toggle("ativo", ehPaginaAtual);

    if (ehPaginaAtual) {
      item.setAttribute("aria-current", "page");
    } else {
      item.removeAttribute("aria-current");
    }
  });
}

function definirTooltipsSidebar() {
  pegarItensSidebar().forEach((item) => {
    const rotulo = item.querySelector(".sbRotulo");
    if (rotulo) {
      item.title = item.dataset.titulo || rotulo.textContent.trim();
    }
  });
}

function bloquearLinksVaziosSidebar() {
  pegarItensSidebar().forEach((item) => {
    if (
      item.getAttribute("href") === "#" &&
      item.dataset.dashboardNav !== "true"
    ) {
      item.addEventListener("click", (evento) => evento.preventDefault());
    }
  });
}

function sairDoSistema() {
  sessionStorage.clear();
  window.location.href = PAGINA_APOS_SAIR;
}

function iniciarSidebar() {
  aplicarPermissoesSidebar();
  marcarItemAtivoSidebar();
  definirTooltipsSidebar();
  bloquearLinksVaziosSidebar();

  const botaoSair = document.getElementById("sbSair");
  if (botaoSair) {
    botaoSair.addEventListener("click", sairDoSistema);
  }
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", iniciarSidebar);
} else {
  iniciarSidebar();
}
