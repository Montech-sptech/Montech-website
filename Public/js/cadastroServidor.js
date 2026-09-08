var formCadastroServidor = document.getElementById("formCadastroServidor");

formCadastroServidor.addEventListener("submit", function (evento) {
    evento.preventDefault();
    salvarServidor();
});

function salvarServidor() {
    var nomeServidor = document.getElementById("nomeServidor").value;
    var hostName = document.getElementById("hostnameServidor").value;
    var tipoServidor = document.getElementById("tipoServidor").value;
    var metodoDeColeta = document.getElementById("metodoColeta").value;
    var porta = document.getElementById("portaConexao").value;
    var intervaloDeColeta = document.getElementById("intervaloColeta").value;

    var componentesSelecionados = document.querySelectorAll("input[name='componentes']:checked");
    var componentesAMonitorar = "";
    for (var i = 0; i < componentesSelecionados.length; i++) {
        componentesAMonitorar += componentesSelecionados[i].value;
        if (i < componentesSelecionados.length - 1) componentesAMonitorar += ",";
    }

    fetch("/servidores/cadastrar", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
            nomeServidorServer: nomeServidor,
            hostNameServer: hostName,
            tipoServidorServer: tipoServidor,
            metodoDeColetaServer: metodoDeColeta,
            portaServer: porta,
            intervaloDeColetaServer: intervaloDeColeta,
            componentesAMonitorarServer: componentesAMonitorar
        })
    })
        .then(function (resposta) {
            if (resposta.ok) return resposta.json();
            return resposta.text().then(function (msg) { throw new Error(msg); });
        })
        .then(function (resultado) {
            console.log("Servidor cadastrado com sucesso: ", resultado);
            formCadastroServidor.reset();
        })
        .catch(function (erro) { console.log(erro); });
}