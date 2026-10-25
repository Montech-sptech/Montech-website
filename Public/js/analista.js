// Dados fixos
var servidorSelecionado = "AIS";
var visualizacaoDisco = "ocupacao";

var horariosColeta = [
    "14:30", "14:31", "14:32",
    "14:33", "14:34", "14:35"
];

var horariosOcorrencias = [
    "14:00", "14:05", "14:10", "14:15",
    "14:20", "14:25", "14:30", "14:35"
];

// A primeira taxa é null porque não há intervalo anterior
var dadosServidores = {
    AIS: {
        cpu: [90, 96, 95, 95, 97, 92],
        ram: [86, 87, 88, 89, 80, 81],
        disco: [70, 70.2, 70.4, 70.6, 70.8, 71],

        leituraDisco: [null, 0.35, 0.42, 0.55, 0.51, 0.48],
        escritaDisco: [null, 0.18, 0.21, 0.29, 0.25, 0.22],

        entradaSwap: [null, 0.01, 0.03, 0.02, 0.04, 0.02],
        saidaSwap: [null, 0.02, 0.04, 0.03, 0.05, 0.03]
    },

    SDV: {
        cpu: [55, 57, 73, 58, 59, 60],
        ram: [54, 55, 55, 56, 56, 56],
        disco: [80, 80.4, 80.8, 81.2, 81.6, 82],

        leituraDisco: [null, 0.25, 0.30, 0.40, 0.32, 0.36],
        escritaDisco: [null, 0.42, 0.48, 0.62, 0.58, 0.64],

        entradaSwap: [null, 0, 0.1, 0.3, 0.2, 0.1],
        saidaSwap: [null, 0.1, 0.2, 0.4, 0.3, 0.2]
    },

    SPA: {
        cpu: [54, 56, 68, 55, 57, 58],
        ram: [54, 54, 55, 55, 56, 56],
        disco: [61, 61.2, 61.4, 61.6, 61.8, 62],

        leituraDisco: [null, 0.12, 0.15, 0.21, 0.16, 0.18],
        escritaDisco: [null, 0.09, 0.10, 0.18, 0.12, 0.14],

        entradaSwap: [null, 0.1, 0.3, 0.2, 0.1, 0.3],
        saidaSwap: [null, 0.2, 0.4, 0.3, 0.2, 0.4]
    }
};

// Histórico exibido pelo botão Analisar
var dadosOcorrencias = {
    cpu: {
        titulo: "CPU do AIS: alerta crítico",
        nome: "CPU",
        limite: 90,
        valores: [48, 50, 54, 62, 71, 80, 85, 92]
    },

    ram: {
        titulo: "RAM do AIS: alerta de atenção",
        nome: "RAM",
        limite: 80,
        valores: [54, 56, 59, 64, 70, 74, 76, 81]
    },

    disco: {
        titulo: "Disco do SDV: alerta de atenção",
        nome: "Disco",
        limite: 80,
        valores: [51, 55, 59, 64, 70, 76, 80, 82]
    }
};

// Guarda os gráficos para atualizar o mesmo canvas
var graficosCriados = {};

// Centraliza as configurações do Chart.js
function criarGrafico(
    idCanvas,
    tipoGrafico,
    rotulosEixoHorizontal,
    seriesGrafico,
    unidadeMedida
) {
    if (unidadeMedida === undefined) {
        unidadeMedida = "";
    }

    var opcoesGrafico = {
        responsive: true,
        maintainAspectRatio: false,
        animation: false,

        plugins: {
            legend: {
                display: true,

                labels: {
                    usePointStyle: true,
                    pointStyle: "rect",
                    boxWidth: 10,
                    boxHeight: 10,
                    padding: 16
                }
            }
        },

        scales: {
            x: {
                grid: {
                    color: "#262f5c"
                }
            },

            y: {
                beginAtZero: true,

                title: {
                    display: true,
                    text: unidadeMedida
                },

                grid: {
                    color: "#262f5c"
                },

                ticks: {
                    precision: 0
                }
            }
        }
    };

    if (unidadeMedida === "%") {
        opcoesGrafico.scales.y.max = 100;
    }

    if (unidadeMedida === " MB/s") {
        opcoesGrafico.scales.y.ticks.precision = 2;
    }

    if (seriesGrafico.length === 1) {
        opcoesGrafico.plugins.legend.display = false;
    }

    // Remove a versão anterior antes de desenhar novamente
    if (graficosCriados[idCanvas]) {
        graficosCriados[idCanvas].destroy();
    }

    graficosCriados[idCanvas] = new Chart(
        document.getElementById(idCanvas),
        {
            type: tipoGrafico,

            data: {
                labels: rotulosEixoHorizontal,
                datasets: seriesGrafico
            },

            options: opcoesGrafico
        }
    );
}

