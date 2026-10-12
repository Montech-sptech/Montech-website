const BotaoVoltar = document.getElementById('btn-voltar');
const Token = document.getElementById('token-unico');
const msgToken = document.getElementById('msgTokenCopiado');
const botaoCopiar = document.getElementById('btn-copiar');
const btnFecharPopUp = document.getElementById('btnFecharPopUp');
const ListaComponenteAdicionar = document.getElementById('popup-componente');
const btnListaComponente = document.getElementById('btn-lista-componente');
const btnCancelar = document.getElementById('btn-cancelar');

window.addEventListener('DOMContentLoaded', function() {
    gerarToken();
});

BotaoVoltar.addEventListener('click', function() {
    window.location.href = './gerenciamentoServidor.html';
});

btnCancelar.addEventListener('click', function() {
    window.location.href = './gerenciamentoServidor.html';
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

botaoCopiar.addEventListener('click', function() {
        navigator.clipboard.writeText(Token.value)
            .then(() => {
                msgToken.style.display = 'flex';
                msgToken.innerHTML = 'Token copiado com sucesso!';
            })
            .catch(err => {
                msgToken.style.display = 'flex';
                msgToken.innerHTML = 'Token não copiado (Erro)';
                console.error('Erro ao copiar o token: ', err);
            });
            
});

const OpcoesDisponiveis = [
  {
    "id": "1",
    "componente": "CPU",
    "metrica": "Porcentagem",
    "icone": "../img/Servidores/cpuIcon.svg",
    "atencao": 13,
    "critico": 13
  },
  {
    "id": "2",
    "componente": "Mem. RAM",
    "metrica": "Porcentagem",
    "icone": "../img/Servidores/ramIcon.svg",
    "atencao": 22,
    "critico": 22 
  }
];

const itemAdicionados = []


function renderizarListaComponentes(dados) {
    const container = document.querySelector('.lista-componentes');
    container.innerHTML = '';

    dados.forEach(item => {
        // Cria a div principal do item
        const divItem = document.createElement('div');
        divItem.className = 'componente-item';

        // Injeta a estrutura HTML baseada no seu molde
        divItem.innerHTML = `
            <div class="componente-nome">
                <img src="${item.icone}" alt="${item.componente}">
                <span>${item.componente}</span>
            </div>

            <div class="componente-campo">
                <label for="${item.id}-metrica">Métrica</label>
                <input type="text" id="${item.id}-metrica" placeholder="${item.metrica}">
            </div>

            <div class="componente-campo">
                <label for="${item.id}-atencao">Atenção</label>
                <input type="number" id="${item.id}-atencao" value="${item.atencao}">
            </div>

            <div class="componente-campo">
                <label for="${item.id}-critico">Crítico</label>
                <input type="number" id="${item.id}-critico" value="${item.critico}">
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
            <button class="componente btn-adicionar-componente" type="button" data-componente="${item.id}">
                <img class="componente__icone" src="${item.icone}" alt="${item.componente}">
                ${item.componente}
            </button>
        `;

        const botao = li.querySelector('.btn-adicionar-componente');

        botao.addEventListener('click', function() { 
            const idBuscado = botao.dataset.componente;
            
            const indiceOpcao = OpcoesDisponiveis.findIndex(opcao => opcao.id === idBuscado);
            
            if (indiceOpcao !== -1) {
                const [itemEncontrado] = OpcoesDisponiveis.splice(indiceOpcao, 1);
                itemAdicionados.push(itemEncontrado);
                renderizarListaComponentes(itemAdicionados);                
                renderizarPopupList();
                console.log('Item movido com sucesso para os adicionados:', itemAdicionados);
            }
            ListaComponenteAdicionar.style.display = 'none';
        });

        popupContainer.appendChild(li);
    });
}

btnListaComponente.addEventListener('click', function(){
    ListaComponenteAdicionar.style.display = 'flex';
    renderizarPopupList();
})

btnFecharPopUp.addEventListener('click', function(){
    ListaComponenteAdicionar.style.display = 'none';
})
