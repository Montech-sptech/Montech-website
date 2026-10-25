const urlParams = new URLSearchParams(window.location.search);
const idServidor = urlParams.get('id');

const itemAdicionados = [];
const OpcoesDisponiveis = [];
let idsOriginais = [];

const ICONE_PADRAO = "../img/Servidores/cpuIcon.svg";

// Valores com que o componente bloqueado volta à lista se for removido e readicionado.
// Ajuste aqui se quiser outro padrão para "Leitura e escrita de disco".
const LIMITES_FIXOS_BLOQUEADOS = {
    limiteAtencao: 0,
    limiteCritico: 0
};

// Retorna true para componentes cujos limites não podem ser editados
function componenteBloqueado(nomeComponente) {
    const nome = String(nomeComponente)
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .toLowerCase();

    // Bloqueia "Leitura de disco" e "Escrita de disco" (componentes separados)
    return nome.includes('disco') && (nome.includes('leitura') || nome.includes('escrita'));
}


const popUpFechar = document.querySelectorAll('.popup-fechar');
const popup = document.querySelectorAll('.popup-overlay');

popUpFechar.forEach(row => {
  row.addEventListener('click', function() {
    popup.forEach(item => {
      item.style.display = 'none';
    });
  });
});


async function buscarInformacoes(idServidor) {
    try {
        const resposta = await fetch(`/gerServidores/buscarServidor/${idServidor}`);

        if (!resposta.ok) {
            console.log("Erro ao buscar o servidor");
            return false;
        }

        const dados = await resposta.json();

        if (dados && dados.length > 0) {
            const nomeServidor = document.getElementById('nome-servidor');
            const selectSistemaOperacional = document.getElementById('sistema-operacional');
            const selectStatusServidor = document.getElementById('status-servidor');
            const tokenUnico = document.getElementById('token-unico');

            nomeServidor.value = dados[0].nomeServidor;
            tokenUnico.value = dados[0].token;
            selectSistemaOperacional.value = dados[0].sistemaOperacional;
            selectStatusServidor.value = dados[0].statusAtividade;
        }

        const compResposta = await fetch(`/gerServidores/buscarComponentesServidorSemServidor/${idServidor}`);

        if (compResposta.ok) {
            const dadosComp = await compResposta.json();

            itemAdicionados.length = 0;
            OpcoesDisponiveis.length = 0;
            idsOriginais = [];

            if (dadosComp && dadosComp.length > 0) {
                for (let i = 0; i < dadosComp.length; i++) {
                    const componente = {
                        idComponente: Number(dadosComp[i].idComponente),
                        nomeComponente: dadosComp[i].nomeComponente,
                        unidadeMedida: dadosComp[i].unidadeMedida,
                        limiteAtencao: dadosComp[i].limiteAtencao,
                        limiteCritico: dadosComp[i].limiteCritico,
                        icone: ICONE_PADRAO
                    };

                    if (dadosComp[i].pertenceAoServidor == 1) {
                        itemAdicionados.push(componente);
                        idsOriginais.push(componente.idComponente);
                    } else {
                        OpcoesDisponiveis.push(componente);
                    }
                }
            }
        }

        carregarListaComponentes();
        renderizarPopupList();

        console.log("Tudo certo");
        return true;
    } catch (erro) {
        console.log(erro);
        return false;
    }
}

buscarInformacoes(idServidor);


