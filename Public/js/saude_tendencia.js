
/* =====================================================================
   CONSTANTES
   ===================================================================== */
const CAMINHO_ARQUIVO_DADOS = 'montech-dados.json';
const DIAS_HISTORICO_NOS_GRAFICOS = 14;
const DIAS_PREVISTO_VS_REAL = 7;
const MAXIMO_LINHAS_TABELA_ACOES = 8;
const MAXIMO_BARRAS_ACELERACAO = 6;
const MESES_ABREVIADOS = ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez'];
const ROTULO_NIVEL_CONFIANCA = { alta: 'Alta', baixa: 'Baixa' };
const ROTULO_GRAVIDADE = { critico: 'Crítico', atencao: 'Atenção', normal: 'Normal' };
const CLASSES_DE_ESTADO = ['estado-critico', 'estado-atencao', 'estado-normal'];

/* =====================================================================
   ESTADO DA APLICAÇÃO
   ===================================================================== */
const estado = {
  dados: null,                    // conteúdo do JSON
  nomesServidores: [],
  nomesComponentes: [],
  mapaCorrelacoes: new Map(),
  selecao: { servidores: new Set(), componentes: new Set() },
  alcanceDias: 7,
  somenteAltaConfianca: false,
  visaoPainelEsquerdo: 'mapaCalor',   // 'mapaCalor' | 'detalhado'
  pilhaNavegacao: [],
  graficosAtivos: [],
  modal: null                     // { tipo, opcoes, selecaoTemporaria, busca }
};

let CORES = {};   // preenchido a partir das variáveis CSS (fonte única das cores)

/* =====================================================================
   UTILITÁRIOS GERAIS
   ===================================================================== */
const buscarById = id => document.getElementById(id);
const arredondar = (numero, casas = 1) => Math.round(numero * 10 ** casas) / 10 ** casas;
const limitar = (valor, minimo, maximo) => Math.min(maximo, Math.max(minimo, valor));
const lerVariavelCss = nome => getComputedStyle(document.documentElement).getPropertyValue(nome).trim();

function criarElemento(tag, { classe, texto, atributos = {}, dataset = {} } = {}, ...filhos) {
  const elemento = document.createElement(tag);
  if (classe) elemento.className = classe;
  if (texto !== undefined) elemento.textContent = texto;
  Object.entries(atributos).forEach(([nome, valor]) => elemento.setAttribute(nome, valor));
  Object.entries(dataset).forEach(([nome, valor]) => { elemento.dataset[nome] = valor; });
  elemento.append(...filhos);
  return elemento;
}

function carregarCores() {
  CORES = {
    normal: lerVariavelCss('--normal'),
    atencao: lerVariavelCss('--atencao'),
    critico: lerVariavelCss('--critico'),
    texto: lerVariavelCss('--texto'),
    textoSuave: lerVariavelCss('--texto-suave'),
    borda: lerVariavelCss('--borda'),
    projecao: lerVariavelCss('--projecao'),
    barraNegativa: lerVariavelCss('--barra-negativa'),
    barraNeutra: lerVariavelCss('--barra-neutra'),
    linhaAgora: lerVariavelCss('--linha-agora'),
    faixaIncerteza: lerVariavelCss('--faixa-incerteza'),
    fundoRotulo: lerVariavelCss('--fundo-rotulo')
  };
}

/* =====================================================================
   REGRAS DE NEGÓCIO (cálculos sobre os dados do JSON)
   ===================================================================== */
const parametros = () => estado.dados.parametros;
const ehAltaConfianca = confianca => confianca >= parametros().limiarAltaConfianca;
const nivelConfianca = confianca => (ehAltaConfianca(confianca) ? 'alta' : 'baixa');

const servidoresSelecionados = () => estado.nomesServidores.filter(nome => estado.selecao.servidores.has(nome));
const componentesSelecionados = () => estado.nomesComponentes.filter(nome => estado.selecao.componentes.has(nome));

function correlacaoEntre(componenteA, componenteB) {
  if (componenteA === componenteB) return 0;
  const chave = [componenteA, componenteB].sort().join('|');
  return estado.mapaCorrelacoes.get(chave) ?? parametros().correlacaoPadrao;
}

// Selecionar componentes correlacionados melhora a confiança da predição.
function bonusDeConfianca(componente) {
  const { correlacaoMinima, bonusConfiancaMaximo, multiplicadorBonusConfianca } = parametros();
  const soma = componentesSelecionados().reduce((total, outro) => {
    const correlacao = correlacaoEntre(componente, outro);
    return total + (outro === componente || correlacao < correlacaoMinima ? 0 : correlacao * multiplicadorBonusConfianca);
  }, 0);
  return Math.min(bonusConfiancaMaximo, soma);
}

function diasAteLimite(limite, previsao) {
  if (previsao.atual >= limite) return 0;
  return previsao.crescimentoPorDia > 0 ? (limite - previsao.atual) / previsao.crescimentoPorDia : Infinity;
}

function montarPrevisao(servidor, componente) {
  const bruto = estado.dados.servidores[servidor].componentes[componente];
  const previsao = {
    servidor,
    componente,
    atual: bruto.consumoAtual,
    crescimentoPorDia: bruto.crescimentoPorDia,
    confianca: Math.min(99, bruto.confianca + bonusDeConfianca(componente)),
    limiteAtencao: bruto.limiteAtencao,
    limiteCritico: bruto.limiteCritico,
    historico: bruto.historico,
    previstoUltimosDias: bruto.previstoUltimosDias
  };
  previsao.diasAteAtencao = diasAteLimite(previsao.limiteAtencao, previsao);
  previsao.diasAteCritico = diasAteLimite(previsao.limiteCritico, previsao);
  previsao.entraEmAtencao = previsao.diasAteAtencao <= estado.alcanceDias;
  previsao.entraEmCritico = previsao.diasAteCritico <= estado.alcanceDias;
  previsao.pico = Math.min(100, Math.max(previsao.atual, previsao.atual + previsao.crescimentoPorDia * estado.alcanceDias));
  return previsao;
}

const todasPrevisoesSelecionadas = () =>
  servidoresSelecionados().flatMap(servidor => componentesSelecionados().map(componente => montarPrevisao(servidor, componente)));

const gravidade = previsao => (previsao.entraEmCritico ? 'critico' : previsao.entraEmAtencao ? 'atencao' : 'normal');
const pontuacaoUrgencia = previsao =>
  (previsao.entraEmCritico ? 0 : previsao.entraEmAtencao ? 1000 : 2000) + Math.min(previsao.diasAteCritico, previsao.diasAteAtencao, 999);

