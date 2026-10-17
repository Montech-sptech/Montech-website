

var btnNovoServidor = document.getElementById('btn-novo-servidor');

const podeGerenciarServidores = usuarioPodeGerenciarServidores();
btnNovoServidor.hidden = !podeGerenciarServidores;

if (podeGerenciarServidores) {
    btnNovoServidor.addEventListener('click', function() {
        window.location.href = './cadastroDeServidor.html';    
    })
}

