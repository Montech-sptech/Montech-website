// ===== Constantes =====
var DIA_MS = 86400000;
var DATA_FIM = new Date(2026, 9, 31, 23, 59, 59);
var TOTAL_SEMANAS = 52;
var SEMANAS_DE_HISTORICO = 12;
var COR_AZUL = "#4fa3ff",
  COR_AZUL_FORTE = "#0b48ff",
  COR_VERDE = "#60d98d",
  COR_AMARELO = "#ffad1f",
  COR_VERMELHO = "#ff6b6b",
  COR_TEXTO_SUAVE = "#a8b0d3",
  COR_GRADE = "#262f5c";
var COR_PERIODO_ANTERIOR = "rgba(168,176,211,0.35)";
var pluginAlinharResumoTurnos = {
  id: "alinharResumoTurnos",
  afterLayout: function (grafico) {
    if (grafico.canvas.id !== "graficoTurnos" || !grafico.chartArea) return;
    var resumo = document.getElementById("resumoTurnos");
    resumo.style.marginLeft = grafico.chartArea.left + "px";
    resumo.style.width = grafico.chartArea.width + "px";
  },
};
var SERVIDORES = ["AIS", "SDV", "SPA"];
var RECURSOS = ["CPU", "RAM", "Disco", "Swap"];
var TURNOS = [
  { nome: "Madrugada", faixa: "00h–06h" },
  { nome: "Manhã", faixa: "06h–12h" },
  { nome: "Tarde", faixa: "12h–18h" },
  { nome: "Noite", faixa: "18h–24h" },
];
var NOMES_DOS_MESES = [
  "jan",
  "fev",
  "mar",
  "abr",
  "mai",
  "jun",
  "jul",
  "ago",
  "set",
  "out",
  "nov",
  "dez",
];
var abaAtiva = "turnos";

// ===== Dados mockados (quando houver API, só o array "incidentes" é substituído) =====
function criarGerador(semente) {
  var estado = semente;
  return function () {
    estado = (estado * 1664525 + 1013904223) % 4294967296;
    return estado / 4294967296;
  };
}
function indiceDaSemana(dataInicio) {
  return Math.floor((DATA_FIM.getTime() - dataInicio.getTime()) / (7 * DIA_MS));
}
var incidentes = [];
function registrarIncidente(
  inicio,
  duracaoMinutos,
  severidade,
  servidor,
  recurso,
) {
  incidentes.push({
    inicio: inicio,
    duracaoMinutos: duracaoMinutos,
    severidade: severidade,
    servidor: servidor,
    recurso: recurso,
    reincidente: false,
    indiceSemana: indiceDaSemana(inicio),
  });
}
var gerarAleatorio = criarGerador(20261031);
var quantidadeFixaDoPeriodoAnterior = { 4: 2, 5: 1, 6: 2, 7: 1 }; // set/26 fecha com 6 incidentes
for (var indiceGerado = TOTAL_SEMANAS - 1; indiceGerado >= 4; indiceGerado--) {
  var sorteioDeQuantidade = gerarAleatorio();
  var quantidadeNaSemana =
    quantidadeFixaDoPeriodoAnterior[indiceGerado] !== undefined
      ? quantidadeFixaDoPeriodoAnterior[indiceGerado]
      : sorteioDeQuantidade < 0.12
        ? 0
        : sorteioDeQuantidade < 0.5
          ? 1
          : sorteioDeQuantidade < 0.85
            ? 2
            : 3;
  for (
    var numeroDoIncidente = 0;
    numeroDoIncidente < quantidadeNaSemana;
    numeroDoIncidente++
  ) {
    var inicioGerado = new Date(
      DATA_FIM.getTime() - (indiceGerado * 7 + gerarAleatorio() * 6.9) * DIA_MS,
    );
    var ehCritico = gerarAleatorio() < 0.62;
    var duracaoGerada = Math.round(
      130 + gerarAleatorio() * 150 + (ehCritico ? 25 : 0),
    );
    registrarIncidente(
      inicioGerado,
      duracaoGerada,
      ehCritico ? "critico" : "atencao",
      SERVIDORES[Math.floor(gerarAleatorio() * 3)],
      RECURSOS[Math.floor(gerarAleatorio() * 4)],
    );
  }
}
// Outubro/2026 fixo: [dia, hora, duração em min, severidade, servidor, recurso]
[
  [5, 2, 240, "critico", "SDV", "RAM"],
  [9, 14, 360, "critico", "AIS", "Disco"],
  [12, 8, 120, "atencao", "SPA", "CPU"],
  [14, 19, 180, "critico", "AIS", "Disco"],
  [16, 3, 200, "critico", "SDV", "RAM"],
  [19, 10, 150, "atencao", "SPA", "Swap"],
  [21, 22, 200, "critico", "SDV", "RAM"],
  [23, 15, 290, "critico", "AIS", "Disco"],
  [26, 7, 190, "atencao", "SPA", "CPU"],
  [28, 1, 260, "critico", "SDV", "RAM"],
  [30, 20, 380, "critico", "AIS", "CPU"],
].forEach(function (linha) {
  registrarIncidente(
    new Date(2026, 9, linha[0], linha[1], 30),
    linha[2],
    linha[3],
    linha[4],
    linha[5],
  );
});
// Reincidência: mesmo servidor e recurso com incidente nos 14 dias anteriores (antes do filtro de severidade)
incidentes.sort(function (a, b) {
  return a.inicio - b.inicio;
});
incidentes.forEach(function (atual, posicao) {
  for (var posicaoAnterior = 0; posicaoAnterior < posicao; posicaoAnterior++) {
    var anterior = incidentes[posicaoAnterior];
    if (
      anterior.servidor === atual.servidor &&
      anterior.recurso === atual.recurso &&
      atual.inicio - anterior.inicio <= 14 * DIA_MS
    ) {
      atual.reincidente = true;
      break;
    }
  }
});

