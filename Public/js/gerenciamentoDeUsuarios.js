const USUARIOS_POR_PAGINA = 8;

// Limites usados nas validações (ajuste aqui se o banco/regra for diferente)
const NOME_MIN = 3;
const NOME_MAX = 100;
const EMAIL_MAX = 100;
const SENHA_MIN = 8;
const SENHA_MAX = 64;
const BUSCA_MAX = 100;
const CAMPOS_ORDENAVEIS = ["nome", "email", "cargo", "status"];
const REGEX_EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
// Termina em .com ou .com.xx (ex.: .com, .com.br)
const REGEX_DOMINIO_COM = /\.com(\.[a-z]{2})?$/i;

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

function normalizarUsuario(u) {
  if (!u || typeof u !== "object") return null;

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
    servidores: Array.isArray(u.servidores) ? u.servidores : [],
  };
}

function pegarUsuariosPeloAdministrador() {
  const listaUsuarios = document.getElementById("listaUsuarios");
  if (!listaUsuarios) {
    console.error(
      "gerenciamentoDeUsuarios.html está desatualizado: falta o elemento #listaUsuarios. Substitua o HTML pela versão nova e recarregue com Ctrl+F5.",
    );
    return;
  }

  const idUsuario = sessionStorage.ID;
  if (!idUsuario) {
    console.error("ID do administrador não encontrado na sessão.");
    listaUsuarios.innerHTML = `<div class="estadoVazio">Sessão não encontrada. Faça login novamente.</div>`;
    return;
  }

  fetch(`/usuarios/pegarUsuariosPeloAdministrador/${encodeURIComponent(idUsuario)}`, {
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
        ? data.map(normalizarUsuario).filter(Boolean)
        : [];

      atualizarTabela();
    })
    .catch((error) => {
      console.error("Error:", error);
      listaUsuarios.innerHTML =
        `<div class="estadoVazio">Não foi possível carregar os usuários.</div>`;

      const info = document.getElementById("infoPaginacao");
      const paginacao = document.getElementById("paginacao");
      if (info) info.textContent = "";
      if (paginacao) paginacao.innerHTML = "";
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
  termoBusca = String(valor ?? "").slice(0, BUSCA_MAX);
  paginaAtual = 1;
  atualizarTabela();
}

function ordenarUsuarios(campo) {
  if (!CAMPOS_ORDENAVEIS.includes(campo)) return;

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
  const numero = Number(pagina);
  if (!Number.isInteger(numero)) return;

  const totalPaginas = Math.max(
    1,
    Math.ceil(usuariosFiltrados.length / USUARIOS_POR_PAGINA),
  );
  if (numero < 1 || numero > totalPaginas) return;

  paginaAtual = numero;
  renderizarTabela();
}

function gerarListaPaginas(atual, total) {
  if (!Number.isInteger(total) || total < 1) return [];

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
  const idSeguro = Number(usuario.idUsuario);

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
                <span class="cargo ${classeDoCargo}" title="${escaparHtml(textoCargo)}">${iconeDoCargo}<span class="cargoTexto">${escaparHtml(textoCargo)}</span></span>
            </div>
            <div class="col colStatus">
                <span class="status ${classeStatus}">${textoStatus}</span>
            </div>
            <div class="col colAcoes">
                <div class="acoesLinha">
                    <button class="btnIcone" type="button" title="Editar usuário" aria-label="Editar ${escaparHtml(usuario.nomeUsuario)}" onclick="abrirModalEdicao(${idSeguro})">${ICONES.editar}</button>
                    <button class="btnIcone perigo" type="button" title="${ehUsuarioLogado ? "Você não pode excluir a si mesmo" : "Excluir usuário"}" aria-label="Excluir ${escaparHtml(usuario.nomeUsuario)}" ${ehUsuarioLogado ? "disabled" : ""} onclick="abrirModalExclusao(${idSeguro})">${ICONES.lixeira}</button>
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

/**/

function abrirModalNovoUsuario() {
  const tela = document.getElementById("telaCadastroUser");
  if (!tela) return;

  const mensagemCadastro = document.getElementById("mensagemCadastroUser");
  if (mensagemCadastro) mensagemCadastro.textContent = "";

  tela.classList.remove("escondido");
  carregarAeroportoDoAdministrador();
  carregarCargos();
}


/* ===== Validações e máscaras compartilhadas ===== */

function somenteDigitos(texto) {
  return String(texto ?? "").replace(/\D/g, "");
}

// 000.000.000-00
function mascararCpf(valor) {
  const d = somenteDigitos(valor).slice(0, 11);
  let r = d.slice(0, 3);
  if (d.length > 3) r += "." + d.slice(3, 6);
  if (d.length > 6) r += "." + d.slice(6, 9);
  if (d.length > 9) r += "-" + d.slice(9, 11);
  return r;
}

// (00) 0000-0000 ou (00) 00000-0000
function mascararTelefone(valor) {
  const d = somenteDigitos(valor).slice(0, 11);
  if (d.length === 0) return "";
  if (d.length < 3) return `(${d}`;

  const ddd = d.slice(0, 2);
  const resto = d.slice(2);

  if (resto.length <= 4) return `(${ddd}) ${resto}`;
  if (d.length <= 10) return `(${ddd}) ${resto.slice(0, 4)}-${resto.slice(4)}`;
  return `(${ddd}) ${resto.slice(0, 5)}-${resto.slice(5)}`;
}

function aplicarMascaraCampo(idCampo, funcaoMascara, tamanhoMaximo, tipoTeclado) {
  const campo = document.getElementById(idCampo);
  if (!campo) return;

  campo.maxLength = tamanhoMaximo;
  campo.inputMode = tipoTeclado;
  campo.value = funcaoMascara(campo.value);

  campo.addEventListener("input", () => {
    const mascarado = funcaoMascara(campo.value);
    if (campo.value !== mascarado) campo.value = mascarado;
  });
}

// Cada validador retorna a mensagem de erro ou null se estiver válido

function validarNomeUsuario(nome) {
  if (nome.length === 0) {
    return "O nome não pode estar vazio nem conter apenas espaços em branco.";
  }
  if (nome.length < NOME_MIN) {
    return `O nome deve ter no mínimo ${NOME_MIN} caracteres.`;
  }
  if (nome.length > NOME_MAX) {
    return `O nome deve ter no máximo ${NOME_MAX} caracteres.`;
  }
  return null;
}

function validarCpfUsuario(cpf) {
  if (cpf.length === 0) return "O CPF não pode estar vazio.";
  if (cpf.length !== 11) return "O CPF deve ter 11 dígitos.";
  return null;
}

function validarEmailUsuario(email) {
  if (email.length === 0) return "O email não pode estar vazio.";
  if (email.length > EMAIL_MAX) {
    return `O email deve ter no máximo ${EMAIL_MAX} caracteres.`;
  }
  if (!email.includes("@")) return "O email deve conter o @.";
  if (email.split("@").length !== 2 || !REGEX_EMAIL.test(email)) {
    return "Informe um email válido.";
  }
  if (!REGEX_DOMINIO_COM.test(email)) {
    return "O email deve terminar com .com (ex.: usuario@dominio.com).";
  }
  return null;
}

// Telefone é opcional: só valida se foi preenchido
function validarTelefoneUsuario(telefone) {
  if (telefone.length === 0) return null;
  if (telefone.length !== 10 && telefone.length !== 11) {
    return "O telefone deve ter 10 ou 11 dígitos (com DDD).";
  }
  const ddd = Number(telefone.slice(0, 2));
  if (ddd < 11 || ddd > 99) return "DDD do telefone inválido.";
  if (telefone.length === 11 && telefone[2] !== "9") {
    return "Celular deve começar com 9 após o DDD.";
  }
  return null;
}

// A senha não recebe trim: espaços no meio ou nas pontas fazem parte dela
function validarSenhaUsuario(senha) {
  if (senha.trim().length === 0) return "A senha não pode estar vazia.";
  if (senha.length < SENHA_MIN) {
    return `A senha deve ter no mínimo ${SENHA_MIN} caracteres.`;
  }
  if (senha.length > SENHA_MAX) {
    return `A senha deve ter no máximo ${SENHA_MAX} caracteres.`;
  }
  return null;
}

// Garante que o valor de um <select> é uma das opções reais dele (e não o placeholder vazio)
function valorEstaNasOpcoes(select) {
  if (!select || select.value === "") return false;
  return Array.from(select.options).some((opcao) => opcao.value === select.value);
}


function cadastrarUsuario() {
  const mensagemCadastro = document.getElementById("mensagemCadastroUser");
  const formCadastro = document.getElementById("formCadastroUser");
  const botaoEnviar = formCadastro
    ? formCadastro.querySelector('[type="submit"]')
    : null;

  if (!mensagemCadastro || !formCadastro) {
    console.error("Formulário de cadastro não encontrado no HTML.");
    return;
  }
  mensagemCadastro.textContent = "";

  const inputNome = document.getElementById("nomeCadastroUser");
  const inputCpf = document.getElementById("cpfCadastroUser");
  const inputEmail = document.getElementById("emailCadastroUser");
  const inputTelefone = document.getElementById("telefoneCadastroUser");
  const inputSenha = document.getElementById("senhaCadastroUser");
  const selectStatus = document.getElementById("statusCadastroUser");
  const selectCargo = document.getElementById("cargoCadastroUser");
  const selectAeroporto = document.getElementById("aeroportoCadastroUser");

  // Remove espaços antes e depois e já reflete isso nos campos
  const nome = inputNome.value.trim();
  inputNome.value = nome;
  const email = inputEmail.value.trim();
  inputEmail.value = email;

  // CPF e telefone seguem para o backend só com dígitos
  inputCpf.value = mascararCpf(inputCpf.value);
  inputTelefone.value = mascararTelefone(inputTelefone.value);
  const cpf = somenteDigitos(inputCpf.value);
  const telefone = somenteDigitos(inputTelefone.value);

  const senha = inputSenha.value;
  const status = selectStatus.value;
  const cargo = selectCargo.value;
  const aeroporto = selectAeroporto.value;

  const erro =
    validarNomeUsuario(nome) ||
    validarCpfUsuario(cpf) ||
    validarEmailUsuario(email) ||
    validarTelefoneUsuario(telefone) ||
    validarSenhaUsuario(senha) ||
    (!valorEstaNasOpcoes(selectStatus) ? "Selecione um status válido." : null) ||
    (!valorEstaNasOpcoes(selectCargo) ? "Selecione um cargo válido." : null) ||
    // O aeroporto é travado (select desabilitado) e deve ser sempre o do administrador
    (aeroporto === "" ||
    String(aeroporto) !== String(sessionStorage.getItem("AEROPORTO_ID"))
      ? "Aeroporto inválido. Recarregue a página e tente novamente."
      : null);

  if (erro) {
    mensagemCadastro.textContent = erro;
    return;
  }

  if (botaoEnviar) botaoEnviar.disabled = true;

  fetch("/usuarios/cadastrar", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      nome: nome,
      cpf: cpf,
      email: email,
      telefone: telefone,
      senha: senha,
      statusAtividade: status,
      fkCargo: cargo,
      fkAeroporto: aeroporto,
    }),
  })
    .then(async (resposta) => {
      if (!resposta.ok) {
        const erroServidor = await resposta.text();

        throw new Error(erroServidor || "Não foi possível cadastrar o usuário.");
      }

      return resposta.json();
    })
    .then(() => {
      mensagemCadastro.textContent = "Usuário cadastrado com sucesso.";

      pegarUsuariosPeloAdministrador();

      formCadastro.reset();

      setTimeout(() => {
        document.getElementById("telaCadastroUser").classList.add("escondido");
        mensagemCadastro.textContent = "";
      }, 1000);
    })
    .catch((erro) => {
      console.error("Erro ao cadastrar usuário:", erro);

      mensagemCadastro.textContent = erro.message;
    })
    .finally(() => {
      if (botaoEnviar) botaoEnviar.disabled = false;
    });
}


