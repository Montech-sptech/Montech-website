
function mostrarSenha(inputId, eyeId) {
    var input = document.getElementById(inputId);
    var eye = document.getElementById(eyeId);

    if (!input || !eye) {
        return;
    }

    if (input.type === "password") {
        input.type = "text";
        eye.src = "../img/login/closedEye.png";
    } else {
        input.type = "password";
        eye.src = "../img/login/openEye.png";
    }
}

var loginForm = document.getElementById("loginForm");

loginForm.addEventListener("submit", async function (event) {
    event.preventDefault();

    var email = document.getElementById("emailLogin").value.trim();
    var senha = document.getElementById("senhaInput").value;
    var mensagem = document.getElementById("loginMensagem");

    mensagem.textContent = "";

    if (!email || !senha) {
        mensagem.textContent = "Preencha o email e a senha.";
        return;
    }

    try {
        var resposta = await fetch("/usuarios/autenticar", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                emailServer: email,
                senhaServer: senha,
            }),
        });

        if (!resposta.ok) {
            mensagem.textContent = await resposta.text();
            return;
        }

        var usuario = await resposta.json();
        sessionStorage.setItem("ID", usuario.id);
        sessionStorage.setItem("EMAIL", usuario.email);
        sessionStorage.setItem("NOME", usuario.nome);
        sessionStorage.setItem("CARGO", usuario.cargo);
        sessionStorage.setItem("EMPRESA_ID", usuario.empresaId);
        sessionStorage.setItem("FOTO_PERFIL", usuario.fotoPerfil);

        if (usuario.cargo === "TI") {
            window.location.href = "/pages/inicioCadastroEmpresa.html";
        } else if (usuario.cargo === "Analista") {
            window.location.href = "/pages/relatorios.html";
        } else {
            window.location.href = "/pages/gerenciamentoDeUsuarios.html";
        }
    } catch (erro) {
        console.error("Erro ao realizar login:", erro);
        mensagem.textContent = "Não foi possível conectar ao servidor. Tente novamente.";
    }
});