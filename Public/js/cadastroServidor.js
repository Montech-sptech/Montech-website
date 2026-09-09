var formCadastroServidor = document.getElementById("formCadastroServidor");
var listaLimites = document.getElementById("listaLimites");
var checkboxesComponentes = document.querySelectorAll("input[name='componentes']");

var nomesComponentes = {
    cpu: "CPU",
    ram: "Mem. RAM",
    disco: "Disco"
};
 
var iconesComponentes = {
    cpu: "../imagens/cpu.png",
    ram: "../imagens/ram.png",
    disco: "../imagens/disco.png"
};
 
var limitesPadrao = {
    atencao: 70,
    critico: 90
};

checkboxesComponentes.forEach(function (checkbox) {
    checkbox.addEventListener("change", atualizarListaLimites);
});


function atualizarListaLimites() {
    checkboxesComponentes.forEach(function (checkbox) {
        var idLinha = "limite_" + checkbox.value;
        var linhaExistente = document.getElementById(idLinha);

        if (checkbox.checked && !linhaExistente) {
            adicionarLinhaLimite(checkbox.value);
        } else if (!checkbox.checked && linhaExistente) {
            linhaExistente.remove();
        }
    });
}

function adicionarLinhaLimite(componente) {
    var linha = document.createElement("div");
    linha.className = "linhaLimite";
    linha.id = "limite_" + componente;

    linha.innerHTML = `
        <div class="infoComponenteLimite">
            <img class="iconeComponente" src="${iconesComponentes[componente]}" alt="">
            <span>${nomesComponentes[componente]}</span>
        </div>
        <div class="campoLimite">
            <label>Atenção</label>
            <input type="number" class="inputLimiteAtencao" data-componente="${componente}"
                value="${limitesPadrao.atencao}" min="0" max="100">
        </div>
        <div class="campoLimite">
            <label>Crítico</label>
            <input type="number" class="inputLimiteCritico" data-componente="${componente}"
                value="${limitesPadrao.critico}" min="0" max="100">
        </div>
    `;

    listaLimites.appendChild(linha);
}

// Monta as linhas de limite para os componentes já marcados por padrão ao carregar a página
atualizarListaLimites();

function cancelarCadastroServidor() {
    formCadastroServidor.reset();
    listaLimites.innerHTML = "";
    atualizarListaLimites();
}

function salvarServidor() {
    var nomeServidor = document.getElementById("nomeServidor").value;
    var hostName = document.getElementById("hostnameServidor").value;
    var tipoServidor = document.getElementById("tipoServidor").value;
    var metodoDeColeta = document.getElementById("metodoColeta").value;
    var intervaloDeColeta = document.getElementById("intervaloColeta").value;

    var componentesSelecionados = document.querySelectorAll("input[name='componentes']:checked");
    var componentes = [];

    componentesSelecionados.forEach(function (checkbox) {
        var inputAtencao = document.querySelector(".inputLimiteAtencao[data-componente='" + checkbox.value + "']");
        var inputCritico = document.querySelector(".inputLimiteCritico[data-componente='" + checkbox.value + "']");

        componentes.push({
            nomeComponente: nomesComponentes[checkbox.value],
            limiteAtencao: inputAtencao ? inputAtencao.value : null,
            limiteCritico: inputCritico ? inputCritico.value : null
        });
    });

    if (componentes.length === 0) {
        alert("Selecione ao menos um componente para monitorar!");
        return;
    }

    console.log(componentes)

    fetch("/servidores/cadastrar/servidor", {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify({
            nomeServidorServer: nomeServidor,
            hostNameServer: hostName,
            tipoServidorServer: tipoServidor,
            metodoDeColetaServer: metodoDeColeta,
            intervaloDeColetaServer: intervaloDeColeta,
            componentesServer: componentes
        })
    })
        .then(function (resposta) {
            if (resposta.ok) {
                return resposta.json();
            } else {
                return resposta.text().then(function (mensagemErro) {
                    throw new Error(mensagemErro);
                });
            }
        })
        .then(function (resultado) {
            console.log("Servidor cadastrado com sucesso: ", resultado);
            alert("Servidor cadastrado com sucesso!");
            formCadastroServidor.reset();
            listaLimites.innerHTML = "";
            atualizarListaLimites();
        })
        .catch(function (erro) {
            console.log(erro);
            alert("Erro ao cadastrar servidor: " + erro.message);
        });
}