function carregarAeroportoDoAdministrador() {
    var aeroportoId = sessionStorage.getItem("AEROPORTO_ID");
    var selectAeroporto = document.getElementById("aeroportoCadastroUser");

    if (!aeroportoId || !selectAeroporto) {
        console.error("ID do aeroporto não encontrado ou campo inexistente.");
        return;
    }

    selectAeroporto.innerHTML = "";

    var opcao = document.createElement("option");
    opcao.value = aeroportoId;
    opcao.textContent = "Aeroporto do administrador";
    opcao.selected = true;

    selectAeroporto.appendChild(opcao);
    selectAeroporto.disabled = true;
}


function carregarCargos() {
    var empresaId = sessionStorage.getItem("EMPRESA_ID");

    if (!empresaId) {
        console.error("ID da empresa não encontrado.");
        return;
    }

    var selectCargo = document.getElementById("cargoCadastroUser");

    if (!selectCargo) {
        console.error("Campo de cargo não encontrado no HTML.");
        return;
    }

    fetch(`/usuarios/cargos?empresaId=${encodeURIComponent(empresaId)}`)
        .then(function (resposta) {
            if (!resposta.ok) {
                throw new Error("Erro ao buscar cargos.");
            }

            return resposta.json();
        })
        .then(function (cargos) {
            console.log("Cargos recebidos:", cargos);

            if (!Array.isArray(cargos)) {
                throw new Error("Resposta de cargos em formato inesperado.");
            }

            selectCargo.innerHTML = '<option value="">Selecione o cargo</option>';

            cargos.forEach(function (cargo) {
                if (!cargo || cargo.idCargo === undefined) return;

                var opcao = document.createElement("option");

                opcao.value = cargo.idCargo;
                opcao.textContent = cargo.nome;

                selectCargo.appendChild(opcao);
            });
        })
        .catch(function (erro) {
            console.error("Erro ao carregar cargos:", erro);
        });
}


