const MAXIMO_PERMISSAO = 4;

let listaCargos = [];
let permissoesDisponiveis = [];
let termoBuscaCargo = "";
let filtroStatus = "todos";

let idCargoEditando = null;
let idCargoExcluindo = null;
let salvandoCargo = false;

function svgIcone(corpo) {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${corpo}</svg>`;
}

const ICONES = {
  escudo: svgIcone(
    '<path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z"/><path d="m9 12 2 2 4-4"/>',
  ),
  usuarios: svgIcone(
    '<path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>',
  ),
  editar: svgIcone(
    '<path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"/><path d="m15 5 4 4"/>',
  ),
  lixeira: svgIcone(
    '<path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/><path d="M10 11v6"/><path d="M14 11v6"/>',
  ),
  check: svgIcone('<path d="M20 6 9 17l-5-5"/>'),
};

function escaparHtml(texto) {
  return String(texto ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function normalizarTexto(texto) {
  return String(texto ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}

function formatarNomePermissao(nome) {
  const texto = String(nome ?? "");
  if (/^[A-Z0-9_ ]+$/.test(texto)) {
    const minusculo = texto.replace(/_/g, " ").toLowerCase();
    return minusculo.charAt(0).toUpperCase() + minusculo.slice(1);
  }
  return texto;
}

async function carregarDadosCargos() {
  const idAdministrador = sessionStorage.ID;

  try {
    const [respostaCargos, respostaPermissoes] = await Promise.all([
      fetch(`/cargos/listar/${idAdministrador}`),
      fetch(`/cargos/permissoes/${idAdministrador}`),
    ]);
    const [cargos, permissoes] = await Promise.all([
      respostaCargos.json().catch(() => null),
      respostaPermissoes.json().catch(() => null),
    ]);

    if (!respostaCargos.ok) {
      throw new Error(
        (cargos && cargos.mensagem) || `Erro ${respostaCargos.status}`,
      );
    }
    if (!respostaPermissoes.ok) {
      throw new Error(
        (permissoes && permissoes.mensagem) ||
          `Erro ${respostaPermissoes.status}`,
      );
    }

    listaCargos = Array.isArray(cargos) ? cargos : [];
    permissoesDisponiveis = Array.isArray(permissoes) ? permissoes : [];

    renderizarCargos();
  } catch (erro) {
    console.error("Erro ao carregar cargos:", erro);
    document.getElementById("listaCargos").innerHTML =
      `<div class="estadoVazio">${escaparHtml(erro.message || "Não foi possível carregar os cargos.")}</div>`;
    document.getElementById("infoCargos").textContent = "";
  }
}

async function recarregarCargos() {
  const idAdministrador = sessionStorage.ID;
  const resposta = await fetch(`/cargos/listar/${idAdministrador}`);
  const cargos = await resposta.json().catch(() => null);
  if (!resposta.ok) {
    throw new Error((cargos && cargos.mensagem) || `Erro ${resposta.status}`);
  }
  listaCargos = cargos;
  renderizarCargos();
}

function buscarCargos(valor) {
  termoBuscaCargo = valor;
  renderizarCargos();
}

function filtrarCargosPorStatus(valor) {
  filtroStatus = valor;
  renderizarCargos();
}

function cargosFiltrados() {
  const termo = normalizarTexto(termoBuscaCargo);

  return listaCargos.filter((cargo) => {
    if (filtroStatus == "ativo" && !cargo.status) return false;
    if (filtroStatus == "inativo" && cargo.status) return false;

    if (termo == "") return true;

    const nomesPermissoes = cargo.permissoes
      .map((p) => formatarNomePermissao(p.nome))
      .join(" ");
    const texto = normalizarTexto(
      `${cargo.nome} ${cargo.descricao} ${nomesPermissoes}`,
    );
    return texto.includes(termo);
  });
}

function montarChipsPermissoes(permissoes) {
  if (permissoes.length == 0) {
    return `<span class="semPermissoes">Nenhuma permissão</span>`;
  }

  const visiveis = permissoes.slice(0, MAXIMO_PERMISSAO);
  const restantes = permissoes.length - visiveis.length;

  let html = visiveis
    .map(
      (p) =>
        `<span class="chipPermissao">${escaparHtml(formatarNomePermissao(p.nome))}</span>`,
    )
    .join("");

  if (restantes > 0) {
    const todas = permissoes
      .map((p) => formatarNomePermissao(p.nome))
      .join(", ");
    html += `<span class="chipPermissao chipMais" title="${escaparHtml(todas)}">+${restantes}</span>`;
  }
  return html;
}

function montarLinhaCargo(cargo) {
  const classeStatus = cargo.status ? "ativo" : "inativo";
  const textoStatus = cargo.status ? "Ativo" : "Inativo";

  let motivoSemExcluir = "";
  if (cargo.protegido) {
    motivoSemExcluir = "O cargo Administrador não pode ser excluído";
  } else if (cargo.totalUsuarios > 0) {
    motivoSemExcluir = `Existem ${cargo.totalUsuarios} usuário(s) com este cargo`;
  }

  return `
    <div class="linhaCargo">
      <div class="col colCargo">
        <div class="celulaCargo">
          <div class="iconeCargo">${ICONES.escudo}</div>
          <div class="dadosCargo">
            <span class="cargoNome">${escaparHtml(cargo.nome)}</span>
            <span class="cargoDescricao">${escaparHtml(cargo.descricao || "Sem descrição")}</span>
          </div>
        </div>
      </div>
      <div class="col colPermissoes">
        <div class="chipsPermissoes">${montarChipsPermissoes(cargo.permissoes)}</div>
      </div>
      <div class="col colUsuarios">
        <span class="contagemUsuarios" title="Usuários com este cargo">${ICONES.usuarios}${cargo.totalUsuarios}</span>
      </div>
      <div class="col colStatus">
        <span class="status ${classeStatus}">${textoStatus}</span>
      </div>
      <div class="col colAcoes">
        <div class="acoesLinha">
          <button class="btnIcone" type="button" title="Editar cargo" aria-label="Editar ${escaparHtml(cargo.nome)}" onclick="abrirModalCargo(${cargo.idCargo})">${ICONES.editar}</button>
          <button class="btnIcone perigo" type="button" title="${escaparHtml(motivoSemExcluir || "Excluir cargo")}" aria-label="Excluir ${escaparHtml(cargo.nome)}" ${motivoSemExcluir ? "disabled" : ""} onclick="abrirModalExclusaoCargo(${cargo.idCargo})">${ICONES.lixeira}</button>
        </div>
      </div>
    </div>`;
}

function renderizarCargos() {
  const filtrados = cargosFiltrados();
  const lista = document.getElementById("listaCargos");

  if (filtrados.length == 0) {
    const mensagem =
      listaCargos.length == 0
        ? "Nenhum cargo cadastrado. Clique em “Novo Cargo” para criar o primeiro."
        : "Nenhum cargo encontrado para essa busca.";
    lista.innerHTML = `<div class="estadoVazio">${mensagem}</div>`;
  } else {
    lista.innerHTML = filtrados.map(montarLinhaCargo).join("");
  }

  const info = document.getElementById("infoCargos");
  if (listaCargos.length == 0) {
    info.textContent = "";
  } else if (filtrados.length == listaCargos.length) {
    info.textContent = `${listaCargos.length} ${listaCargos.length == 1 ? "cargo" : "cargos"}`;
  } else {
    info.textContent = `Mostrando ${filtrados.length} de ${listaCargos.length} cargos`;
  }
}