// ===== Utilitários =====
function selecionarIncidentes(
  primeiraSemana,
  quantidadeDeSemanas,
  severidadeSelecionada,
) {
  return incidentes.filter(function (incidente) {
    var dentroDaJanela =
      incidente.indiceSemana >= primeiraSemana &&
      incidente.indiceSemana < primeiraSemana + quantidadeDeSemanas;
    return (
      dentroDaJanela &&
      (severidadeSelecionada === "todas" ||
        incidente.severidade === severidadeSelecionada)
    );
  });
}
function duracoesDe(lista) {
  return lista.map(function (incidente) {
    return incidente.duracaoMinutos;
  });
}
function ordenar(lista) {
  return lista.slice().sort(function (a, b) {
    return a - b;
  });
}
function mediana(lista) {
  if (!lista.length) return null;
  var ordenada = ordenar(lista),
    meio = Math.floor(ordenada.length / 2);
  return ordenada.length % 2
    ? ordenada[meio]
    : (ordenada[meio - 1] + ordenada[meio]) / 2;
}
function media(lista) {
  return lista.length
    ? lista.reduce(function (soma, valor) {
        return soma + valor;
      }, 0) / lista.length
    : null;
}
function percentil(lista, proporcao) {
  if (!lista.length) return null;
  var ordenada = ordenar(lista),
    posicao = (ordenada.length - 1) * proporcao,
    base = Math.floor(posicao);
  return ordenada[base + 1] !== undefined
    ? ordenada[base] + (posicao - base) * (ordenada[base + 1] - ordenada[base])
    : ordenada[base];
}
function dois(numero) {
  return numero < 10 ? "0" + numero : "" + numero;
}
function formatarDuracao(minutos) {
  if (minutos === null) return "—";
  var horas = Math.floor(minutos / 60),
    resto = Math.round(minutos % 60);
  if (!horas) return resto + " min";
  return horas + "h" + (resto ? " " + dois(resto) : "");
}
function formatarEixoEmHoras(valor) {
  return valor / 60 + "h";
}
function dataInicioDaSemana(indiceSemana) {
  return new Date(DATA_FIM.getTime() - ((indiceSemana + 1) * 7 - 1) * DIA_MS);
}
function rotuloDaSemana(indiceSemana) {
  var data = dataInicioDaSemana(indiceSemana);
  return dois(data.getDate()) + "/" + dois(data.getMonth() + 1);
}
function formatarIntervalo(semanaMaisAntiga, semanaMaisRecente) {
  var inicio = dataInicioDaSemana(semanaMaisAntiga);
  var fim = new Date(
    dataInicioDaSemana(semanaMaisRecente).getTime() + 6 * DIA_MS,
  );
  return (
    dois(inicio.getDate()) +
    "/" +
    dois(inicio.getMonth() + 1) +
    "/" +
    String(inicio.getFullYear()).slice(-2) +
    " a " +
    dois(fim.getDate()) +
    "/" +
    dois(fim.getMonth() + 1) +
    "/" +
    String(fim.getFullYear()).slice(-2)
  );
}
// Variação sempre em % relativo (ou duração, no tempo mediano). Em todos os indicadores, aumentar é pior.
function montarVariacao(atual, anterior, tipo) {
  if (
    atual === null ||
    anterior === null ||
    (tipo === "percentual" && anterior === 0)
  ) {
    return {
      classe: "neutro",
      html: '<span class="variacao neutro">sem base de comparação</span>',
    };
  }
  var diferenca = atual - anterior;
  var classe = diferenca > 0 ? "pior" : diferenca < 0 ? "melhor" : "neutro";
  var seta = diferenca > 0 ? "▲" : diferenca < 0 ? "▼" : "●";
  var valor =
    tipo === "percentual"
      ? Math.round(Math.abs(diferenca / anterior) * 100) + "%"
      : formatarDuracao(Math.abs(diferenca));
  return {
    classe: classe,
    html:
      '<span class="variacao ' + classe + '">' + seta + " " + valor + "</span>",
  };
}
function lerFiltros() {
  return {
    semanas: parseInt(document.getElementById("filtroPeriodo").value, 10),
    severidade: document.getElementById("filtroSeveridade").value,
  };
}

