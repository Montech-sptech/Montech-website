
function mostrarSenha(inputId, eyeId) {
    var input = document.getElementById(inputId);
    var eye = document.getElementById(eyeId);

    if (input.type == "password") {
        input.type = "text";
        eye.src = "../img/login/openEye.png";
    } else {
        input.type = "password";
        eye.src = "../img/login/closedEye.png";
    }
}