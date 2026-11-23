// ============================================================
// MONTECH — Análise Gerencial de Alertas
// Os dados abaixo são fictícios. Substitua a criação de dados
// pela resposta da API/nuvem quando integrar ao projeto real.
// ============================================================

const SERVIDORES = ["SPA", "SDV", "AIS"];
const COMPONENTES = ["CPU", "RAM", "Armazenamento"];
const TIPOS_ALERTA = ["Acompanhamento", "Crítico"];

const CORES_SERVIDORES = {
  SPA: "#c3a0ff",
  SDV: "#72d5f5",
  AIS: "#55d7b1"
};

const CORES_COMPONENTES = {
  "CPU": "#86c5ff",
  "RAM": "#72d5f5",
  "Armazenamento": "#c3a0ff"
};

let periodoSelecionado = 182;
let servidorSelecionado = "Todos";

let graficoComponentes = null;
let graficoHistorico = null;

// ------------------------------------------------------------
// 1. DADOS DE DEMONSTRAÇÃO
// Cada item representa uma ocorrência de alerta.
// Estrutura: data, servidor, componente e tipo.
// ------------------------------------------------------------

function gerarDadosDemonstrativos() {
  const alertas = [];
  const hoje = new Date();
  hoje.setHours(12, 0, 0, 0);

  // Gera um conjunto de dados para os últimos 364 dias.
  for (let dia = 363; dia >= 0; dia--) {
    const data = new Date(hoje);
    data.setDate(hoje.getDate() - dia);

    SERVIDORES.forEach((servidor, indiceServidor) => {
      COMPONENTES.forEach((componente, indiceComponente) => {
        // A fórmula cria quantidades variadas, mas repetíveis.
        const base = (dia * 7 + indiceServidor * 13 + indiceComponente * 19) % 11;
        let quantidade = base < 3 ? 0 : base < 7 ? 1 : base < 10 ? 2 : 3;

        // Pequenas diferenças entre os servidores.
        if (servidor === "SPA" && componente === "RAM") quantidade += 1;
        if (servidor === "SDV" && componente === "Armazenamento") quantidade += 1;
        if (servidor === "AIS" && componente === "CPU" && base % 3 === 0) quantidade += 1;

        for (let i = 0; i < quantidade; i++) {
          const ehCritico = (base + i + indiceComponente) % 4 === 0;

          alertas.push({
            data: new Date(data),
            servidor: servidor,
            componente: componente,
            tipo: ehCritico ? "Crítico" : "Acompanhamento"
          });
        }
      });
    });
  }

  return alertas;
}

const alertas = gerarDadosDemonstrativos();

// ------------------------------------------------------------
// 2. FUNÇÕES DE FILTRO E AGRUPAMENTO
// ------------------------------------------------------------

function obterAlertasDoPeriodo(dias, deslocamento = 0) {
  const fim = new Date();
  fim.setHours(23, 59, 59, 999);
  fim.setDate(fim.getDate() - (deslocamento * dias));

  const inicio = new Date(fim);
  inicio.setDate(inicio.getDate() - dias + 1);
  inicio.setHours(0, 0, 0, 0);

  return alertas.filter((alerta) => {
    const dataValida = alerta.data >= inicio && alerta.data <= fim;
    const servidorValido =
      servidorSelecionado === "Todos" ||
      alerta.servidor === servidorSelecionado;

    return dataValida && servidorValido;
  });
}

function contarPor(lista, propriedade) {
  const resultado = {};

  lista.forEach((item) => {
    const chave = item[propriedade];
    resultado[chave] = (resultado[chave] || 0) + 1;
  });

  return resultado;
}

function contarTipos(lista) {
  return {
    acompanhamento: lista.filter((item) => item.tipo === "Acompanhamento").length,
    critico: lista.filter((item) => item.tipo === "Crítico").length
  };
}

function obterDiasComAlertas(lista) {
  const dias = new Set();

  lista.forEach((alerta) => {
    dias.add(alerta.data.toISOString().slice(0, 10));
  });

  return dias.size;
}

function obterNomeCurtoComponente(componente) {
  if (componente === "Armazenamento") return "Disco";
  return componente;
}

function obterTextoPeriodo(dias) {
  if (dias === 7) return "Últimos 7 dias";
  if (dias === 30) return "Últimos 30 dias";
  if (dias === 90) return "Últimos 90 dias";
  return "Últimos 6 meses";
}

// ------------------------------------------------------------
// 3. ATUALIZAÇÃO DO CABEÇALHO E DOS INDICADORES (KPIs)
// ------------------------------------------------------------

