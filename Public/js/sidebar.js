const PAGINA_APOS_SAIR = "/";

const CARGOS_CONHECIDOS = ["Administrador", "Analista", "TI"];

function pegarItensSidebar() {
  return Array.from(document.querySelectorAll("#sidebar .sbItem"));
}

function aplicarPermissoesSidebar() {
  const cargoAtual = sessionStorage.getItem("CARGO");
  const cargoReconhecido = CARGOS_CONHECIDOS.includes(cargoAtual);

  if (!cargoReconhecido) {
    console.warn(
      `Sidebar: cargo "${cargoAtual}" não reconhecido, exibindo todos os itens.`,
    );
    return;
  }

  pegarItensSidebar().forEach((item) => {
    const cargosPermitidos = (item.dataset.cargos || "")
      .split(",")
      .map((cargo) => cargo.trim())
      .filter(Boolean);

    item.hidden = !cargosPermitidos.includes(cargoAtual);
  });
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
