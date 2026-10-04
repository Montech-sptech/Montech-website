// Dados fixos usados no diagnóstico de cada servidor.
var servidores = {
    AIS: {
        recursos: [
            ["CPU", "92%", "Crítico ≥ 90%", "red"],
            ["RAM", "81%", "Atenção ≥ 80%", "orange"],
            ["Disco", "71%", "Atenção ≥ 80%", "green"]
        ],

        indicadores: [
            ["CPU média · 5 min", "87,4%"],
            ["Pico de CPU · 5 min", "96% às 14:31"],
            ["RAM média · janela disponível", "78,6%"],
            ["Swap · 5 min", "houve atividade"],
            ["Disco I/O · por ciclo", "leitura 2,4 MB · escrita 1,1 MB"],
            ["CPU por núcleo", "[96, 91, 88, 93]%"]
        ],

        eventos: [
            ["14:35", "Coleta recebida"],
            ["14:18", "RAM ultrapassou 80%"],
            ["14:09", "CPU ultrapassou 90%; INC-1024 aberto"]
        ],

        observacao:
            "Comparar média de CPU, pico, uso por núcleo e horário do alerta.",

        cpu: [62, 64, 70, 78, 82, 89, 92],
        ram: [61, 62, 65, 70, 73, 77, 81],
        disco: [66, 66, 67, 68, 69, 70, 71]
    },

    SDV: {
        recursos: [
            ["CPU", "60%", "Crítico ≥ 90%", "green"],
            ["RAM", "56%", "Atenção ≥ 80%", "green"],
            ["Disco", "82%", "Atenção ≥ 80%", "orange"]
        ],

        indicadores: [
            ["CPU média · 5 min", "59,2%"],
            ["Pico de CPU · 5 min", "73% às 14:27"],
            ["RAM média · janela disponível", "55,8%"],
            ["Swap · 5 min", "sem atividade"],
            ["Disco I/O · por ciclo", "leitura 1,8 MB · escrita 3,2 MB"],
            ["CPU por núcleo", "[61, 58, 60, 61]%"]
        ],

        eventos: [
            ["14:35", "Coleta recebida"],
            ["14:24", "Disco ultrapassou 80%"],
            ["30 dias", "3 incidentes anteriores da categoria disco"]
        ],

        observacao:
            "Acompanhar a persistência do uso de disco e seu crescimento no período.",

        cpu: [54, 55, 56, 56, 58, 59, 60],
        ram: [51, 52, 52, 53, 54, 55, 56],
        disco: [68, 70, 72, 75, 77, 80, 82]
    },

    SPA: {
        recursos: [
            ["CPU", "58%", "Crítico ≥ 90%", "green"],
            ["RAM", "56%", "Atenção ≥ 80%", "green"],
            ["Disco", "62%", "Atenção ≥ 80%", "green"]
        ],

        indicadores: [
            ["CPU média · 5 min", "56,9%"],
            ["Pico de CPU · 5 min", "68% às 14:22"],
            ["RAM média · janela disponível", "55,3%"],
            ["Swap · 5 min", "sem atividade"],
            ["Disco I/O · por ciclo", "leitura 0,9 MB · escrita 0,7 MB"],
            ["CPU por núcleo", "[55, 59, 58, 60]%"]
        ],

        eventos: [
            ["14:35", "Coleta recebida"],
            ["Últimas 6 h", "Recursos abaixo dos limites"],
            ["30 dias", "Sem recorrência da mesma categoria"]
        ],

        observacao:
            "Recursos dentro dos limites no período apresentado.",

        cpu: [55, 56, 54, 57, 55, 57, 58],
        ram: [52, 53, 54, 54, 55, 56, 56],
        disco: [58, 59, 60, 60, 61, 61, 62]
    }
};

// Dados fixos apresentados ao clicar nos olhinhos.
var ocorrencias = {
    cpu: {
        titulo: "CPU do AIS · alerta crítico",
        recurso: "CPU",
        limite: 90,
        cor: "#ff5361",
        valores: [48, 50, 54, 62, 71, 80, 89, 92]
    },

    ram: {
        titulo: "RAM do AIS · alerta de atenção",
        recurso: "RAM",
        limite: 80,
        cor: "#4fa3ff",
        valores: [54, 56, 59, 64, 70, 74, 78, 81]
    },

    disk: {
        titulo: "Disco do SDV · alerta de atenção",
        recurso: "Disco",
        limite: 80,
        cor: "#ffad1f",
        valores: [51, 55, 59, 64, 70, 76, 80, 82]
    }
};

// Guarda os gráficos criados pelo Chart.js.
var graficoRecursos = null;
var graficoOcorrencia = null;

// Define a fonte e a cor dos textos dos gráficos.
Chart.defaults.color = "#b8c1d9";
Chart.defaults.font.family =
    "Inter, 'Helvetica Neue', Arial, sans-serif";

// Monta uma série de dados para um gráfico de linhas.
function criarSerie(nome, valores, cor) {
    return {
        label: nome,
        data: valores,
        borderColor: cor,
        backgroundColor: cor,
        borderWidth: 2,
        pointRadius: 3,
        tension: 0.25,
        fill: false
    };
}

