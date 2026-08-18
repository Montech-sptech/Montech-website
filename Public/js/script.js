var modal = document.getElementById("modalCadastro");
var fecharCadastro = document.getElementById("fecharModalCadastro");

var modalL = document.getElementById("modalLogin");
var fecharLogin = document.getElementById("fecharModalLogin");

function modalLogin() {
    modal.style.display = "none";
    modalL.style.display = "flex";
}

fecharLogin.onclick = function() {
    modalL.style.display = "none";
}

function modalCadastro() {
    modalL.style.display = "none";
    modal.style.display = "flex";
}

fecharCadastro.onclick = function() {
    modal.style.display = "none";
}

function mostrarSenha(inputId, eyeId) {
    var input = document.getElementById(inputId);
    var eye = document.getElementById(eyeId);

    if (input.type == "password") {
        input.type = "text";
        eye.src = "../imagens/openEye.png";
    } else {
        input.type = "password";
        eye.src = "../imagens/closedEye.png";
    }
}