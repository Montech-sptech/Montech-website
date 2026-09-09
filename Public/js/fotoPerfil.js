const opcoesFotoPerfil = [
    "../imagens/fotoUsuario.png",
    "../imagens/avatar2.png",
    "../imagens/avatar3.png",
    "../imagens/avatar4.png",
    "../imagens/avatar5.png"
];

function abrirModalFotoPerfil() {
    const grid = document.getElementById("gridFotosPerfil");
    grid.innerHTML = "";

    for (let i = 0; i < opcoesFotoPerfil.length; i++) {
        const opcao = document.createElement("div");
        opcao.className = "opcaoFotoPerfil";

        const img = document.createElement("img");
        img.src = opcoesFotoPerfil[i];
        img.alt = "Opção de foto de perfil";

        opcao.appendChild(img);
        grid.appendChild(opcao);
    }

    document.getElementById("modalFotoPerfil").classList.remove("escondido");
}

function fecharModalFotoPerfil() {
    document.getElementById("modalFotoPerfil").classList.add("escondido");
}