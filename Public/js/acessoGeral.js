let nome = document.getElementById('nomeUsuario');
let cargo = document.getElementById('cargoUsuario');

function carregarInformacoes(){
    nome.textContent = sessionStorage.getItem("NOME");
    cargo.textContent = sessionStorage.getItem("CARGO");
}