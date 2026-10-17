const PAGINA_APOS_SAIR = "/";

const PAGINAS_RESTRITAS_A_ADMINISTRADOR = [
  "gerenciamentoDeUsuarios.html",
  "gerenciamentoDeCargos.html",
];

function pegarItensSidebar() {
  return Array.from(document.querySelectorAll("#sidebar .sbItem"));
}

function aplicarPermissoesSidebar() {
  const cargoAtual = (sessionStorage.getItem("CARGO") || "")
    .trim()
    .toLowerCase();

  pegarItensSidebar().forEach((item) => {
    const cargosPermitidos = (item.dataset.cargos || "")
      .split(",")
      .map((cargo) => cargo.trim())
      .filter(Boolean)
      .map((cargo) => cargo.toLowerCase());

    item.hidden = !cargosPermitidos.includes(cargoAtual);
  });

  /*const paginaAtual = window.location.pathname.split("/").pop();
  if (
    cargoAtual !== "administrador" &&
    PAGINAS_RESTRITAS_A_ADMINISTRADOR.includes(paginaAtual)
  ) {
    window.location.replace("cadastroDeServidor.html");
  }*/
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