const contarCriticos = lista => lista.filter(p => p.entraEmCritico).length;
const contarEmAtencao = lista => lista.filter(p => p.entraEmAtencao).length;
const mediaConfianca = lista => (lista.length ? lista.reduce((total, p) => total + p.confianca, 0) / lista.length : 0);

function escolherPor(lista, criterio, maior = false) {
  return lista.reduce((melhor, item) => (!melhor || (maior ? criterio(item) > criterio(melhor) : criterio(item) < criterio(melhor)) ? item : melhor), null);
}

function statusDoServidor(servidor) {
  const previsoes = estado.nomesComponentes.map(componente => montarPrevisao(servidor, componente));
  if (previsoes.some(p => p.entraEmCritico)) return 'critico';
  return previsoes.some(p => p.entraEmAtencao) ? 'atencao' : 'normal';
}

/* ---------- Formatação ---------- */
const variacaoDoPrazo = (previsao, dias) => Math.round(dias * (100 - previsao.confianca) / 100 * 0.8);

function descreverPrazo(previsao, dias) {
  if (!isFinite(dias)) return 'sem previsão de estouro';
  if (dias < 1) return 'já ultrapassou';
  if (ehAltaConfianca(previsao.confianca)) return `aproximadamente ${Math.round(dias)} dias`;
  const variacao = variacaoDoPrazo(previsao, dias);
  return `${Math.max(0, Math.round(dias) - variacao)}–${Math.round(dias) + variacao} dias`;
}

function formatarDataPrevista(diasAPartirDaReferencia) {
  const [ano, mes, dia] = estado.dados.metadados.dataReferencia.split('-').map(Number);
  const data = new Date(ano, mes - 1, dia + Math.round(diasAPartirDaReferencia));
  return `${String(data.getDate()).padStart(2, '0')} de ${MESES_ABREVIADOS[data.getMonth()]}`;
}

function formatarDataHoraAtualizacao(iso) {
  const data = new Date(iso);
  return `${String(data.getDate()).padStart(2, '0')}/${MESES_ABREVIADOS[data.getMonth()]} ${String(data.getHours()).padStart(2, '0')}:${String(data.getMinutes()).padStart(2, '0')}`;
}

const formatarCrescimento = previsao => `+${arredondar(previsao.crescimentoPorDia)} p.p./dia`;

/* ---------- Séries dos gráficos ---------- */
function serieComProjecao(previsao, diasDeHistorico) {
  const historico = previsao.historico.slice(previsao.historico.length - diasDeHistorico);
  const projecao = Array.from({ length: estado.alcanceDias }, (_, k) => limitar(previsao.atual + previsao.crescimentoPorDia * (k + 1), 1, 100));
  return [...historico, ...projecao];
}

function rotulosDoEixoTempo(diasDeHistorico) {
  const passado = Array.from({ length: diasDeHistorico }, (_, k) => {
    const deslocamento = k - diasDeHistorico + 1;
    return deslocamento === 0 ? 'agora' : `${deslocamento}d`;
  });
  const futuro = Array.from({ length: estado.alcanceDias }, (_, k) => `+${k + 1}d`);
  return [...passado, ...futuro];
}

/* =====================================================================
   COMPONENTES DE INTERFACE REUTILIZÁVEIS
   ===================================================================== */
function criarSeloConfianca(confianca) {
  const nivel = nivelConfianca(confianca);
  return criarElemento('span', {
    classe: `selo-confianca selo-confianca--${nivel}`,
    texto: ROTULO_NIVEL_CONFIANCA[nivel],
    atributos: { title: `Confiança ${ROTULO_NIVEL_CONFIANCA[nivel].toLowerCase()}` }
  });
}

function preencherIndicador(idIndicador, { titulo, valor, subtexto, confianca = null, gravidadeIndicador = null, destino = null }) {
  const indicador = buscarById(idIndicador);
  if (titulo !== undefined) indicador.querySelector('.indicador__titulo').textContent = titulo;
  indicador.querySelector('.indicador__valor').textContent = valor;
  indicador.querySelector('.indicador__subtexto').textContent = subtexto;

  const selo = indicador.querySelector('.selo-confianca');
  selo.hidden = confianca === null;
  if (confianca !== null) {
    const nivel = nivelConfianca(confianca);
    selo.className = `selo-confianca selo-confianca--${nivel}`;
    selo.textContent = ROTULO_NIVEL_CONFIANCA[nivel];
    selo.title = `Confiança ${ROTULO_NIVEL_CONFIANCA[nivel].toLowerCase()}`;
  }

  indicador.classList.remove(...CLASSES_DE_ESTADO);
  if (gravidadeIndicador) indicador.classList.add(`estado-${gravidadeIndicador}`);

  const clicavel = destino !== null;
  indicador.classList.toggle('indicador--clicavel', clicavel);
  if (clicavel) {
    indicador.dataset.ir = destino;
    indicador.setAttribute('role', 'button');
    indicador.tabIndex = 0;
  } else {
    delete indicador.dataset.ir;
    indicador.removeAttribute('role');
    indicador.removeAttribute('tabindex');
  }
}

const destinoServidor = previsao => `${previsao.servidor}|`;
const destinoServidorEComponente = previsao => `${previsao.servidor}|${previsao.componente}`;

function descreverComponentesDeFora(lista) {
  const baixa = lista.filter(p => !ehAltaConfianca(p.confianca)).map(p => p.componente);
  if (!baixa.length) return 'Todas as predições têm alta confiança';
  const nomes = baixa.length > 1 ? `${baixa.slice(0, -1).join(', ')} e ${baixa[baixa.length - 1]}` : baixa[0];
  return `Revisar dados de ${nomes}`;
}

/* =====================================================================
   GRÁFICOS (Chart.js)
   ===================================================================== */
