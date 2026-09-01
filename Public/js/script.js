var modal = document.getElementById("modalCadastro");
var fecharCadastro = document.getElementById("fecharModalCadastro");

var modalL = document.getElementById("modalLogin");
var fecharLogin = document.getElementById("fecharModalLogin");

var botaoLogin = document.getElementById("botaoEntrar");
var botaoCriar = document.getElementById("botaoCriar");

function modalLogin() {
    modal.style.display = "none";
    modalL.style.display = "flex";
}

fecharLogin.onclick = function () {
    modalL.style.display = "none";
}

function modalCadastro() {
    modalL.style.display = "none";
    modal.style.display = "flex";
}

fecharCadastro.onclick = function () {
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

let listaEmpresasCadastradas = [];

function cadastrar() {

    var nomeVar = nome.value;
    var emailVar = email.value;
    var senhaVar = senha.value;
    var confirmacaoSenhaVar = confirmarSenha.value;
    var codigoVar = token.value;

    if (
        nomeVar == "" ||
        emailVar == "" ||
        senhaVar == "" ||
        confirmacaoSenhaVar == "" ||
        codigoVar == ""
    ) {
        alert("Preencha todos os campos");
        return false;
    }

    if (senhaVar != confirmacaoSenhaVar) {
        alert("As senhas não coincidem");
        return false;
    }

    listar();

    setTimeout(function () {
        var idEmpresaVincular;

        for (let i = 0; i < listaEmpresasCadastradas.length; i++) {
            if (listaEmpresasCadastradas[i].token == codigoVar) {
                idEmpresaVincular = listaEmpresasCadastradas[i].idEmpresa;

                break;
            }
        }

        if (idEmpresaVincular == undefined) {
            alert("Código de empresa inválido");
            return false;
        }

        fetch("/usuarios/cadastrar", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },

            body: JSON.stringify({
                nomeServer: nomeVar,
                emailServer: emailVar,
                senhaServer: senhaVar,
                idEmpresaVincularServer: idEmpresaVincular
            }),
        })
            .then(function (resposta) {
                console.log("resposta: ", resposta);

                if (resposta.ok) {
                    modal.style.display = "none";
                    modalL.style.display = "flex";
                    alert("Cadastro realizado com sucesso!");
                } else {
                    throw "Houve um erro ao tentar realizar o cadastro!";
                }

            })
            .catch(function (resposta) {
                console.log(`#ERRO: ${resposta}`);

            });

    }, 500);
    return false;

}

function listar() {

    listaEmpresasCadastradas = [];

    fetch("/empresas/listar", {
        method: "GET",
    })

        .then(function (resposta) {
            resposta.json().then((empresas) => {
                empresas.forEach((empresa) => {
                    listaEmpresasCadastradas.push(empresa);
                });
                console.log("listaEmpresasCadastradas");
                console.log(listaEmpresasCadastradas);

            });

        })

        .catch(function (resposta) {
            console.log(`#ERRO: ${resposta}`);
        });
}

function validar() {
    if (sessionStorage.getItem("ID")) {
        botaoCriar.style.display = 'none';
        botaoLogin.style.display = 'none';
        modalL.style.display = 'none';
    }
}

function logar() {
    var emailVar = emailLogin.value;
    var senhaVar = senhaLogin.value;
    if (emailVar == "" || senhaVar == "") {
        alert("Preencha todos os campos");
        return false;
    }

    fetch("/usuarios/autenticar", {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify({
            emailServer: emailVar,
            senhaServer: senhaVar
        }),
    })
        .then(function (resposta) {
            console.log("resposta: ", resposta);
            if (resposta.ok) {
                resposta.json().then(function (dados) {
                    sessionStorage.setItem("ID", dados.id);
                    sessionStorage.setItem("EMAIL", dados.email);
                    sessionStorage.setItem("NOME", dados.nome);
                    sessionStorage.setItem("CARGO", dados.cargo)

                    validar();
                });
            } else {
                resposta.text().then(function (mensagem) {
                    alert(mensagem);
                });
            }
        })

        .catch(function (erro) {
            console.log(`#ERRO: ${erro}`);
        });

    return false;
}