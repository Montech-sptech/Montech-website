
"use strict";

/* ==========================================
   1. CONFIGURAÇÕES GERAIS
   ========================================== */

const $ = id => document.getElementById(id);

const SEGUNDO = 1000;
const MINUTO = 60 * SEGUNDO;
const HORA = 60 * MINUTO;
const DIA = 24 * HORA;

const PASSO = 10 * SEGUNDO;
const FUSO = "America/Sao_Paulo";

// Horário de referência fixo da simulação.
const AGORA = Math.floor(Date.now() / PASSO) * PASSO;

const RECURSOS = {
  cpu: {
    nome: "CPU",
    unidade: "%",
    limite: 80,
    base: 48,
    amplitude: 6,
    impulso: 39
  },

  temperatura: {
    nome: "Temperatura CPU",
    unidade: "°C",
    limite: 78,
    base: 56,
    amplitude: 6,
    impulso: 30
  },

  ram: {
    nome: "RAM",
    unidade: "%",
    limite: 85,
    base: 64,
    amplitude: 4,
    impulso: 29
  },

  disco: {
    nome: "Disco",
    unidade: "%",
    limite: 90,
    base: 71,
    amplitude: 2,
    impulso: 23
  },

  swap: {
    nome: "Swap",
    unidade: "%",
    limite: 70,
    base: 36,
    amplitude: 3,
    impulso: 43
  },

  rede: {
    nome: "Rede",
    unidade: "MB/s",
    limite: 65,
    base: 24,
    amplitude: 6,
    impulso: 52
  }
};

const NOMES = Object.keys(RECURSOS);
const SERVIDORES = ["AIS", "SPA", "SDV"];

const CORES = {
  azul: "#4fa3ff",
  ciano: "#5fd0ef",
  vermelho: "#ff6b7a",
  roxo: "#a78bfa"
};

const LINHAS_PAGINA = 20;

const cache = new Map();

const estado = {
  servidor: "AIS",
  recurso: "cpu",
  periodo: "24",
  data: "",

  episodioId: "",
  zoom: false,

  bins: [],
  episodios: [],
  resolucao: PASSO,

  pagina: 0,
  selecionado: -1,

  busca: "",
  filtroTabela: "todas"
};

let grafico = null;
let ajudaFixada = null;


/* ==========================================
   2. FORMATAÇÃO
   ========================================== */

function numero(valor, casas = 1) {
  return Number(valor).toLocaleString("pt-BR", {
    minimumFractionDigits: casas,
    maximumFractionDigits: casas
  });
}

function unidade(valor, config) {
  if (
    valor === null ||
    valor === undefined ||
    !Number.isFinite(valor)
  ) {
    return "—";
  }

  return config.unidade === "%"
    ? `${numero(valor)}%`
    : `${numero(valor)} ${config.unidade}`;
}

function unidadeExcedente(config) {
  return config.unidade === "%"
    ? "pp"
    : config.unidade;
}

function duracao(segundos) {
  segundos = Math.max(0, Math.round(segundos));

  if (segundos < 60) {
    return `${segundos} s`;
  }

  const horas = Math.floor(segundos / 3600);
  const minutos = Math.floor((segundos % 3600) / 60);

  return horas > 0
    ? `${horas}h ${minutos}min`
    : `${minutos} min`;
}

function dataHora(timestamp) {
  return new Intl.DateTimeFormat("pt-BR", {
    timeZone: FUSO,
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit"
  }).format(timestamp);
}

function dataHoraSegundos(timestamp) {
  return new Intl.DateTimeFormat("pt-BR", {
    timeZone: FUSO,
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit"
  }).format(timestamp);
}

function horario(timestamp) {
  return new Intl.DateTimeFormat("pt-BR", {
    timeZone: FUSO,
    hour: "2-digit",
    minute: "2-digit"
  }).format(timestamp);
}

function dataISO(timestamp) {
  // São Paulo utiliza UTC-3 nas datas
  // deste protótipo.
  return new Date(timestamp - 3 * HORA)
    .toISOString()
    .slice(0, 10);
}