const pluginLimites = {
  id: 'limites',
  afterDatasetsDraw(grafico, _argumentos, opcoes) {
    if (!opcoes || !opcoes.ativo) return;
    const { ctx, chartArea: area, scales: escalas } = grafico;
    ctx.save();
    ctx.setLineDash([5, 4]);
    ctx.lineWidth = 1.3;

    if (opcoes.linhasHorizontais && opcoes.limiteAtencao != null) {
      [[opcoes.limiteAtencao, CORES.atencao], [opcoes.limiteCritico, CORES.critico]].forEach(([valor, cor]) => {
        const y = escalas.y.getPixelForValue(valor);
        ctx.strokeStyle = cor;
        ctx.beginPath(); ctx.moveTo(area.left, y); ctx.lineTo(area.right, y); ctx.stroke();
      });
    }

    if (opcoes.limitesPorBarra) {
      ctx.setLineDash([]);
      ctx.lineWidth = 3;
      grafico.getDatasetMeta(0).data.forEach((barra, indice) => {
        const limites = opcoes.limitesPorBarra[indice];
        const meiaAltura = barra.height / 2 + 3;
        [[limites.atencao, CORES.atencao], [limites.critico, CORES.critico]].forEach(([valor, cor]) => {
          const x = escalas.x.getPixelForValue(valor);
          ctx.strokeStyle = cor;
          ctx.beginPath(); ctx.moveTo(x, barra.y - meiaAltura); ctx.lineTo(x, barra.y + meiaAltura); ctx.stroke();
        });
      });
      ctx.setLineDash([5, 4]);
      ctx.lineWidth = 1.3;
    }

    if (opcoes.marcadorAgora != null) {
      const x = escalas.x.getPixelForValue(opcoes.marcadorAgora);
      ctx.strokeStyle = CORES.linhaAgora;
      ctx.beginPath(); ctx.moveTo(x, area.top); ctx.lineTo(x, area.bottom); ctx.stroke();
      ctx.setLineDash([]);
      ctx.fillStyle = CORES.linhaAgora;
      ctx.fillText('agora', x + 4, area.top + 10);
    }
    ctx.restore();
  }
};

const pluginRotuloNaBarra = {
  id: 'rotuloNaBarra',
  afterDatasetsDraw(grafico, _argumentos, opcoes) {
    if (!opcoes || !opcoes.textos) return;
    const { ctx, chartArea: area } = grafico;
    ctx.save();
    ctx.font = '600 13px "Space Grotesk",sans-serif';
    ctx.textBaseline = 'middle';
    grafico.getDatasetMeta(0).data.forEach((barra, indice) => {
      const x = area.left + 8;
      const largura = ctx.measureText(opcoes.textos[indice]).width;
      ctx.fillStyle = CORES.fundoRotulo;
      ctx.fillRect(x - 6, barra.y - 11, largura + 12, 22);
      ctx.fillStyle = '#fff';
      ctx.fillText(opcoes.textos[indice], x, barra.y);
    });
    ctx.restore();
  }
};

function configurarChartJs() {
  Chart.defaults.color = CORES.textoSuave;
  Chart.defaults.borderColor = CORES.borda;
  Chart.defaults.font.family = '"Space Grotesk",system-ui,sans-serif';
  Chart.defaults.maintainAspectRatio = false;
}

function criarGrafico(idCanvas, configuracao) {
  const grafico = new Chart(buscarById(idCanvas), { plugins: [pluginLimites, pluginRotuloNaBarra], ...configuracao });
  estado.graficosAtivos.push(grafico);
  return grafico;
}

function destruirGraficos() {
  estado.graficosAtivos.forEach(grafico => grafico.destroy());
  estado.graficosAtivos = [];
}

function descreverEstadoNaBarra(previsao) {
  if (previsao.entraEmCritico) return `crítico em ${descreverPrazo(previsao, previsao.diasAteCritico)}`;
  if (previsao.entraEmAtencao) return `atenção em ${descreverPrazo(previsao, previsao.diasAteAtencao)}`;
  return 'estável' + (ehAltaConfianca(previsao.confianca) ? '' : ` (conf. ${ROTULO_NIVEL_CONFIANCA[nivelConfianca(previsao.confianca)].toLowerCase()})`);
}

// Barras horizontais com o valor previsto no fim da janela e marcadores de limite
function configurarBarrasDePrevisao(linhas, coresPersonalizadas, exibirRotulosDoEixo = !coresPersonalizadas) {
  return {
    type: 'bar',
    data: {
      labels: linhas.map(l => l.rotulo),
      datasets: [{
        data: linhas.map(l => arredondar(l.pico)),
        backgroundColor: coresPersonalizadas || linhas.map(l => CORES[gravidade(l)]),
        barPercentage: 0.7
      }]
    },
    options: {
      indexAxis: 'y',
      scales: {
        x: { min: 0, max: 100, ticks: { callback: valor => valor + '%' } },
        y: { grid: { display: false }, ticks: { display: exibirRotulosDoEixo, color: CORES.texto, font: { size: 13 } } }
      },
      plugins: {
        legend: { display: false },
        limites: { ativo: true, limitesPorBarra: linhas.map(l => ({ atencao: l.limiteAtencao, critico: l.limiteCritico })) },
        rotuloNaBarra: { textos: linhas.map(descreverEstadoNaBarra) },
        tooltip: {
          callbacks: {
            label: item => {
              const l = linhas[item.dataIndex];
              return `Previsto no fim da janela: ${item.raw}% · atual ${arredondar(l.atual)}% · limites: atenção ${l.limiteAtencao}%, crítico ${l.limiteCritico}%`;
            }
          }
        }
      }
    }
  };
}

/* =====================================================================
   TELAS — cada função preenche a estrutura que já existe no HTML
   ===================================================================== */
function mostrarTela(nomeDaTela) {
  document.querySelectorAll('[data-tela]').forEach(secao => { secao.hidden = secao.dataset.tela !== nomeDaTela; });
}

