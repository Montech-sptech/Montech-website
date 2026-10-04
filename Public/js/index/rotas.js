var botoesLogin = document.querySelectorAll(".botaoEntrar");

botoesLogin.forEach(function(botao) {
    botao.addEventListener('click', function() { 
        window.location.href = 'login.html'; 
    });
});