function atualizarDescricao() {
  const descricaoServidor = servidorSelecionado === "Todos"
    ? "Todos os servidores"
    : `Servidor ${servidorSelecionado}`;

  document.getElementById("periodDescription").textContent =
    obterTextoPeriodo(periodoSelecionado);

  document.getElementById("overviewDescription").textContent =
    `Total de alertas no período selecionado • ${periodoSelecionado} dias • ${descricaoServidor}`;

  document.getElementById("componentDescription").textContent =
    `Volume histórico de alertas • ${obterTextoPeriodo(periodoSelecionado)} • ${descricaoServidor}`;

  document.getElementById("historyTag").textContent =
    `${obterTextoPeriodo(periodoSelecionado)} • ${descricaoServidor}`;
}

function atualizarKpis(alertasAtuais, alertasAnteriores) {
  const totalAtual = alertasAtuais.length;
  const totalAnterior = alertasAnteriores.length;

  // KPI 1: comparação com o período anterior de mesma duração.
  let variacao = 0;

  if (totalAnterior > 0) {
    variacao = ((totalAtual - totalAnterior) / totalAnterior) * 100;
  } else if (totalAtual > 0) {
    variacao = 100;
  }

  const valorVariacao = document.getElementById("comparisonValue");
  valorVariacao.textContent = `${variacao > 0 ? "+" : ""}${Math.round(variacao)}%`;
  valorVariacao.className = `kpi-value ${variacao > 0 ? "negative" : "positive"}`;

  document.getElementById("comparisonUnit").textContent =
    variacao > 0 ? "de aumento" : variacao < 0 ? "de redução" : "sem variação";

  document.getElementById("comparisonTitle").textContent =
    `Relação dos alertas ao período anterior`;

  document.getElementById("currentTotal").textContent = totalAtual;
  document.getElementById("previousTotal").textContent = totalAnterior;

  // KPI 2: quantidade de dias que tiveram pelo menos um alerta.
  const diasComAlertas = obterDiasComAlertas(alertasAtuais);
  document.getElementById("daysWithAlerts").textContent =
    `${diasComAlertas}/${periodoSelecionado}`;

  const percentualDias = periodoSelecionado > 0
    ? Math.round((diasComAlertas / periodoSelecionado) * 100)
    : 0;

  document.getElementById("daysPercentage").textContent = `${percentualDias}%`;
  document.getElementById("daysInPeriod").textContent = `${periodoSelecionado} dias`;

  // KPI 3 e KPI 4 mudam de significado conforme o filtro de servidor.
  if (servidorSelecionado === "Todos") {
    atualizarKpiTodosServidores(alertasAtuais);
  } else {
    atualizarKpiServidorIndividual(alertasAtuais);
  }
}

function atualizarKpiTodosServidores(lista) {
  const porServidor = contarPor(lista, "servidor");
  const servidorLider = SERVIDORES
    .map((servidor) => ({ nome: servidor, total: porServidor[servidor] || 0 }))
    .sort((a, b) => b.total - a.total)[0];

  const alertasServidor = lista.filter((item) => item.servidor === servidorLider.nome);
  const tiposServidor = contarTipos(alertasServidor);

  document.getElementById("leaderTitle").textContent = "Servidor com mais alertas";
  document.getElementById("leaderValue").textContent = servidorLider.nome;
  document.getElementById("leaderCritical").textContent = tiposServidor.critico;
  document.getElementById("leaderWarning").textContent = tiposServidor.acompanhamento;
  document.getElementById("leaderTotal").textContent = servidorLider.total;

  const porComponente = contarPor(lista, "componente");
  const componenteLider = COMPONENTES
    .map((componente) => ({ nome: componente, total: porComponente[componente] || 0 }))
    .sort((a, b) => b.total - a.total)[0];

  const alertasComponente = lista.filter(
    (item) => item.componente === componenteLider.nome
  );

  const tiposComponente = contarTipos(alertasComponente);
  const servidorMaisAssociado = contarPor(alertasComponente, "servidor");
  const servidorDoComponente = Object.keys(servidorMaisAssociado)
    .sort((a, b) => servidorMaisAssociado[b] - servidorMaisAssociado[a])[0] || "—";

  document.getElementById("mainComponentTitle").textContent =
    "Principal componente gerador de alertas";
  document.getElementById("mainComponentValue").textContent = componenteLider.total;
  document.getElementById("mainComponentName").textContent =
    obterNomeCurtoComponente(componenteLider.nome);
  document.getElementById("mainComponentServer").textContent = servidorDoComponente;
  document.getElementById("mainComponentCritical").textContent = tiposComponente.critico;
  document.getElementById("mainComponentWarning").textContent = tiposComponente.acompanhamento;
}

