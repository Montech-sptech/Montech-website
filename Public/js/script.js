var modal = document.getElementById("modalCadastro");
var fecharCadastro = document.getElementById("fecharModalCadastro");

function modalCadastro() {
    modal.style.display = "flex";
}

fecharCadastro.onclick = function() {
    modal.style.display = "none";
}

function mostrarSenha(inputId, eyeId) {
    var input = document.getElementById(inputId);
    var eye = document.getElementById(eyeId);

    if (input.type === "password") {
        input.type = "text";
        eye.src = "../imagens/openEye.png";
    } else {
        input.type = "password";
        eye.src = "../imagens/closedEye.png";
    }
}