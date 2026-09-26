
function mostrarSenha(inputId, eyeId) {
    var input = document.getElementById(inputId);
    var eye = document.getElementById(eyeId);

    if (input.type == "password") {
        input.type = "text";
        eye.src = "../img/openEye.png";
    } else {
        input.type = "password";
        eye.src = "../img/closedEye.png";
    }
}