function atualizarKpiServidorIndividual(lista) {
  const porComponente = contarPor(lista, "componente");
  const componenteLider = COMPONENTES
    .map((componente) => ({ nome: componente, total: porComponente[componente] || 0 }))
    .sort((a, b) => b.total - a.total)[0];

  const alertasComponente = lista.filter(
    (item) => item.componente === componenteLider.nome
  );
  const tiposComponente = contarTipos(alertasComponente);

  document.getElementById("leaderTitle").textContent = "Componente com mais alertas";
  document.getElementById("leaderValue").textContent =
    obterNomeCurtoComponente(componenteLider.nome);
  document.getElementById("leaderCritical").textContent = tiposComponente.critico;
  document.getElementById("leaderWarning").textContent = tiposComponente.acompanhamento;
  document.getElementById("leaderTotal").textContent = componenteLider.total;

  const tipos = contarTipos(lista);
  const tipoMaisFrequente = tipos.critico > tipos.acompanhamento
    ? "Crítico"
    : "Acompanhamento";

  document.getElementById("mainComponentTitle").textContent =
    "Tipo de alerta predominante";
  document.getElementById("mainComponentValue").textContent =
    tipoMaisFrequente === "Crítico" ? tipos.critico : tipos.acompanhamento;
  document.getElementById("mainComponentName").textContent = tipoMaisFrequente;
  document.getElementById("mainComponentServer").textContent = servidorSelecionado;
  document.getElementById("mainComponentCritical").textContent = tipos.critico;
  document.getElementById("mainComponentWarning").textContent = tipos.acompanhamento;
}

// ------------------------------------------------------------
// 4. RANKING DOS TRÊS COMPONENTES COM MAIS ALERTAS
// ------------------------------------------------------------

function atualizarRanking(lista) {
  const agrupados = {};

  lista.forEach((alerta) => {
    const chave = servidorSelecionado === "Todos"
      ? `${alerta.componente}|${alerta.servidor}`
      : alerta.componente;

    if (!agrupados[chave]) {
      agrupados[chave] = {
        componente: alerta.componente,
        servidor: servidorSelecionado === "Todos" ? alerta.servidor : "",
        total: 0
      };
    }

    agrupados[chave].total++;
  });

  const ranking = Object.values(agrupados)
    .sort((a, b) => b.total - a.total)
    .slice(0, 3);

  const container = document.getElementById("rankingList");
  container.innerHTML = "";

  ranking.forEach((item, indice) => {
    const cartao = document.createElement("article");
    cartao.className = "ranking-item";

    const detalhe = servidorSelecionado === "Todos"
      ? `${item.servidor} · Alertas registrados`
      : "Alertas registrados no servidor";

    cartao.innerHTML = `
      <span class="ranking-position">0${indice + 1}</span>
      <div class="ranking-name">
        <strong>${obterNomeCurtoComponente(item.componente)}</strong>
        <span>${detalhe}</span>
      </div>
      <div class="ranking-count">
        <strong>${item.total}</strong>
        <span>ocorrências</span>
      </div>
    `;

    container.appendChild(cartao);
  });

  if (ranking.length === 0) {
    container.innerHTML = '<p class="empty-message">Nenhum alerta encontrado para os filtros selecionados.</p>';
  }

  document.getElementById("rankingContext").textContent =
    servidorSelecionado === "Todos"
      ? "Componente e servidor"
      : `Componentes do ${servidorSelecionado}`;
}

// ------------------------------------------------------------
// 5. GRÁFICO DE ALERTAS POR COMPONENTE (BARRAS EMPILHADAS)
// ------------------------------------------------------------

