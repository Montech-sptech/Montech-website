var modal = document.getElementById("modalCadastro");
var fecharCadastro = document.getElementById("fecharModalCadastro");

function modalCadastro() {
    modal.style.display = "flex";
}

fecharCadastro.onclick = function() {
    modal.style.display = "none";
}