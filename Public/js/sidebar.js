const PAGINA_APOS_SAIR = "/";

const PAGINAS_RESTRITAS_A_GERENCIAR_USUARIOS = [
  "gerenciamentoDeUsuarios.html",
  "gerenciamentoDeCargos.html",
];

const PERMISSOES_POR_ITEM_SIDEBAR = {
  Dashboard: ["VISUALIZAR_DASHBOARD"],
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
  const paginasDashboard = ["gerente.html", "analista.html"];
  const possuiPermissaoDashboard =
    permissoesUsuario?.includes("VISUALIZAR_DASHBOARD") || false;

  if (paginasDashboard.includes(paginaAtual) && !possuiPermissaoDashboard) {
    window.location.replace("gerenciamentoServidor.html");
    return;
  }


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
    if (item.getAttribute("href") === "#") {
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