// Define a aparência dos gráficos de percentual.
function opcoesPercentual() {
    return {
        responsive: true,
        maintainAspectRatio: false,
        animation: false,

        interaction: {
            mode: "index",
            intersect: false
        },

        plugins: {
            legend: {
                labels: {
                    boxWidth: 12
                }
            },

            tooltip: {
                callbacks: {
                    label: function (contexto) {
                        return contexto.dataset.label + ": " + contexto.raw + "%";
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
    };
}

// Troca o conteúdo do diagnóstico para o servidor escolhido.
function selectServer(nome, botao) {
    var servidor = servidores[nome];
    var botoes = document.querySelectorAll(".detail-tabs button");

    // Remove o destaque dos botões anteriores.
    for (var i = 0; i < botoes.length; i++) {
        botoes[i].classList.remove("selected");
    }

    // Destaca o botão correspondente ao servidor.
    if (botao != null) {
        botao.classList.add("selected");
    } else {
        botoes[0].classList.add("selected");
    }

    document.getElementById("diagnostic-title").textContent =
        nome + " · recursos e limites";

    var htmlRecursos = "";

    // Cada linha do array vira um cartão de recurso.
    for (var i = 0; i < servidor.recursos.length; i++) {
        var recurso = servidor.recursos[i];

        htmlRecursos +=
            "<div>" +
            "<small>" + recurso[0] + "</small>" +
            "<b class='" + recurso[3] + "'>" + recurso[1] + "</b>" +
            "<em>" + recurso[2] + "</em>" +
            "</div>";
    }

    document.getElementById("technical-metrics").innerHTML = htmlRecursos;

    var htmlIndicadores = "";

    // Preenche os indicadores derivados da coleta.
    for (var i = 0; i < servidor.indicadores.length; i++) {
        var indicador = servidor.indicadores[i];

        htmlIndicadores +=
            "<div>" +
            "<small>" + indicador[0] + "</small>" +
            "<b>" + indicador[1] + "</b>" +
            "</div>";
    }

    document.getElementById("derived-metrics").innerHTML = htmlIndicadores;

    var htmlEventos = "";

    // Monta a linha do tempo.
    for (var i = 0; i < servidor.eventos.length; i++) {
        var evento = servidor.eventos[i];

        htmlEventos +=
            "<div>" +
            "<strong>" + evento[0] + "</strong>" +
            "<br>" +
            evento[1] +
            "</div>";
    }

    document.getElementById("diagnostic-timeline").innerHTML = htmlEventos;

    document.getElementById("diagnostic-action").textContent =
        servidor.observacao;

    atualizarGraficoRecursos(nome);
}

// Desenha CPU, RAM e disco do servidor selecionado.
function atualizarGraficoRecursos(nome) {
    var servidor = servidores[nome];

    // Remove o gráfico anterior antes de criar outro no mesmo canvas.
    if (graficoRecursos != null) {
        graficoRecursos.destroy();
    }

    graficoRecursos = new Chart(
        document.getElementById("technical-canvas"),
        {
            type: "line",

            data: {
                labels: [
                    "08:35", "09:35", "10:35", "11:35",
                    "12:35", "13:35", "14:35"
                ],

                datasets: [
                    criarSerie("CPU", servidor.cpu, "#4fa3ff"),
                    criarSerie("RAM", servidor.ram, "#60d98d"),
                    criarSerie("Disco", servidor.disco, "#ffad1f")
                ]
            },

            options: opcoesPercentual()
        }
    );
}

// Abre o gráfico da ocorrência clicada.
function showAlertChart(recurso, botao) {
    var painel = document.getElementById("alert-chart");

    // Um segundo clique no mesmo olhinho fecha o gráfico.
    if (botao.getAttribute("aria-expanded") == "true") {
        closeAlertChart();
        return;
    }

    var botoes = document.querySelectorAll(".eye");

    for (var i = 0; i < botoes.length; i++) {
        botoes[i].setAttribute("aria-expanded", "false");
    }

    botao.setAttribute("aria-expanded", "true");
    painel.hidden = false;

    var ocorrencia = ocorrencias[recurso];

    document.getElementById("alert-chart-title").textContent =
        ocorrencia.titulo;

    // Repete o limite para formar uma linha horizontal.
    var valoresLimite = [];

    for (var i = 0; i < ocorrencia.valores.length; i++) {
        valoresLimite.push(ocorrencia.limite);
    }

    var serieRecurso = criarSerie(
        ocorrencia.recurso,
        ocorrencia.valores,
        ocorrencia.cor
    );

    var serieLimite = criarSerie(
        "Limite de " + ocorrencia.limite + "%",
        valoresLimite,
        "#b8c1d9"
    );

    serieLimite.borderDash = [5, 5];
    serieLimite.pointRadius = 0;

    if (graficoOcorrencia != null) {
        graficoOcorrencia.destroy();
    }

    graficoOcorrencia = new Chart(
        document.getElementById("alert-canvas"),
        {
            type: "line",

            data: {
                labels: [
                    "14:00", "14:05", "14:10", "14:15",
                    "14:20", "14:25", "14:30", "14:35"
                ],

                datasets: [
                    serieRecurso,
                    serieLimite
                ]
            },

            options: opcoesPercentual()
        }
    );
}

// Esconde o gráfico e remove o destaque dos olhinhos.
function closeAlertChart() {
    document.getElementById("alert-chart").hidden = true;

    var botoes = document.querySelectorAll(".eye");

    for (var i = 0; i < botoes.length; i++) {
        botoes[i].setAttribute("aria-expanded", "false");
    }
}

// Mostra o AIS quando a página é aberta.
selectServer("AIS", null);