function carregarListaComponentes() {
    const listaComponente = document.getElementById('lista-componentes');
    listaComponente.innerHTML = `
        <h3>Lista de componente</h3>
        <p>Ajuste os parâmetros de atenção e crítico para receber seus alertas</p>
    `;

    itemAdicionados.forEach(item => {
        const bloqueado = componenteBloqueado(item.nomeComponente);
        const atributosBloqueio = bloqueado
            ? 'readonly class="campo-bloqueado" title="Este componente não permite edição dos limites"'
            : '';

        const divItem = document.createElement('div');
        divItem.className = 'componente-item';

        divItem.innerHTML = `
            <div class="componente-nome">
                <img src="${item.icone}" alt="${item.nomeComponente}">
                <span>${item.nomeComponente}</span>
            </div>

            <div class="componente-campo">
                <label for="${item.idComponente}-metrica">Métrica</label>
                <input type="text" id="${item.idComponente}-metrica" readonly value="${item.unidadeMedida}">
            </div>

            <div class="componente-campo">
                <label for="${item.idComponente}-atencao">Atenção</label>
                <input type="number" id="${item.idComponente}-atencao" value="${item.limiteAtencao}" ${atributosBloqueio}>
            </div>

            <div class="componente-campo">
                <label for="${item.idComponente}-critico">Crítico</label>
                <input type="number" id="${item.idComponente}-critico" value="${item.limiteCritico}" ${atributosBloqueio}>
            </div>

            <button type="button" class="btn-excluir">
                <img src="../img/Servidores/lixoIcon.svg" alt="Excluir componente">
            </button>
        `;

        const inputAtencao = divItem.querySelector(`#${CSS.escape(item.idComponente + '-atencao')}`);
        const inputCritico = divItem.querySelector(`#${CSS.escape(item.idComponente + '-critico')}`);

        inputAtencao.addEventListener('input', function () {
            item.limiteAtencao = lerNumero(inputAtencao.value);
        });

        inputCritico.addEventListener('input', function () {
            item.limiteCritico = lerNumero(inputCritico.value);
        });

        const btnExcluir = divItem.querySelector('.btn-excluir');
        btnExcluir.addEventListener('click', function () {
            const indice = itemAdicionados.findIndex(elemento => elemento.idComponente === item.idComponente);

            if (indice === -1) {
                return;
            }

            const [removido] = itemAdicionados.splice(indice, 1);
            removido.limiteAtencao = 0.00;
            removido.limiteCritico = 0.00;

            OpcoesDisponiveis.push(removido);

            console.log('Item removido do array. Lista atual:', itemAdicionados);

            divItem.remove();
            renderizarPopupList();
        });

        listaComponente.appendChild(divItem);
    });
}


function renderizarPopupList() {
    const popupContainer = document.querySelector('.popup__lista');
    popupContainer.innerHTML = '';

    if (OpcoesDisponiveis.length !== 0) {
        OpcoesDisponiveis.forEach(item => {
            const li = document.createElement('li');

            li.innerHTML = `
                <button class="componente btn-adicionar-componente" type="button" data-componente="${item.idComponente}">
                    <img class="componente__icone" src="${item.icone}" alt="${item.nomeComponente}">
                    ${item.nomeComponente}
                </button>
            `;

            const botao = li.querySelector('.btn-adicionar-componente');

            botao.addEventListener('click', function () {
                const idBuscado = parseInt(botao.dataset.componente);
                const indiceOpcao = OpcoesDisponiveis.findIndex(opcao => opcao.idComponente === idBuscado);

                if (indiceOpcao !== -1) {
                    const [itemEncontrado] = OpcoesDisponiveis.splice(indiceOpcao, 1);

                    // Componente bloqueado volta sempre com os limites fixos
                    if (componenteBloqueado(itemEncontrado.nomeComponente)) {
                        itemEncontrado.limiteAtencao = LIMITES_FIXOS_BLOQUEADOS.limiteAtencao;
                        itemEncontrado.limiteCritico = LIMITES_FIXOS_BLOQUEADOS.limiteCritico;
                    }

                    itemAdicionados.push(itemEncontrado);
                    carregarListaComponentes();
                    renderizarPopupList();
                    console.log('Item movido com sucesso para os adicionados:', itemAdicionados);
                }

                const listaComponenteAdicionar = document.getElementById('ListaComponenteAdicionar');
                if (listaComponenteAdicionar) {
                    listaComponenteAdicionar.style.display = 'none';
                }
            });

            popupContainer.appendChild(li);
        });
    } else {
        const li = document.createElement('li');

        li.innerHTML = `
            <p>
                Sem componentes
            </p>
        `;

        popupContainer.appendChild(li);
    }
}


