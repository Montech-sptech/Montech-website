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

const OPCOES_DASHBOARD = [
  {
    pagina: "monitoramento_continuo.html",
    rotulo: "Monitoramento contínuo",
    rotuloCompacto: "Monit.",
    permissao: "VISUALIZAR_DASHBOARD",
  },
  {
    pagina: "diagnostico_tecnico.html",
    rotulo: "Diagnóstico técnico",
    rotuloCompacto: "Diagnóstico",
    permissao: "VISUALIZAR_DASHBOARD",
  },
  {
    pagina: "saude_tendencia.html",
    rotulo: "Saúde e tendência",
    rotuloCompacto: "Saúde",
    permissao: "VISUALIZAR_DASHBOARD",
  },
  {
    pagina: "analise_alerta.html",
    rotulo: "Análise de alerta",
    rotuloCompacto: "Alertas",
    permissao: "VISUALIZAR_DASHBOARD_GESTOR",
  },
  {
    pagina: "resposta_incidentes.html",
    rotulo: "Resposta a incidentes",
    rotuloCompacto: "Resposta",
    permissao: "VISUALIZAR_DASHBOARD_GESTOR",
  },
];

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
  const permissoes = permissoesUsuario || [];
  const opcoesPermitidas = OPCOES_DASHBOARD.filter((opcao) =>
    permissoes.includes(opcao.permissao),
  );
  const itemDashboard = pegarItensSidebar().find(
    (item) => item.querySelector(".sbRotulo")?.textContent.trim() === "Dashboard",
  );

  if (itemDashboard && opcoesPermitidas.length) {
    itemDashboard.dataset.dashboardNav = "true";

    const idSubmenu = "opcoesDashboardSidebar";
    const paginaAtual = window.location.pathname.split("/").pop();
    const submenu = document.createElement("div");
    submenu.id = idSubmenu;
    submenu.className = "sbSubmenuDashboard";
    submenu.hidden = !opcoesPermitidas.some(
      (opcao) => opcao.pagina === paginaAtual,
    );

    opcoesPermitidas.forEach((opcao) => {
      const link = document.createElement("a");
      const rotulo = document.createElement("span");
      const rotuloCompacto = document.createElement("span");
      link.className = "sbSubitemDashboard";
      link.href = opcao.pagina;
      rotulo.textContent = opcao.rotulo;
      rotuloCompacto.className = "sbRotuloDashboardCompacto";
      rotuloCompacto.textContent = opcao.rotuloCompacto;
      link.append(rotulo, rotuloCompacto);
      submenu.appendChild(link);
    });

    itemDashboard.href = "#";
    itemDashboard.setAttribute(
      "aria-expanded",
      String(!submenu.hidden),
    );
    itemDashboard.setAttribute("aria-controls", idSubmenu);
    itemDashboard.insertAdjacentElement("afterend", submenu);
    itemDashboard.addEventListener("click", (evento) => {
      evento.preventDefault();
      const expandido = itemDashboard.getAttribute("aria-expanded") === "true";
      itemDashboard.setAttribute("aria-expanded", String(!expandido));
      submenu.hidden = expandido;
    });
  }

  const paginaAtual = window.location.pathname.split("/").pop();
  const opcaoAtual = OPCOES_DASHBOARD.find(
    (opcao) => opcao.pagina === paginaAtual,
  );
  if (opcaoAtual && !permissoes.includes(opcaoAtual.permissao)) {
    const paginaPermitida =
      opcoesPermitidas[0]?.pagina || "gerenciamentoServidor.html";
    window.location.replace(paginaPermitida);
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
    const ehDashboardAtual =
      item.querySelector(".sbRotulo")?.textContent.trim() === "Dashboard" &&
      OPCOES_DASHBOARD.some((opcao) => opcao.pagina === paginaAtual);

    item.classList.toggle("ativo", ehPaginaAtual || ehDashboardAtual);

    if (ehPaginaAtual || ehDashboardAtual) {
      item.setAttribute("aria-current", "page");
    } else {
      item.removeAttribute("aria-current");
    }
  });

  document.querySelectorAll(".sbSubitemDashboard").forEach((link) => {
    const ehPaginaAtual = link.getAttribute("href") === paginaAtual;
    link.classList.toggle("ativo", ehPaginaAtual);
    if (ehPaginaAtual) {
      link.setAttribute("aria-current", "page");
    } else {
      link.removeAttribute("aria-current");
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
