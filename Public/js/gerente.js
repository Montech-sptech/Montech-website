// Dados fixos
var semanasMes = [
    "1ª semana",
    "2ª semana",
    "3ª semana",
    "4ª semana"
];

// Cada posição representa uma semana
var historicoRecursos = {
    cpu: {
        AIS: {
            minimo: [38, 41, 44, 48],
            media: [62, 65, 68, 72],
            maximo: [86, 89, 92, 76]
        },

        SDV: {
            minimo: [44, 46, 48, 50],
            media: [54, 56, 58, 60],
            maximo: [64, 66, 68, 70]
        },

        SPA: {
            minimo: [47, 48, 46, 48],
            media: [57, 58, 56, 58],
            maximo: [67, 68, 66, 68]
        }
    },

    ram: {
        AIS: {
            minimo: [54, 58, 63, 68],
            media: [64, 68, 73, 78],
            maximo: [74, 78, 83, 88]
        },

        SDV: {
            minimo: [42, 43, 45, 46],
            media: [52, 53, 55, 56],
            maximo: [62, 63, 65, 66]
        },

        SPA: {
            minimo: [43, 44, 45, 46],
            media: [53, 54, 55, 56],
            maximo: [63, 64, 65, 66]
        }
    },

    disco: {
        AIS: {
            minimo: [62, 64, 65, 67],
            media: [66, 68, 69, 71],
            maximo: [70, 72, 73, 75]
        },

        SDV: {
            minimo: [64, 66, 70, 73],
            media: [68, 70, 74, 77],
            maximo: [72, 74, 78, 81]
        },

        SPA: {
            minimo: [54, 55, 56, 58],
            media: [58, 59, 60, 62],
            maximo: [62, 63, 64, 66]
        }
    }
};

// Turnos: 0 = madrugada, 1 = manhã, 2 = tarde, 3 = noite
// O tempo total continua contando até a resolução
var incidentesResolvidos = [
    { turnoAbertura: 0, severidade: "critico", minutos: 480 },
    { turnoAbertura: 0, severidade: "critico", minutos: 360 },

    { turnoAbertura: 1, severidade: "atencao", minutos: 120 },
    { turnoAbertura: 1, severidade: "critico", minutos: 180 },

    { turnoAbertura: 2, severidade: "atencao", minutos: 140 },
    { turnoAbertura: 2, severidade: "critico", minutos: 200 },

    { turnoAbertura: 3, severidade: "critico", minutos: 200 },
    { turnoAbertura: 3, severidade: "critico", minutos: 260 }
];

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

// Executada pelos botões CPU, RAM e Disco
function selecionarRecurso(recursoSelecionado, botaoClicado) {
    var nomesRecursos = {
        cpu: "CPU utilizada",
        ram: "RAM utilizada",
        disco: "Disco ocupado"
    };

    var siglasServidores = ["AIS", "SDV", "SPA"];

    var botoesRecursos = document.querySelectorAll(
        ".seletor-recurso button"
    );

    for (
        var indiceBotao = 0;
        indiceBotao < botoesRecursos.length;
        indiceBotao++
    ) {
        botoesRecursos[indiceBotao].setAttribute(
            "aria-pressed",
            "false"
        );
    }

    botaoClicado.setAttribute("aria-pressed", "true");

    // Atualiza um gráfico para cada servidor
    for (
        var indiceServidor = 0;
        indiceServidor < siglasServidores.length;
        indiceServidor++
    ) {
        var siglaServidor = siglasServidores[indiceServidor];
        var prefixoServidor = siglaServidor.toLowerCase();

        var estatisticasSemana =
            historicoRecursos[recursoSelecionado][siglaServidor];

        document.getElementById(
            "titulo-recurso-" + prefixoServidor
        ).textContent =
            nomesRecursos[recursoSelecionado] + " no " + siglaServidor;

        criarGrafico(
            "grafico-" + prefixoServidor,
            "line",
            semanasMes,
            [
                criarSerie(
                    "Mínimo",
                    estatisticasSemana.minimo,
                    "#60d98d"
                ),
                criarSerie(
                    "Média",
                    estatisticasSemana.media,
                    "#4fa3ff"
                ),
                criarSerie(
                    "Máximo",
                    estatisticasSemana.maximo,
                    "#ffad1f"
                )
            ],
            "%"
        );
    }
}