// ===== Gráficos =====
Chart.defaults.color = COR_TEXTO_SUAVE;
Chart.defaults.font.family = "'Inter', system-ui, sans-serif";
Chart.defaults.font.size = 12;
Chart.defaults.maintainAspectRatio = false;
Chart.defaults.borderColor = COR_GRADE;
var graficos = {};
function desenharGrafico(idCanvas, configuracao) {
  if (graficos[idCanvas]) graficos[idCanvas].destroy();
  graficos[idCanvas] = new Chart(
    document.getElementById(idCanvas),
    configuracao,
  );
}

// Linha pontilhada que separa o histórico do período do filtro
var pluginDivisorDoHistorico = {
  id: "divisorDoHistorico",
  afterDraw: function (grafico) {
    var contexto = grafico.ctx,
      area = grafico.chartArea,
      escalaX = grafico.scales.x;
    var xDivisao =
      (escalaX.getPixelForValue(SEMANAS_DE_HISTORICO - 1) +
        escalaX.getPixelForValue(SEMANAS_DE_HISTORICO)) /
      2;
    contexto.save();
    contexto.strokeStyle = "rgba(255,255,255,0.3)";
    contexto.setLineDash([2, 4]);
    contexto.beginPath();
    contexto.moveTo(xDivisao, area.top);
    contexto.lineTo(xDivisao, area.bottom);
    contexto.stroke();
    contexto.setLineDash([]);
    contexto.fillStyle = COR_TEXTO_SUAVE;
    contexto.font = "12px Inter, sans-serif";
    contexto.textAlign = "center";
    contexto.fillText(
      "Período do filtro",
      (xDivisao + area.right) / 2,
      grafico.height - 6,
    );
    contexto.restore();
  },
};