let idUsuarioExcluindo = null;

function abrirModalExclusao(idUsuarioClicado) {
  if (idUsuarioClicado === undefined || idUsuarioClicado === null) return;

  // Ninguém exclui a si mesmo (o botão já vem desabilitado, aqui é a garantia)
  if (String(idUsuarioClicado) === String(sessionStorage.ID)) return;

  const usuarioSelecionado = listaUsuariosGlobais.find(
    (u) => String(u.idUsuario) === String(idUsuarioClicado),
  );
  if (!usuarioSelecionado) return;

  const texto = document.getElementById("textoConfirmacaoExclusao");
  const modal = document.getElementById("modalExclusao");
  if (!texto || !modal) return;

  idUsuarioExcluindo = usuarioSelecionado.idUsuario;

  texto.innerHTML =
    `Tem certeza que deseja excluir <strong>${escaparHtml(usuarioSelecionado.nomeUsuario)}</strong>? Essa ação não pode ser desfeita.`;

  modal.classList.remove("escondido");
}

function fecharModalExclusao() {
  const modal = document.getElementById("modalExclusao");
  if (modal) modal.classList.add("escondido");
}

let excluindoUsuario = false;

function confirmarExclusaoUsuario() {
  if (excluindoUsuario) return;

  const idAdministrador = sessionStorage.ID;

  if (!idAdministrador) {
    alert("Sessão não encontrada. Faça login novamente.");
    return;
  }
  if (idUsuarioExcluindo === null || idUsuarioExcluindo === undefined) {
    alert("Nenhum usuário selecionado para exclusão.");
    return;
  }
  if (String(idUsuarioExcluindo) === String(idAdministrador)) {
    alert("Você não pode excluir a si mesmo.");
    return;
  }

  excluindoUsuario = true;

  fetch(`/usuarios/excluirUsuario/${encodeURIComponent(idAdministrador)}`, {
    method: "DELETE",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ idUsuario: idUsuarioExcluindo }),
  })
    .then((response) => {
      if (!response.ok) {
        throw new Error(`Erro ${response.status} ao excluir usuário`);
      }
      idUsuarioExcluindo = null;
      fecharModalExclusao();
      pegarUsuariosPeloAdministrador();
    })
    .catch((erro) => {
      console.error("Erro ao excluir usuário:", erro);
      alert("Não foi possível excluir o usuário.");
    })
    .finally(() => {
      excluindoUsuario = false;
    });
}