function atualizarGraficoComponentes(lista) {
  const acompanhamento = [];
  const criticos = [];

  COMPONENTES.forEach((componente) => {
    const alertasComponente = lista.filter(
      (item) => item.componente === componente
    );

    acompanhamento.push(
      alertasComponente.filter((item) => item.tipo === "Acompanhamento").length
    );

    criticos.push(
      alertasComponente.filter((item) => item.tipo === "Crítico").length
    );
  });

  const totalAcompanhamento = acompanhamento.reduce((soma, valor) => soma + valor, 0);
  const totalCriticos = criticos.reduce((soma, valor) => soma + valor, 0);

  document.getElementById("componentTotal").textContent = lista.length;
  document.getElementById("warningLegend").textContent = totalAcompanhamento;
  document.getElementById("criticalLegend").textContent = totalCriticos;

  const contexto = document.getElementById("componentChart").getContext("2d");

  if (graficoComponentes) {
    graficoComponentes.destroy();
  }

  graficoComponentes = new Chart(contexto, {
    type: "bar",
    data: {
      labels: ["CPU", "RAM", "Armazenamento"],
      datasets: [
        {
          label: "Acompanhamento",
          data: acompanhamento,
          backgroundColor: "#f0c766",
          borderRadius: 3,
          borderSkipped: false,
          barThickness: 19
        },
        {
          label: "Crítico",
          data: criticos,
          backgroundColor: "#ff7180",
          borderRadius: 3,
          borderSkipped: false,
          barThickness: 19
        }
      ]
    },
    options: {
      indexAxis: "y",
      maintainAspectRatio: false,
      responsive: true,
      interaction: {
        mode: "index",
        intersect: false
      },
      plugins: {
        legend: { display: false },
        tooltip: {
          backgroundColor: "#071222",
          borderColor: "#334b68",
          borderWidth: 1,
          titleColor: "#edf3ff",
          bodyColor: "#c2d0e2",
          padding: 10
        }
      },
      scales: {
        x: {
          stacked: true,
          beginAtZero: true,
          grid: { color: "rgba(125, 151, 181, 0.12)" },
          ticks: {
            color: "#7188a8",
            font: { size: 10 },
            precision: 0
          },
          border: { display: false }
        },
        y: {
          stacked: true,
          grid: { display: false },
          ticks: {
            color: "#d2deed",
            font: { size: 11 }
          },
          border: { display: false }
        }
      }
    }
  });
}

// ------------------------------------------------------------
// 6. GRÁFICO DE EVOLUÇÃO HISTÓRICA
// Todos: uma linha por servidor.
// Servidor individual: uma linha por tipo de alerta/componente.
// ------------------------------------------------------------

function criarIntervalos(lista, dias) {
  const hoje = new Date();
  hoje.setHours(23, 59, 59, 999);

  const inicio = new Date(hoje);
  inicio.setDate(inicio.getDate() - dias + 1);
  inicio.setHours(0, 0, 0, 0);

  let quantidadeIntervalos;

  if (dias <= 7) quantidadeIntervalos = 7;
  else if (dias <= 30) quantidadeIntervalos = 6;
  else if (dias <= 90) quantidadeIntervalos = 3;
  else quantidadeIntervalos = 6;

  const tamanhoIntervalo = dias / quantidadeIntervalos;
  const intervalos = [];

  for (let i = 0; i < quantidadeIntervalos; i++) {
    const dataInicio = new Date(inicio);
    dataInicio.setDate(inicio.getDate() + Math.floor(i * tamanhoIntervalo));

    const dataFim = new Date(inicio);
    dataFim.setDate(inicio.getDate() + Math.floor((i + 1) * tamanhoIntervalo) - 1);

    intervalos.push({
      inicio: dataInicio,
      fim: dataFim,
      rotulo: formatarRotuloIntervalo(dataInicio, dias)
    });
  }

  return intervalos;
}

function formatarRotuloIntervalo(data, dias) {
  if (dias > 90) {
    return data.toLocaleDateString("pt-BR", { month: "short" }).replace(".", "");
  }

  if (dias > 7) {
    return data.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" });
  }

  return data.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" });
}

function contarAlertasNoIntervalo(lista, inicio, fim) {
  return lista.filter((alerta) =>
    alerta.data >= inicio && alerta.data <= fim
  ).length;
}

function atualizarLegendaHistorico() {
  const legenda = document.getElementById("historyLegend");

  if (servidorSelecionado === "Todos") {
legenda.innerHTML = `
      <span><i class="legend-line spa"></i> SPA</span>
      <span><i class="legend-line sdv"></i> SDV</span>
      <span><i class="legend-line ais"></i> AIS</span>
    `;

    document.getElementById("historyDescription").textContent =
      "Comparação mensal da quantidade de alertas gerados por servidor.";
  } else {
    legenda.innerHTML = `
      <span><i class="legend-line spa"></i> CPU</span>
      <span><i class="legend-line sdv"></i> RAM</span>
      <span><i class="legend-line ais"></i> Disco</span>
    `;

    document.getElementById("historyDescription").textContent =
      `Evolução dos alertas por componente do servidor ${servidorSelecionado}.`;
  }
}