function desenharCartaDeControle(semanas, severidade) {
  var rotulos = [],
    medianas = [],
    ehJanela = [];
  for (var indice = semanas + SEMANAS_DE_HISTORICO - 1; indice >= 0; indice--) {
    rotulos.push(rotuloDaSemana(indice));
    medianas.push(
      mediana(duracoesDe(selecionarIncidentes(indice, 1, severidade))),
    ); // semana sem incidente fica sem ponto
    ehJanela.push(indice < semanas);
  }
  var base = medianas.filter(function (valor, posicao) {
    return !ehJanela[posicao] && valor !== null;
  });
  var temFaixa = base.length >= 3;
  var mediaDoHistorico = null,
    limiteSuperior = null,
    limiteInferior = null;
  if (temFaixa) {
    mediaDoHistorico = media(base);
    var variancia =
      base.reduce(function (soma, valor) {
        return soma + Math.pow(valor - mediaDoHistorico, 2);
      }, 0) /
      (base.length - 1);
    limiteSuperior = mediaDoHistorico + 2 * Math.sqrt(variancia);
    limiteInferior = Math.max(0, mediaDoHistorico - 2 * Math.sqrt(variancia));
  }
  var semanasPiores = 0,
    semanasMelhores = 0;
  medianas.forEach(function (valor, posicao) {
    if (!temFaixa || !ehJanela[posicao] || valor === null) return;
    if (valor > limiteSuperior) semanasPiores++;
    else if (valor < limiteInferior) semanasMelhores++;
  });
  function corDoPonto(contexto) {
    var valor = medianas[contexto.dataIndex];
    if (valor === null || !temFaixa || !ehJanela[contexto.dataIndex])
      return COR_AZUL;
    return valor > limiteSuperior
      ? COR_VERMELHO
      : valor < limiteInferior
        ? COR_VERDE
        : COR_AZUL;
  }
  function raioDoPonto(contexto) {
    return corDoPonto(contexto) === COR_AZUL ? 3.5 : 6;
  }
  function repetir(valor) {
    return rotulos.map(function () {
      return valor;
    });
  }

  var selo = document.getElementById("seloControle");
  selo.className = "seloEstado";
  if (!temFaixa) {
    selo.textContent = "Histórico insuficiente";
  } else if (semanasPiores > 0) {
    selo.textContent =
      semanasPiores +
      (semanasPiores === 1
        ? " semana fora do padrão"
        : " semanas fora do padrão") +
      (semanasMelhores ? " · " + semanasMelhores + " melhor que o normal" : "");
    selo.classList.add("pior");
  } else if (semanasMelhores > 0) {
    selo.textContent =
      semanasMelhores +
      (semanasMelhores === 1
        ? " semana melhor que o normal"
        : " semanas melhores que o normal");
    selo.classList.add("melhor");
  } else {
    selo.textContent = "Dentro do padrão";
    selo.classList.add("melhor");
  }

  desenharGrafico("graficoControle", {
    type: "line",
    data: {
      labels: rotulos,
      datasets: [
        {
          label: "Limite inferior",
          data: repetir(limiteInferior),
          borderWidth: 0,
          pointRadius: 0,
          fill: false,
        },
        {
          label: "Faixa normal",
          data: repetir(limiteSuperior),
          borderWidth: 0,
          pointRadius: 0,
          fill: "-1",
          backgroundColor: "rgba(96,217,141,0.13)",
        },
        {
          label: "Média do histórico",
          data: repetir(mediaDoHistorico),
          borderColor: "rgba(96,217,141,0.7)",
          borderDash: [5, 5],
          borderWidth: 1.5,
          pointRadius: 0,
          fill: false,
        },
        {
          label: "Mediana da semana",
          data: medianas,
          borderColor: COR_AZUL,
          borderWidth: 2,
          spanGaps: true,
          fill: false,
          pointBackgroundColor: corDoPonto,
          pointBorderColor: corDoPonto,
          pointRadius: raioDoPonto,
        },
      ],
    },
    options: {
      layout: { padding: { bottom: 22 } },
      plugins: {
        legend: { display: false },
        tooltip: {
          filter: function (item) {
            return item.datasetIndex === 3 && item.raw !== null;
          },
          callbacks: {
            title: function (itens) {
              return "Semana de " + itens[0].label;
            },
            label: function (item) {
              return "Mediana: " + formatarDuracao(item.raw);
            },
          },
        },
      },
      scales: {
        x: {
          grid: { display: false },
          ticks: { maxRotation: 0, autoSkipPadding: 12 },
        },
        y: {
          beginAtZero: true,
          ticks: { stepSize: 60, callback: formatarEixoEmHoras },
        },
      },
    },
    plugins: [pluginDivisorDoHistorico],
  });
}