/* ---------- Tela: visão geral (todos × todos) ---------- */
function desenharVisaoGeral(previsoes) {
  const porServidor = servidoresSelecionados().map(servidor => previsoes.filter(p => p.servidor === servidor)).filter(grupo => grupo.length);
  const servidorMaisCriticos = escolherPor(porServidor, contarCriticos, true);
  const servidorMaisAtencao = escolherPor(porServidor, contarEmAtencao, true);
  const maisProximoDoCritico = escolherPor(previsoes, p => p.diasAteCritico);
  const maiorCrescimento = escolherPor(previsoes, p => p.crescimentoPorDia, true);

  const totalCriticos = contarCriticos(servidorMaisCriticos);
  preencherIndicador('indicadorServidorMaisCriticos', {
    valor: totalCriticos ? servidorMaisCriticos[0].servidor : 'Nenhum',
    subtexto: `${totalCriticos} componente(s) devem ficar críticos`,
    confianca: mediaConfianca(servidorMaisCriticos),
    gravidadeIndicador: totalCriticos ? 'critico' : 'normal',
    destino: totalCriticos ? destinoServidor(servidorMaisCriticos[0]) : null
  });
  preencherIndicador('indicadorComponenteMaisProximoCritico', {
    valor: isFinite(maisProximoDoCritico.diasAteCritico) ? `${maisProximoDoCritico.servidor} · ${maisProximoDoCritico.componente}` : 'Nenhum',
    subtexto: descreverPrazo(maisProximoDoCritico, maisProximoDoCritico.diasAteCritico),
    confianca: maisProximoDoCritico.confianca,
    gravidadeIndicador: gravidade(maisProximoDoCritico),
    destino: destinoServidorEComponente(maisProximoDoCritico)
  });
  preencherIndicador('indicadorMaiorCrescimentoGeral', {
    valor: `${maiorCrescimento.servidor} · ${maiorCrescimento.componente}`,
    subtexto: formatarCrescimento(maiorCrescimento),
    confianca: maiorCrescimento.confianca,
    gravidadeIndicador: gravidade(maiorCrescimento),
    destino: destinoServidorEComponente(maiorCrescimento)
  });
  const totalEmAtencao = contarEmAtencao(servidorMaisAtencao);
  preencherIndicador('indicadorServidorMaisAtencao', {
    valor: totalEmAtencao ? servidorMaisAtencao[0].servidor : 'Nenhum',
    subtexto: `${totalEmAtencao} componente(s) passam do limite`,
    confianca: mediaConfianca(servidorMaisAtencao),
    gravidadeIndicador: totalEmAtencao ? 'atencao' : 'normal',
    destino: totalEmAtencao ? destinoServidor(servidorMaisAtencao[0]) : null
  });

  desenharMapaDeCalor();
  desenharTabelaDeAcoes(previsoes);
  desenharGraficoDeAceleracao(previsoes);
  aplicarVisaoDoPainelEsquerdo();
}

function desenharMapaDeCalor() {
  const colunas = componentesSelecionados();
  const mapa = buscarById('mapaCalor');
  const horizonte = parametros().horizonteMaximoDias;
  mapa.replaceChildren();
  mapa.style.gridTemplateColumns = `110px repeat(${colunas.length},1fr)`;
  mapa.append(criarElemento('span'), ...colunas.map(c => criarElemento('span', { classe: 'mapa-calor__coluna', texto: c })));

  servidoresSelecionados().forEach(servidor => {
    mapa.append(criarElemento('span', { classe: 'mapa-calor__linha', texto: servidor }));
    colunas.forEach(componente => {
      const previsao = montarPrevisao(servidor, componente);
      if (estado.somenteAltaConfianca && !ehAltaConfianca(previsao.confianca)) {
        mapa.append(criarElemento('div', { classe: 'celula celula--oculta', texto: '·' }));
        return;
      }
      const classes = ['celula'];
      if (previsao.entraEmCritico) classes.push('estado-critico');
      else if (previsao.entraEmAtencao) classes.push('estado-atencao');
      if (!ehAltaConfianca(previsao.confianca)) classes.push('celula--baixa-confianca');
      const dias = isFinite(previsao.diasAteAtencao) && previsao.diasAteAtencao <= horizonte
        ? `${Math.max(0, Math.ceil(previsao.diasAteAtencao))} d`
        : `>${horizonte} d`;
      mapa.append(criarElemento('div', {
        classe: classes.join(' '),
        texto: dias,
        atributos: { title: `${servidor} · ${componente} · confiança ${ROTULO_NIVEL_CONFIANCA[nivelConfianca(previsao.confianca)].toLowerCase()}` },
        dataset: { ir: destinoServidorEComponente(previsao) }
      }));
    });
  });
}

function desenharTabelaDeAcoes(previsoes) {
  const urgentes = previsoes.filter(p => p.entraEmAtencao).sort((a, b) => pontuacaoUrgencia(a) - pontuacaoUrgencia(b)).slice(0, MAXIMO_LINHAS_TABELA_ACOES);
  const corpo = buscarById('corpoTabelaAcoes');
  corpo.replaceChildren(...urgentes.map(p => criarElemento('tr', { classe: 'linha-clicavel', dataset: { ir: destinoServidorEComponente(p) } },
    criarElemento('td', { texto: p.servidor }),
    criarElemento('td', { texto: p.componente }),
    criarElemento('td', {}, criarElemento('span', {
      classe: `etiqueta-estado estado-${p.entraEmCritico ? 'critico' : 'atencao'}`,
      texto: p.entraEmCritico ? 'Crítico' : 'Atenção'
    })),
    criarElemento('td', { texto: descreverPrazo(p, p.entraEmCritico ? p.diasAteCritico : p.diasAteAtencao) }),
    criarElemento('td', {}, criarSeloConfianca(p.confianca))
  )));
  buscarById('mensagemSemAlertas').hidden = urgentes.length > 0;
}

function desenharGraficoDeAceleracao(previsoes) {
  const emAlta = previsoes.filter(p => p.crescimentoPorDia > 0).sort((a, b) => b.crescimentoPorDia - a.crescimentoPorDia).slice(0, MAXIMO_BARRAS_ACELERACAO);
  buscarById('areaGraficoAceleracao').hidden = emAlta.length === 0;
  buscarById('mensagemSemAceleracao').hidden = emAlta.length > 0;
  if (!emAlta.length) return;

  criarGrafico('graficoAceleracao', {
    type: 'bar',
    data: {
      labels: emAlta.map(p => [p.servidor, p.componente]),
      datasets: [{ data: emAlta.map(p => arredondar(p.crescimentoPorDia)), backgroundColor: emAlta.map(p => CORES[gravidade(p)]), barPercentage: 0.7 }]
    },
    options: {
      indexAxis: 'y',
      layout: { padding: { right: 8 } },
      scales: {
        x: { min: 0, ticks: { callback: valor => '+' + valor } },
        y: { grid: { display: false }, ticks: { color: CORES.texto, font: { size: 12 } } }
      },
      plugins: {
        legend: { display: false },
        rotuloNaBarra: { textos: emAlta.map(p => `+${arredondar(p.crescimentoPorDia)} p.p./dia`) },
        tooltip: {
          callbacks: {
            title: itens => `${emAlta[itens[0].dataIndex].servidor} · ${emAlta[itens[0].dataIndex].componente}`,
            label: item => `+${item.raw} p.p./dia · atual ${arredondar(emAlta[item.dataIndex].atual)}% · confiança ${ROTULO_NIVEL_CONFIANCA[nivelConfianca(emAlta[item.dataIndex].confianca)].toLowerCase()}`
          }
        }
      }
    }
  });
}