function atualizarGraficoHistorico(lista) {
  const intervalos = criarIntervalos(lista, periodoSelecionado);
  const labels = intervalos.map((intervalo) => intervalo.rotulo);
  const datasets = [];

  if (servidorSelecionado === "Todos") {
    SERVIDORES.forEach((servidor) => {
      const dados = intervalos.map((intervalo) => {
        const alertasServidor = lista.filter(
          (alerta) => alerta.servidor === servidor
        );

        return contarAlertasNoIntervalo(
          alertasServidor,
          intervalo.inicio,
          intervalo.fim
        );
      });

      datasets.push({
        label: servidor,
        data: dados,
        borderColor: CORES_SERVIDORES[servidor],
        backgroundColor: CORES_SERVIDORES[servidor],
        tension: 0.25,
        borderWidth: 2,
        pointRadius: 2,
        pointHoverRadius: 5
      });
    });
  } else {
    const cores = ["#c3a0ff", "#72d5f5", "#55d7b1", "#f0c766"];

    COMPONENTES.forEach((componente, indice) => {
      const dados = intervalos.map((intervalo) => {
        const alertasComponente = lista.filter(
          (alerta) => alerta.componente === componente
        );

        return contarAlertasNoIntervalo(
          alertasComponente,
          intervalo.inicio,
          intervalo.fim
        );
      });

      datasets.push({
        label: obterNomeCurtoComponente(componente),
        data: dados,
        borderColor: cores[indice],
        backgroundColor: cores[indice],
        tension: 0.25,
        borderWidth: 2,
        pointRadius: 2,
        pointHoverRadius: 5
      });
    });
  }

  atualizarLegendaHistorico();

  const contexto = document.getElementById("historyChart").getContext("2d");

  if (graficoHistorico) {
    graficoHistorico.destroy();
  }

  graficoHistorico = new Chart(contexto, {
    type: "line",
    data: {
      labels: labels,
      datasets: datasets
    },
    options: {
      maintainAspectRatio: false,
      responsive: true,
      interaction: {
        mode: "index",
        intersect: false
      },
      plugins: {
        legend: { display: false },
        tooltip: {
          backgroundColor: "#071222",
          borderColor: "#334b68",
          borderWidth: 1,
          titleColor: "#edf3ff",
          bodyColor: "#c2d0e2",
          padding: 10
        }
      },
      scales: {
        x: {
          grid: { display: false },
          ticks: {
            color: "#7188a8",
            font: { size: 10 }
          },
          border: { color: "rgba(125, 151, 181, 0.2)" }
        },
        y: {
          beginAtZero: true,
          grid: { color: "rgba(125, 151, 181, 0.15)" },
          ticks: {
            color: "#7188a8",
            font: { size: 10 },
            precision: 0
          },
          border: { display: false }
        }
      }
    }
  });
}

// ------------------------------------------------------------
// 7. FUNÇÃO PRINCIPAL: ATUALIZA TODA A DASHBOARD
// ------------------------------------------------------------

function atualizarDashboard() {
  const alertasAtuais = obterAlertasDoPeriodo(periodoSelecionado, 0);
  const alertasAnteriores = obterAlertasDoPeriodo(periodoSelecionado, 1);

  atualizarDescricao();
  atualizarKpis(alertasAtuais, alertasAnteriores);
  atualizarRanking(alertasAtuais);
  atualizarGraficoComponentes(alertasAtuais);
  atualizarGraficoHistorico(alertasAtuais);
}

// ------------------------------------------------------------
// 8. EVENTOS DOS FILTROS
// ------------------------------------------------------------

function configurarFiltros() {
  const botoesPeriodo = document.querySelectorAll("#periodFilters .segment");
  const botoesServidor = document.querySelectorAll("#serverFilters .segment");

  botoesPeriodo.forEach((botao) => {
    botao.addEventListener("click", () => {
      periodoSelecionado = Number(botao.dataset.days);

      botoesPeriodo.forEach((item) => item.classList.remove("active"));
      botao.classList.add("active");

      atualizarDashboard();
    });
  });

  botoesServidor.forEach((botao) => {
    botao.addEventListener("click", () => {
      servidorSelecionado = botao.dataset.server;

      botoesServidor.forEach((item) => item.classList.remove("active"));
      botao.classList.add("active");

      atualizarDashboard();
    });
  });
}

// ------------------------------------------------------------
// 9. INICIALIZAÇÃO
// ------------------------------------------------------------

function iniciarDashboard() {
  document.getElementById("lastUpdate").textContent =
    new Date().toLocaleString("pt-BR", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit"
    });

  configurarFiltros();
  atualizarDashboard();
}

document.addEventListener("DOMContentLoaded", iniciarDashboard);