function desenharGraficoDeIncidentes(semanas, severidade) {
  var tamanhoDoBloco = semanas === 4 ? 1 : 4; // semana a semana no último mês; blocos de 4 semanas nos períodos maiores
  var quantidadeDeBlocos = semanas / tamanhoDoBloco;
  var rotulos = [],
    primeiras = [],
    reincidentes = [],
    anteriores = [],
    reincidentesAnteriores = [],
    intervalosAtuais = [],
    intervalosAnteriores = [];
  for (var bloco = 0; bloco < quantidadeDeBlocos; bloco++) {
    var semanaMaisRecente = semanas - (bloco + 1) * tamanhoDoBloco;
    var semanaMaisAntiga = semanaMaisRecente + tamanhoDoBloco - 1;
    var doBloco = selecionarIncidentes(
      semanaMaisRecente,
      tamanhoDoBloco,
      severidade,
    );
    var reincidentesDoBloco = doBloco.filter(function (i) {
      return i.reincidente;
    }).length;
    // Rótulo por posição: o período anterior é comparado "semana 1 contra semana 1"
    rotulos.push(
      tamanhoDoBloco === 1
        ? bloco + 1 + "ª semana"
        : "Sem. " +
            (bloco * tamanhoDoBloco + 1) +
            "–" +
            (bloco + 1) * tamanhoDoBloco,
    );
    primeiras.push(doBloco.length - reincidentesDoBloco);
    reincidentes.push(reincidentesDoBloco);
    var doBlocoAnterior = selecionarIncidentes(
      semanaMaisRecente + semanas,
      tamanhoDoBloco,
      severidade,
    );
    var reincidentesDoBlocoAnterior = doBlocoAnterior.filter(function (i) {
      return i.reincidente;
    }).length;
    anteriores.push(doBlocoAnterior.length - reincidentesDoBlocoAnterior);
    reincidentesAnteriores.push(reincidentesDoBlocoAnterior);
    intervalosAtuais.push(
      formatarIntervalo(semanaMaisAntiga, semanaMaisRecente),
    );
    intervalosAnteriores.push(
      formatarIntervalo(
        semanaMaisAntiga + semanas,
        semanaMaisRecente + semanas,
      ),
    );
  }
  var atuais = selecionarIncidentes(0, semanas, severidade);
  var anterioresTodos = selecionarIncidentes(semanas, semanas, severidade);
  function contarReincidentes(lista) {
    return lista.filter(function (i) {
      return i.reincidente;
    }).length;
  }
  document.getElementById("descricaoIncidentes").textContent =
    (semanas === 4 ? "Por semana" : "Por bloco de 4 semanas") +
    ", separando primeira ocorrência de reincidente, comparando ao período anterior";
  document.getElementById("periodosComparados").textContent =
    formatarIntervalo(semanas - 1, 0) +
    " contra " +
    formatarIntervalo(2 * semanas - 1, semanas);
  document.getElementById("chipsIncidentes").innerHTML =
    "<span>Total de Incidentes: " +
    montarVariacao(atuais.length, anterioresTodos.length, "percentual").html +
    "</span>" +
    "<span>Reincidente: " +
    montarVariacao(
      contarReincidentes(atuais),
      contarReincidentes(anterioresTodos),
      "percentual",
    ).html +
    "</span>";

  desenharGrafico("graficoIncidentes", {
    type: "bar",
    data: {
      labels: rotulos,
      datasets: [
        {
          label: "Primeira ocorrência",
          data: primeiras,
          backgroundColor: COR_AZUL_FORTE,
          stack: "atual",
          borderRadius: 3,
        },
        {
          label: "Reincidente",
          data: reincidentes,
          backgroundColor: "#062669",
          stack: "atual",
          borderRadius: 3,
        },
        {
          label: "Período anterior",
          data: anteriores,
          backgroundColor: "#858da6",
          stack: "anterior",
          borderRadius: 3,
        },
        {
          label: "Reincidente (período anterior)",
          data: reincidentesAnteriores,
          backgroundColor: "#50596f",
          stack: "anterior",
          borderRadius: 3,
        },
      ],
    },
    options: {
      interaction: { mode: "index", intersect: false },
      plugins: {
        legend: { labels: { boxWidth: 10, boxHeight: 10 } },
        tooltip: {
          callbacks: {
            title: function (itens) {
              var posicao = itens[0].dataIndex;
              return [
                "Atual: " + intervalosAtuais[posicao],
                "Anterior: " + intervalosAnteriores[posicao],
              ];
            },
          },
        },
      },
      scales: {
        x: { stacked: true, grid: { display: false } },
        y: { stacked: true, beginAtZero: true, ticks: { precision: 0 } },
      },
    },
  });
}

function desenharGraficoDeTurnos(semanas, severidade) {
  var nomeDoCalculo = "médio";
  if (abaAtiva === "turnos") {
    document.getElementById("tituloTurnos").textContent =
      "Tempo " + nomeDoCalculo + " por turno de abertura";
    document.getElementById("descricaoTurnos").textContent =
      "Quando a resposta é mais lenta ou mais rápida";
  }
  var atuais = selecionarIncidentes(0, semanas, severidade);
  var anteriores = selecionarIncidentes(semanas, semanas, severidade);
  function calcularDoTurno(lista, turno) {
    var doTurno = duracoesDe(
      lista.filter(function (i) {
        return Math.floor(i.inicio.getHours() / 6) === turno;
      }),
    );
    return media(doTurno);
  }
  var valoresAtuais = TURNOS.map(function (t, posicao) {
    return calcularDoTurno(atuais, posicao);
  });
  var valoresAnteriores = TURNOS.map(function (t, posicao) {
    return calcularDoTurno(anteriores, posicao);
  });
  document.getElementById("resumoTurnos").innerHTML = TURNOS.map(
    function (turno, posicao) {
      var quantidade = atuais.filter(function (i) {
        return Math.floor(i.inicio.getHours() / 6) === posicao;
      }).length;
      return (
        "<div><b>" +
        turno.nome +
        "</b>" +
        turno.faixa +
        "<br>" +
        quantidade +
        " incidentes<br>" +
        montarVariacao(
          valoresAtuais[posicao],
          valoresAnteriores[posicao],
          "percentual",
        ).html +
        "</div>"
      );
    },
  ).join("");
  desenharGrafico("graficoTurnos", {
    type: "bar",
    plugins: [pluginAlinharResumoTurnos],
    data: {
      labels: TURNOS.map(function (t) {
        return t.nome;
      }),
      datasets: [
        {
          label: "Período atual",
          data: valoresAtuais,
          backgroundColor: COR_AZUL_FORTE,
          borderRadius: 3,
        },
        {
          label: "Período anterior",
          data: valoresAnteriores,
          backgroundColor: COR_PERIODO_ANTERIOR,
          borderRadius: 3,
        },
      ],
    },
    options: {
      plugins: {
        legend: { labels: { boxWidth: 10, boxHeight: 10 } },
        tooltip: {
          callbacks: {
            label: function (item) {
              return (
                item.dataset.label +
                " (" +
                nomeDoCalculo +
                "): " +
                formatarDuracao(item.raw)
              );
            },
          },
        },
      },
      scales: {
        x: { grid: { display: false } },
        y: {
          beginAtZero: true,
          ticks: { stepSize: 60, callback: formatarEixoEmHoras },
        },
      },
    },
  });
}

