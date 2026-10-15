const Servidoreslista = document.getElementById('listaServidores');

async function CarregarInfos() {
    let idAeroporto = sessionStorage.AEROPORTO_ID;
    console.log(idAeroporto)
    if (!idAeroporto) {
        console.log('ID do aeroporto não encontrado');
        return;
    }

    try {
        let resposta = await fetch(`/gerServidores/buscarServidoresAeroporto/${idAeroporto}`);
        if (resposta.ok) {
            let dados = await resposta.json();
            if (dados && dados.length >= 0) {
                Servidoreslista.innerHTML = "";

                for (let i = 0; i < dados.length; i++) {
                    let idServidor = dados[i].idServidor;
                    let nomeServidor = dados[i].nomeServidor;
                    let sistemaOperacional = dados[i].sistemaOperacional;
                    let status = dados[i].statusAtividade;
                    let classStatus = '';

                    if(status == 1) {
                        classStatus = "ativo"
                    } else {
                        classStatus = "desativado"
                    }
            

                    Servidoreslista.innerHTML += `
                          <article class="card-servidor">
                            <p class="status">Status: <span class="status-valor ${classStatus}">${classStatus}</span></p>
                            <h2 class="nome-servidor">${nomeServidor}</h2>
                            <h3 class="sistema-operacional">${sistemaOperacional}</h3>
                    
                            <button type="button" class="btn-visualizar" data-servidor="${idServidor}">Visualizar</button>
                    
                            <div class="card-acoes">
                            <button type="button" class="btn-editar" aria-label="Editar servidor">
                                <img src="../img/GerenciamentoServidores/EditIcon.svg" alt="">
                            </button>
                            <button type="button" class="btn-excluir" data-servidor="${idServidor}" aria-label="Excluir servidor">
                                <img src="../img/GerenciamentoServidores/LixoIcon.svg" alt="">
                            </button>
                            </div>
                        </article>
                    `;
                }
            } else {
                console.log('Nenhum dado encontrado');
            }
        } else {
            console.log("Sem servidores")
        }
    } catch (erro) {
        console.error("Erro ao carregar informações:", erro);
        ModoFavorito.innerHTML = 'Erro ao carregar dados';
    }

    const botoesExcluir = document.querySelectorAll('.btn-excluir');
    const popUpFechar = document.querySelectorAll('.popup-fechar');
    const popUp = document.getElementById('popup-excluir');
    const popUpAviso = document.getElementById('popup-aviso');
    const botoesVisualizar = document.querySelectorAll('.btn-visualizar');
    const botoesEditar = document.querySelectorAll('.btn-editar');

    popUpFechar.forEach(function(botao) {
        botao.addEventListener('click', function() { 
            popUp.style.display = 'none'; 
            popUpAviso.style.display = 'none'; 
            sessionStorage.ID_SERVIDOR_EXCLUIR = undefined;
        });
    });

    botoesExcluir.forEach(function(botao) {
        botao.addEventListener('click', function() { 
            popUp.style.display = 'flex';
            sessionStorage.ID_SERVIDOR_EXCLUIR = botao.dataset.servidor
        });
    });

    botoesEditar.forEach(function(botao) {
        botao.addEventListener('click', function() { 
            window.location.href = './editarServidor.html';    
        });
    });

    botoesVisualizar.forEach(function(botao) {
        botao.addEventListener('click', function() {
            window.location.href = './visualizarServidor.html?id=' + encodeURIComponent(botao.dataset.servidor);
        });
    });
}

    
window.addEventListener('DOMContentLoaded', function() {
    CarregarInfos()
})

const btnConfirmarExclusao = document.getElementById('btn-confirmar-exclusao');
const iptConfirmarExclusao = document.getElementById('input-confirmar-exclusao');

btnConfirmarExclusao.addEventListener('click', function() {
    if(iptConfirmarExclusao.value == 'excluir') {
        DeletarServidor(sessionStorage.ID_SERVIDOR_EXCLUIR)
    } else {
        alert("Erro")
    }
})

async function DeletarServidor(idServidor) {
        try {
        const resposta = await fetch("/gerServidores/deletarComponenteServidor", {
            method: "DELETE",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                idServidorServer: idServidor
            })
        });

        if (!resposta.ok) {
            console.log("Houve um erro ao tentar realizar o delete de servidor!");
            alert("erro")
            return false;
        }

        const respostaComp = await fetch("/gerServidores/deletarServidor", {
            method: "DELETE",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                idServidorServer: idServidor
            })
        });

        if (!respostaComp.ok) {
            console.log("Erro componentes");
            alert("erro")
            return false;
        }

        const popUpAviso = document.getElementById('popup-aviso');
        const popUp = document.getElementById('popup-excluir');
        
        CarregarInfos();
        popUp.style.display = 'none';
        popUpAviso.style.display = 'flex';
        console.log("Tudo certo");
        return true;
    } catch (erro) {
        console.log(erro);
        alert("erro")
        return false;
    }
}



