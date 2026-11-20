/* MonTech · Billing
 * Este script apenas EXIBE dados: todos os cálculos (acumulados, projeção, variações,
 * percentuais, médias, níveis de alerta) já vêm prontos no JSON.
 *
 * Estrutura esperada de cada mês em faturamento.meses["AAAA-MM"]:
 * {
 *   dias_no_mes: 30,
 *   dias_com_dados: 30,
 *   orcamento: 50000,
 *   total_execucao_por_dia: [ ... ],
 *   acumulado_por_dia: [ ... ],
 *   resumo: { total, variacao_pct, variacao_nivel, orcamento_consumido_pct, media_diaria },
 *   posicao_por_dia: {
 *     "1": {
 *       gasto, gasto_pct_orcamento, gasto_nivel,
 *       projetado, projetado_pct_orcamento, projetado_nivel,
 *       projecao_acumulada: [ ... ],            // começa no próprio dia
 *       variacao_projetada_pct, variacao_projetada_usd, variacao_projetada_nivel,
 *       media_diaria, media_diaria_mes_anterior,
 *       variacao_media_diaria_pct, variacao_media_diaria_nivel
 *     }
 *   }
 * }
 * Níveis aceitos: "good" | "warn" | "bad"
 */

/* ========== Utilitários ========== */
const obterPorId = (id) => document.getElementById(id);
const capitalizar = (texto) => texto.charAt(0).toUpperCase() + texto.slice(1);

/* ========== Formatadores (apenas exibição) ========== */
const formatarUsd = (valor) =>
  "US$ " + valor.toLocaleString("pt-BR", { maximumFractionDigits: 0 });
const formatarUsdComSinal = (valor) =>
  (valor >= 0 ? "+" : "−") + formatarUsd(Math.abs(valor));
