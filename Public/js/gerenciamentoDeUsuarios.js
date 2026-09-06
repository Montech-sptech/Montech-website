let listaUsuariosGlobais = [];

function pegarUsuariosPeloAdministrador() {
    let idUsuario = sessionStorage.ID;

    fetch(`/usuarios/pegarUsuariosPeloAdministrador/${idUsuario}`, {
        method: "GET",
    })
        .then(response => response.json())
        .then(data => {
            console.log(data);

            listaUsuariosGlobais = data;

            let textoDadosTabelaUsuarios = `
            <div class="linhaCabecalho">
                <div class="col">Usuário</div>
                <div class="col">Status</div>
                <div class="col">Servidores</div>
                <div class="col">Ações</div>
            </div>`;

            for (let i = 0; i < data.length; i++) {
                const usuario = data[i];

                let textoStatus = "";
                if (usuario.status == false) {
                    textoStatus = `
                <div class="col">
                    <span class="status inativo">Inativo</span>
                 </div>`;
                } else {
                    textoStatus = `
                <div class="col">
                    <span class="status ativo">Ativo</span>
                 </div>`;
                }

                let textoServidoresDisponivel = usuario.servidores.length == 0
                    ? `<span class="servidor inativo">Não possui nenhum servidor disponivel</span>`
                    : ``;

                for (let j = 0; j < usuario.servidores.length; j++) {
                    textoServidoresDisponivel += `<span class="servidor ativo">${usuario.servidores[j].nomeServidor}</span>`;
                }

                textoDadosTabelaUsuarios += `
            <div class="linhaUsuario">
                <div class="col">
                    <span class="usuarioNome">${usuario.nomeUsuario}</span>
                    <span class="usuarioEmail">${usuario.email}</span>
                </div>
                ${textoStatus}
                <div class="col">
                    <div class="servidores">
                        ${textoServidoresDisponivel}
                    </div>
                </div>
                 <div class="col">
                    <button class="btnEditar" onclick="abrirModalEdicao(${usuario.idUsuario})">Editar</button>
                </div>
            </div>`;
            }

            document.getElementById('tabelaUsuarios').innerHTML = textoDadosTabelaUsuarios;
        })
        .catch(error => {
            console.error('Error:', error);
        });
}

let servidoresDisponiveis = [];

function carregarServidoresDaEmpresa() {
    let idAdministrador = sessionStorage.ID;

    fetch(`/servidores/pegarServidoresPorEmpresa/${idAdministrador}`, {
        method: "GET"
    })
        .then(response => response.json())
        .then(data => {
            servidoresDisponiveis = data;
            console.log("Servidores carregados:", servidoresDisponiveis);
        })
        .catch(error => {
            console.error("Erro ao buscar servidores da empresa:", error);
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
        document.getElementById('selectStatusModal').value = "inativo";
    } else {
        document.getElementById('selectStatusModal').value = "ativo";
    }

    let idsServidoresUsuario = [];
    for (let i = 0; i < usuarioSelecionado.servidores.length; i++) {
        idsServidoresUsuario.push(usuarioSelecionado.servidores[i].idServidor);
    }

    let containerServidores = document.querySelector('.gridServidoresModal');
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

    document.getElementById('modalEdicao').classList.remove('escondido');
}

function fecharModalEdicao() {
    modalEdicao.classList.add('escondido');
}

function alternarVisualCheckbox(input) {
    let labelPai = input.parentElement;

    if (input.checked) {
        labelPai.classList.add('ativo');
    } else {
        labelPai.classList.remove('ativo');
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

    const novoStatus = document.getElementById('selectStatusModal').value;

    if (novoStatus === 'inativo' && (usuarioOriginal.status == true)) {
        const reqInativar = fetch(`/usuarios/inativarUsuario/${idAdministrador}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                idUsuario: idUsuarioEditando
            })
        });
        requisicoesPendentes.push(reqInativar);
    }

    if (novoStatus === 'ativo' && (usuarioOriginal.status == false)) {
        const reqAtivar = fetch(`/usuarios/ativarUsuario/${idAdministrador}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                idUsuario: idUsuarioEditando
            })
        });
        requisicoesPendentes.push(reqAtivar);
    }

    const checkboxes = document.querySelectorAll('.inputServidorCheckbox');

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
        const reqAdd = fetch(`/servidores/adicionarServidoresUsuario/${idAdministrador}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                idUsuario: idUsuarioEditando,
                idServidor: idServidor
            })
        });
        requisicoesPendentes.push(reqAdd);
    }

    for (let i = 0; i < servidoresParaRemover.length; i++) {
        let idServidor = servidoresParaRemover[i];
        const reqRem = fetch(`/servidores/removerServidorUsuario/${idAdministrador}`, {
            method: 'DELETE',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ idUsuario: idUsuarioEditando, idServidor: idServidor })
        });
        requisicoesPendentes.push(reqRem);
    }

    if (requisicoesPendentes.length > 0) {
        Promise.all(requisicoesPendentes)
            .then(respostas => {
                alert("Alterações salvas com sucesso!");
                fecharModalEdicao();
                pegarUsuariosPeloAdministrador();
            })
            .catch(erro => {
                console.error("Erro ao salvar edições:", erro);
                alert("Houve um erro ao processar as alterações.");
            });
    } else {
        fecharModalEdicao();
    }
}