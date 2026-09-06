carregarRelatorios();

function salvarRelatorio() {
    var titulo = document.getElementById("tituloRelatorioInput").value;
    var tipo = document.getElementById("tipoRelatorioInput").value;
    var resumo = document.getElementById("resumoRelatorioInput").value;
    var descricao = document.getElementById("observacoesRelatorioInput").value;
    var fkEmpresa = sessionStorage.getItem("EMPRESA_ID");
    var dataRelatorio = document.getElementById("dataRelatorioInput").value;

    fetch("/relatorios/cadastrar", {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },

        body: JSON.stringify({
            tituloServer: titulo,
            tipoServer: tipo,
            resumoServer: resumo,
            descricaoServer: descricao,
            dataRelatorioServer: dataRelatorio,
            statusAnaliseServer: document.getElementById("statusRelatorioInput").value,
            fkEmpresaServer: fkEmpresa
        })
    })
        .then(function (resposta) {
            if (resposta.ok) {
                fecharModalRelatorio();
                document.getElementById("tituloRelatorioInput").value = "";
                document.getElementById("tipoRelatorioInput").value = "";
                document.getElementById("dataRelatorioInput").value = "";
                document.getElementById("statusRelatorioInput").value = "";
                document.getElementById("resumoRelatorioInput").value = "";
                document.getElementById("observacoesRelatorioInput").value = "";

                carregarRelatorios();
            } else {
                console.log("erro relatório");
            }
        })
        .catch(function (erro) {
            console.log(erro);
        });
}

function carregarRelatorios() {
    var idEmpresa = sessionStorage.getItem("EMPRESA_ID");
    fetch("/relatorios/listar/" + idEmpresa)
        .then(function (resposta) {
            if (resposta.ok) {
                return resposta.json();
            }
        })
        .then(function (relatorios) {
            var container = document.querySelector(".secaoElementos");
            container.innerHTML = "";

            for (var i = 0; i < relatorios.length; i++) {
                var relatorio = relatorios[i];
                var data = new Date(relatorio.dataRelatorio);

                var dataFormatada =
                    String(data.getDate()).padStart(2, "0") + "/" +
                    String(data.getMonth() + 1).padStart(2, "0") + "/" +
                    data.getFullYear();

                var card = document.createElement("div");

                card.className = "cardRelatorio";

                card.innerHTML = `
                    <h2>${relatorio.tituloRelatorio}</h2>

                    <div class="tipoRelatorio">
                        <span>${relatorio.tipo}</span>
                        <span class="tagRelatorio">MONTECH</span>
                    </div>

                    <div class="descricaoRelatorio">
                        ${relatorio.resumo}
                    </div>

                    <div class="rodapeRelatorio">

                        <div class="usuarioRelatorio">
                            <img class="iconeUsuario" src="../imagens/user.png" alt="Usuário">
                            <span>${sessionStorage.getItem("NOME")}</span>
                        </div>

                        <span class="dataRelatorio">${dataFormatada}</span>

                        <span class="statusRelatorio">
                            ${relatorio.statusAnalise}
                        </span>

                    </div>
                `;
                container.appendChild(card);
            }
        })
        .catch(function (erro) {

            console.log(erro);

        });
}

setInterval(carregarRelatorios, 5000)