// ===== KPIs e tela =====
function calcularIndicadores(lista) {
  var criticos = lista.filter(function (i) {
    return i.severidade === "critico";
  });
  return {
    total: lista.length,
    criticos: criticos.length,
    atencao: lista.length - criticos.length,
    mediana: mediana(duracoesDe(lista)),
    p90: percentil(duracoesDe(lista), 0.9),
    minutosCriticos: duracoesDe(criticos).reduce(function (soma, valor) {
      return soma + valor;
    }, 0),
    reincidentes: lista.filter(function (i) {
      return i.reincidente;
    }).length,
  };
}
function desenharMapaDeCalor(semanas, severidade) {
  var dias = [
    { nome: "Segunda-feira", dia: 1 },
    { nome: "Terça-feira", dia: 2 },
    { nome: "Quarta-feira", dia: 3 },
    { nome: "Quinta-feira", dia: 4 },
    { nome: "Sexta-feira", dia: 5 },
    { nome: "Sábado", dia: 6 },
    { nome: "Domingo", dia: 0 },
  ];
  var atuais = selecionarIncidentes(0, semanas, severidade);
  var contagens = dias.map(function (dia) {
    return TURNOS.map(function (turno, indiceTurno) {
      return atuais.filter(function (incidente) {
        return (
          incidente.inicio.getDay() === dia.dia &&
          Math.floor(incidente.inicio.getHours() / 6) === indiceTurno
        );
      }).length;
    });
  });
  var maiorValor = contagens.reduce(function (maior, linha) {
    return Math.max(maior, Math.max.apply(null, linha));
  }, 0);
  var html =
    '<div class="linhaMapa cabecalhoMapa" role="row">' +
    '<span role="columnheader">Dia</span>' +
    TURNOS.map(function (turno) {
      return (
        '<span role="columnheader"><b>' +
        turno.nome +
        "</b><small>" +
        turno.faixa +
        "</small></span>"
      );
    }).join("") +
    "</div>";

  dias.forEach(function (dia, indiceDia) {
    html +=
      '<div class="linhaMapa" role="row">' +
      '<span class="rotuloLinhaMapa" role="rowheader">' +
      dia.nome +
      "</span>";
    contagens[indiceDia].forEach(function (quantidade, indiceTurno) {
      var intensidade = maiorValor ? quantidade / maiorValor : 0;
      var classe = quantidade === 0 ? "celulaMapa zero" : "celulaMapa";
      html +=
        '<span class="' +
        classe +
        '" role="gridcell" style="--intensidade: ' +
        intensidade +
        '" aria-label="' +
        dia.nome +
        ", " +
        TURNOS[indiceTurno].nome +
        ": " +
        quantidade +
        (quantidade === 1 ? " incidente" : " incidentes") +
        '" title="' +
        dia.nome +
        ", " +
        TURNOS[indiceTurno].nome +
        ": " +
        quantidade +
        (quantidade === 1 ? " incidente" : " incidentes") +
        '">' +
        quantidade +
        "</span>";
    });
    html += "</div>";
  });
  document.getElementById("mapaCalor").innerHTML = html;
}
function ativarAba(aba) {
  abaAtiva = aba;
  var estaEmTurnos = aba === "turnos";
  var abaTurnos = document.getElementById("abaTurnos");
  var abaMapaCalor = document.getElementById("abaMapaCalor");
  var painelTurnos = document.getElementById("painelTurnos");
  var painelMapaCalor = document.getElementById("painelMapaCalor");

  abaTurnos.classList.toggle("ativa", estaEmTurnos);
  abaTurnos.setAttribute("aria-selected", estaEmTurnos);
  abaTurnos.tabIndex = estaEmTurnos ? 0 : -1;
  abaMapaCalor.classList.toggle("ativa", !estaEmTurnos);
  abaMapaCalor.setAttribute("aria-selected", !estaEmTurnos);
  abaMapaCalor.tabIndex = estaEmTurnos ? -1 : 0;
  painelTurnos.hidden = !estaEmTurnos;
  painelMapaCalor.hidden = estaEmTurnos;

  var titulo = document.getElementById("tituloTurnos");
  var descricao = document.getElementById("descricaoTurnos");
  if (estaEmTurnos) {
    titulo.textContent = "Tempo médio por turno de abertura";
    descricao.textContent = "Quando a resposta é mais lenta ou mais rápida";
    if (graficos.graficoTurnos) {
      graficos.graficoTurnos.resize();
      graficos.graficoTurnos.update("none");
    }
  } else {
    titulo.textContent = "Quando os incidentes abrem";
    descricao.textContent =
      "Quantidade de incidentes por dia da semana e turno de abertura";
  }
}
document.getElementById("abaTurnos").addEventListener("click", function () {
  ativarAba("turnos");
});
document.getElementById("abaMapaCalor").addEventListener("click", function () {
  ativarAba("mapaCalor");
});
document
  .querySelector('[role="tablist"]')
  .addEventListener("keydown", function (evento) {
    if (
      evento.key !== "ArrowLeft" &&
      evento.key !== "ArrowRight" &&
      evento.key !== "Home" &&
      evento.key !== "End"
    ) {
      return;
    }
    evento.preventDefault();
    var proximaAba =
      evento.key === "Home"
        ? document.getElementById("abaTurnos")
        : evento.key === "End"
          ? document.getElementById("abaMapaCalor")
          : document.activeElement.id === "abaTurnos"
            ? document.getElementById("abaMapaCalor")
            : document.getElementById("abaTurnos");
    proximaAba.focus();
    ativarAba(
      proximaAba === document.getElementById("abaTurnos")
        ? "turnos"
        : "mapaCalor",
    );
  });