// Encontra o valor central da lista ordenada
function calcularMediana(temposResolucao) {
    if (temposResolucao.length === 0) {
        return null;
    }

    var temposOrdenados = temposResolucao.slice();

    temposOrdenados.sort(function (tempoA, tempoB) {
        return tempoA - tempoB;
    });

    var indiceCentral = Math.floor(temposOrdenados.length / 2);

    if (temposOrdenados.length % 2 !== 0) {
        return temposOrdenados[indiceCentral];
    }

    return (
        temposOrdenados[indiceCentral - 1]
        + temposOrdenados[indiceCentral]
    ) / 2;
}

// Executada quando o filtro de severidade muda
function atualizarResolucaoPorTurno(severidadeSelecionada) {
    var nomesTurnos = [
        "Madrugada",
        "Manhã",
        "Tarde",
        "Noite"
    ];

    var horariosTurnos = [
        "00h–06h",
        "06h–12h",
        "12h–18h",
        "18h–24h"
    ];

    var temposMedianos = [];
    var resumoTurnos = "";

    for (var indiceTurno = 0; indiceTurno < 4; indiceTurno++) {
        var temposDoTurno = [];

        for (
            var indiceIncidente = 0;
            indiceIncidente < incidentesResolvidos.length;
            indiceIncidente++
        ) {
            var incidente = incidentesResolvidos[indiceIncidente];

            var pertenceAoTurno =
                incidente.turnoAbertura === indiceTurno;

            var atendeAoFiltro =
                severidadeSelecionada === "todas"
                || incidente.severidade === severidadeSelecionada;

            if (pertenceAoTurno && atendeAoFiltro) {
                temposDoTurno.push(incidente.minutos);
            }
        }

        // Um turno sem casos recebe null, nunca tempo zero.
        temposMedianos.push(calcularMediana(temposDoTurno));

        var descricaoQuantidade = temposDoTurno.length + " incidentes";

        if (temposDoTurno.length === 0) {
            descricaoQuantidade = "Sem incidentes";
        }

        resumoTurnos += "<div>"
            + "<strong>" + nomesTurnos[indiceTurno] + "</strong>"
            + "<span>" + horariosTurnos[indiceTurno] + "</span>"
            + "<span>" + descricaoQuantidade + "</span>"
            + "</div>";
    }

    criarGrafico(
        "grafico-resolucao-turnos",
        "bar",
        nomesTurnos,
        [
            criarSerie(
                "Tempo mediano de resolução",
                temposMedianos,
                "#4fa3ff"
            )
        ],
        " min"
    );

    document.getElementById("resumo-turnos").innerHTML =
        resumoTurnos;
}

// Ponto de início da dashboard
if (verificarChartJs()) {
    criarGrafico("grafico-incidentes", "bar", semanasMes, [
        criarSerie("Incidentes críticos", [1, 2, 3, 1], "#3b6bff")
    ]);

    criarGrafico("grafico-dias-alertas", "bar", semanasMes, [
        criarSerie("Dias com alerta", [1, 2, 2, 1], "#ffad1f")
    ]);

    criarGrafico(
        "grafico-ocorrencias-recursos",
        "bar",
        ["CPU", "Disco", "RAM"],
        [
            criarSerie("Ocorrências no mês", [5, 4, 2], "#3b6bff")
        ]
    );

    selecionarRecurso(
        "cpu",
        document.querySelector(".seletor-recurso button")
    );

    atualizarResolucaoPorTurno("todas");
}