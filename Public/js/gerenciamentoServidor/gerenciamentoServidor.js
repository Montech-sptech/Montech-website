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
                    
                            <button type="button" class="btn-visualizar">Visualizar</button>
                    
                            <div class="card-acoes">
                            <button type="button" class="btn-editar" aria-label="Editar servidor">
                                <img src="../img/GerenciamentoServidores/EditIcon.svg" alt="">
                            </button>
                            <button type="button" class="btn-excluir" aria-label="Excluir servidor">
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

    var botoesExcluir = document.querySelectorAll('.btn-excluir');
    var popUpFechar = document.getElementById('popup-fechar');
    var popUp = document.getElementById('popup-excluir');
    var botoesVisualizar = document.querySelectorAll('.btn-visualizar');
    var botoesEditar = document.querySelectorAll('.btn-editar');

    popUpFechar.addEventListener('click', function() {
        popUp.style.display = 'none'; 
    })

    botoesExcluir.forEach(function(botao) {
        botao.addEventListener('click', function() { 
            popUp.style.display = 'flex'; 
        });
    });

    botoesEditar.forEach(function(botao) {
        botao.addEventListener('click', function() { 
            window.location.href = './editarServidor.html';    
        });
    });

    botoesVisualizar.forEach(function(botao) {
        botao.addEventListener('click', function() { 
            window.location.href = './visualizarServidor.html';    
        });
    });
}

    
window.addEventListener('DOMContentLoaded', function() {
    CarregarInfos()
})