let servidoresDisponiveis = [];

function carregarServidoresDoAeroporto() {
  const idAdministrador = sessionStorage.ID;

  if (!idAdministrador) {
    console.error("ID do administrador não encontrado na sessão.");
    return;
  }

  fetch(`/servidores/pegarServidoresPorAeroporto/${encodeURIComponent(idAdministrador)}`, {
    method: "GET",
  })
    .then((response) => {
      if (!response.ok) {
        throw new Error(`Erro ${response.status} ao buscar servidores`);
      }
      return response.json();
    })
    .then((data) => {
      servidoresDisponiveis = Array.isArray(data) ? data : [];
      console.log("Servidores carregados:", servidoresDisponiveis);
    })
    .catch((error) => {
      console.error("Erro ao buscar servidores do aeroporto:", error);
    });
}

let idUsuarioEditando = null;

function abrirModalEdicao(idUsuarioClicado) {
  const usuarioSelecionado = listaUsuariosGlobais.find(
    (u) => String(u.idUsuario) === String(idUsuarioClicado),
  );

  if (!usuarioSelecionado) {
    alert("Não foi possível encontrar o usuário selecionado.");
    return;
  }

  const campoNome = document.getElementById("inputNomeModal");
  const campoEmail = document.getElementById("inputEmailModal");
  const selectStatus = document.getElementById("selectStatusModal");
  const containerServidores = document.querySelector(".gridServidoresModal");
  const modal = document.getElementById("modalEdicao");

  if (!campoNome || !campoEmail || !selectStatus || !containerServidores || !modal) {
    console.error("Elementos do modal de edição não encontrados no HTML.");
    return;
  }

  idUsuarioEditando = usuarioSelecionado.idUsuario;

  campoNome.value = usuarioSelecionado.nomeUsuario;
  campoEmail.value = usuarioSelecionado.email;
  selectStatus.value = usuarioSelecionado.status === false ? "inativo" : "ativo";

  const idsServidoresUsuario = usuarioSelecionado.servidores.map((s) =>
    String(s.idServidor),
  );

  const lista = Array.isArray(servidoresDisponiveis) ? servidoresDisponiveis : [];
  let htmlCheckboxes = "";

  for (let i = 0; i < lista.length; i++) {
    const servidor = lista[i];
    if (!servidor) continue;

    const marcado = idsServidoresUsuario.includes(String(servidor.idServidor));
    const estaMarcado = marcado ? "checked" : "";
    const classeAtiva = marcado ? "ativo" : "";

    htmlCheckboxes += `
            <label class="checkboxServidor ${classeAtiva}">
                <input type="checkbox" value="${escaparHtml(servidor.idServidor)}" class="inputServidorCheckbox" ${estaMarcado} onchange="alternarVisualCheckbox(this)">
                <span class="nomeServidorModal">${escaparHtml(servidor.nomeServidor)}</span>
            </label>
        `;
  }

  containerServidores.innerHTML = htmlCheckboxes;

  modal.classList.remove("escondido");
}