function aplicarVisaoDoPainelEsquerdo() {
  document.querySelectorAll('[data-visao-painel]').forEach(bloco => { bloco.hidden = bloco.dataset.visaoPainel !== estado.visaoPainelEsquerdo; });
  document.querySelectorAll('[data-visao]').forEach(botao => botao.setAttribute('aria-pressed', String(botao.dataset.visao === estado.visaoPainelEsquerdo)));
}

/* ---------- Tela: vários servidores × um componente ---------- */
function desenharVisaoPorComponente(previsoes, todas) {
  const componente = componentesSelecionados()[0];
  const linhas = previsoes.map(p => ({ ...p, rotulo: p.servidor })).sort((a, b) => pontuacaoUrgencia(a) - pontuacaoUrgencia(b));
  const maiorPico = escolherPor(previsoes, p => p.pico, true);
  const maiorCrescimento = escolherPor(previsoes, p => p.crescimentoPorDia, true);
  const maisProximo = escolherPor(previsoes, p => p.diasAteAtencao);
  const baixaConfianca = todas.filter(p => !ehAltaConfianca(p.confianca)).length;

  preencherIndicador('indicadorMaiorPicoPrevisto', {
    titulo: `Maior pico previsto de ${componente}`,
    valor: `${maiorPico.servidor} · ${arredondar(maiorPico.pico)}%`,
    subtexto: `até ${formatarDataPrevista(estado.alcanceDias)}`,
    confianca: maiorPico.confianca,
    gravidadeIndicador: gravidade(maiorPico),
    destino: destinoServidor(maiorPico)
  });
  preencherIndicador('indicadorMaiorCrescimentoComponente', {
    valor: maiorCrescimento.servidor,
    subtexto: formatarCrescimento(maiorCrescimento),
    confianca: maiorCrescimento.confianca,
    gravidadeIndicador: gravidade(maiorCrescimento),
    destino: destinoServidor(maiorCrescimento)
  });
  preencherIndicador('indicadorMaisProximoAtencaoComponente', {
    valor: isFinite(maisProximo.diasAteAtencao) ? maisProximo.servidor : 'Nenhum',
    subtexto: descreverPrazo(maisProximo, maisProximo.diasAteAtencao),
    confianca: maisProximo.confianca,
    gravidadeIndicador: gravidade(maisProximo),
    destino: destinoServidor(maisProximo)
  });
  preencherIndicador('indicadorPrevisoesAltaConfianca', {
    valor: `${todas.length - baixaConfianca} / ${todas.length}`,
    subtexto: baixaConfianca ? `${baixaConfianca} ${baixaConfianca > 1 ? 'séries' : 'série'} com baixa confiança` : 'Todas as séries com alta confiança',
    gravidadeIndicador: baixaConfianca ? 'atencao' : 'normal'
  });

  buscarById('tituloGraficoPorServidor').textContent = `${componente} por servidor`;
  const corDoServidor = servidor => estado.dados.servidores[servidor].corNoGrafico;

  // Legenda clicável (mostra/oculta servidores nos dois gráficos)
  const servidoresOcultos = new Set();
  const legenda = buscarById('legendaServidores');
  legenda.replaceChildren(...previsoes.map(p => criarElemento('button', {
    classe: 'legenda-servidores__botao', atributos: { type: 'button' }, dataset: { servidor: p.servidor }
  }, criarElemento('i', { classe: 'legenda-servidores__bolinha', atributos: { style: `background:${corDoServidor(p.servidor)}` } }), document.createTextNode(p.servidor))));

  let graficoBarras = null;
  const desenharBarras = () => {
    if (graficoBarras) {
      graficoBarras.destroy();
      estado.graficosAtivos = estado.graficosAtivos.filter(g => g !== graficoBarras);
    }
    const visiveis = linhas.filter(l => !servidoresOcultos.has(l.servidor));
    graficoBarras = criarGrafico('graficoComponentePorServidor', configurarBarrasDePrevisao(visiveis, visiveis.map(l => corDoServidor(l.servidor))));
  };
  desenharBarras();

  const dias = DIAS_HISTORICO_NOS_GRAFICOS;
  const graficoProjecao = criarGrafico('graficoProjecaoServidores', {
    type: 'line',
    data: {
      labels: rotulosDoEixoTempo(dias),
      datasets: previsoes.map(p => ({
        label: p.servidor,
        data: serieComProjecao(p, dias),
        borderColor: corDoServidor(p.servidor),
        backgroundColor: corDoServidor(p.servidor),
        pointRadius: 0,
        tension: 0.25,
        borderWidth: 3,
        segment: {
          borderDash: trecho => (trecho.p0DataIndex >= dias - 1 ? [5, 4] : undefined),
          borderColor: trecho => {
            const maximo = Math.max(trecho.p0.parsed.y, trecho.p1.parsed.y);
            return maximo >= p.limiteCritico ? CORES.critico : maximo >= p.limiteAtencao ? CORES.atencao : corDoServidor(p.servidor);
          }
        }
      }))
    },
    options: {
      scales: { y: { min: 0, max: 100, ticks: { callback: valor => valor + '%' } }, x: { ticks: { maxTicksLimit: 8 } } },
      plugins: { legend: { display: false }, limites: { ativo: true, marcadorAgora: dias - 1 } },
      interaction: { mode: 'nearest', intersect: false }
    }
  });

  legenda.onclick = evento => {
    const botao = evento.target.closest('button');
    if (!botao) return;
    const servidor = botao.dataset.servidor;
    const ficouOculto = !servidoresOcultos.has(servidor);
    ficouOculto ? servidoresOcultos.add(servidor) : servidoresOcultos.delete(servidor);
    botao.classList.toggle('legenda-servidores__botao--oculto', ficouOculto);
    desenharBarras();
    graficoProjecao.setDatasetVisibility(previsoes.findIndex(p => p.servidor === servidor), !ficouOculto);
    graficoProjecao.update();
  };
}

