const USUARIOS_POR_PAGINA = 10;

let listaUsuariosGlobais = [];
let usuariosFiltrados = [];
let termoBusca = "";
let campoOrdenacao = null;
let direcaoOrdenacao = "asc";
let paginaAtual = 1;

function svgIcone(corpo) {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${corpo}</svg>`;
}

const ICONES = {
  usuario: svgIcone(
    '<path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>',
  ),
  ferramenta: svgIcone(
    '<path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/>',
  ),
  editar: svgIcone(
    '<path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"/><path d="m15 5 4 4"/>',
  ),
  lixeira: svgIcone(
    '<path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/><path d="M10 11v6"/><path d="M14 11v6"/>',
  ),
  esquerda: svgIcone('<path d="m15 18-6-6 6-6"/>'),
  direita: svgIcone('<path d="m9 18 6-6-6-6"/>'),
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

function classeCargo(cargo) {
  return normalizarTexto(cargo)
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

function iniciais(nome) {
  const partes = String(nome || "")
    .trim()
    .split(/\s+/)
    .filter(Boolean);
  if (partes.length == 0) return "?";
  const primeira = partes[0][0];
  const ultima = partes.length > 1 ? partes[partes.length - 1][0] : "";
  return (primeira + ultima).toUpperCase();
}

function formatarUltimoAcesso(valor) {
  if (!valor) return "—";
  const data = new Date(valor);
  if (isNaN(data)) return "—";
  const dia = data.toLocaleDateString("pt-BR");
  const hora = data.toLocaleTimeString("pt-BR", {
    hour: "2-digit",
    minute: "2-digit",
  });
  return `${dia} - ${hora}`;
}

function normalizarUsuario(u) {
  const statusBruto = u.status !== undefined ? u.status : u.statusAtividade;

  return {
    idUsuario: u.idUsuario,
    nomeUsuario: u.nomeUsuario || u.nome || "",
    email: u.email || "",
    cargo: u.nomeCargo || u.cargo || "",
    status: !(
      statusBruto === false ||
      statusBruto === 0 ||
      statusBruto === "0"
    ),
    ultimoAcesso: u.ultimoAcesso || null,
    servidores: u.servidores || [],
  };
}

function pegarUsuariosPeloAdministrador() {
  if (!document.getElementById("listaUsuarios")) {
    console.error(
      "gerenciamentoDeUsuarios.html está desatualizado: falta o elemento #listaUsuarios. Substitua o HTML pela versão nova e recarregue com Ctrl+F5.",
    );
    return;
  }

  let idUsuario = sessionStorage.ID;

  fetch(`/usuarios/pegarUsuariosPeloAdministrador/${idUsuario}`, {
    method: "GET",
  })
    .then((response) => {
      if (!response.ok) {
        throw new Error(`Erro ${response.status} ao buscar usuários`);
      }
      return response.json();
    })
    .then((data) => {
      console.log(data);

      listaUsuariosGlobais = Array.isArray(data)
        ? data.map(normalizarUsuario)
        : [];

      atualizarTabela();
    })
    .catch((error) => {
      console.error("Error:", error);
      document.getElementById("listaUsuarios").innerHTML =
        `<div class="estadoVazio">Não foi possível carregar os usuários.</div>`;
      document.getElementById("infoPaginacao").textContent = "";
      document.getElementById("paginacao").innerHTML = "";
    });
}

function valorParaOrdenar(usuario, campo) {
  switch (campo) {
    case "nome":
      return usuario.nomeUsuario;
    case "email":
      return usuario.email;
    case "cargo":
      return usuario.cargo;
    case "status":
      return usuario.status ? 1 : 0;
    case "ultimoAcesso":
      return usuario.ultimoAcesso
        ? new Date(usuario.ultimoAcesso).getTime()
        : 0;
    default:
      return "";
  }
}

function compararUsuarios(a, b, campo) {
  const valorA = valorParaOrdenar(a, campo);
  const valorB = valorParaOrdenar(b, campo);

  if (typeof valorA === "number" && typeof valorB === "number") {
    return valorA - valorB;
  }
  return String(valorA).localeCompare(String(valorB), "pt-BR", {
    sensitivity: "base",
  });
}

function atualizarTabela() {
  const termo = normalizarTexto(termoBusca);

  usuariosFiltrados = listaUsuariosGlobais.filter((usuario) => {
    if (termo == "") return true;
    const texto = normalizarTexto(
      `${usuario.nomeUsuario} ${usuario.email} ${usuario.cargo}`,
    );
    return texto.includes(termo);
  });

  if (campoOrdenacao) {
    const fator = direcaoOrdenacao == "asc" ? 1 : -1;
    usuariosFiltrados.sort(
      (a, b) => fator * compararUsuarios(a, b, campoOrdenacao),
    );
  }

  renderizarTabela();
}

function buscarUsuarios(valor) {
  termoBusca = valor;
  paginaAtual = 1;
  atualizarTabela();
}

function ordenarUsuarios(campo) {
  if (campoOrdenacao == campo) {
    direcaoOrdenacao = direcaoOrdenacao == "asc" ? "desc" : "asc";
  } else {
    campoOrdenacao = campo;
    direcaoOrdenacao = "asc";
  }

  paginaAtual = 1;
  atualizarTabela();
}

function irParaPagina(pagina) {
  paginaAtual = pagina;
  renderizarTabela();
}

function gerarListaPaginas(atual, total) {
  if (total <= 5) {
    return Array.from({ length: total }, (_, i) => i + 1);
  }

  const paginas = new Set([1, total, atual - 1, atual, atual + 1]);
  if (atual <= 2) {
    paginas.add(2);
    paginas.add(3);
  }
  if (atual >= total - 1) {
    paginas.add(total - 2);
    paginas.add(total - 1);
  }

  const ordenadas = [...paginas]
    .filter((p) => p >= 1 && p <= total)
    .sort((a, b) => a - b);

  const resultado = [];
  for (let i = 0; i < ordenadas.length; i++) {
    if (i > 0 && ordenadas[i] - ordenadas[i - 1] > 1) {
      resultado.push("...");
    }
    resultado.push(ordenadas[i]);
  }
  return resultado;
}

function montarLinhaUsuario(usuario) {
  const classeDoCargo = classeCargo(usuario.cargo);
  const iconeDoCargo =
    classeDoCargo == "tecnico" ? ICONES.ferramenta : ICONES.usuario;
  const textoCargo = usuario.cargo || "Sem cargo";

  const classeStatus = usuario.status ? "ativo" : "inativo";
  const textoStatus = usuario.status ? "Ativo" : "Inativo";

  const ehUsuarioLogado =
    String(usuario.idUsuario) === String(sessionStorage.ID);

  return `
        <div class="linhaUsuario">
            <div class="col colUsuario">
                <div class="celulaUsuario">
                    <div class="avatar">${escaparHtml(iniciais(usuario.nomeUsuario))}</div>
                    <div class="dadosUsuario">
                        <span class="usuarioNome">${escaparHtml(usuario.nomeUsuario)}</span>
                        <span class="usuarioEmailInline">${escaparHtml(usuario.email)}</span>
                    </div>
                </div>
            </div>
            <div class="col colEmail">
                <span class="usuarioEmail">${escaparHtml(usuario.email)}</span>
            </div>
            <div class="col colCargo">
                <span class="cargo ${classeDoCargo}">${iconeDoCargo}${escaparHtml(textoCargo)}</span>
            </div>
            <div class="col colStatus">
                <span class="status ${classeStatus}">${textoStatus}</span>
            </div>
            <div class="col colUltimoAcesso">
                <span class="ultimoAcesso">${formatarUltimoAcesso(usuario.ultimoAcesso)}</span>
            </div>
            <div class="col colAcoes">
                <div class="acoesLinha">
                    <button class="btnIcone" type="button" title="Editar usuário" aria-label="Editar ${escaparHtml(usuario.nomeUsuario)}" onclick="abrirModalEdicao(${usuario.idUsuario})">${ICONES.editar}</button>
                    <button class="btnIcone perigo" type="button" title="${ehUsuarioLogado ? "Você não pode excluir a si mesmo" : "Excluir usuário"}" aria-label="Excluir ${escaparHtml(usuario.nomeUsuario)}" ${ehUsuarioLogado ? "disabled" : ""} onclick="abrirModalExclusao(${usuario.idUsuario})">${ICONES.lixeira}</button>
                </div>
            </div>
        </div>`;
}

function renderizarTabela() {
  const total = usuariosFiltrados.length;
  const totalPaginas = Math.max(1, Math.ceil(total / USUARIOS_POR_PAGINA));

  if (paginaAtual > totalPaginas) paginaAtual = totalPaginas;
  if (paginaAtual < 1) paginaAtual = 1;

  const inicio = (paginaAtual - 1) * USUARIOS_POR_PAGINA;
  const usuariosDaPagina = usuariosFiltrados.slice(
    inicio,
    inicio + USUARIOS_POR_PAGINA,
  );

  const lista = document.getElementById("listaUsuarios");
  if (usuariosDaPagina.length == 0) {
    const mensagem =
      listaUsuariosGlobais.length == 0
        ? "Nenhum usuário cadastrado."
        : "Nenhum usuário encontrado para essa busca.";
    lista.innerHTML = `<div class="estadoVazio">${mensagem}</div>`;
  } else {
    lista.innerHTML = usuariosDaPagina.map(montarLinhaUsuario).join("");
  }

  const info = document.getElementById("infoPaginacao");
  if (total == 0) {
    info.textContent = "";
  } else {
    info.textContent = `Mostrando ${inicio + 1} a ${inicio + usuariosDaPagina.length} de ${total} ${total == 1 ? "usuário" : "usuários"}`;
  }

  const paginacao = document.getElementById("paginacao");
  if (totalPaginas <= 1) {
    paginacao.innerHTML = "";
  } else {
    let html = `<button class="btnPagina" type="button" aria-label="Página anterior" ${paginaAtual == 1 ? "disabled" : ""} onclick="irParaPagina(${paginaAtual - 1})">${ICONES.esquerda}</button>`;

    const paginas = gerarListaPaginas(paginaAtual, totalPaginas);
    for (let i = 0; i < paginas.length; i++) {
      const pagina = paginas[i];
      if (pagina == "...") {
        html += `<span class="reticencias">···</span>`;
      } else {
        html += `<button class="btnPagina ${pagina == paginaAtual ? "ativo" : ""}" type="button" ${pagina == paginaAtual ? 'aria-current="page"' : ""} onclick="irParaPagina(${pagina})">${pagina}</button>`;
      }
    }

    html += `<button class="btnPagina" type="button" aria-label="Próxima página" ${paginaAtual == totalPaginas ? "disabled" : ""} onclick="irParaPagina(${paginaAtual + 1})">${ICONES.direita}</button>`;
    paginacao.innerHTML = html;
  }

  document.querySelectorAll(".btnOrdenar").forEach((botao) => {
    const ativo = botao.dataset.campo == campoOrdenacao;
    botao.classList.toggle("ativo", ativo);
    botao.classList.toggle("asc", ativo && direcaoOrdenacao == "asc");
    botao.classList.toggle("desc", ativo && direcaoOrdenacao == "desc");
  });
}

function abrirModalNovoUsuario() {
  alert("Cadastro de novo usuário ainda não implementado.");
}

let idUsuarioExcluindo = null;

function abrirModalExclusao(idUsuarioClicado) {
  idUsuarioExcluindo = idUsuarioClicado;

  let usuarioSelecionado = null;
  for (let i = 0; i < listaUsuariosGlobais.length; i++) {
    if (listaUsuariosGlobais[i].idUsuario === idUsuarioClicado) {
      usuarioSelecionado = listaUsuariosGlobais[i];
      break;
    }
  }
  if (!usuarioSelecionado) return;

  document.getElementById("textoConfirmacaoExclusao").innerHTML =
    `Tem certeza que deseja excluir <strong>${escaparHtml(usuarioSelecionado.nomeUsuario)}</strong>? Essa ação não pode ser desfeita.`;

  document.getElementById("modalExclusao").classList.remove("escondido");
}

function fecharModalExclusao() {
  document.getElementById("modalExclusao").classList.add("escondido");
}

function confirmarExclusaoUsuario() {
  const idAdministrador = sessionStorage.ID;

  fetch(`/usuarios/excluirUsuario/${idAdministrador}`, {
    method: "DELETE",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ idUsuario: idUsuarioExcluindo }),
  })
    .then((response) => {
      if (!response.ok) {
        throw new Error(`Erro ${response.status} ao excluir usuário`);
      }
      fecharModalExclusao();
      pegarUsuariosPeloAdministrador();
    })
    .catch((erro) => {
      console.error("Erro ao excluir usuário:", erro);
      alert("Não foi possível excluir o usuário.");
    });
}

let servidoresDisponiveis = [];

function carregarServidoresDoAeroporto() {
  let idAdministrador = sessionStorage.ID;

  fetch(`/servidores/pegarServidoresPorAeroporto/${idAdministrador}`, {
    method: "GET",
  })
    .then((response) => response.json())
    .then((data) => {
      servidoresDisponiveis = data;
      console.log("Servidores carregados:", servidoresDisponiveis);
    })
    .catch((error) => {
      console.error("Erro ao buscar servidores do aeroporto:", error);
    });
}

let idUsuarioEditando = null;

function abrirModalEdicao(idUsuarioClicado) {
  idUsuarioEditando = idUsuarioClicado;

  let usuarioSelecionado = {};

  for (let i = 0; i < listaUsuariosGlobais.length; i++) {
    if (listaUsuariosGlobais[i].idUsuario === idUsuarioClicado) {
      usuarioSelecionado = listaUsuariosGlobais[i];
      break;
    }
  }

  inputNomeModal.value = usuarioSelecionado.nomeUsuario;
  inputEmailModal.value = usuarioSelecionado.email;

  if (usuarioSelecionado.status == false) {
    document.getElementById("selectStatusModal").value = "inativo";
  } else {
    document.getElementById("selectStatusModal").value = "ativo";
  }

  let idsServidoresUsuario = [];
  for (let i = 0; i < usuarioSelecionado.servidores.length; i++) {
    idsServidoresUsuario.push(usuarioSelecionado.servidores[i].idServidor);
  }

  let containerServidores = document.querySelector(".gridServidoresModal");
  let htmlCheckboxes = "";

  for (let i = 0; i < servidoresDisponiveis.length; i++) {
    let servidor = servidoresDisponiveis[i];

    let estaMarcado = "";
    let classeAtiva = "";

    for (let j = 0; j < idsServidoresUsuario.length; j++) {
      if (idsServidoresUsuario[j] === servidor.idServidor) {
        estaMarcado = "checked";
        classeAtiva = "ativo";
        break;
      }
    }

    htmlCheckboxes += `
            <label class="checkboxServidor ${classeAtiva}">
                <input type="checkbox" value="${servidor.idServidor}" class="inputServidorCheckbox" ${estaMarcado} onchange="alternarVisualCheckbox(this)">
                <span class="nomeServidorModal">${servidor.nomeServidor}</span>
            </label>
        `;
  }

  containerServidores.innerHTML = htmlCheckboxes;

  document.getElementById("modalEdicao").classList.remove("escondido");
}

function fecharModalEdicao() {
  modalEdicao.classList.add("escondido");
}

function alternarVisualCheckbox(input) {
  let labelPai = input.parentElement;

  if (input.checked) {
    labelPai.classList.add("ativo");
  } else {
    labelPai.classList.remove("ativo");
  }
}

function salvarEdicaoUsuario() {
  const idAdministrador = sessionStorage.ID;

  let usuarioOriginal = null;
  for (let i = 0; i < listaUsuariosGlobais.length; i++) {
    if (listaUsuariosGlobais[i].idUsuario === idUsuarioEditando) {
      usuarioOriginal = listaUsuariosGlobais[i];
      break;
    }
  }

  let requisicoesPendentes = [];

  const novoStatus = document.getElementById("selectStatusModal").value;

  if (novoStatus === "inativo" && usuarioOriginal.status == true) {
    const reqInativar = fetch(`/usuarios/inativarUsuario/${idAdministrador}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        idUsuario: idUsuarioEditando,
      }),
    });
    requisicoesPendentes.push(reqInativar);
  }

  if (novoStatus === "ativo" && usuarioOriginal.status == false) {
    const reqAtivar = fetch(`/usuarios/ativarUsuario/${idAdministrador}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        idUsuario: idUsuarioEditando,
      }),
    });
    requisicoesPendentes.push(reqAtivar);
  }

  const checkboxes = document.querySelectorAll(".inputServidorCheckbox");

  let servidoresSelecionados = [];
  for (let i = 0; i < checkboxes.length; i++) {
    if (checkboxes[i].checked) {
      servidoresSelecionados.push(Number(checkboxes[i].value));
    }
  }

  let servidoresOriginais = [];
  for (let i = 0; i < usuarioOriginal.servidores.length; i++) {
    servidoresOriginais.push(usuarioOriginal.servidores[i].idServidor);
  }

  let servidoresParaAdicionar = [];
  for (let i = 0; i < servidoresSelecionados.length; i++) {
    let idSelecionado = servidoresSelecionados[i];
    let encontrado = false;
    for (let j = 0; j < servidoresOriginais.length; j++) {
      if (servidoresOriginais[j] === idSelecionado) {
        encontrado = true;
        break;
      }
    }
    if (!encontrado) {
      servidoresParaAdicionar.push(idSelecionado);
    }
  }

  let servidoresParaRemover = [];
  for (let i = 0; i < servidoresOriginais.length; i++) {
    let idOriginal = servidoresOriginais[i];
    let encontrado = false;
    for (let j = 0; j < servidoresSelecionados.length; j++) {
      if (servidoresSelecionados[j] === idOriginal) {
        encontrado = true;
        break;
      }
    }
    if (!encontrado) {
      servidoresParaRemover.push(idOriginal);
    }
  }

  for (let i = 0; i < servidoresParaAdicionar.length; i++) {
    let idServidor = servidoresParaAdicionar[i];
    const reqAdd = fetch(
      `/servidores/adicionarServidoresUsuario/${idAdministrador}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          idUsuario: idUsuarioEditando,
          idServidor: idServidor,
        }),
      },
    );
    requisicoesPendentes.push(reqAdd);
  }

  for (let i = 0; i < servidoresParaRemover.length; i++) {
    let idServidor = servidoresParaRemover[i];
    const reqRem = fetch(
      `/servidores/removerServidorUsuario/${idAdministrador}`,
      {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          idUsuario: idUsuarioEditando,
          idServidor: idServidor,
        }),
      },
    );
    requisicoesPendentes.push(reqRem);
  }

  if (requisicoesPendentes.length > 0) {
    Promise.all(requisicoesPendentes)
      .then((respostas) => {
        fecharModalEdicao();
        pegarUsuariosPeloAdministrador();
      })
      .catch((erro) => {
        console.error("Erro ao salvar edições:", erro);
        alert("Houve um erro ao processar as alterações.");
      });
  } else {
    fecharModalEdicao();
  }
}