function fecharModalEdicao() {
  const modal = document.getElementById("modalEdicao");
  if (modal) modal.classList.add("escondido");
}

function alternarVisualCheckbox(input) {
  if (!input || !input.parentElement) return;

  const labelPai = input.parentElement;

  if (input.checked) {
    labelPai.classList.add("ativo");
  } else {
    labelPai.classList.remove("ativo");
  }
}

let salvandoEdicao = false;

function salvarEdicaoUsuario() {
  if (salvandoEdicao) return;

  const idAdministrador = sessionStorage.ID;

  if (!idAdministrador) {
    alert("Sessão não encontrada. Faça login novamente.");
    return;
  }
  if (idUsuarioEditando === null || idUsuarioEditando === undefined) {
    alert("Nenhum usuário selecionado para edição.");
    return;
  }

  const usuarioOriginal = listaUsuariosGlobais.find(
    (u) => String(u.idUsuario) === String(idUsuarioEditando),
  );

  if (!usuarioOriginal) {
    alert("Não foi possível encontrar o usuário selecionado.");
    return;
  }

  const campoNome = document.getElementById("inputNomeModal");
  const campoEmail = document.getElementById("inputEmailModal");
  const selectStatus = document.getElementById("selectStatusModal");

  if (!campoNome || !campoEmail || !selectStatus) {
    console.error("Elementos do modal de edição não encontrados no HTML.");
    return;
  }

  // Remove espaços antes e depois e já reflete isso nos campos
  const novoNome = campoNome.value.trim();
  campoNome.value = novoNome;
  const novoEmail = campoEmail.value.trim();
  campoEmail.value = novoEmail;
  const novoStatus = selectStatus.value;

  const erro =
    validarNomeUsuario(novoNome) ||
    validarEmailUsuario(novoEmail) ||
    (novoStatus !== "ativo" && novoStatus !== "inativo"
      ? "O status deve ser ativo ou inativo."
      : null) ||
    (String(usuarioOriginal.idUsuario) === String(idAdministrador) &&
    novoStatus === "inativo"
      ? "Você não pode desativar a sua própria conta."
      : null);

  if (erro) {
    alert(erro);
    return;
  }

  const servidoresSelecionados = Array.from(
    document.querySelectorAll(".inputServidorCheckbox"),
  )
    .filter((checkbox) => checkbox.checked)
    .map((checkbox) => Number(checkbox.value));

  // Só podem ser vinculados servidores do aeroporto do administrador
  const idsPermitidos = (Array.isArray(servidoresDisponiveis) ? servidoresDisponiveis : [])
    .map((servidor) => Number(servidor.idServidor));

  const servidorInvalido = servidoresSelecionados.some(
    (id) => !Number.isInteger(id) || !idsPermitidos.includes(id),
  );
  if (servidorInvalido) {
    alert("Há servidores inválidos selecionados. Recarregue a página e tente novamente.");
    return;
  }

  const servidoresOriginais = usuarioOriginal.servidores.map((s) =>
    Number(s.idServidor),
  );

  const servidoresParaAdicionar = servidoresSelecionados.filter(
    (id) => !servidoresOriginais.includes(id),
  );
  const servidoresParaRemover = servidoresOriginais.filter(
    (id) => !servidoresSelecionados.includes(id),
  );

  salvandoEdicao = true;

  const requisicoesPendentes = [];

  requisicoesPendentes.push(
    fetch(`/usuarios/editarUsuario/${encodeURIComponent(idUsuarioEditando)}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        nome: novoNome,
        email: novoEmail,
        statusAtividade: novoStatus === "ativo",
      }),
    }),
  );

  for (let i = 0; i < servidoresParaAdicionar.length; i++) {
    requisicoesPendentes.push(
      fetch(`/servidores/adicionarServidoresUsuario/${encodeURIComponent(idAdministrador)}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          idUsuario: idUsuarioEditando,
          idServidor: servidoresParaAdicionar[i],
        }),
      }),
    );
  }

  for (let i = 0; i < servidoresParaRemover.length; i++) {
    requisicoesPendentes.push(
      fetch(`/servidores/removerServidorUsuario/${encodeURIComponent(idAdministrador)}`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          idUsuario: idUsuarioEditando,
          idServidor: servidoresParaRemover[i],
        }),
      }),
    );
  }

  Promise.all(requisicoesPendentes)
    .then((respostas) => {
      const respostaComErro = respostas.find((resposta) => !resposta.ok);
      if (respostaComErro) {
        throw new Error(`Erro ${respostaComErro.status} ao salvar alterações`);
      }
      fecharModalEdicao();
      pegarUsuariosPeloAdministrador();
    })
    .catch((erro) => {
      console.error("Erro ao salvar edições:", erro);
      alert("Houve um erro ao processar as alterações.");
    })
    .finally(() => {
      salvandoEdicao = false;
    });
}

document.addEventListener("DOMContentLoaded", () => {
  pegarUsuariosPeloAdministrador();
  carregarServidoresDoAeroporto();

  aplicarMascaraCampo("cpfCadastroUser", mascararCpf, 14, "numeric");
  aplicarMascaraCampo("telefoneCadastroUser", mascararTelefone, 15, "tel");

  const telaCadastroUser = document.getElementById("telaCadastroUser");
  const formCadastroUser = document.getElementById("formCadastroUser");
  const botaoFechar = document.getElementById("fecharCadastroUser");
  const botaoCancelar = document.getElementById("cancelarCadastroUser");

  const fecharCadastroUser = () => {
    if (telaCadastroUser) telaCadastroUser.classList.add("escondido");
  };

  if (botaoFechar) botaoFechar.addEventListener("click", fecharCadastroUser);
  if (botaoCancelar) botaoCancelar.addEventListener("click", fecharCadastroUser);

  if (formCadastroUser) {
    formCadastroUser.addEventListener("submit", (evento) => {
      evento.preventDefault();
      cadastrarUsuario();
    });
  }
});