/* ---------- Tela: um servidor × vários componentes ---------- */
function desenharVisaoPorServidor(previsoes, todas) {
  const servidor = servidoresSelecionados()[0];
  const linhas = previsoes.map(p => ({ ...p, rotulo: p.componente })).sort((a, b) => pontuacaoUrgencia(a) - pontuacaoUrgencia(b));
  const porCrescimento = [...previsoes].sort((a, b) => b.crescimentoPorDia - a.crescimentoPorDia);
  const totalCriticos = contarCriticos(previsoes);
  const totalEmAtencao = contarEmAtencao(previsoes);
  const maisProximo = escolherPor(previsoes, p => p.diasAteAtencao);
  const maiorCrescimento = porCrescimento[0];
  const confiaveis = todas.filter(p => ehAltaConfianca(p.confianca)).length;

  preencherIndicador('indicadorSaudeComponentes', {
    valor: `${previsoes.length - totalEmAtencao} de ${previsoes.length} saudáveis`,
    subtexto: `${totalEmAtencao - totalCriticos} em atenção · ${totalCriticos} críticos`,
    confianca: mediaConfianca(previsoes),
    gravidadeIndicador: totalCriticos ? 'critico' : totalEmAtencao ? 'atencao' : 'normal'
  });
  preencherIndicador('indicadorMaisProximoAtencaoServidor', {
    valor: isFinite(maisProximo.diasAteAtencao) ? maisProximo.componente : 'Nenhum',
    subtexto: descreverPrazo(maisProximo, maisProximo.diasAteAtencao),
    confianca: maisProximo.confianca,
    gravidadeIndicador: gravidade(maisProximo),
    destino: `${servidor}|${maisProximo.componente}`
  });
  preencherIndicador('indicadorMaiorCrescimentoServidor', {
    valor: maiorCrescimento.componente,
    subtexto: formatarCrescimento(maiorCrescimento),
    confianca: maiorCrescimento.confianca,
    gravidadeIndicador: gravidade(maiorCrescimento),
    destino: `${servidor}|${maiorCrescimento.componente}`
  });
  preencherIndicador('indicadorPredicoesConfiaveis', {
    valor: `${confiaveis} de ${todas.length}`,
    subtexto: descreverComponentesDeFora(todas),
    gravidadeIndicador: confiaveis < todas.length ? 'atencao' : 'normal'
  });

  criarGrafico('graficoTempoAteLimites', configurarBarrasDePrevisao(linhas, linhas.map(() => CORES.barraNeutra), true));
  criarGrafico('graficoRankingCrescimento', {
    type: 'bar',
    data: {
      labels: porCrescimento.map(p => p.componente),
      datasets: [{
        data: porCrescimento.map(p => arredondar(p.crescimentoPorDia)),
        backgroundColor: porCrescimento.map(p => (p.crescimentoPorDia > 0 ? CORES.normal : CORES.barraNegativa))
      }]
    },
    options: { indexAxis: 'y', scales: { y: { grid: { display: false } } }, plugins: { legend: { display: false } } }
  });
}

/* ---------- Tela: detalhe (um servidor × um componente) ---------- */
function desenharDetalhe(previsao) {
  const dias = estado.dados.metadados.diasDeHistorico;
  const passaDoLimite = isFinite(previsao.diasAteAtencao);
  const altaConfianca = ehAltaConfianca(previsao.confianca);
  const estadoPrevisao = gravidade(previsao);

  preencherIndicador('indicadorTaxaCrescimento', {
    valor: `${previsao.crescimentoPorDia >= 0 ? '+' : ''}${arredondar(previsao.crescimentoPorDia)} p.p./dia`,
    subtexto: `consumo atual ${arredondar(previsao.atual)}% · atenção em ${previsao.limiteAtencao}%`,
    gravidadeIndicador: estadoPrevisao
  });
  preencherIndicador('indicadorPassaLimiteAtencao', {
    valor: passaDoLimite ? (previsao.diasAteAtencao < 1 ? 'Já passou' : formatarDataPrevista(previsao.diasAteAtencao)) : 'Não passa',
    subtexto: passaDoLimite ? descreverPrazo(previsao, previsao.diasAteAtencao) : 'sem tendência de alta',
    confianca: previsao.confianca,
    gravidadeIndicador: estadoPrevisao
  });
  preencherIndicador('indicadorPicoPrevisto', {
    valor: `${arredondar(previsao.pico)}%`,
    subtexto: `em ${formatarDataPrevista(estado.alcanceDias)} (fim da janela)`,
    confianca: previsao.confianca,
    gravidadeIndicador: estadoPrevisao
  });
  preencherIndicador('indicadorConfiancaPredicao', {
    valor: ROTULO_NIVEL_CONFIANCA[nivelConfianca(previsao.confianca)],
    subtexto: altaConfianca ? 'dados suficientes e modelo estável' : 'histórico ou variação limitam a precisão',
    confianca: previsao.confianca,
    gravidadeIndicador: estadoPrevisao
  });

  buscarById('tituloGraficoDetalhe').textContent = `${previsao.servidor} · ${previsao.componente}`;
  buscarById('descricaoGraficoDetalhe').textContent = `Histórico, projeção e faixa de incerteza · atenção em ${previsao.limiteAtencao}% · crítico em ${previsao.limiteCritico}%`;

  const projecao = serieComProjecao(previsao, dias).slice(dias);
  const incerteza = 100 - previsao.confianca;
  const vazios = Array(dias - 1).fill(null);
  const faixaSuperior = [...vazios, previsao.atual, ...projecao.map((v, k) => Math.min(100, v + incerteza * 0.06 * Math.sqrt(k + 1) * 2))];
  const faixaInferior = [...vazios, previsao.atual, ...projecao.map((v, k) => Math.max(0, v - incerteza * 0.06 * Math.sqrt(k + 1) * 2))];

  criarGrafico('graficoDetalheProjecao', {
    type: 'line',
    data: {
      labels: rotulosDoEixoTempo(dias),
      datasets: [
        { data: faixaInferior, borderWidth: 0, pointRadius: 0, tension: 0.25 },
        { label: 'Faixa de incerteza', data: faixaSuperior, borderWidth: 0, pointRadius: 0, tension: 0.25, fill: '-1', backgroundColor: CORES.faixaIncerteza },
        { label: 'Histórico', data: previsao.historico, borderColor: CORES.normal, pointRadius: 0, borderWidth: 2, tension: 0.25 },
        { label: 'Projeção', data: [...vazios, previsao.atual, ...projecao], borderColor: CORES.projecao, borderDash: [6, 4], pointRadius: 0, borderWidth: 2, tension: 0.25 }
      ]
    },
    options: {
      scales: { y: { min: 0, max: 100, ticks: { callback: valor => valor + '%' } }, x: { ticks: { maxTicksLimit: 10 } } },
      plugins: {
        legend: { position: 'bottom', labels: { boxWidth: 10, filter: item => item.datasetIndex > 0 } },
        limites: { ativo: true, linhasHorizontais: true, limiteAtencao: previsao.limiteAtencao, limiteCritico: previsao.limiteCritico, marcadorAgora: dias - 1 }
      },
      interaction: { mode: 'index', intersect: false }
    }
  });

  const real = previsao.historico.slice(-DIAS_PREVISTO_VS_REAL);
  criarGrafico('graficoPrevistoVsReal', {
    type: 'line',
    data: {
      labels: real.map((_, k) => (k - (DIAS_PREVISTO_VS_REAL - 1) === 0 ? 'hoje' : `${k - (DIAS_PREVISTO_VS_REAL - 1)}d`)),
      datasets: [
        { label: 'Real', data: real, borderColor: CORES.normal, pointRadius: 2, borderWidth: 2 },
        { label: 'Previsto', data: previsao.previstoUltimosDias, borderColor: CORES.atencao, borderDash: [4, 3], pointRadius: 2, borderWidth: 2 }
      ]
    },
    options: { scales: { y: { ticks: { callback: valor => valor + '%' } } }, plugins: { legend: { position: 'bottom', labels: { boxWidth: 10 } } } }
  });
}