const formatarUsdCentavos = (valor) =>
  "US$ " +
  valor.toLocaleString("pt-BR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
const formatarPorcentagem = (valor) =>
  (valor >= 0 ? "+" : "") + valor.toFixed(1).replace(".", ",") + "%";
const formatarPorcentagemSimples = (valor) =>
  valor.toFixed(1).replace(".", ",") + "%";

/* ========== Estado ========== */
const estado = {
  faturamento: null, // JSON carregado
  chavesMeses: [], // ["2025-11", ..., "2026-11"] em ordem
  mesesAtras: 0, // 0 = mês mais recente (fixo)
  dia: 1, // último dia com dados do mês (definido na inicialização)
  grafico: null, // instância do Chart.js
};

/* ========== Dados ========== */
const URL_FATURAMENTO = "billing-mock.json";
// produção: const URL_FATURAMENTO = "/billing/empresa-alpha/";

async function carregarFaturamento() {
  const resposta = await fetch(URL_FATURAMENTO, { cache: "no-store" });
  if (!resposta.ok) throw new Error(`HTTP ${resposta.status} ao buscar ${URL_FATURAMENTO}`);
  return resposta.json();
}

function mostrarErro(mensagem) {
  const aviso = obterPorId("error-banner");
  aviso.textContent = mensagem;
  aviso.hidden = false;
}

function obterMes(mesesAtras) {
  const chave = estado.chavesMeses[estado.chavesMeses.length - 1 - mesesAtras];
  if (!chave) return null;
  const [ano, mesNumero] = chave.split("-").map(Number);
  return {
    ...estado.faturamento.meses[chave],
    chave,
    ano,
    mes: mesNumero - 1,
    rotulo: new Date(ano, mesNumero - 1, 1).toLocaleDateString("pt-BR", {
      month: "long",
      year: "numeric",
    }),
  };
}

const obterPosicao = (mes, dia) => mes.posicao_por_dia[dia];

/* ========== KPIs ========== */
function definirChip(id, texto, nivel) {
  const elemento = obterPorId(id);
  elemento.textContent = texto;
  elemento.className = "chip " + nivel;
}

function renderizarKpiOrcamento({ idValor, idChip, valor, porcentagem, nivel }) {
  obterPorId(idValor).textContent = formatarUsd(valor);
  definirChip(idChip, formatarPorcentagemSimples(porcentagem) + " do orçamento", nivel);
}

function renderizarKpiVariacao(posicao) {
  obterPorId("kpi-variation-value").textContent = formatarPorcentagem(posicao.variacao_projetada_pct);
  definirChip(
    "kpi-variation-chip",
    formatarUsdComSinal(posicao.variacao_projetada_usd),
    posicao.variacao_projetada_nivel,
  );
}

function renderizarKpiDiario(posicao) {
  obterPorId("kpi-daily-value").textContent = formatarUsd(posicao.media_diaria) + " / dia";
  definirChip(
    "kpi-daily-chip",
    formatarPorcentagem(posicao.variacao_media_diaria_pct),
    posicao.variacao_media_diaria_nivel,
  );
  obterPorId("kpi-daily-note").textContent =
    "vs. " + formatarUsd(posicao.media_diaria_mes_anterior) + " / dia no mês anterior";
}

function renderizarKpis() {
  const mes = obterMes(estado.mesesAtras);
  const posicao = obterPosicao(mes, estado.dia);

  obterPorId("period-subtitle").textContent = `Posição em ${estado.dia} de ${mes.rotulo}`;
  renderizarKpiOrcamento({
    idValor: "kpi-spent-value",
    idChip: "kpi-spent-chip",
    valor: posicao.gasto,
    porcentagem: posicao.gasto_pct_orcamento,
    nivel: posicao.gasto_nivel,
  });
  renderizarKpiOrcamento({
    idValor: "kpi-projection-value",
    idChip: "kpi-projection-chip",
    valor: posicao.projetado,
    porcentagem: posicao.projetado_pct_orcamento,
    nivel: posicao.projetado_nivel,
  });
  renderizarKpiVariacao(posicao);
  renderizarKpiDiario(posicao);
}

/* ========== Gráfico (Chart.js) ========== */
// Alinha a série ao eixo X (apenas posicionamento, sem cálculo de valores)
const completarSerie = (lista, tamanho, deslocamento = 0) =>
  Array.from({ length: tamanho }, (_valor, indice) => lista[indice - deslocamento] ?? null);

function gradientePreenchimentoAtual(contexto) {
  const grafico = contexto.chart;
  const { chartArea: areaGrafico } = grafico;
  if (!areaGrafico) return "rgba(59,130,246,.15)";
  const gradiente = grafico.ctx.createLinearGradient(0, areaGrafico.top, 0, areaGrafico.bottom);
  gradiente.addColorStop(0, "rgba(59,130,246,.3)");
  gradiente.addColorStop(1, "rgba(59,130,246,0)");
  return gradiente;
}

function montarDadosGrafico() {
  const atual = obterMes(estado.mesesAtras);
  const anterior = obterMes(estado.mesesAtras + 1);
  const posicao = obterPosicao(atual, estado.dia);
  const quantidadeDias = Math.max(atual.dias_no_mes, anterior ? anterior.dias_no_mes : 0);
  const rotulos = Array.from({ length: quantidadeDias }, (_valor, indice) => indice + 1);
  const linha = { pointRadius: 0, pointHoverRadius: 4 };

  return {
    labels: rotulos,
    datasets: [
      {
        ...linha,
        label: "Mês anterior",
        data: completarSerie(anterior ? anterior.acumulado_por_dia : [], quantidadeDias),
        borderColor: "#64748b",
        borderWidth: 2,
        order: 3,
      },
      {
        ...linha,
        label: "Atual",
        data: completarSerie(atual.acumulado_por_dia.slice(0, estado.dia), quantidadeDias),
        borderColor: "#3b82f6",
        borderWidth: 2.5,
        fill: "origin",
        backgroundColor: gradientePreenchimentoAtual,
        order: 1,
      },
      {
        ...linha,
        label: "Projeção",
        data: completarSerie(posicao.projecao_acumulada, quantidadeDias, estado.dia - 1),
        borderColor: "#f59e0b",
        borderWidth: 2,
        borderDash: [6, 5],
        order: 2,
      },
      {
        ...linha,
        label: "Orçamento",
        data: rotulos.map(() => atual.orcamento),
        borderColor: "#ef4444",
        borderWidth: 1.5,
        borderDash: [2, 4],
        pointHoverRadius: 0,
        order: 4,
      },
    ],
  };
}

function montarOpcoesGrafico() {
  return {
    responsive: true,
    maintainAspectRatio: false,
    animation: { duration: 400 },
    interaction: { mode: "index", intersect: false },
    layout: { padding: { top: 4, right: 12 } },
    scales: {
      x: {
        grid: { display: false },
        border: { color: "#1e2a40" },
        ticks: { color: "#8693a9", maxTicksLimit: 10, font: { size: 15 }, padding: 6 },
      },
      y: {
        min: 0, // máximo é automático (Chart.js)
        grid: { color: "#1e2a40" },
        border: { display: false },
        ticks: {
          color: "#8693a9",
          maxTicksLimit: 6,
          font: { size: 15 },
          padding: 8,
          callback: (valor) => (valor / 1000).toFixed(0) + "k",
        },
      },
    },
    plugins: {
      legend: { display: false }, // legenda customizada no HTML
      tooltip: {
        backgroundColor: "#0b1424",
        borderColor: "#1e2a40",
        borderWidth: 1,
        titleColor: "#e6ebf4",
        bodyColor: "#e6ebf4",
        titleFont: { size: 16, weight: "600" },
        bodyFont: { size: 15 },
        padding: 12,
        boxPadding: 4,
        filter: (item) => item.raw != null && item.dataset.label !== "Orçamento",
        callbacks: {
          title: (itens) => "Dia " + itens[0].label,
          label: (item) => ` ${item.dataset.label}: ${formatarUsd(item.raw)}`,
        },
      },
    },
  };
}

function renderizarGrafico() {
  if (!estado.grafico) {
    estado.grafico = new Chart(obterPorId("main-chart"), {
      type: "line",
      data: montarDadosGrafico(),
      options: montarOpcoesGrafico(),
    });
    return;
  }
  estado.grafico.data = montarDadosGrafico();
  estado.grafico.update();
}

/* ========== Relatórios (PDF) ========== */
function montarDadosRelatorio(mesesAtras) {
  return {
    atual: obterMes(mesesAtras),
    anterior: obterMes(mesesAtras + 1),
  };
}

function desenharCabecalhoRelatorio(documento, rotulo) {
  documento.setFillColor(10, 15, 26);
  documento.rect(0, 0, 595, 84, "F");
  documento.setTextColor(255, 255, 255);
  documento.setFont("helvetica", "bold");
  documento.setFontSize(18);
  documento.text("MonTech · Relatório de Billing", 40, 40);
  documento.setFont("helvetica", "normal");
  documento.setFontSize(11);
  documento.setTextColor(147, 163, 190);
  documento.text(capitalizar(rotulo), 40, 62);
  documento.setTextColor(30, 41, 59);
}

function desenharResumoRelatorio(documento, { atual, anterior }, posicaoY) {
  const { resumo } = atual;
  const linhas = [
    ["Total gasto no mês", formatarUsdCentavos(resumo.total)],
    [
      anterior ? `Total do mês anterior (${anterior.rotulo})` : "Total do mês anterior",
      anterior ? formatarUsdCentavos(anterior.resumo.total) : "-",
    ],
    [
      "Variação vs. mês anterior",
      resumo.variacao_pct != null ? formatarPorcentagem(resumo.variacao_pct) : "-",
    ],
    ["Orçamento mensal", formatarUsdCentavos(atual.orcamento)],
    ["Orçamento consumido", formatarPorcentagemSimples(resumo.orcamento_consumido_pct)],
    ["Gasto médio diário", formatarUsdCentavos(resumo.media_diaria)],
  ];
  linhas.forEach(([rotulo, valor]) => {
    documento.setFont("helvetica", "normal");
    documento.setFontSize(11);
    documento.text(rotulo, 40, posicaoY);
    documento.setFont("helvetica", "bold");
    documento.text(valor, 555, posicaoY, { align: "right" });
    posicaoY += 20;
  });
  return posicaoY;
}

function desenharCabecalhoTabela(documento, posicaoY) {
  documento.setFillColor(20, 30, 48);
  documento.rect(34, posicaoY - 14, 527, 22, "F");
  documento.setTextColor(255, 255, 255);
  documento.setFont("helvetica", "bold");
  documento.setFontSize(10);
  documento.text("Dia", 40, posicaoY);
  documento.text("Custo diário", 250, posicaoY, { align: "right" });
  documento.text("Acumulado", 400, posicaoY, { align: "right" });
  documento.text("Acum. mês anterior", 555, posicaoY, { align: "right" });
  documento.setTextColor(30, 41, 59);
  documento.setFont("helvetica", "normal");
  return posicaoY + 22;
}

function desenharLinhasTabela(documento, { atual, anterior }, posicaoY) {
  atual.total_execucao_por_dia.forEach((valor, indice) => {
    if (posicaoY > 790) {
      documento.addPage();
      posicaoY = desenharCabecalhoTabela(documento, 50);
    }
    if (indice % 2 === 0) {
      documento.setFillColor(243, 246, 251);
      documento.rect(34, posicaoY - 12, 527, 18, "F");
    }
    const acumuladoAnterior = anterior?.acumulado_por_dia[indice];
    documento.text(String(indice + 1), 40, posicaoY);
    documento.text(formatarUsdCentavos(valor), 250, posicaoY, { align: "right" });
    documento.text(formatarUsdCentavos(atual.acumulado_por_dia[indice]), 400, posicaoY, { align: "right" });
    documento.text(
      acumuladoAnterior != null ? formatarUsdCentavos(acumuladoAnterior) : "-",
      555,
      posicaoY,
      { align: "right" },
    );
    posicaoY += 18;
  });
}

function montarRelatorioPdf(mesesAtras) {
  const relatorio = montarDadosRelatorio(mesesAtras);
  const { atual } = relatorio;
  const documento = new window.jspdf.jsPDF({ unit: "pt", format: "a4" });
  desenharCabecalhoRelatorio(documento, atual.rotulo);
  let posicaoY = desenharResumoRelatorio(documento, relatorio, 118) + 14;
  posicaoY = desenharCabecalhoTabela(documento, posicaoY);
  desenharLinhasTabela(documento, relatorio, posicaoY);
  const nomeArquivo = `relatorio-billing-${atual.ano}-${String(atual.mes + 1).padStart(2, "0")}.pdf`;
  return { nome: nomeArquivo, dados: documento.output("arraybuffer") };
}

function salvarPeloNavegador(relatorio) {
  const link = document.createElement("a");
  link.href = URL.createObjectURL(new Blob([relatorio.dados], { type: "application/pdf" }));
  link.download = relatorio.nome;
  document.body.appendChild(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(link.href), 1000);
}

async function baixarRelatorio(mesesAtras) {
  const relatorio = montarRelatorioPdf(mesesAtras);
  if (typeof claude !== "undefined" && typeof claude.use === "function") {
    try {
      const gerenciadorDownloads = await claude.use("downloads");
      if (gerenciadorDownloads) {
        await gerenciadorDownloads.save({ filename: relatorio.nome, data: relatorio.dados });
        return;
      }
    } catch (erro) {
      if (erro && erro.code === "declined") return;
    }
  }
  salvarPeloNavegador(relatorio); // navegador comum (fora do claude.ai)
}

/* ========== Histórico (modal) ========== */
function htmlItemHistorico(mesesAtras) {
  const mes = obterMes(mesesAtras);
  return `
    <div>
      <div class="history-name">${mes.rotulo}</div>
      <div class="history-meta">
        <span>${formatarUsd(mes.resumo.total)}</span>
        ${
          mes.resumo.variacao_pct != null
            ? `<span class="chip ${mes.resumo.variacao_nivel}">${formatarPorcentagem(mes.resumo.variacao_pct)}</span>`
            : ""
        }
      </div>
    </div>
    <button class="btn small" type="button" data-back="${mesesAtras}">⬇ Baixar PDF</button>`;
}

function renderizarHistorico() {
  const lista = obterPorId("history-list");
  lista.innerHTML = "";
  for (let mesesAtras = 1; mesesAtras <= 6; mesesAtras++) {
    const mes = obterMes(mesesAtras);
    if (!mes) break;
    const itemLista = document.createElement("li");
    itemLista.className = "history-item";
    itemLista.id = `history-item-${mes.ano}-${mes.mes + 1}`;
    itemLista.innerHTML = htmlItemHistorico(mesesAtras);
    lista.appendChild(itemLista);
  }
}

const abrirHistorico = () => {
  renderizarHistorico();
  obterPorId("history-modal").classList.add("open");
};
const fecharHistorico = () => obterPorId("history-modal").classList.remove("open");

/* ========== Render principal ========== */
function renderizar() {
  obterPorId("budget-input").value = obterMes(estado.mesesAtras).orcamento;
  renderizarKpis();
  renderizarGrafico();
}

/* ========== Eventos ========== */
function vincularEventos() {
  obterPorId("btn-download-report").addEventListener("click", () => {
    if (estado.faturamento) baixarRelatorio(1);
  });
  obterPorId("btn-history").addEventListener("click", () => {
    if (estado.faturamento) abrirHistorico();
  });
  obterPorId("history-close").addEventListener("click", fecharHistorico);
  obterPorId("history-modal").addEventListener("click", (evento) => {
    if (evento.target === obterPorId("history-modal")) fecharHistorico();
  });
  obterPorId("history-list").addEventListener("click", (evento) => {
    const botao = evento.target.closest("button[data-back]");
    if (botao) baixarRelatorio(+botao.dataset.back);
  });
  document.addEventListener("keydown", (evento) => {
    if (evento.key === "Escape") fecharHistorico();
  });
}

/* ========== Inicialização ========== */
async function iniciar() {
  vincularEventos();
  try {
    estado.faturamento = await carregarFaturamento();
    estado.chavesMeses = Object.keys(estado.faturamento.meses).sort();
    estado.mesesAtras = 0; // sempre o mês mais recente
    estado.dia = obterMes(0).dias_com_dados; // sempre o último dia com dados
    renderizar();
  } catch (erro) {
    console.error(erro);
    mostrarErro(
      location.protocol === "file:"
        ? "Não foi possível carregar billing-mock.json abrindo o HTML direto do disco (file://). Rode um servidor local, por exemplo: python -m http.server, e acesse http://localhost:8000."
        : "Não foi possível carregar os dados de faturamento: " + erro.message,
    );
  }
}

document.addEventListener("DOMContentLoaded", iniciar);