function lerNumero(valor) {
    const numero = parseFloat(valor);
    return isNaN(numero) ? 0 : numero;
}

function lerValoresDosInputs() {
    itemAdicionados.forEach(item => {
        const inputAtencao = document.getElementById(`${item.idComponente}-atencao`);
        const inputCritico = document.getElementById(`${item.idComponente}-critico`);

        if (inputAtencao) {
            item.limiteAtencao = lerNumero(inputAtencao.value);
        }
        if (inputCritico) {
            item.limiteCritico = lerNumero(inputCritico.value);
        }
    });
}


const btnSalvar = document.getElementById('btn-salvar-edit');

const popupError = document.getElementById('popup-Error');
const tituloError = document.getElementById('titulo-Error');
const descricaoError = document.getElementById('descricao-Error');
function mensagemErro(titulo, descricao) {
    tituloError.innerHTML = "";    
    descricaoError.innerHTML = "";    


    popupError.style.display = 'flex';
    tituloError.innerHTML = titulo;    
    descricaoError.innerHTML = descricao;    
}


// Valida os campos do servidor. Retorna os valores já tratados ou null se houver erro.
// O token é somente leitura e não é enviado na edição, então não entra aqui.
function validarDadosServidor() {
    const nomeServidor = document.getElementById('nome-servidor');
    const selectSistemaOperacional = document.getElementById('sistema-operacional');
    const selectStatusServidor = document.getElementById('status-servidor');

    // Remove espaços antes e depois e já reflete isso no campo
    const nome = nomeServidor.value.trim();
    nomeServidor.value = nome;

    const sistema = selectSistemaOperacional.value.trim().toLowerCase();
    const status = selectStatusServidor.value.trim();

    if (nome.length === 0) {
        mensagemErro(
            'Erro no campo Nome do Servidor',
            'O nome não pode estar vazio nem conter apenas espaços em branco.'
        );
        return null;
    }
    if (nome.length < 3) {
        mensagemErro(
            'Erro no campo Nome do Servidor',
            'O nome deve ter no mínimo 3 caracteres.'
        );
        return null;
    }
    if (nome.length > 30) {
        mensagemErro(
            'Erro no campo Nome do Servidor',
            'O nome deve ter no máximo 30 caracteres.'
        );
        return null;
    }
    if (sistema !== 'linux' && sistema !== 'windows') {
        mensagemErro(
            'Erro no campo Sistema Operacional',
            'O sistema operacional deve ser "linux" ou "windows".'
        );
        return null;
    }
    if (status !== '0' && status !== '1') {
        mensagemErro(
            'Erro no campo Status do Servidor',
            'O status deve ser ativado ou desativado.'
        );
        return null;
    }

    return { nome, sistema, status };
}



