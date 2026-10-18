window.addEventListener('DOMContentLoaded', function() {
    gerarToken();
});

function gerarToken() {
    const inicial = 'm'
        .trim()
        .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
        .charAt(0)
        .toUpperCase();

    const hoje = new Date();
    const dia = String(hoje.getDate()).padStart(2, "0");
    const mes = String(hoje.getMonth() + 1).padStart(2, "0");
    const ano = hoje.getFullYear();
    const prefixo = `${inicial}${dia}${mes}${ano}`;

    const aleatorio = Array.from(
        crypto.getRandomValues(new Uint8Array(32 - prefixo.length)),
        n => n % 10
    ).join("");

    if (Token) {
        Token.value = `${prefixo}${aleatorio}`;
    }
}

async function CarregarComponentes() {
    try {
        let resposta = await fetch(`/gerServidores/buscarComponentes`);
        if (resposta.ok) {
            let dados = await resposta.json();
            if (dados && dados.length >= 0) {
                OpcoesDisponiveis.length = 0; 

                for (let i = 0; i < dados.length; i++) {
                    let idComponente = dados[i].idComponente;
                    let nomeComponente = dados[i].nomeComponente;
                    let unidadeMedida = dados[i].unidadeMedida;

                    OpcoesDisponiveis.push({
                        "idComponente": idComponente,
                        "nomeComponente": nomeComponente,
                        "unidadeMedida": unidadeMedida,
                        "limiteAtencao": 0,
                        "limiteCritico": 0,
                        "icone": "../img/Servidores/cpuIcon.svg"
                    });
                }
                
                console.log("Componentes carregados no array:", OpcoesDisponiveis);
            } else {
                console.log('Nenhum dado encontrado');
            }
        } else {
            console.log("Sem componente")
        }
    } catch (erro) {
        console.error("Erro ao carregar informações:", erro);
    }
}
    
window.addEventListener('DOMContentLoaded', function() {
    CarregarComponentes()
})

const itemAdicionados = [];
const OpcoesDisponiveis = [];



