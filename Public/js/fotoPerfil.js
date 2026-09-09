const opcoesFotoPerfil = [
    "../imagens/fotoUsuario.png",
    "../imagens/sino.png",
    "../imagens/user.png",
    "../imagens/ram.png",
    "../imagens/disco.png"
];

let fotoSelecionadaTemp = null;

function abrirModalFotoPerfil() {
    const grid = document.getElementById("gridFotosPerfil");
    grid.innerHTML = "";

    const fotoAtual = document.querySelector(".fotoPerfilAtual").src;
    fotoSelecionadaTemp = fotoAtual;

    opcoesFotoPerfil.forEach((caminho) => {
        const opcao = document.createElement("div");
        opcao.className = "opcaoFotoPerfil" + (fotoAtual.endsWith(caminho) ? " selecionada" : "");
        opcao.onclick = () => selecionarFotoPerfil(caminho, opcao);

        const img = document.createElement("img");
        img.src = caminho;
        img.alt = "Opção de foto de perfil";

        opcao.appendChild(img);
        grid.appendChild(opcao);
    });

    document.getElementById("modalFotoPerfil").classList.remove("escondido");
}

function selecionarFotoPerfil(caminho, elemento) {
    fotoSelecionadaTemp = caminho;
    document.querySelectorAll(".opcaoFotoPerfil").forEach((el) => el.classList.remove("selecionada"));
    elemento.classList.add("selecionada");
}

function salvarFotoPerfil() {
    if (!fotoSelecionadaTemp) return;

    fetch(`/usuarios/atualizarFotoPerfil/${sessionStorage.getItem("ID")}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fotoPerfil: fotoSelecionadaTemp })
    })
        .then(response => response.json())
        .then(() => {
            sessionStorage.setItem("FOTO_PERFIL", fotoSelecionadaTemp);
            document.querySelectorAll(".fotoPerfilAtual").forEach((img) => {
                img.src = fotoSelecionadaTemp;
            });
            fecharModalFotoPerfil();
        })
        .catch(erro => {
            console.error("Erro ao salvar a foto de perfil:", erro);
        });
}

function fecharModalFotoPerfil() {
    document.getElementById("modalFotoPerfil").classList.add("escondido");
}