// Uma série reúne os valores representados pela mesma cor
function criarSerie(nomeSerie, valoresSerie, corSerie) {
    return {
        label: nomeSerie,
        data: valoresSerie,
        borderColor: corSerie,
        backgroundColor: corSerie,
        borderWidth: 2,
        pointRadius: 3,
        borderRadius: 4
    };
}

// Verifica se a biblioteca carregou antes de iniciar
function verificarChartJs() {
    if (typeof Chart === "undefined") {
        document.getElementById("mensagem-erro-graficos").hidden = false;

        var controlesGraficos = document.querySelectorAll(
            "button, select"
        );

        for (
            var indiceControle = 0;
            indiceControle < controlesGraficos.length;
            indiceControle++
        ) {
            controlesGraficos[indiceControle].disabled = true;
        }

        return false;
    }

    Chart.defaults.color = "#b8c1d9";
    Chart.defaults.font.family =
        'Inter, "Helvetica Neue", Arial, sans-serif';

    return true;
}

// Apresenta números com vírgula e até duas casas decimais
function formatarNumero(valorNumerico) {
    return valorNumerico.toLocaleString("pt-BR", {
        maximumFractionDigits: 2
    });
}

function calcularMedia(valoresMedidos) {
    var somaValores = 0;

    for (
        var indiceLeitura = 0;
        indiceLeitura < valoresMedidos.length;
        indiceLeitura++
    ) {
        somaValores += valoresMedidos[indiceLeitura];
    }

    return somaValores / valoresMedidos.length;
}

function buscarMaiorValor(valoresMedidos) {
    var maiorValor = valoresMedidos[0];

    for (
        var indiceLeitura = 1;
        indiceLeitura < valoresMedidos.length;
        indiceLeitura++
    ) {
        if (valoresMedidos[indiceLeitura] > maiorValor) {
            maiorValor = valoresMedidos[indiceLeitura];
        }
    }

    return maiorValor;
}

// Monta um indicador dentro do cartão de recurso
function montarIndicador(rotuloIndicador, valorIndicador) {
    return "<div>"
        + "<span>" + rotuloIndicador + "</span>"
        + "<strong>" + valorIndicador + "</strong>"
        + "</div>";
}

// Repete o limite para criar uma linha horizontal
function criarLinhaLimite(
    descricaoLimite,
    percentualLimite,
    quantidadeLeituras
) {
    var valoresLimite = [];

    for (
        var indiceLeitura = 0;
        indiceLeitura < quantidadeLeituras;
        indiceLeitura++
    ) {
        valoresLimite.push(percentualLimite);
    }

    var serieLimite = criarSerie(
        descricaoLimite,
        valoresLimite,
        "#ffad1f"
    );

    serieLimite.borderDash = [5, 5];
    serieLimite.pointRadius = 0;

    return serieLimite;
}


 // Ignora valores que não representam uma leitura válida
function valoresValidos(valores) {
    return valores.filter(function (valor) {
        return typeof valor === "number" && Number.isFinite(valor);
    });
}

// Soma a entrada e a saída de cada intervalo
function somarTransferencias(entradas, saidas) {
    return entradas.map(function (entrada, indice) {
        var saida = saidas[indice];

        if (entrada === null || saida === null) {
            return null;
        }

        return entrada + saida;
    });
}

// Cria os quatro indicadores de cada gráfico
function montarResumoRecurso(valores, unidade, limiteAtencao) {
    var leituras = valoresValidos(valores);

    var valorAtual = leituras[leituras.length - 1];
    var media = calcularMedia(leituras);
    var pico = buscarMaiorValor(leituras);

    var limite = limiteAtencao === null
        ? "Não definido"
        : formatarNumero(limiteAtencao) + unidade;

    return montarIndicador(
        "Uso atual",
        formatarNumero(valorAtual) + unidade
    )
    + montarIndicador(
        "Média em 5 minutos",
        formatarNumero(media) + unidade
    )
    + montarIndicador(
        "Pico em 5 minutos",
        formatarNumero(pico) + unidade
    )
    + montarIndicador(
        "Limite de atenção",
        limite
    );
}


// Executada ao clicar em AIS, SDV ou SPA

