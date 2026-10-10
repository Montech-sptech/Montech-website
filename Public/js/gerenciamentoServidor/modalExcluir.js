var botoesExcluir = document.querySelectorAll('.btn-excluir');
var botoesEditar = document.querySelectorAll('.btn-editar');
var botoesVisualizar = document.querySelectorAll('.btn-visualizar');
var popUp = document.getElementById('popup-excluir');
var popUpFechar = document.getElementById('popup-fechar');
var btnNovoServidor = document.getElementById('btn-novo-servidor');


btnNovoServidor.addEventListener('click', function() {
    window.location.href = './cadastroDeServidor.html';    
})


popUpFechar.addEventListener('click', function() {
        popUp.style.display = 'none'; 
})

botoesExcluir.forEach(function(botao) {
    botao.addEventListener('click', function() { 
        popUp.style.display = 'flex'; 
    });
});

botoesEditar.forEach(function(botao) {
    botao.addEventListener('click', function() { 
        window.location.href = './editarServidor.html';    
    });
});

botoesVisualizar.forEach(function(botao) {
    botao.addEventListener('click', function() { 
        window.location.href = './visualizarServidor.html';    
    });
});

botoesExcluir.forEach(function(botao) {
    botao.addEventListener('click', function() { 
        popUp.style.display = 'flex'; 
    });
});

botoesExcluir.forEach(function(botao) {
    botao.addEventListener('click', function() { 
        popUp.style.display = 'flex'; 
    });
});