function renderizarListaComponentes(dados) {
    const container = document.querySelector('.lista-componentes');
    container.innerHTML = `
        <h3>Lista de componente</h3>
        <p>Ajuste os parâmetros de atenção e crítico para receber seus alertas</p>
    `;

    dados.forEach(item => {
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
                <input type="number" id="${item.idComponente}-atencao" value="${item.atencao}">
            </div>

            <div class="componente-campo">
                <label for="${item.idComponente}-critico">Crítico</label>
                <input type="number" id="${item.idComponente}-critico" value="${item.critico}">
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
        btnExcluir.addEventListener('click', function() {
            const indice = itemAdicionados.findIndex(elemento => elemento.id === item.id);
            
            OpcoesDisponiveis.push(itemAdicionados[indice])

            if (indice !== -1) {
                itemAdicionados.splice(indice, 1);
                console.log('Item removido do array. Lista atual:', itemAdicionados);
            }

            divItem.remove();
        });

        container.appendChild(divItem);
    });
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


function renderizarPopupList() {
    const popupContainer = document.querySelector('.popup__lista');
        popupContainer.innerHTML = '';

    if(OpcoesDisponiveis.length != 0) {
    OpcoesDisponiveis.forEach(item => {

            const li = document.createElement('li');

            li.innerHTML = `
                <button class="componente btn-adicionar-componente" type="button" data-componente="${item.idComponente}">
                    <img class="componente__icone" src="${item.icone}" alt="${item.nomeComponente}">
                    ${item.nomeComponente}
                </button>
            `;

            const botao = li.querySelector('.btn-adicionar-componente');

            botao.addEventListener('click', function() { 
                const idBuscado = parseInt(botao.dataset.componente);
                const indiceOpcao = OpcoesDisponiveis.findIndex(opcao => opcao.idComponente === idBuscado);
                
                if (indiceOpcao !== -1) {
                    const [itemEncontrado] = OpcoesDisponiveis.splice(indiceOpcao, 1);
                    itemAdicionados.push(itemEncontrado);
                    renderizarListaComponentes(itemAdicionados);                
                    renderizarPopupList();
                    console.log(itemAdicionados)
                    console.log('Item movido com sucesso para os adicionados:', itemAdicionados);
                }
                ListaComponenteAdicionar.style.display = 'none';
            });

            popupContainer.appendChild(li);
        });
    }  else {
        const li = document.createElement('li');

        li.innerHTML = `
            <p>
                Sem componentes
            </p>
        `;

        popupContainer.appendChild(li);
    }
}


const btnSalvar = document.getElementById('btn-salvar');
const popUpFechar = document.querySelectorAll('.popup-fechar');
const popup = document.querySelectorAll('.popup-overlay');
const popUpConcluido = document.getElementById('popUpConcluido');

popUpFechar.forEach(row => {
  row.addEventListener('click', function() {
    popup.forEach(item => {
      item.style.display = 'none';
    });
  });
});

btnSalvar.addEventListener('click', function() {
    cadastrarServidor();
})

function mensagemErro(titulo, descricao) {
    const popupError = document.getElementById('popup-Error');
    const tituloError = document.getElementById('titulo-Error');
    const descricaoError = document.getElementById('descricao-Error');
    tituloError.innerHTML = "";    
    descricaoError.innerHTML = "";    


    popupError.style.display = 'flex';
    tituloError.innerHTML = titulo;    
    descricaoError.innerHTML = descricao;    
}


async function cadastrarServidor() {
    const nomeServidor = document.getElementById('nome-servidor');
    const sistemaOperacional = document.getElementById('sistema-operacional');
    const tokenUnico = document.getElementById('token-unico');
    const idAeroporto = sessionStorage.AEROPORTO_ID;
    lerValoresDosInputs();

    const nome = nomeServidor.value.trim();
    const sistema = sistemaOperacional.value.trim().toLowerCase();
    const token = tokenUnico.value.trim();

    if (nome.length === 0) {
        mensagemErro(
            'Erro no campo Nome do Servidor',
            'O nome não pode estar vazio nem conter apenas espaços em branco.'
        );
        return;
    }

    if (nome.length < 3) {
        mensagemErro(
            'Erro no campo Nome do Servidor',
            'O nome deve ter no mínimo 3 caracteres.'
        );
        return;
    }
    if (nome.length > 30) {
        mensagemErro(
            'Erro no campo Nome do Servidor',
            'O nome deve ter no máximo 30 caracteres.'
        );
        return;
    }
    if (sistema !== 'linux' && sistema !== 'windows') {
        mensagemErro(
            'Erro no campo Sistema Operacional',
            'O sistema operacional deve ser "linux" ou "windows".'
        );
        return;
    }
    if (token.length !== 32) {
        mensagemErro(
            'Erro no campo Token Único',
            `O token deve ter exatamente 32 caracteres (atualmente tem ${token.length}).`
        );
        return;
    }
    if(itemAdicionados.length < 1) {
        mensagemErro(
            'Sem componentes',
            `Selecione no mínimo um componente para cadastrar o servidor`
        );
        return;
    }

    try {
        const resposta = await fetch("/gerServidores/cadastrarServidor", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                tokenServer: tokenUnico.value,
                nomeServidorServer: nomeServidor.value,
                sistemaOperacionalServer: sistemaOperacional.value,
                fkAeroportoServer: idAeroporto
            })
        });

        if (!resposta.ok) {
            console.log("Houve um erro ao tentar realizar o cadastro de servidor!");
            alert("erro")
            return false;
        }

        const json = await resposta.json();
        const idServidor = json.insertId;

        for (const { limiteAtencao, limiteCritico } of itemAdicionados) {
            const valorAtencao = parseFloat(limiteAtencao);
            const valorCritico = parseFloat(limiteCritico);

            if (valorAtencao < 0 || valorAtencao > 100) {
                mensagemErro(
                    'Erro no campo Limite de Atenção',
                    `O limite de atenção deve estar entre 0 e 100 (valor informado: ${valorAtencao}).`
                );
                deleteServer(idServidor)
                return;
            }

            if (valorCritico < 0 || valorCritico > 100) {
                mensagemErro(
                    'Erro no campo Limite Crítico',
                    `O limite crítico deve estar entre 0 e 100 (valor informado: ${valorCritico}).`
                );
                deleteServer(idServidor)
                return;
            }
            if (valorCritico < valorAtencao) {
                mensagemErro(
                    'Erro no valor critico e atenca',
                    `O limite crítico deve ser maior que o de atencao (valor informado: ${valorCritico} < ${valorAtencao}).`
                );
                deleteServer(idServidor)
                return;
            }
        }

        const componentes = itemAdicionados.map(({ idComponente, limiteAtencao, limiteCritico }) => ({
            fkComponente: idComponente,
            limiteAtencao: limiteAtencao,
            limiteCritico: limiteCritico
        }));

        const respostaComp = await fetch("/gerServidores/cadastrarComponenteServidor", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ fkServidorServer: idServidor, componentesServer: componentes })
        });

        if (!respostaComp.ok) {
            console.log("Erro componentes");
            deleteServer(idServidor)
            alert("erro")
            return false;
        }

        const botaoVisualizar = document.getElementById('visualizar_servidor');
        botaoVisualizar.dataset.servidor = idServidor;

        botaoVisualizar.addEventListener('click', function() {
            window.location.href = './visualizarServidor.html?id=' + encodeURIComponent(botaoVisualizar.dataset.servidor);
        });

        popUpConcluido.style.display = 'flex';
        console.log("Tudo certo");
        return true;
    } catch (erro) {
        console.log(erro);
        alert("erro")
        return false;
    }
}

async function deleteServer(idServidor) {
        const resposta = await fetch("/gerServidores/deletarServidor", {
            method: "DELETE",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                idServidorServer: idServidor
            })
        });

        if (!resposta.ok) {
            console.log("Houve um erro ao tentar realizar o delete de servidor!");
            alert("erro")
            return false;
        }
}