function renderizarKpis(semanas, severidade) {
  var atual = calcularIndicadores(selecionarIncidentes(0, semanas, severidade));
  var anterior = calcularIndicadores(
    selecionarIncidentes(semanas, semanas, severidade),
  );
  var taxaAtual = atual.total ? (atual.reincidentes / atual.total) * 100 : null;
  var taxaAnterior = anterior.total
    ? (anterior.reincidentes / anterior.total) * 100
    : null;
  var cartoes = [
    {
      rotulo: "Incidentes no período",
      valor: atual.total,
      variacao: montarVariacao(atual.total, anterior.total, "percentual"),
      detalhe: atual.criticos + " críticos e " + atual.atencao + " de atenção",
    },
    {
      rotulo: "Tempo mediano para encerrar",
      valor: formatarDuracao(atual.mediana),
      variacao: montarVariacao(atual.mediana, anterior.mediana, "minutos"),
      detalhe:
        "9 em 10 incidentes encerram em até " +
        formatarDuracao(
          atual.p90 === null ? null : Math.round(atual.p90 / 10) * 10,
        ),
    },
    {
      rotulo: "Horas em estado crítico",
      valor: Math.round(atual.minutosCriticos / 60) + "h",
      variacao: montarVariacao(
        atual.minutosCriticos,
        anterior.minutosCriticos,
        "percentual",
      ),
      detalhe: "Soma da duração dos incidentes críticos",
    },
    {
      rotulo: "Incidentes reincidentes",
      valor: taxaAtual === null ? "—" : Math.round(taxaAtual) + "%",
      variacao: montarVariacao(taxaAtual, taxaAnterior, "percentual"),
      detalhe:
        atual.reincidentes + " de " + atual.total + " voltaram em até 14 dias",
    },
  ];
  document.getElementById("gradeKpis").innerHTML = cartoes
    .map(function (cartao) {
      return (
        '<div class="cartaoKpi ' +
        cartao.variacao.classe +
        '"><div class="kpiRotulo">' +
        cartao.rotulo +
        '</div><div class="kpiValor">' +
        cartao.valor +
        "</div>" +
        cartao.variacao.html +
        '<div class="kpiDetalhe">' +
        cartao.detalhe +
        "</div></div>"
      );
    })
    .join("");
}
function renderizarTudo() {
  var filtros = lerFiltros();
  var inicioDaJanela = dataInicioDaSemana(filtros.semanas - 1);
  document.getElementById("subtituloPagina").textContent =
    "Congonhas · " +
    dois(inicioDaJanela.getDate()) +
    "/" +
    dois(inicioDaJanela.getMonth() + 1) +
    " a 31/10/2026 · comparado ao período anterior de mesma duração · dados de exemplo";
  renderizarKpis(filtros.semanas, filtros.severidade);
  desenharCartaDeControle(filtros.semanas, filtros.severidade);
  desenharGraficoDeIncidentes(filtros.semanas, filtros.severidade);
  desenharGraficoDeTurnos(filtros.semanas, filtros.severidade);
  desenharMapaDeCalor(filtros.semanas, filtros.severidade);
}
document
  .getElementById("filtroPeriodo")
  .addEventListener("change", renderizarTudo);