btnSalvar.addEventListener('click', async function () {
    btnSalvar.disabled = true;

    try {
        lerValoresDosInputs();

        const dadosServidor = validarDadosServidor();
        if (!dadosServidor) {
            return;
        }

        for (const item of itemAdicionados) {
            const valorAtencao = parseFloat(item.limiteAtencao);
            const valorCritico = parseFloat(item.limiteCritico);

            if (valorAtencao < 0 || valorAtencao > 100) {
                mensagemErro(
                    `"${item.nomeComponente}" com erro no Limite de Atenção`,
                    `O limite de atenção deve estar entre 0 e 100 (valor informado: ${valorAtencao}).`
                );
                return;
            }

            if (valorCritico < 0 || valorCritico > 100) {
                mensagemErro(
                    `"${item.nomeComponente}" com erro no Limite Crítico`,
                    `O limite crítico deve estar entre 0 e 100 (valor informado: ${valorCritico}).`
                );
                return;
            }

            if (valorAtencao > valorCritico) {
                mensagemErro(
                    `"${item.nomeComponente}" com erro nos limites`,
                    'O limite de atenção não pode ser maior que o limite crítico.'
                );
                return;
            }
        }

        const okServidor = await atualizarServidor(dadosServidor);
        if (!okServidor) {
            if(popupError.style.display != 'flex') {                
                mensagemErro(
                    'Erro ao atualizar o servidor',
                    'Revise as alterações feitas e tente novamente.'
                );
            }
            return;
        }

        const okRemocao = await removerComponentesServidor();
        if (!okRemocao) {
            if(popupError.style.display != 'flex') {                
                mensagemErro(
                    'Erro ao remover componentes',
                    'Revise as alterações feitas e tente novamente.'
                );
            }
            return;
        }

        const okComponentes = await atualizarDadosComponentesServidor();
        if (!okComponentes) {
            if(popupError.style.display != 'flex') {                
                mensagemErro(
                    'Erro ao atualizar componentes',
                    'Revise as alterações feitas e tente novamente.'
                );
            }
            return;
        }

        idsOriginais = itemAdicionados.map(item => item.idComponente);

        const popUp = document.getElementById('popup-concluido');
        popUp.style.display = 'flex';

        const botaoVisualizar = document.getElementById('visualizar_servidor');
        botaoVisualizar.dataset.servidor = idServidor;

        botaoVisualizar.onclick = function () {
            window.location.href = './visualizarServidor.html?id=' + encodeURIComponent(botaoVisualizar.dataset.servidor);
        };

    } catch (erro) {
        console.log(erro);
        mensagemErro(
            'Erro inesperado',
            'Ocorreu um erro ao salvar as alterações. Tente novamente.'
        );
    } finally {
        btnSalvar.disabled = false;
    }
});


async function atualizarServidor(dadosServidor) {
    try {
        if (itemAdicionados.length < 1) {
            mensagemErro(
                'Sem componentes',
                'Selecione no mínimo um componente para atualizar o servidor'
            );
            return false;
        }

        const resposta = await fetch("/gerServidores/atualizarDadosServidor", {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                idServidorServer: idServidor,
                nomeServidorServer: dadosServidor.nome,
                sistemaOperacionalServer: dadosServidor.sistema,
                statusAtividadeServer: dadosServidor.status
            })
        });

        if (!resposta.ok) {
            console.log("Houve um erro ao tentar realizar o update de servidor!");
            return false;
        }

        return true;
    } catch (erro) {
        console.log(erro);
        return false;
    }
}


async function removerComponentesServidor() {
    try {
        const idsAtuais = itemAdicionados.map(item => item.idComponente);
        const idsRemovidos = idsOriginais.filter(id => !idsAtuais.includes(id));

        if (idsRemovidos.length === 0) {
            return true;
        }

        const resposta = await fetch("/gerServidores/removerComponentesServidor", {
            method: "DELETE",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                idServidorServer: idServidor,
                componentesServer: idsAtuais
            })
        });

        if (!resposta.ok) {
            console.log("Houve um erro ao tentar realizar o delete dos componentes do servidor!");
            return false;
        }

        return true;
    } catch (erro) {
        console.log(erro);
        return false;
    }
}


async function atualizarDadosComponentesServidor() {
    try {
        const componentesDados = itemAdicionados.map(row => ({
            idComponente: row.idComponente,
            limiteAtencao: row.limiteAtencao,
            limiteCritico: row.limiteCritico
        }));

        if (componentesDados.length === 0) {
            return true;
        }

        const resposta = await fetch("/gerServidores/atualizarDadosComponentesServidor", {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                idServidorServer: idServidor,
                componentesServer: componentesDados
            })
        });

        if (!resposta.ok) {
            console.log("Houve um erro ao tentar realizar o update dos componentes do servidor!");
            return false;
        }

        return true;
    } catch (erro) {
        console.log(erro);
        return false;
    }
}