/* =====================================================================
   RENDERIZAÇÃO PRINCIPAL
   ===================================================================== */
function atualizarRotulosDosFiltros() {
  const rotulo = (selecionados, total, nomes) =>
    selecionados.size === total ? 'Todos' : selecionados.size === 1 ? nomes.find(n => selecionados.has(n)) : `${selecionados.size} selecionados`;
  buscarById('rotuloServidores').textContent = rotulo(estado.selecao.servidores, estado.nomesServidores.length, estado.nomesServidores);
  buscarById('rotuloComponentes').textContent = rotulo(estado.selecao.componentes, estado.nomesComponentes.length, estado.nomesComponentes);
}

function atualizarCabecalhoEAvisos(todas, ocultas) {
  const totalServidores = estado.selecao.servidores.size;
  const totalComponentes = estado.selecao.componentes.size;
  buscarById('escopoSelecionado').textContent =
    `${totalServidores === estado.nomesServidores.length ? 'Todos os servidores' : `${totalServidores} servidor(es)`} · ` +
    `${totalComponentes === estado.nomesComponentes.length ? 'todos os componentes' : `${totalComponentes} componente(s)`} · ` +
    `próximos ${estado.alcanceDias === 1 ? '24 horas' : `${estado.alcanceDias} dias`}`;

  const urgentes = ocultas.filter(p => p.diasAteAtencao <= 2).length;
  buscarById('avisoPrevisoesOcultas').hidden = ocultas.length === 0;
  buscarById('textoAvisoOcultas').textContent = `${ocultas.length} previsões de baixa confiança estão ocultas${urgentes ? ` (${urgentes} com prazo menor que 48h)` : ''}.`;

  buscarById('migalhaNavegacao').hidden = estado.pilhaNavegacao.length === 0;

  const { diasDeHistorico, atualizadoEm, origemDosDados } = estado.dados.metadados;
}

function desenhar() {
  destruirGraficos();
  const todas = todasPrevisoesSelecionadas();
  const ocultas = estado.somenteAltaConfianca ? todas.filter(p => !ehAltaConfianca(p.confianca)) : [];
  const visiveis = estado.somenteAltaConfianca ? todas.filter(p => ehAltaConfianca(p.confianca)) : todas;
  const varios = { servidores: estado.selecao.servidores.size > 1, componentes: estado.selecao.componentes.size > 1 };

  atualizarCabecalhoEAvisos(todas, ocultas);

  if (!visiveis.length) return mostrarTela('vazia');
  if (varios.servidores && varios.componentes) { mostrarTela('visaoGeral'); desenharVisaoGeral(visiveis); }
  else if (varios.servidores) { mostrarTela('componenteUnico'); desenharVisaoPorComponente(visiveis, todas); }
  else if (varios.componentes) { mostrarTela('servidorUnico'); desenharVisaoPorServidor(visiveis, todas); }
  else { mostrarTela('detalhe'); desenharDetalhe(visiveis[0]); }
}

/* =====================================================================
   NAVEGAÇÃO (drill-down e voltar)
   ===================================================================== */
function irPara(servidor, componente) {
  estado.pilhaNavegacao.push({ servidores: new Set(estado.selecao.servidores), componentes: new Set(estado.selecao.componentes) });
  if (servidor) estado.selecao.servidores = new Set([servidor]);
  if (componente) estado.selecao.componentes = new Set([componente]);
  atualizarRotulosDosFiltros();
  desenhar();
}

function voltar() {
  const anterior = estado.pilhaNavegacao.pop();
  if (!anterior) return;
  estado.selecao.servidores = anterior.servidores;
  estado.selecao.componentes = anterior.componentes;
  atualizarRotulosDosFiltros();
  desenhar();
}

/* =====================================================================
   MODAL DE SELEÇÃO
   ===================================================================== */
function abrirModal(tipo) {
  const opcoes = tipo === 'servidores' ? estado.nomesServidores : estado.nomesComponentes;
  estado.modal = { tipo, opcoes, selecaoTemporaria: new Set(estado.selecao[tipo]), busca: '' };
  buscarById('tituloModal').textContent = `Selecionar ${tipo}`;
  buscarById('ajudaModal').textContent = `Escolha quais ${tipo} serão considerados nas visualizações do dashboard.`;
  const campoBusca = buscarById('campoBuscaModal');
  campoBusca.hidden = tipo !== 'servidores';
  campoBusca.value = '';
  buscarById('modalSelecao').hidden = false;
  renderizarModal();
  if (!campoBusca.hidden) campoBusca.focus();
}

function fecharModal() {
  estado.modal = null;
  buscarById('modalSelecao').hidden = true;
  buscarById('modalLista').replaceChildren();
}