function selecionarServidor(siglaServidor, botaoClicado) {
    servidorSelecionado = siglaServidor;

    if (botaoClicado) {
        var botoesServidores = document.querySelectorAll(
            ".seletor-servidor button"
        );

        for (var indiceBotao = 0; indiceBotao < botoesServidores.length; indiceBotao++) {
            botoesServidores[indiceBotao].classList.remove("selecionado");
        }

        botaoClicado.classList.add("selecionado");
    }

    var dadosServidor = dadosServidores[siglaServidor];

    document.getElementById("titulo-cpu").textContent =
        "CPU do " + siglaServidor;

    document.getElementById("titulo-ram").textContent =
        "RAM do " + siglaServidor;

    document.getElementById("titulo-disco").textContent =
        "Disco do " + siglaServidor;

    document.getElementById("titulo-swap").textContent =
        "Swap do " + siglaServidor;

    // Indicadores da CPU
    document.getElementById("indicadores-cpu").innerHTML =
        montarResumoRecurso(dadosServidor.cpu, "%", null);

    // Indicadores da RAM
    document.getElementById("indicadores-ram").innerHTML =
        montarResumoRecurso(dadosServidor.ram, "%", 80);

    // Indicadores do Swap
    var trafegoSwap = somarTransferencias(
        dadosServidor.entradaSwap,
        dadosServidor.saidaSwap
    );

    document.getElementById("indicadores-swap").innerHTML =
        montarResumoRecurso(trafegoSwap, " MB/s", null);

    // Gráfico da CPU
    criarGrafico("grafico-cpu", "line", horariosColeta, [
        criarSerie("Uso de CPU", dadosServidor.cpu, "#4fa3ff"),
        criarLinhaLimite("Limite crítico", 90, horariosColeta.length)
    ], "%");

    // Gráfico da RAM
    criarGrafico("grafico-ram", "line", horariosColeta, [
        criarSerie("Uso de RAM", dadosServidor.ram, "#60d98d"),
        criarLinhaLimite("Limite de atenção", 80, horariosColeta.length)
    ], "%");

    // Gráfico do Swap
    criarGrafico("grafico-swap", "line", horariosColeta, [
        criarSerie("Entrada", dadosServidor.entradaSwap, "#4fa3ff"),
        criarSerie("Saída", dadosServidor.saidaSwap, "#ffad1f")
    ], " MB/s");

    atualizarDisco();
}


// Executada pelos dois botões de visualização do disco
function selecionarVisualizacaoDisco(visualizacao, botaoClicado) {
    visualizacaoDisco = visualizacao;

    var botoesDisco = document.querySelectorAll(
        ".seletor-disco button"
    );

    for (
        var indiceBotao = 0;
        indiceBotao < botoesDisco.length;
        indiceBotao++
    ) {
        botoesDisco[indiceBotao].classList.remove("selecionado");
    }

    botaoClicado.classList.add("selecionado");

    atualizarDisco();
}


function atualizarDisco() {
    var dadosServidor = dadosServidores[servidorSelecionado];

    if (visualizacaoDisco === "ocupacao") {

        // Indicadores de ocupação
        document.getElementById("indicadores-disco").innerHTML =
            montarResumoRecurso(dadosServidor.disco, "%", 80);

        criarGrafico("grafico-disco", "line", horariosColeta, [
            criarSerie("Ocupação", dadosServidor.disco, "#4fa3ff"),
            criarLinhaLimite("Limite de atenção", 80, horariosColeta.length)
        ], "%");

    } else {

        // Soma das taxas de leitura e escrita
        var transferenciasDisco = somarTransferencias(
            dadosServidor.leituraDisco,
            dadosServidor.escritaDisco
        );

        // Indicadores de transferência
        document.getElementById("indicadores-disco").innerHTML =
            montarResumoRecurso(transferenciasDisco, " MB/s", null);

        criarGrafico("grafico-disco", "line", horariosColeta, [
            criarSerie(
                "Leitura",
                dadosServidor.leituraDisco,
                "#4fa3ff"
            ),
            criarSerie(
                "Escrita",
                dadosServidor.escritaDisco,
                "#60d98d"
            )
        ], " MB/s");
    }
}


// Executada ao clicar em Analisar
function abrirGraficoOcorrencia(recursoSelecionado, botaoClicado) {
    var graficoJaAberto =
        botaoClicado.getAttribute("aria-expanded") === "true";

    fecharGraficoOcorrencia();

    if (graficoJaAberto) {
        return;
    }

    var ocorrenciaSelecionada = dadosOcorrencias[recursoSelecionado];

    document.getElementById("historico-ocorrencia").hidden = false;

    document.getElementById("titulo-ocorrencia").textContent =
        ocorrenciaSelecionada.titulo;

    botaoClicado.setAttribute("aria-expanded", "true");

    criarGrafico("grafico-ocorrencia", "line", horariosOcorrencias, [
        criarSerie(
            ocorrenciaSelecionada.nome,
            ocorrenciaSelecionada.valores,
            "#4fa3ff"
        ),
        criarLinhaLimite(
            "Limite de alerta",
            ocorrenciaSelecionada.limite,
            8
        )
    ], "%");
}

function fecharGraficoOcorrencia() {
    document.getElementById("historico-ocorrencia").hidden = true;

    var botoesAnalise = document.querySelectorAll(".botao-analisar");

    for (
        var indiceBotao = 0;
        indiceBotao < botoesAnalise.length;
        indiceBotao++
    ) {
        botoesAnalise[indiceBotao].setAttribute(
            "aria-expanded",
            "false"
        );
    }
}

// Ponto de início da dashboard
if (verificarChartJs()) {
    selecionarServidor("AIS", null);
}