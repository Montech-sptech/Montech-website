const Token = document.getElementById('token-unico');
const msgToken = document.getElementById('msgTokenCopiado');


const BotaoVoltar = document.getElementById('btn-voltar');
BotaoVoltar.addEventListener('click', function() {
    window.location.href = './gerenciamentoServidor.html';
});

const btnCancelar = document.getElementById('btn-cancelar');

try {
    btnCancelar.addEventListener('click', function() {
        window.location.href = './gerenciamentoServidor.html';
    });
} catch {}


const btnFecharPopUp = document.getElementById('btnFecharPopUp');
const ListaComponenteAdicionar = document.getElementById('popup-componente');
const btnListaComponente = document.getElementById('btn-lista-componente');


btnFecharPopUp.addEventListener('click', function(){
    ListaComponenteAdicionar.style.display = 'none';
})

try {
    btnListaComponente.addEventListener('click', function(){
        ListaComponenteAdicionar.style.display = 'flex';
        renderizarPopupList();
    })
} catch {}


const botaoCopiar = document.getElementById('btn-copiar');
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