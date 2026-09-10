let nome = document.getElementById('nomeUsuario');
let cargo = document.getElementById('cargoUsuario');

function carregarInformacoes(){
    nome.textContent = sessionStorage.getItem("NOME");
    cargo.textContent = sessionStorage.getItem("CARGO");

    var foto = sessionStorage.getItem("FOTO_PERFIL");
    if (foto) {
        document.querySelectorAll(".fotoPerfilAtual").forEach((img) => {
            img.src = foto;
        });
    }

    validarPermissoesHeader();
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

function validarPermissoesHeader() {
    var cargoAtual = sessionStorage.getItem("CARGO");
    var permissoes = {
        TI: [
            "opcaoInicioEmpresa",
            "opcaoContatosEmpresa",
            "opcaoCadastroEmpresas",
            "opcaoEmpresasCadastradas"
        ],
        Administrador: [
            "opcaoGerenciamentoUsuarios",
            "opcaoCadastroServidores",
            "opcaoAlertas"
        ],
        Analista: [
            "opcaoDashboard",
            "opcaoRelatorios"
        ]
    };

    document.querySelectorAll("#containerOpcoes .opcao").forEach((opcao) => {
        opcao.style.display = "none";
    });

    (permissoes[cargoAtual] || []).forEach((id) => {
        var opcao = document.getElementById(id);
        if (opcao) {
            opcao.style.display = "flex";
        }
    });
}