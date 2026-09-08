let nome = document.getElementById('nomeUsuario');
let cargo = document.getElementById('cargoUsuario');

function carregarInformacoes(){
    nome.textContent = sessionStorage.getItem("NOME");
    cargo.textContent = sessionStorage.getItem("CARGO");
}

function sair(){
    sessionStorage.clear();
    window.location.href = "./landingPage.html";
}

function trocarPagina(pagina) {
    window.location.href = pagina;
}

function abrirModalRelatorio() {
    document.getElementById("modalRelatorio").style.display = "flex";
}

function fecharModalRelatorio() {
    document.getElementById("modalRelatorio").style.display = "none";
}

function salvarRelatorio() {
    fecharModalRelatorio();
}