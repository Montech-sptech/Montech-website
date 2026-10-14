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
                        "atencao": 0,
                        "critico": 0,
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

function renderizarPopupList() {
    const popupContainer = document.querySelector('.popup__lista');
        popupContainer.innerHTML = '';

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
}


const btnSalvar = document.getElementById('btn-salvar');

btnSalvar.addEventListener('click', function() {
    cadastrarServidor();
})


async function cadastrarServidor() {
    const nomeServidor = document.getElementById('nome-servidor');
    const sistemaOperacional = document.getElementById('sistema-operacional');
    const tokenUnico = document.getElementById('token-unico');
    const idAeroporto = sessionStorage.AEROPORTO_ID;

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
            return false;
        }

        const json = await resposta.json();
        const idServidor = json.insertId;

        const componentes = itemAdicionados.map(({ idComponente, atencao, critico }) => ({
            fkComponente: idComponente,
            limiteAtencao: atencao,
            limiteCritico: critico
        }));

        const respostaComp = await fetch("/gerServidores/cadastrarComponenteServidor", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ fkServidorServer: idServidor, componentesServer: componentes })
        });

        if (!respostaComp.ok) {
            console.log("Erro componentes");
            return false;
        }

        console.log("Tudo certo");
        return true;
    } catch (erro) {
        console.log(erro);
        return false;
    }
}