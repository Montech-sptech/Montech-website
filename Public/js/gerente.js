// Rótulos usados nos gráficos de evolução semanal.
var semanas = [
    "1ª semana",
    "2ª semana",
    "3ª semana",
    "4ª semana"
];

// Padroniza a fonte e a cor dos textos dos gráficos.
Chart.defaults.color = "#b8c1d9";
Chart.defaults.font.family =
    "Inter, 'Helvetica Neue', Arial, sans-serif";

// Cria os gráficos de barras da dashboard.
function criarGraficoBarras(id, titulo, rotulos, valores, cores, unidade) {
    new Chart(document.getElementById(id), {
        type: "bar",

        data: {
            labels: rotulos,

            datasets: [
                {
                    label: titulo,
                    data: valores,
                    backgroundColor: cores,
                    borderRadius: 4
                }
            ]
        },

        options: {
            responsive: true,
            maintainAspectRatio: false,
            animation: false,

            plugins: {
                // O título do cartão já identifica a série.
                legend: {
                    display: false
                },

                tooltip: {
                    callbacks: {
                        label: function (contexto) {
                            return titulo + ": " + contexto.raw + unidade;
                        }
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

                    grid: {
                        color: "#262f5c"
                    },

                    ticks: {
                        precision: 0,

                        callback: function (valor) {
                            return valor + unidade;
                        }
                    }
                }
            }
        }
    });
}

// Cria os gráficos de percentual dos recursos.
function criarGraficoLinha(id, titulo, valores, cor) {
    new Chart(document.getElementById(id), {
        type: "line",

        data: {
            labels: semanas,

            datasets: [
                {
                    label: titulo,
                    data: valores,
                    borderColor: cor,
                    backgroundColor: cor,
                    borderWidth: 2,
                    pointRadius: 4,
                    tension: 0.25,
                    fill: false
                }
            ]
        },

        options: {
            responsive: true,
            maintainAspectRatio: false,
            animation: false,

            plugins: {
                legend: {
                    display: false
                },

                tooltip: {
                    callbacks: {
                        label: function (contexto) {
                            return titulo + ": " + contexto.raw + "%";
                        }
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
                    min: 0,
                    max: 100,

                    grid: {
                        color: "#262f5c"
                    },

                    ticks: {
                        callback: function (valor) {
                            return valor + "%";
                        }
                    }
                }
            }
        }
    });
}

// Quantidade de incidentes críticos em cada semana.
criarGraficoBarras(
    "incidents-canvas",
    "Incidentes críticos",
    semanas,
    [1, 2, 2, 3],
    "#3b6bff",
    ""
);

// Quantidade de dias com pelo menos um alerta.
criarGraficoBarras(
    "days-canvas",
    "Dias com alerta",
    semanas,
    [1, 2, 2, 4],
    "#ffad1f",
    ""
);

// Uso médio semanal da CPU do AIS.
criarGraficoLinha(
    "ais-canvas",
    "CPU média do AIS",
    [62, 65, 68, 72],
    "#4fa3ff"
);

// Percentual médio semanal de disco ocupado no SDV.
criarGraficoLinha(
    "sdv-canvas",
    "Disco ocupado do SDV",
    [68, 70, 74, 77],
    "#ffad1f"
);

// Uso médio semanal da CPU do SPA.
criarGraficoLinha(
    "spa-canvas",
    "CPU média do SPA",
    [57, 58, 56, 58],
    "#60d98d"
);

// Compara o tempo mediano em minutos.
// 160 minutos = 2h40; 200 minutos = 3h20.
criarGraficoBarras(
    "resolution-canvas",
    "Tempo mediano",
    ["Anterior", "Atual"],
    [160, 200],
    ["#2b3990", "#3b6bff"],
    " min"
);

// Quantidade de incidentes em cada faixa de tempo.
criarGraficoBarras(
    "distribution-canvas",
    "Incidentes resolvidos",
    ["Até 2 h", "2 a 4 h", "Mais de 4 h"],
    [2, 3, 3],
    "#3b6bff",
    ""
);