function escapar(texto) {
  return String(texto).replace(
    /[&<>"']/g,
    caractere => ({
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#39;"
    })[caractere]
  );
}

function limitar(valor, minimo, maximo) {
  return Math.max(minimo, Math.min(maximo, valor));
}

function percentil(valoresOrdenados, p) {
  if (!valoresOrdenados.length) return null;

  const posicao =
    (valoresOrdenados.length - 1) * p;

  const inferior = Math.floor(posicao);
  const superior = Math.ceil(posicao);

  if (inferior === superior) {
    return valoresOrdenados[inferior];
  }

  const peso = posicao - inferior;

  return (
    valoresOrdenados[inferior] * (1 - peso) +
    valoresOrdenados[superior] * peso
  );
}


/* ==========================================
   3. BUSCA EFICIENTE POR INTERVALO
   ========================================== */

function indiceInicial(dados, instante) {
  let inicio = 0;
  let fim = dados.length;

  while (inicio < fim) {
    const meio = Math.floor(
      (inicio + fim) / 2
    );

    if (dados[meio].t < instante) {
      inicio = meio + 1;
    } else {
      fim = meio;
    }
  }

  return inicio;
}

// O fim do intervalo é exclusivo.
function filtrarIntervalo(dados, inicio, fim) {
  const a = indiceInicial(dados, inicio);
  const b = indiceInicial(dados, fim);

  return dados.slice(a, b);
}


/* ==========================================
   4. DATAS E PERÍODOS
   ========================================== */

const HOJE = dataISO(AGORA);

const INICIO_HOJE = Date.parse(
  `${HOJE}T00:00:00-03:00`
);

// Sete dias corridos, incluindo hoje.
const DATA_MINIMA = dataISO(
  INICIO_HOJE - 6 * DIA
);

function configurarCalendario() {
  const campo = $("data-alvo");

  campo.min = DATA_MINIMA;
  campo.max = HOJE;
  campo.value = HOJE;

  estado.data = HOJE;
}

function intervaloInvestigacao() {
  if (estado.periodo === "data") {
    const data = estado.data || HOJE;

    const inicio = Date.parse(
      `${data}T00:00:00-03:00`
    );

    const fim = Math.min(
      inicio + DIA,
      AGORA + PASSO
    );

    return {
      inicio,
      fim,
      nome:
        `Dia ${data.split("-").reverse().join("/")}`
    };
  }

  const horas = Number(estado.periodo);

  const nomes = {
    1: "Última hora",
    6: "Últimas 6 horas",
    24: "Últimas 24 horas",
    72: "Últimos 3 dias",
    168: "Últimos 7 dias"
  };

  return {
    inicio: AGORA - horas * HORA + PASSO,
    fim: AGORA + PASSO,
    nome: nomes[horas]
  };
}


/* ==========================================
   5. AGRUPAMENTOS DEFINIDOS
   ========================================== */

function passoVisualizacao() {
  // Zoom sempre mostra coletas de 10 segundos.
  if (estado.zoom) {
    return PASSO;
  }

  switch (estado.periodo) {
    case "1":
      return MINUTO;

    case "6":
      return 5 * MINUTO;

    case "24":
    case "data":
      return 15 * MINUTO;

    case "72":
      return 30 * MINUTO;

    case "168":
      return 45 * MINUTO;

    default:
      return 15 * MINUTO;
  }
}

function nomeResolucao(passo) {
  const nomes = {
    [PASSO]: "Coletas individuais: 10 segundos",
    [MINUTO]: "Agrupamento: 1 minuto",
    [5 * MINUTO]: "Agrupamento: 5 minutos",
    [15 * MINUTO]: "Agrupamento: 15 minutos",
    [30 * MINUTO]: "Agrupamento: 30 minutos",
    [45 * MINUTO]: "Agrupamento: 45 minutos"
  };

  return nomes[passo] || "Agrupamento variável";
}


/* ==========================================
   6. DADOS SIMULADOS
   ========================================== */

/*
  Estes dados são fictícios.

  Na integração real, a função carregarSerie()
  será substituída por uma consulta à API
  que utilizará os dados da Silver.

  Os limites também deverão vir da
  configuração real de cada recurso.
*/

function valorSimulado(timestamp, recurso, servidor) {
  const c = RECURSOS[recurso];

  const dataLocal = new Date(
    timestamp - 3 * HORA
  );

  const dia = dataLocal.getUTCDate();

  const minutos =
    dataLocal.getUTCHours() * 60 +
    dataLocal.getUTCMinutes();

  const indiceServidor =
    SERVIDORES.indexOf(servidor);

  const indiceRecurso =
    NOMES.indexOf(recurso);

  const fase = minutos / 1440 * 2 * Math.PI;

  let valor =
    c.base +
    c.amplitude * Math.sin(fase - 1.2) +
    2 * Math.sin(
      timestamp / 79000 + indiceRecurso
    ) +
    1.2 * Math.cos(
      timestamp / 47000 + indiceServidor
    );

  // Eventos artificiais para gerar desvios.
  const deslocamento =
    indiceServidor * 11 +
    indiceRecurso * 2;

  const eventos = [
    { inicio: 8 * 60 + 35, duracao: 16 },
    { inicio: 14 * 60 + 50, duracao: 13 }
  ];

  if (dia % 2 === 0) {
    eventos.push({
      inicio: 20 * 60 + 15,
      duracao: 10
    });
  }

  for (const evento of eventos) {
    const inicio = evento.inicio + deslocamento;
    const fim = inicio + evento.duracao;

    if (
      minutos >= inicio &&
      minutos < fim
    ) {
      const progresso =
        (minutos - inicio) / evento.duracao;

      valor +=
        c.impulso * Math.sin(Math.PI * progresso);
    }
  }

  return limitar(
    valor,
    0,
    recurso === "temperatura" ? 110 : 100
  );
}

function carregarSerie(servidor, recurso) {
  const chave = `${servidor}-${recurso}`;

  if (cache.has(chave)) {
    return cache.get(chave);
  }

  const dados = [];

  // Um dia adicional permite identificar
  // episódios próximos ao início dos filtros.
  const inicio = AGORA - 8 * DIA;

  for (
    let t = inicio;
    t <= AGORA;
    t += PASSO
  ) {
    dados.push({
      t,
      v: valorSimulado(
        t,
        recurso,
        servidor
      )
    });
  }

  const episodios = identificarEpisodios(
    dados,
    RECURSOS[recurso].limite,
    chave
  );

  const resultado = {
    dados,
    episodios
  };

  cache.set(chave, resultado);

  return resultado;
}


/* ==========================================
   7. IDENTIFICAÇÃO DE EPISÓDIOS
   ========================================== */

/*
  Regra provisória da demonstração:

  - 3 coletas consecutivas acima do limite
    confirmam um episódio.

  - 3 coletas consecutivas no limite ou abaixo
    confirmam a recuperação.

  - O início é a primeira leitura acima
    do limite da sequência confirmada.

  - O fim é a primeira leitura da sequência
    de recuperação confirmada.

  - Gaps superiores a 15 segundos interrompem
    a sequência; episódios interrompidos
    por gaps não recebem fechamento confirmado.

  Esta regra deverá ser validada com dados reais.
*/

function identificarEpisodios(dados, limite, chave) {
  const episodios = [];

  let consecutivasAcima = 0;
  let inicioPendente = 0;
  let picoPendente = -Infinity;

  let ativo = null;

  let consecutivasNormais = 0;
  let inicioRecuperacao = 0;
  let instanteAnterior = null;

  function registrarInterrupcao(fim) {
    if (!ativo) return;

    ativo.fim = fim;
    ativo.ativo = false;
    ativo.interrompido = true;

    episodios.push(ativo);
    ativo = null;
  }

  for (const leitura of dados) {
    // Evita unir coletas separadas por falhas.
    if (
      instanteAnterior !== null &&
      leitura.t - instanteAnterior > 1.5 * PASSO
    ) {
      registrarInterrupcao(
        instanteAnterior + PASSO
      );

      consecutivasAcima = 0;
      consecutivasNormais = 0;
    }

    instanteAnterior = leitura.t;

    const acima = leitura.v > limite;

    if (!ativo) {
      if (acima) {
        if (consecutivasAcima === 0) {
          inicioPendente = leitura.t;
          picoPendente = leitura.v;
        }

        consecutivasAcima++;

        picoPendente = Math.max(
          picoPendente,
          leitura.v
        );

        if (consecutivasAcima >= 3) {
          ativo = {
            id: `${chave}-${inicioPendente}`,
            inicio: inicioPendente,
            fim: null,
            pico: picoPendente,
            ativo: true,
            interrompido: false
          };

          consecutivasAcima = 0;
          consecutivasNormais = 0;
        }
      } else {
        consecutivasAcima = 0;
      }

      continue;
    }

    if (acima) {
      ativo.pico = Math.max(
        ativo.pico,
        leitura.v
      );

      consecutivasNormais = 0;
    } else {
      if (consecutivasNormais === 0) {
        inicioRecuperacao = leitura.t;
      }

      consecutivasNormais++;

      if (consecutivasNormais >= 3) {
        ativo.fim = inicioRecuperacao;
        ativo.ativo = false;

        episodios.push(ativo);

        ativo = null;
        consecutivasNormais = 0;
      }
    }
  }

  // Episódio ainda ativo na última coleta.
  if (ativo) {
    ativo.fim = AGORA + PASSO;
    ativo.ativo = true;

    episodios.push(ativo);
  }

  return episodios;
}


/* ==========================================
   8. EPISÓDIOS NO PERÍODO
   ========================================== */

function episodiosNoPeriodo(
  episodios,
  intervalo,
  dados
) {
  return episodios
    .filter(e =>
      e.inicio < intervalo.fim &&
      e.fim > intervalo.inicio
    )
    .map(e => {
      const inicio = Math.max(
        e.inicio,
        intervalo.inicio
      );

      const fim = Math.min(
        e.fim,
        intervalo.fim
      );

      const leituras = filtrarIntervalo(
        dados,
        inicio,
        fim
      );

      const picoPeriodo = leituras.length
        ? Math.max(...leituras.map(r => r.v))
        : null;

      return {
        ...e,
        duracaoPeriodo: Math.max(
          0,
          (fim - inicio) / 1000
        ),
        picoPeriodo
      };
    });
}

function episodioAtual() {
  return estado.episodios.find(
    e => e.id === estado.episodioId
  ) || null;
}


/* ==========================================
   9. AGREGAÇÃO TEMPORAL
   ========================================== */

function agregarLeituras(dados, passo, limite) {
  if (!dados.length) return [];

  // Zoom: cada registro representa uma coleta.
  if (passo === PASSO) {
    return dados.map(r => ({
      inicio: r.t,
      fim: r.t + PASSO,
      p10: r.v,
      mediana: r.v,
      p90: r.v,
      maximo: r.v,
      quantidade: 1,
      acima: Number(r.v > limite)
    }));
  }

  const resultado = [];

  let janelaAtual = null;
  let valores = [];

  function finalizarJanela() {
    if (!valores.length) return;

    const ordenados = [...valores].sort(
      (a, b) => a - b
    );

    resultado.push({
      inicio: janelaAtual,
      fim: janelaAtual + passo,

      p10: percentil(ordenados, .10),
      mediana: percentil(ordenados, .50),
      p90: percentil(ordenados, .90),

      maximo: ordenados[ordenados.length - 1],
      quantidade: valores.length,

      acima: valores.filter(
        v => v > limite
      ).length
    });
  }

  for (const leitura of dados) {
    const janela = Math.floor(
      leitura.t / passo
    ) * passo;

    if (janelaAtual !== janela) {
      finalizarJanela();

      janelaAtual = janela;
      valores = [];
    }

    valores.push(leitura.v);
  }

  finalizarJanela();

  return resultado;
}


/* ==========================================
   10. TOOLTIP EXPLICATIVO
   ========================================== */

function botaoAjuda(texto, rotulo = "Ver explicação") {
  return `
    <button
      class="ajuda"
      type="button"
      data-ajuda="${escapar(texto)}"
      aria-label="${escapar(rotulo)}"
    >?</button>
  `;
}

function esconderAjuda() {
  $("ajuda-global").hidden = true;
  ajudaFixada = null;
}

function mostrarAjuda(botao) {
  if (!botao?.dataset.ajuda) return;

  const popup = $("ajuda-global");

  popup.textContent = botao.dataset.ajuda;
  popup.hidden = false;

  const alvo = botao.getBoundingClientRect();

  const largura = popup.offsetWidth;
  const altura = popup.offsetHeight;

  const esquerda = limitar(
    alvo.left + alvo.width / 2 - largura / 2,
    12,
    Math.max(
      12,
      window.innerWidth - largura - 12
    )
  );

  let topo = alvo.top - altura - 9;

  if (topo < 12) {
    topo = alvo.bottom + 9;
  }

  if (topo + altura > window.innerHeight - 12) {
    topo = Math.max(
      12,
      window.innerHeight - altura - 12
    );
  }

  popup.style.left = `${esquerda}px`;
  popup.style.top = `${topo}px`;
}

function configurarTooltips() {
  document.addEventListener("mouseover", e => {
    const botao = e.target.closest?.(".ajuda");

    if (botao && !ajudaFixada) {
      mostrarAjuda(botao);
    }
  });

  document.addEventListener("mouseout", e => {
    const botao = e.target.closest?.(".ajuda");

    if (
      botao &&
      !ajudaFixada &&
      !botao.contains(e.relatedTarget)
    ) {
      $("ajuda-global").hidden = true;
    }
  });

  document.addEventListener("focusin", e => {
    const botao = e.target.closest?.(".ajuda");

    if (botao) {
      mostrarAjuda(botao);
    }
  });

  document.addEventListener("click", e => {
    const botao = e.target.closest?.(".ajuda");

    if (!botao) {
      esconderAjuda();
      return;
    }

    e.preventDefault();

    if (ajudaFixada === botao) {
      esconderAjuda();
      return;
    }

    ajudaFixada = botao;
    mostrarAjuda(botao);
  });

  document.addEventListener("keydown", e => {
    if (e.key === "Escape") {
      esconderAjuda();
    }
  });

  window.addEventListener(
    "scroll",
    esconderAjuda,
    true
  );

  window.addEventListener(
    "resize",
    esconderAjuda
  );
}


/* ==========================================
   11. KPIs
   ========================================== */

function renderizarKpis(intervalo, episodios) {
  const c = RECURSOS[estado.recurso];

  const tempoTotal = episodios.reduce(
    (total, e) => total + e.duracaoPeriodo,
    0
  );

  const picos = episodios
    .map(e => e.picoPeriodo)
    .filter(Number.isFinite);

  const maiorPico = picos.length
    ? Math.max(...picos)
    : null;

  const excedente = maiorPico === null
    ? null
    : Math.max(0, maiorPico - c.limite);

  const maisLongo = episodios.length
    ? [...episodios].sort(
        (a, b) =>
          b.duracaoPeriodo - a.duracaoPeriodo
      )[0]
    : null;

  const itens = [
    {
      titulo: "Tempo total em desvio",
      valor: duracao(tempoTotal),

      detalhe:
        `Tempo acumulado em ${episodios.length} episódio(s).`,

      ajuda:
        "Soma do tempo dos episódios confirmados dentro do período selecionado. Trechos fora do período não entram no cálculo."
    },

    {
      titulo: "Episódios identificados",
      valor: String(episodios.length),

      detalhe:
        `Ocorrências de ${c.nome} no período.`,

      ajuda:
        "Quantidade de episódios confirmados que ocorreram no período. Cada episódio é contado uma vez."
    },

    {
      titulo: "Maior ultrapassagem",

      valor: excedente === null
        ? "—"
        : `+${numero(excedente)} ${unidadeExcedente(c)}`,

      detalhe: maiorPico === null
        ? "Nenhum episódio confirmado."
        : `Pico ${unidade(maiorPico, c)} · Limite ${unidade(c.limite, c)}`,

      ajuda: c.unidade === "%"
        ? "Diferença entre o maior pico de um episódio e o limite. pp significa pontos percentuais: 96% menos 80% = 16 pp."
        : `Diferença entre o maior pico de um episódio e o limite operacional, em ${c.unidade}.`
    },

    {
      titulo: "Episódio mais longo",

      valor: maisLongo
        ? duracao(maisLongo.duracaoPeriodo)
        : "—",

      detalhe: maisLongo
        ? `${dataHora(maisLongo.inicio)} · ${
            maisLongo.ativo
              ? "Em andamento"
              : maisLongo.interrompido
                ? "Coleta interrompida"
                : "Encerrado"
          }`
        : "Nenhum episódio confirmado.",

      ajuda:
        "Episódio que permaneceu mais tempo em desvio dentro do período investigado."
    }
  ];

  $("kpis").innerHTML = itens.map(item => `
    <article class="kpi">

      <div class="kpi-cabecalho">
        <span class="kpi-titulo">
          ${escapar(item.titulo)}
        </span>

        ${botaoAjuda(
          item.ajuda,
          `Explicação: ${item.titulo}`
        )}
      </div>

      <div class="valor-kpi">
        ${escapar(item.valor)}
      </div>

      <small>${escapar(item.detalhe)}</small>

    </article>
  `).join("");
}


/* ==========================================
   12. SEIS RECURSOS COMPACTOS
   ========================================== */

function renderizarComparacao(intervalo) {
  const LARGURA = 160;
  const TOPO = 5;
  const BASE = 39;
  const TOTAL_PONTOS = 32;

  const html = NOMES.map(recurso => {
    const c = RECURSOS[recurso];

    const origem = carregarSerie(
      estado.servidor,
      recurso
    );

    const leituras = filtrarIntervalo(
      origem.dados,
      intervalo.inicio,
      intervalo.fim
    );

    const pico = leituras.length
      ? leituras.reduce(
          (maior, r) => Math.max(maior, r.v),
          -Infinity
        )
      : null;

    const acimaLimite =
      pico !== null && pico > c.limite;

    const ativo =
      recurso === estado.recurso;

    const tamanhoGrupo = Math.max(
      1,
      Math.ceil(
        leituras.length / TOTAL_PONTOS
      )
    );

    const pontos = [];

    for (
      let i = 0;
      i < leituras.length;
      i += tamanhoGrupo
    ) {
      let maior = -Infinity;

      const fim = Math.min(
        i + tamanhoGrupo,
        leituras.length
      );

      for (let j = i; j < fim; j++) {
        maior = Math.max(
          maior,
          leituras[j].v
        );
      }

      pontos.push(maior);
    }

    const teto = c.unidade === "%"
      ? 100
      : Math.max(
          c.limite * 1.25,
          (pico ?? 0) * 1.1,
          1
        );

    const x = indice =>
      4 + (
        pontos.length <= 1
          ? 0
          : indice / (pontos.length - 1) * 152
      );

    const y = valor =>
      BASE -
      limitar(valor / teto, 0, 1) *
      (BASE - TOPO);

    const caminho = pontos.map(
      (valor, indice) =>
        `${indice === 0 ? "M" : "L"}` +
        `${x(indice).toFixed(2)} ` +
        `${y(valor).toFixed(2)}`
    ).join(" ");

    const area = pontos.length
      ? `${caminho} ` +
        `L${x(pontos.length - 1)} ${BASE} ` +
        `L${x(0)} ${BASE} Z`
      : "";

    const yLimite = y(c.limite);

    const indicePico = pontos.length
      ? pontos.reduce(
          (melhor, valor, indice) =>
            valor > pontos[melhor]
              ? indice
              : melhor,
          0
        )
      : -1;

    const corPico = acimaLimite
      ? CORES.vermelho
      : CORES.ciano;

    const valorPico = pico === null
      ? "—"
      : unidade(pico, c);

    const valorLimite =
      unidade(c.limite, c);

    const explicacao = [
      `${c.nome} — Servidor ${estado.servidor}`,
      `Maior valor: ${valorPico}`,
      `Limite: ${valorLimite}`,
      acimaLimite
        ? "Houve leituras acima do limite."
        : "Nenhuma leitura acima do limite.",
      "A curva mostra máximos agrupados.",
      "Um pico isolado não confirma um episódio."
    ].join("\n");

    return `
      <button
        class="mini ${ativo ? "ativo" : ""}"
        type="button"
        data-recurso="${recurso}"
        aria-pressed="${ativo}"
        aria-label="Investigar ${escapar(c.nome)}"
        title="${escapar(explicacao)}"
      >

        <div class="mini-topo">
          <span class="mini-nome">
            ${escapar(c.nome)}
          </span>

          <span class="mini-pico ${
            acimaLimite ? "alto" : ""
          }">
            Pico ${escapar(valorPico)}
          </span>
        </div>

        <svg
          class="mini-chart"
          viewBox="0 0 ${LARGURA} 44"
          preserveAspectRatio="none"
          aria-hidden="true"
        >

          <defs>
            <linearGradient
              id="mini-area-${recurso}"
              x1="0"
              y1="0"
              x2="0"
              y2="1"
            >
              <stop
                offset="0%"
                stop-color="${CORES.azul}"
                stop-opacity=".26"
              />
              <stop
                offset="100%"
                stop-color="${CORES.azul}"
                stop-opacity="0"
              />
            </linearGradient>

            <clipPath id="mini-corte-${recurso}">
              <rect
                x="0"
                y="0"
                width="${LARGURA}"
                height="${Math.max(0, yLimite)}"
              />
            </clipPath>
          </defs>

          <line
            x1="0" y1="${BASE}"
            x2="${LARGURA}" y2="${BASE}"
            stroke="#334071"
            stroke-width=".7"
          />

          <line
            x1="0" y1="${yLimite}"
            x2="${LARGURA}" y2="${yLimite}"
            stroke="${CORES.vermelho}"
            stroke-dasharray="4 4"
            stroke-width="1"
            opacity=".8"
          />

          <path
            d="${area}"
            fill="url(#mini-area-${recurso})"
          />

          <path
            d="${caminho}"
            fill="none"
            stroke="${CORES.azul}"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"
          />

          <path
            d="${caminho}"
            fill="none"
            stroke="${CORES.vermelho}"
            stroke-width="2.4"
            stroke-linecap="round"
            stroke-linejoin="round"
            clip-path="url(#mini-corte-${recurso})"
          />

          ${indicePico >= 0 ? `
            <circle
              cx="${x(indicePico)}"
              cy="${y(pontos[indicePico])}"
              r="3"
              fill="${corPico}"
              stroke="#0b1033"
              stroke-width="1.2"
            />
          ` : ""}
        </svg>

        <div class="mini-rodape">
          <span class="mini-limite">
            Limite ${escapar(valorLimite)}
          </span>

          <span class="mini-status">
            <i class="${
              acimaLimite ? "alerta" : "normal"
            }"></i>

            ${
              acimaLimite
                ? "Pico acima"
                : "Dentro do limite"
            }
          </span>
        </div>

      </button>
    `;
  }).join("");

  $("comparacao").innerHTML = html;
}


/* ==========================================
   13. SELETOR DE EPISÓDIOS
   ========================================== */

function renderizarSeletorEpisodios() {
  $("episodio").innerHTML = `
    <option value="">
      Nenhum selecionado
    </option>

    ${estado.episodios.map((e, i) => `
      <option value="${escapar(e.id)}">
        Episódio ${i + 1} · ${dataHora(e.inicio)}
      </option>
    `).join("")}
  `;

  $("episodio").value = estado.episodioId;

  $("zoom").disabled =
    !estado.episodioId || estado.zoom;

  $("voltar").hidden = !estado.zoom;
}

function renderizarResumoEpisodio() {
  const e = episodioAtual();
  const c = RECURSOS[estado.recurso];

  if (!e) {
    $("resumo-episodio").innerHTML = `
    `;

    return;
  }

  let situacao;

  if (e.ativo) {
    situacao = "Em andamento";
  } else if (e.interrompido) {
    situacao = "Interrompido por falta de coletas";
  } else {
    situacao = `Encerrado em ${dataHora(e.fim)}`;
  }

  $("resumo-episodio").innerHTML = `
    <strong>Episódio selecionado:</strong>
    início em ${dataHora(e.inicio)} ·
    ${escapar(situacao)} ·
    duração no período:
    ${duracao(e.duracaoPeriodo)} ·
    pico no período:
    ${unidade(e.picoPeriodo, c)}.
  `;
}


/* ==========================================
   14. MARCAÇÕES DO GRÁFICO
   ========================================== */

const pluginMarcacoes = {
  id: "marcacoesMontech",

  beforeDatasetsDraw(chart) {
    const { ctx, chartArea, scales } = chart;

    if (!estado.bins.length) return;

    ctx.save();

    ctx.beginPath();
    ctx.rect(
      chartArea.left,
      chartArea.top,
      chartArea.right - chartArea.left,
      chartArea.bottom - chartArea.top
    );
    ctx.clip();

    // Episódios no intervalo visível.
    for (const e of estado.episodios) {
      const x1 = scales.x.getPixelForValue(
        e.inicio
      );

      const x2 = scales.x.getPixelForValue(
        e.fim
      );

      if (
        x2 < chartArea.left ||
        x1 > chartArea.right
      ) {
        continue;
      }

      const selecionado =
        e.id === estado.episodioId;

      ctx.fillStyle = selecionado
        ? "rgba(167,139,250,.25)"
        : "rgba(167,139,250,.07)";

      ctx.fillRect(
        x1,
        chartArea.top,
        Math.max(0, x2 - x1),
        chartArea.bottom - chartArea.top
      );
    }

    ctx.restore();
  },

  afterDraw(chart) {
    if (estado.selecionado < 0) return;

    const bin = estado.bins[
      estado.selecionado
    ];

    if (!bin) return;

    const meio = (bin.inicio + bin.fim) / 2;

    const x = chart.scales.x.getPixelForValue(
      meio
    );

    if (!Number.isFinite(x)) return;

    const { ctx, chartArea } = chart;

    ctx.save();

    ctx.beginPath();
    ctx.rect(
      chartArea.left,
      chartArea.top,
      chartArea.right - chartArea.left,
      chartArea.bottom - chartArea.top
    );
    ctx.clip();

    ctx.strokeStyle = "#ffffffbb";
    ctx.setLineDash([4, 4]);

    ctx.beginPath();
    ctx.moveTo(x, chartArea.top);
    ctx.lineTo(x, chartArea.bottom);
    ctx.stroke();

    ctx.restore();
  }
};


/* ==========================================
   15. GRÁFICO TEMPORAL
   ========================================== */

function pontosSerie(chave) {
  return estado.bins.map(bin => ({
    x: (bin.inicio + bin.fim) / 2,
    y: bin[chave]
  }));
}

function destacarLinhaAoPassar(indice) {
  document.querySelectorAll(
    "#corpo-tabela tr[data-indice]"
  ).forEach(tr => {
    tr.classList.toggle(
      "em-foco",
      Number(tr.dataset.indice) === indice
    );
  });
}

function renderizarGrafico() {
  const c = RECURSOS[estado.recurso];
  const bins = estado.bins;

  const bruto =
    estado.resolucao === PASSO;

  if (grafico) {
    grafico.destroy();
    grafico = null;
  }

  const datasets = [];

  if (bruto) {
    datasets.push({
      label: "Leitura",
      data: pontosSerie("mediana"),
      borderColor: CORES.azul,
      backgroundColor: CORES.azul,
      borderWidth: 2,
      pointRadius: 0,
      pointHoverRadius: 4,
      tension: .12
    });
  } else {
    // Limite inferior da faixa.
    datasets.push({
      label: "P10",
      data: pontosSerie("p10"),
      borderColor: "transparent",
      borderWidth: 0,
      pointRadius: 0
    });

    // Faixa preenchida até o P10.
    datasets.push({
      label: "P90",
      data: pontosSerie("p90"),
      borderColor: "transparent",
      borderWidth: 0,
      pointRadius: 0,
      backgroundColor: "rgba(79,163,255,.16)",
      fill: {
        target: 0,
        above: "rgba(79,163,255,.16)",
        below: "rgba(79,163,255,.16)"
      }
    });

    datasets.push({
      label: "Mediana (P50)",
      data: pontosSerie("mediana"),
      borderColor: CORES.azul,
      borderWidth: 2,
      pointRadius: 0,
      pointHoverRadius: 4,
      tension: .12
    });

    datasets.push({
      label: "Máximo",
      data: pontosSerie("maximo"),
      borderColor: CORES.ciano,
      borderWidth: 1.5,
      pointRadius: 0,
      pointHoverRadius: 4,
      tension: .12
    });
  }

  datasets.push({
    label: "Limite operacional",
    data: bins.map(bin => ({
      x: (bin.inicio + bin.fim) / 2,
      y: c.limite
    })),
    borderColor: CORES.vermelho,
    borderWidth: 1.5,
    borderDash: [6, 5],
    pointRadius: 0,
    tension: 0
  });

  const intervaloVisivel = bins.length
    ? {
        inicio: bins[0].inicio,
        fim: bins[bins.length - 1].fim
      }
    : {
        inicio: AGORA - HORA,
        fim: AGORA + PASSO
      };

  grafico = new Chart(
    $("grafico-temporal"),
    {
      type: "line",

      data: {
        datasets
      },

      plugins: [pluginMarcacoes],

      options: {
        responsive: true,
        maintainAspectRatio: false,
        animation: false,
        parsing: false,

        interaction: {
          mode: "index",
          intersect: false
        },

        onHover: (_evento, elementos) => {
          const indice = elementos.length
            ? elementos[0].index
            : -1;

          destacarLinhaAoPassar(indice);
        },

        onClick: (_evento, elementos) => {
          if (!elementos.length) return;

          selecionarJanela(
            elementos[0].index
          );
        },

        scales: {
          x: {
            type: "linear",
            min: intervaloVisivel.inicio,
            max: intervaloVisivel.fim,

            grid: {
              display: false
            },

            ticks: {
              color: "#c9ccf5",
              maxTicksLimit: 7,
              maxRotation: 0,

              callback: valor =>
                estado.periodo === "72" ||
                estado.periodo === "168"
                  ? dataHora(valor)
                  : horario(valor)
            }
          },

          y: {
            beginAtZero: true,
            suggestedMax:
              c.unidade === "°C" ? 110 : 100,

            grid: {
              color: "rgba(201,204,245,.11)"
            },

            ticks: {
              color: "#c9ccf5",

              callback: valor =>
                c.unidade === "%"
                  ? `${valor}%`
                  : `${valor} ${c.unidade}`
            }
          }
        },

        plugins: {
          legend: {
            display: false
          },

          tooltip: {
            backgroundColor: "#202957",
            titleColor: "#ffffff",
            bodyColor: "#ffffff",
            borderColor: "#6975c7",
            borderWidth: 1,
            padding: 11,
            displayColors: false,

            // Um tooltip consolidado por janela.
            filter: contexto =>
              contexto.dataset.label ===
                "Mediana (P50)" ||
              contexto.dataset.label ===
                "Leitura",

            callbacks: {
              title: itens => {
                if (!itens.length) return "";

                const bin = bins[
                  itens[0].dataIndex
                ];

                if (bruto) {
                  return (
                    "Coleta: " +
                    dataHoraSegundos(bin.inicio)
                  );
                }

                return (
                  `Janela: ${dataHora(bin.inicio)}` +
                  ` até ${dataHora(bin.fim)}`
                );
              },

              label: contexto => {
                const bin = bins[
                  contexto.dataIndex
                ];

                if (bruto) {
                  return (
                    "Leitura: " +
                    unidade(bin.mediana, c)
                  );
                }

                return [
                  `P10: ${unidade(bin.p10, c)}`,
                  `Mediana: ${unidade(bin.mediana, c)}`,
                  `P90: ${unidade(bin.p90, c)}`,
                  `Máximo: ${unidade(bin.maximo, c)}`
                ];
              },

              afterBody: itens => {
                if (!itens.length) return [];

                const bin = bins[
                  itens[0].dataIndex
                ];

                return [
                  `Limite: ${unidade(c.limite, c)}`,
                  `Leituras válidas: ${bin.quantidade}`,
                  `Acima do limite: ${bin.acima}`
                ];
              }
            }
          }
        }
      }
    }
  );
}


/* ==========================================
   16. FILTROS E ORDENAÇÃO DA TABELA
   ========================================== */

/*
  O gráfico mantém ordem crescente.
  A tabela usa ordem DECRESCENTE:
  a última janela aparece primeiro.

  A busca e o filtro são aplicados antes
  da paginação.
*/

function indicesFiltradosTabela() {
  const c = RECURSOS[estado.recurso];

  const busca = estado.busca
    .trim()
    .toLowerCase();

  const resultado = [];

  // Percorre de trás para frente:
  // MAIS RECENTE -> MAIS ANTIGO.
  for (
    let i = estado.bins.length - 1;
    i >= 0;
    i--
  ) {
    const bin = estado.bins[i];

    if (
      estado.filtroTabela === "acima" &&
      bin.maximo <= c.limite
    ) {
      continue;
    }

    if (busca) {
      const dataFormatada = dataHora(
        bin.inicio
      ).replace(/,/g, "");

      const textoBusca = (
        dataFormatada +
        " " +
        dataISO(bin.inicio)
      ).toLowerCase();

      if (!textoBusca.includes(busca)) {
        continue;
      }
    }

    resultado.push(i);
  }

  return resultado;
}

function atualizarBotoesFiltro() {
  const todas =
    estado.filtroTabela === "todas";

  $("filtro-todas").classList.toggle(
    "ativo",
    todas
  );

  $("filtro-acima").classList.toggle(
    "ativo",
    !todas
  );

  $("filtro-todas").setAttribute(
    "aria-pressed",
    String(todas)
  );

  $("filtro-acima").setAttribute(
    "aria-pressed",
    String(!todas)
  );
}

function limparFiltrosTabela() {
  estado.busca = "";
  estado.filtroTabela = "todas";
  estado.pagina = 0;
  estado.selecionado = -1;

  $("busca-tabela").value = "";

  atualizarBotoesFiltro();
}


/* ==========================================
   17. SELEÇÃO SINCRONIZADA
   ========================================== */

function selecionarJanela(indice) {
  if (
    indice < 0 ||
    indice >= estado.bins.length
  ) {
    return;
  }

  let indices = indicesFiltradosTabela();

  // Se a janela escolhida no gráfico estiver
  // oculta pelos filtros, mostra todas.
  if (!indices.includes(indice)) {
    estado.busca = "";
    estado.filtroTabela = "todas";

    $("busca-tabela").value = "";

    atualizarBotoesFiltro();

    indices = indicesFiltradosTabela();
  }

  estado.selecionado = indice;

  const posicao = indices.indexOf(indice);

  estado.pagina = Math.floor(
    posicao / LINHAS_PAGINA
  );

  renderizarTabela(true);

  if (grafico) {
    grafico.update("none");
  }

  // Posiciona a linha no centro da área rolável.
  const linha = document.querySelector(
    `#corpo-tabela tr[data-indice="${indice}"]`
  );

  if (linha) {
    const rolagem = $("tabela-scroll");

    rolagem.scrollTop = Math.max(
      0,
      linha.offsetTop -
        rolagem.offsetTop -
        rolagem.clientHeight / 2
    );
  }
}


/* ==========================================
   18. DETALHES DA JANELA
   ========================================== */

function renderizarDetalhesJanela() {
  const indice = estado.selecionado;
  const bin = estado.bins[indice];

  if (!bin) {
    $("detalhes-janela").innerHTML = `
      <div class="detalhes-vazio">
        Selecione uma linha para visualizar
        os indicadores da janela.
      </div>
    `;

    return;
  }

  const c = RECURSOS[estado.recurso];

  const bruto =
    estado.resolucao === PASSO;

  const titulo = bruto
    ? `Coleta ${dataHoraSegundos(bin.inicio)}`
    : `Janela ${dataHora(bin.inicio)}`;

  const itens = bruto
    ? [
        ["Leitura", unidade(bin.mediana, c)],
        ["Limite", unidade(c.limite, c)],
        [
          "Acima",
          bin.acima ? "Sim" : "Não"
        ]
      ]
    : [
        ["P10", unidade(bin.p10, c)],
        ["Mediana", unidade(bin.mediana, c)],
        ["P90", unidade(bin.p90, c)],
        ["Máximo", unidade(bin.maximo, c)],
        ["Limite", unidade(c.limite, c)],
        ["Leituras", String(bin.quantidade)]
      ];

  const situacao = bin.maximo > c.limite
    ? `${bin.acima} leitura(s) acima do limite nesta janela. Isso não confirma, por si só, um episódio.`
    : "Nenhuma leitura acima do limite nesta janela.";

  $("detalhes-janela").innerHTML = `
    <div class="detalhes-titulo">
      <strong>${escapar(titulo)}</strong>
      <span>
        ${bruto ? "Coleta individual" : "Valores agrupados"}
      </span>
    </div>

    <div class="detalhes-grid">
      ${itens.map(([nome, valor]) => `
        <div class="detalhe-item">
          <span>${escapar(nome)}</span>
          <strong>${escapar(valor)}</strong>
        </div>
      `).join("")}
    </div>

    <div class="detalhe-alerta">
      ${escapar(situacao)}
    </div>
  `;
}


/* ==========================================
   19. TABELA COM PAGINAÇÃO
   ========================================== */

function renderizarTabela(rolarParaTopo = false) {
  const c = RECURSOS[estado.recurso];

  const bruto =
    estado.resolucao === PASSO;

  const indices = indicesFiltradosTabela();

  const paginas = Math.max(
    1,
    Math.ceil(
      indices.length / LINHAS_PAGINA
    )
  );

  estado.pagina = limitar(
    estado.pagina,
    0,
    paginas - 1
  );

  // Cabeçalhos claros e explicativos.
  const colunas = [
    [
      "Horário ↓",
      "Registros do mais recente para o mais antigo."
    ],
    [
      bruto ? "Leitura" : "Mediana",
      bruto
        ? "Valor registrado nesta coleta."
        : "Valor central da janela: metade das leituras ficou nesse valor ou abaixo."
    ],
    [
      bruto ? "Limite" : "Máximo",
      bruto
        ? "Limite operacional do recurso."
        : "Maior leitura registrada na janela."
    ],
    [
      "Situação",
      "Pico acima indica que a maior leitura ultrapassou o limite. Não significa necessariamente um episódio confirmado."
    ]
  ];

  $("cabecalho-tabela").innerHTML = `
    <tr>
      ${colunas.map(([nome, ajuda]) => `
        <th scope="col">
          ${escapar(nome)}
          ${botaoAjuda(ajuda)}
        </th>
      `).join("")}
    </tr>
  `;

  const inicio =
    estado.pagina * LINHAS_PAGINA;

  const fim = Math.min(
    inicio + LINHAS_PAGINA,
    indices.length
  );

  const visiveis = indices.slice(
    inicio,
    fim
  );

  if (!visiveis.length) {
    $("corpo-tabela").innerHTML = `
      <tr>
        <td colspan="4" class="linha-vazia">
          Nenhum registro encontrado
          para os filtros selecionados.
        </td>
      </tr>
    `;
  } else {
    $("corpo-tabela").innerHTML =
      visiveis.map(indice => {
        const bin = estado.bins[indice];

        const acima =
          bin.maximo > c.limite;

        const mediana = unidade(
          bin.mediana,
          c
        );

        const terceiro = bruto
          ? unidade(c.limite, c)
          : unidade(bin.maximo, c);

        const horarioLinha = bruto
          ? dataHoraSegundos(bin.inicio)
          : dataHora(bin.inicio);

        const situacao = acima
          ? "Pico acima"
          : "Dentro";

        return `
          <tr
            data-indice="${indice}"
            tabindex="0"
            aria-selected="${
              indice === estado.selecionado
            }"
            class="${
              indice === estado.selecionado
                ? "selecionada"
                : ""
            }"
          >

            <td>${escapar(horarioLinha)}</td>

            <td>${escapar(mediana)}</td>

            <td class="${
              acima ? "valor-alto" : ""
            }">
              ${escapar(terceiro)}
            </td>

            <td>
              ${escapar(situacao)}
            </td>

          </tr>
        `;
      }).join("");
  }

  $("total-registros").textContent =
    `${indices.length} de ${estado.bins.length} registros`;

  $("pagina-atual").textContent =
    `Página ${estado.pagina + 1} de ${paginas}`;

  $("pagina-anterior").disabled =
    estado.pagina === 0;

  $("proxima-pagina").disabled =
    estado.pagina >= paginas - 1;

  renderizarDetalhesJanela();

  if (rolarParaTopo) {
    $("tabela-scroll").scrollTop = 0;
  }
}


/* ==========================================
   20. ATUALIZAÇÃO DA DASHBOARD
   ========================================== */

function atualizarDashboard() {
  const c = RECURSOS[estado.recurso];

  const intervalo = intervaloInvestigacao();

  const origem = carregarSerie(
    estado.servidor,
    estado.recurso
  );

  const leituras = filtrarIntervalo(
    origem.dados,
    intervalo.inicio,
    intervalo.fim
  );

  estado.episodios = episodiosNoPeriodo(
    origem.episodios,
    intervalo,
    origem.dados
  );

  // Limpa episódio se ele não existir
  // no período investigado.
  if (
    !estado.episodios.some(
      e => e.id === estado.episodioId
    )
  ) {
    estado.episodioId = "";
    estado.zoom = false;
  }

  // KPIs sempre usam todo o período.
  renderizarKpis(
    intervalo,
    estado.episodios
  );

  renderizarComparacao(intervalo);
  renderizarSeletorEpisodios();
  renderizarResumoEpisodio();

  let inicioVisual = intervalo.inicio;
  let fimVisual = intervalo.fim;

  const episodio = episodioAtual();

  // Zoom: três minutos adicionais
  // antes e depois da ocorrência.
  if (estado.zoom && episodio) {
    inicioVisual = Math.max(
      intervalo.inicio,
      episodio.inicio - 3 * MINUTO
    );

    fimVisual = Math.min(
      intervalo.fim,
      episodio.fim + 3 * MINUTO
    );
  }

  const leiturasVisiveis = estado.zoom
    ? filtrarIntervalo(
        origem.dados,
        inicioVisual,
        fimVisual
      )
    : leituras;

  estado.resolucao = passoVisualizacao();

  estado.bins = agregarLeituras(
    leiturasVisiveis,
    estado.resolucao,
    c.limite
  );

  estado.pagina = 0;
  estado.selecionado = -1;

  $("periodo-ativo").textContent =
    `${intervalo.nome} · ` +
    `${dataHora(intervalo.inicio)} até ` +
    `${dataHora(intervalo.fim - PASSO)}`;

  $("resolucao").textContent =
    nomeResolucao(estado.resolucao);

  $("titulo-grafico").textContent =
    `Evolução temporal — ${c.nome}`;

  $("descricao-grafico").textContent =
    `Servidor ${estado.servidor} · ` +
    `Limite operacional: ${unidade(c.limite, c)}` +
    (estado.zoom ? " · Episódio ampliado" : "");

  $("texto-grafico").textContent =
    estado.resolucao === PASSO
      ? "Cada ponto representa uma coleta de 10 segundos. Clique no gráfico para localizar a coleta na tabela."
      : "Cada ponto resume uma janela. A faixa P10–P90 mostra aproximadamente 80% das leituras. Clique para consultar a janela na tabela.";

  renderizarGrafico();
  renderizarTabela(true);
}


/* ==========================================
   21. EVENTOS
   ========================================== */

function configurarEventos() {
  // Mudança de servidor.
  $("servidor").addEventListener(
    "change",
    e => {
      estado.servidor = e.target.value;
      estado.episodioId = "";
      estado.zoom = false;

      limparFiltrosTabela();
      atualizarDashboard();
    }
  );

  // Mudança de recurso.
  $("recurso").addEventListener(
    "change",
    e => {
      estado.recurso = e.target.value;
      estado.episodioId = "";
      estado.zoom = false;

      limparFiltrosTabela();
      atualizarDashboard();
    }
  );

  // Mudança de período.
  $("periodo").addEventListener(
    "change",
    e => {
      estado.periodo = e.target.value;

      $("campo-data").hidden =
        estado.periodo !== "data";

      if (estado.periodo === "data") {
        estado.data =
          $("data-alvo").value || HOJE;
      }

      estado.episodioId = "";
      estado.zoom = false;

      limparFiltrosTabela();
      atualizarDashboard();
    }
  );

  // Data específica.
  $("data-alvo").addEventListener(
    "change",
    e => {
      const valor = e.target.value;

      if (
        !valor ||
        valor < DATA_MINIMA ||
        valor > HOJE
      ) {
        e.target.value = HOJE;
        estado.data = HOJE;
      } else {
        estado.data = valor;
      }

      estado.episodioId = "";
      estado.zoom = false;

      limparFiltrosTabela();
      atualizarDashboard();
    }
  );

  // Seleção de recurso pelo minigráfico.
  $("comparacao").addEventListener(
    "click",
    e => {
      const botao = e.target.closest(
        "[data-recurso]"
      );

      if (!botao) return;

      const recurso = botao.dataset.recurso;

      if (!RECURSOS[recurso]) return;

      estado.recurso = recurso;
      estado.episodioId = "";
      estado.zoom = false;

      $("recurso").value = recurso;

      limparFiltrosTabela();
      atualizarDashboard();
    }
  );

  // Seleção de episódio.
  $("episodio").addEventListener(
    "change",
    e => {
      estado.episodioId = e.target.value;
      estado.zoom = false;

      limparFiltrosTabela();
      atualizarDashboard();
    }
  );

  // Zoom no episódio.
  $("zoom").addEventListener(
    "click",
    () => {
      if (!episodioAtual()) return;

      estado.zoom = true;

      limparFiltrosTabela();
      atualizarDashboard();
    }
  );

  // Voltar à visão completa.
  $("voltar").addEventListener(
    "click",
    () => {
      estado.zoom = false;

      limparFiltrosTabela();
      atualizarDashboard();
    }
  );

  // Busca por data ou horário.
  $("busca-tabela").addEventListener(
    "input",
    e => {
      estado.busca = e.target.value;
      estado.pagina = 0;

      renderizarTabela(true);
    }
  );

  // Filtro: todas.
  $("filtro-todas").addEventListener(
    "click",
    () => {
      estado.filtroTabela = "todas";
      estado.pagina = 0;

      atualizarBotoesFiltro();
      renderizarTabela(true);
    }
  );

  // Filtro: picos acima do limite.
  $("filtro-acima").addEventListener(
    "click",
    () => {
      estado.filtroTabela = "acima";
      estado.pagina = 0;

      atualizarBotoesFiltro();
      renderizarTabela(true);
    }
  );

  // Página anterior = registros mais recentes.
  $("pagina-anterior").addEventListener(
    "click",
    () => {
      estado.pagina = Math.max(
        0,
        estado.pagina - 1
      );

      renderizarTabela(true);
    }
  );

  // Próxima página = registros mais antigos.
  $("proxima-pagina").addEventListener(
    "click",
    () => {
      estado.pagina++;

      renderizarTabela(true);
    }
  );

  // Clique em uma linha.
  $("corpo-tabela").addEventListener(
    "click",
    e => {
      if (e.target.closest(".ajuda")) return;

      const linha = e.target.closest(
        "tr[data-indice]"
      );

      if (!linha) return;

      selecionarJanela(
        Number(linha.dataset.indice)
      );
    }
  );

  // Teclado na tabela.
  $("corpo-tabela").addEventListener(
    "keydown",
    e => {
      if (
        e.key !== "Enter" &&
        e.key !== " "
      ) {
        return;
      }

      if (e.target.closest(".ajuda")) {
        return;
      }

      const linha = e.target.closest(
        "tr[data-indice]"
      );

      if (!linha) return;

      e.preventDefault();

      selecionarJanela(
        Number(linha.dataset.indice)
      );
    }
  );
}


/* ==========================================
   22. INICIALIZAÇÃO
   ========================================== */

function iniciar() {
  if (typeof Chart === "undefined") {
    $("erro").hidden = false;

    $("erro").textContent =
      "Não foi possível carregar o Chart.js. " +
      "Verifique a conexão com a internet.";

    return;
  }

  Chart.defaults.color = "#c9ccf5";

  Chart.defaults.font.family =
    "Inter, Arial, sans-serif";

  Chart.defaults.font.size = 13;

  configurarCalendario();
  configurarTooltips();
  configurarEventos();

  atualizarBotoesFiltro();

  $("ultima-coleta").textContent =
    `Referência da simulação: ${dataHoraSegundos(AGORA)}`;

  atualizarDashboard();
}

iniciar();