function renderizarModal() {
  const { tipo, opcoes, selecaoTemporaria, busca } = estado.modal;
  const filtradas = opcoes.filter(nome => nome.toLowerCase().includes(busca.toLowerCase()));

  buscarById('modalSelecionarTodos').checked = selecaoTemporaria.size === opcoes.length;
  buscarById('modalContagem').textContent = `${selecaoTemporaria.size} de ${opcoes.length} selecionados`;
  buscarById('modalAplicar').disabled = selecaoTemporaria.size === 0;

  const lista = buscarById('modalLista');
  if (!filtradas.length) {
    lista.replaceChildren(criarElemento('div', { classe: 'vazio', texto: `Nenhum ${tipo === 'servidores' ? 'servidor' : 'componente'} encontrado. Não há resultados para "${busca}".` }));
    return;
  }
  lista.replaceChildren(...filtradas.map(nome => {
    const marcado = selecaoTemporaria.has(nome);
    const item = criarElemento('label', { classe: `item-selecao${marcado ? ' item-selecao--ativo' : ''}` },
      criarElemento('input', { atributos: { type: 'checkbox' }, dataset: { nome } }),
      document.createTextNode(nome));
    item.querySelector('input').checked = marcado;
    if (tipo === 'servidores') {
      const status = statusDoServidor(nome);
      item.append(criarElemento('em', { classe: `estado-${status}`, texto: `● ${ROTULO_GRAVIDADE[status]}` }));
    }
    return item;
  }));
}

function aplicarSelecaoDoModal() {
  const { tipo, selecaoTemporaria } = estado.modal;
  estado.selecao[tipo] = new Set(selecaoTemporaria);
  estado.pilhaNavegacao = [];
  fecharModal();
  atualizarRotulosDosFiltros();
  desenhar();
}

/* =====================================================================
   EVENTOS
   ===================================================================== */
function registrarEventos() {
  buscarById('seletorAlcance').addEventListener('change', evento => {
    estado.alcanceDias = Number(evento.target.value);
    estado.pilhaNavegacao = [];
    desenhar();
  });

  buscarById('filtroAltaConfianca').addEventListener('change', evento => {
    estado.somenteAltaConfianca = evento.target.checked;
    estado.pilhaNavegacao = [];
    desenhar();
  });

  buscarById('botaoMostrarTodas').addEventListener('click', () => {
    estado.somenteAltaConfianca = false;
    buscarById('filtroAltaConfianca').checked = false;
    desenhar();
  });

  buscarById('botaoVoltar').addEventListener('click', voltar);

  document.addEventListener('click', evento => {
    const botaoVisao = evento.target.closest('[data-visao]');
    if (botaoVisao) { estado.visaoPainelEsquerdo = botaoVisao.dataset.visao; aplicarVisaoDoPainelEsquerdo(); return; }

    const botaoModal = evento.target.closest('[data-abrir-modal]');
    if (botaoModal) { abrirModal(botaoModal.dataset.abrirModal); return; }

    const destino = evento.target.closest('[data-ir]');
    if (destino) {
      const [servidor, componente] = destino.dataset.ir.split('|');
      irPara(servidor || null, componente || null);
    }
  });

  // Indicadores clicáveis também respondem ao teclado
  document.addEventListener('keydown', evento => {
    if (evento.key === 'Escape' && estado.modal) { fecharModal(); return; }
    if ((evento.key === 'Enter' || evento.key === ' ') && evento.target.matches('.indicador--clicavel')) {
      evento.preventDefault();
      evento.target.click();
    }
  });

  // Modal
  buscarById('botaoFecharModal').addEventListener('click', fecharModal);
  buscarById('modalCancelar').addEventListener('click', fecharModal);
  buscarById('modalSelecao').addEventListener('click', evento => { if (evento.target.id === 'modalSelecao') fecharModal(); });
  buscarById('modalAplicar').addEventListener('click', aplicarSelecaoDoModal);
  buscarById('modalLimparSelecao').addEventListener('click', () => { estado.modal.selecaoTemporaria = new Set(); renderizarModal(); });
  buscarById('campoBuscaModal').addEventListener('input', evento => { estado.modal.busca = evento.target.value; renderizarModal(); });
  buscarById('modalSelecionarTodos').addEventListener('change', evento => {
    estado.modal.selecaoTemporaria = evento.target.checked ? new Set(estado.modal.opcoes) : new Set();
    renderizarModal();
  });
  buscarById('modalLista').addEventListener('change', evento => {
    const nome = evento.target.dataset.nome;
    if (nome === undefined) return;
    evento.target.checked ? estado.modal.selecaoTemporaria.add(nome) : estado.modal.selecaoTemporaria.delete(nome);
    renderizarModal();
  });

  // Seleção manual do arquivo de dados (alternativa quando fetch não é possível)
  buscarById('campoArquivoDados').addEventListener('change', async evento => {
    const arquivo = evento.target.files[0];
    if (!arquivo) return;
    try { inicializar(JSON.parse(await arquivo.text())); }
    catch (erro) { mostrarErroDeCarregamento(erro); }
  });
}

/* =====================================================================
   CARREGAMENTO DOS DADOS E INICIALIZAÇÃO
   ===================================================================== */
function validarDados(dados) {
  const valido = dados && dados.metadados && dados.parametros && dados.servidores && Object.keys(dados.servidores).length;
  if (!valido) throw new Error('O arquivo não tem a estrutura esperada (metadados, parametros e servidores).');
}

function mostrarErroDeCarregamento(erro) {
  buscarById('painelCarregamento').hidden = false;
  buscarById('conteudoPrincipal').hidden = true;
  buscarById('painelCarregamento').querySelector('h2').textContent = 'Não foi possível carregar os dados';
  buscarById('mensagemCarregamento').textContent = `${erro.message}`;
  buscarById('areaSelecaoArquivo').hidden = false;
}

function inicializar(dados) {
  validarDados(dados);
  estado.dados = dados;
  estado.nomesServidores = Object.keys(dados.servidores);
  estado.nomesComponentes = [...new Set(estado.nomesServidores.flatMap(s => Object.keys(dados.servidores[s].componentes)))];
  estado.mapaCorrelacoes = new Map((dados.correlacoes || []).map(c => [[...c.componentes].sort().join('|'), c.coeficiente]));
  estado.selecao = { servidores: new Set(estado.nomesServidores), componentes: new Set(estado.nomesComponentes) };
  estado.pilhaNavegacao = [];

  carregarCores();
  configurarChartJs();
  buscarById('painelCarregamento').hidden = true;
  buscarById('conteudoPrincipal').hidden = false;
  atualizarRotulosDosFiltros();
  desenhar();
}

async function iniciar() {
  registrarEventos();
  try {
    const resposta = await fetch(CAMINHO_ARQUIVO_DADOS);
    if (!resposta.ok) throw new Error(`Falha ao ler ${CAMINHO_ARQUIVO_DADOS} (HTTP ${resposta.status}).`);
    inicializar(await resposta.json());
  } catch (erro) {
    mostrarErroDeCarregamento(erro);
  }
  if (document.fonts) document.fonts.ready.then(() => { if (estado.dados) desenhar(); });
}

iniciar();