document
  .getElementById("filtroSeveridade")
  .addEventListener("change", renderizarTudo);
// ===== Modal de exportação =====
var modalExportar = document.getElementById("modalExportar");
var campoDataInicial = document.getElementById("dataInicial");
var campoDataFinal = document.getElementById("dataFinal");
function formatarParaCampo(data) {
  return (
    data.getFullYear() +
    "-" +
    dois(data.getMonth() + 1) +
    "-" +
    dois(data.getDate())
  );
}
function lerCampo(campo, fimDoDia) {
  if (!campo.value) return null;
  var partes = campo.value.split("-");
  return fimDoDia
    ? new Date(+partes[0], +partes[1] - 1, +partes[2], 23, 59, 59)
    : new Date(+partes[0], +partes[1] - 1, +partes[2]);
}
function atualizarAvisoDoModal() {
  var inicio = lerCampo(campoDataInicial, false),
    fim = lerCampo(campoDataFinal, true);
  var aviso = document.getElementById("avisoModal"),
    botaoBaixar = document.getElementById("botaoBaixar");
  botaoBaixar.disabled = true;
  document.querySelectorAll("#atalhosMes button").forEach(function (botaoMes) {
    botaoMes.classList.toggle(
      "ativo",
      botaoMes.dataset.inicio === campoDataInicial.value &&
        botaoMes.dataset.fim === campoDataFinal.value,
    );
  });
  if (!inicio || !fim) {
    aviso.textContent = "Escolha as duas datas.";
    return;
  }
  if (fim < inicio) {
    aviso.textContent =
      "A data final precisa ser igual ou posterior à inicial.";
    return;
  }
  var quantidade = incidentes.filter(function (i) {
    return i.inicio >= inicio && i.inicio <= fim;
  }).length;
  aviso.textContent = quantidade + " incidentes registrados neste período.";
  botaoBaixar.disabled = false;
}
for (var deslocamentoMes = 0; deslocamentoMes < 6; deslocamentoMes++) {
  var primeiroDia = new Date(2026, 9 - deslocamentoMes, 1),
    ultimoDia = new Date(2026, 9 - deslocamentoMes + 1, 0);
  var botaoMes = document.createElement("button");
  botaoMes.type = "button";
  botaoMes.textContent =
    NOMES_DOS_MESES[primeiroDia.getMonth()] +
    "/" +
    String(primeiroDia.getFullYear()).slice(2);
  botaoMes.dataset.inicio = formatarParaCampo(primeiroDia);
  botaoMes.dataset.fim = formatarParaCampo(ultimoDia);
  botaoMes.addEventListener("click", function () {
    campoDataInicial.value = this.dataset.inicio;
    campoDataFinal.value = this.dataset.fim;
    atualizarAvisoDoModal();
  });
  document.getElementById("atalhosMes").appendChild(botaoMes);
}
campoDataInicial.addEventListener("change", atualizarAvisoDoModal);
campoDataFinal.addEventListener("change", atualizarAvisoDoModal);
function fecharModal() {
  modalExportar.hidden = true;
}
document.getElementById("botaoExportar").addEventListener("click", function () {
  document.getElementById("atalhosMes").firstChild.click(); // começa no mês mais recente
  modalExportar.hidden = false;
});
document.getElementById("botaoCancelar").addEventListener("click", fecharModal);
modalExportar.addEventListener("click", function (evento) {
  if (evento.target === modalExportar) fecharModal();
});
document.addEventListener("keydown", function (evento) {
  if (evento.key === "Escape") fecharModal();
});
document.getElementById("botaoBaixar").addEventListener("click", function () {
  document.getElementById("avisoModal").textContent =
    "Protótipo: aqui o Java gera o PDF com a análise do Gemini para o período escolhido.";
});

renderizarTudo();
