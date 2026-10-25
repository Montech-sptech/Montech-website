let popUp = document.getElementById('popup-aviso');
let botaoFechar = document.getElementById('popup-fechar');
let AbrirContatos = document.getElementById('AbrirContatos');


AbrirContatos.addEventListener('click', function() {
    popUp.style.display = 'flex';
})

botaoFechar.addEventListener('click', function() {
    popUp.style.display = 'none';
})