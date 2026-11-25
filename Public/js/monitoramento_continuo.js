// Dados que virão do banco de dados pelo JSON do bucket Gold

var SERVIDORES_DB = [
    { n: "GRU-SPA", d: "Planos de voo e informações aeronáuticas" },
    { n: "GRU-SDV", d: "Dados de vigilância e trilhas" },
    { n: "GRU-AIS", d: "Serviço de informação aeronáutica" }
];

var T = {
    "GRU-SPA": { c: [70, 90], r: [85, 92], k: [75, 90], t: [75, 85] },
    "GRU-SDV": { c: [75, 92], r: [80, 90], k: [70, 85], t: [72, 82] },
    "GRU-AIS": { c: [65, 85], r: [88, 95], k: [72, 88], t: [70, 80] }
};

// Variáveis que serão preenchidas pelo JSON do bucket Gold

var S = [];
var H = {}; // Histórioco para grafico
var P = {}; // processos

async function carregarDadosGold() {
    var resp = await fetch("../data/gold_monitoramento.json?t=" + Date.now(), { cache: "no-store" });
    var gold = await resp.json();

    S = SERVIDORES_DB.map(function (srv) {
        var g = gold.servidores[srv.n];
        var m = g.metricas_atuais;

        // Calcula o status geral do servidor comparando com os limites do banco
        var st = "Normal";
        var niveis = [cls(m.cpu_pct, T[srv.n].c), cls(m.ram_pct, T[srv.n].r), cls(m.disco_pct, T[srv.n].k)];
        if (niveis.indexOf("cr") !== -1) st = "Crítico";
        else if (niveis.indexOf("wa") !== -1) st = "Aviso";

        H[srv.n] = g.serie_60min;
        P[srv.n] = g.processos;

        return {
            n: srv.n,
            d: srv.d,
            online: g.online,
            st: st,
            c: m.cpu_pct,
            r: m.ram_pct,
            k: m.disco_pct,
            t: m.temperatura_c,
            net: m.rede_mbps,
            sw: m.swap_pct
        };
    });

    atualizarKpis();
    atualizarAlertas(gold.gerado_em);
    cards();
    if (cur) atualizarDetalheAoVivo();
}

function cls(v, t) { return v >= t[1] ? "cr" : v >= t[0] ? "wa" : "ok" }
function col(c) { return "var(--" + c + ")" }
function meter(l, v, t) { var c = cls(v, t); return '<div class="m"><span>' + l + '</span><div class="track"><div class="fill" style="width:' + v + '%;background:' + col(c) + '"></div></div><b class="' + c + '">' + v + '%</b></div>' }

var cur = null, view = null, sortK = "cpu_pct", onlyC = false;
var comps = { c: true, r: true, k: true, net: false, sw: false };
function toggleComp(key) {
    if (comps[key]) {
        var ativos = Object.keys(comps).filter(function (k) { return comps[k]; }).length;
        if (ativos <= 1) return;
    }
    comps[key] = !comps[key];
    draw();
}
function cards() {
    var h = "";
    S.forEach(function (s) {
        var sc = s.st == "Crítico" ? "cr" : s.st == "Aviso" ? "wa" : "ok";
        h += '<article class="card' + (cur == s.n ? " sel" : "") + '"><div class="top"><div><h3>' + s.n + '</h3><small>' + s.d + '</small></div><span class="pill ' + sc + '">' + s.st + '</span></div>' + meter("CPU", s.c, T[s.n].c) + meter("RAM", s.r, T[s.n].r) + meter("Disco", s.k, T[s.n].k) +
            '<div class="meta"><div class="btns"><button type="button" aria-pressed="' + (cur == s.n && view == "c") + '" onclick="go(\'' + s.n + '\',\'c\')">Analisar componentes</button><button type="button" aria-pressed="' + (cur == s.n && view == "p") + '" onclick="go(\'' + s.n + '\',\'p\')">Processos</button></div></div></article>';
    });
    document.getElementById("srv").innerHTML = h;
}
var FS_IN = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M8 3H5a2 2 0 0 0-2 2v3m18 0V5a2 2 0 0 0-2-2h-3m0 18h3a2 2 0 0 0 2-2v-3M3 16v3a2 2 0 0 0 2 2h3"/></svg>';
var FS_OUT = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M8 3v3a2 2 0 0 1-2 2H3m18 0h-3a2 2 0 0 1-2-2V3m0 18v-3a2 2 0 0 1 2-2h3M3 16h3a2 2 0 0 1 2 2v3"/></svg>';
function isFs() {
    var el = document.getElementById("det");
    return document.fullscreenElement === el || el.classList.contains("fs");
}
function syncFsBtn() {
    var b = document.getElementById("btnFs");
    if (b) {
        var on = isFs();
        b.innerHTML = on ? FS_OUT : FS_IN;
        b.setAttribute("aria-pressed", String(on));
        b.title = on ? "Sair da tela cheia" : "Tela cheia";
        b.setAttribute("aria-label", b.title);
    }
    requestAnimationFrame(function () {
        graficosAtivos.forEach(function (g) { g.resize(); });
    });
}
function toggleFs() {
    var el = document.getElementById("det");
    if (!el) return;
    if (document.fullscreenElement === el) {
        document.exitFullscreen();
    } else if (el.classList.contains("fs")) {
        el.classList.remove("fs");
        syncFsBtn();
    } else if (el.requestFullscreen) {
        el.requestFullscreen().catch(function () {
            el.classList.add("fs");
            syncFsBtn();
        });
    } else {
        el.classList.add("fs");
        syncFsBtn();
    }
}
document.addEventListener("fullscreenchange", syncFsBtn);
document.addEventListener("keydown", function (e) {
    if (e.key === "Escape") {
        var el = document.getElementById("det");
        if (el && el.classList.contains("fs")) { el.classList.remove("fs"); syncFsBtn(); }
    }
});
function go(n, v) {
    if (cur == n && view == v) {
        if (document.fullscreenElement) document.exitFullscreen();
        var el = document.getElementById("det");
        if (el) el.classList.remove("fs");
        cur = null; view = null;
    } else {
        if (v == "c") comps = { c: true, r: true, k: true, net: false, sw: false };
        cur = n; view = v;
    }
    cards(); draw();
}
var graficosAtivos = [];
function limparGraficos() {
    graficosAtivos.forEach(function (g) { g.destroy(); });
    graficosAtivos = [];
}
function cssVar(nome) {
    return getComputedStyle(document.querySelector(".mg")).getPropertyValue(nome).trim();
}
var limitesPlugin = {
    id: "limites",
    afterDatasetsDraw: function (chart) {
        var cfg = chart.options.plugins && chart.options.plugins.limites;
        if (!cfg || !cfg.thr || !cfg.thr.length) return;
        var ctx = chart.ctx, area = chart.chartArea, y = chart.scales.y;
        var limits = cfg.thr, unit = cfg.unit || "%";
        [
            { v: limits[0], c: cssVar("--wa"), l: "limite de aviso", dy: 17 },
            { v: limits[1], c: cssVar("--cr"), l: "limite crítico", dy: -7 }
        ].forEach(function (t) {
            if (t.v == null) return;
            var py = y.getPixelForValue(t.v);
            var texto = t.l + " " + t.v + unit;
            ctx.save();
            ctx.beginPath();
            ctx.setLineDash([8, 5]);
            ctx.strokeStyle = t.c;
            ctx.lineWidth = 2.4;
            ctx.moveTo(area.left, py);
            ctx.lineTo(area.right, py);
            ctx.stroke();
            ctx.setLineDash([]);
            ctx.font = "700 14px Inter, system-ui, sans-serif";
            var tw = ctx.measureText(texto).width;
            var ty = py + t.dy;
            ctx.fillStyle = "rgba(8, 12, 38, 0.92)";
            ctx.fillRect(area.right - tw - 10, ty - 13, tw + 12, 18);
            ctx.fillStyle = t.c;
            ctx.textAlign = "right";
            ctx.fillText(texto, area.right - 3, ty);
            ctx.restore();
        });
    }
};
function labelsTempo(qtd) {
    var out = [];
    for (var i = 0; i < qtd; i++) {
        var min = Math.round((qtd - 1 - i) * 60 / Math.max(1, qtd - 1));
        out.push(min === 0 ? "agora" : "-" + min + " min");
    }
    return out;
}
function hexAlpha(hex, alpha) {
    var h = hex.replace("#", "");
    if (h.length !== 6) return hex;
    var r = parseInt(h.slice(0, 2), 16), g = parseInt(h.slice(2, 4), 16), b = parseInt(h.slice(4, 6), 16);
    return "rgba(" + r + "," + g + "," + b + "," + alpha + ")";
}
function legendaHtml(nomeLinha, corVar, thr, unit) {
    var itens = '<span><i class="leg-line" style="background:var(' + corVar + ')"></i>' + nomeLinha + '</span>';
    if (thr && thr[0] != null) itens += '<span><i class="leg-dash" style="border-color:var(--wa)"></i>Aviso (' + thr[0] + unit + ')</span>';
    if (thr && thr[1] != null) itens += '<span><i class="leg-dash" style="border-color:var(--cr)"></i>Crítico (' + thr[1] + unit + ')</span>';
    return '<div class="chart-leg">' + itens + '</div>';
}
function criarGrafico(canvasId, nomeLinha, dados, thr, corVar, maxY, unit) {
    var canvas = document.getElementById(canvasId);
    if (!canvas || typeof Chart === "undefined") return;
    maxY = maxY || 100;
    unit = unit || "%";
    var cor = cssVar(corVar);
    var corLinha = cssVar("--line");
    var corTexto = cssVar("--mu");

    var g = new Chart(canvas, {
        type: "line",
        data: {
            labels: labelsTempo(dados.length),
            datasets: [{
                label: nomeLinha,
                data: dados,
                borderColor: cor,
                backgroundColor: function (context) {
                    var area = context.chart.chartArea;
                    if (!area) return hexAlpha(cor, 0.14);
                    var grad = context.chart.ctx.createLinearGradient(0, area.top, 0, area.bottom);
                    grad.addColorStop(0, hexAlpha(cor, 0.24));
                    grad.addColorStop(1, hexAlpha(cor, 0.02));
                    return grad;
                },
                fill: true,
                borderWidth: 2.5,
                pointRadius: 2.5,
                pointHoverRadius: 5,
                pointBackgroundColor: cor,
                tension: 0.25
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            animation: { duration: 250 },
            interaction: { mode: "index", intersect: false },
            plugins: {
                legend: { display: false },
                tooltip: {
                    backgroundColor: "#0c1238",
                    borderColor: corLinha,
                    borderWidth: 1,
                    titleColor: "#ffffff",
                    bodyColor: corTexto,
                    callbacks: {
                        label: function (ctx) { return " " + nomeLinha + ": " + ctx.parsed.y + unit; }
                    }
                },
                limites: { thr: thr || [], unit: unit }
            },
            scales: {
                x: {
                    grid: { color: "rgba(31, 42, 99, 0.35)" },
                    border: { display: false },
                    ticks: { color: corTexto, font: { size: 12.5, weight: "500" }, maxTicksLimit: 6 }
                },
                y: {
                    min: 0,
                    max: maxY,
                    grid: { color: corLinha },
                    border: { display: false },
                    ticks: {
                        color: corTexto,
                        font: { size: 12.5, weight: "500" },
                        stepSize: maxY / 4,
                        callback: function (v) { return v + unit; }
                    }
                }
            }
        },
        plugins: [limitesPlugin]
    });
    graficosAtivos.push(g);
}
function draw() {
    limparGraficos();
    var el = document.getElementById("det");
    if (!cur) { el.style.display = "none"; return }
    el.style.display = "block";
    var s = S.filter(function (q) { return q.n == cur })[0], h;
    if (view == "c") {
        var filtros = [
            { k: "c", l: "CPU" },
            { k: "r", l: "RAM" },
            { k: "k", l: "Disco" },
            { k: "net", l: "Rede" },
            { k: "sw", l: "Swap" }
        ].map(function (f) {
            return '<button type="button" aria-pressed="' + comps[f.k] + '" onclick="toggleComp(\'' + f.k + '\')">' + f.l + '</button>';
        }).join("");

        var fila = [];
        var outros = [];
        if (comps.r) outros.push({ id: "ch_ram", nome: "Uso de RAM", t: 'Memória RAM (%) · atual ' + s.r + '%', d: H[s.n].ram_pct, thr: T[s.n].r, cor: "--s2", maxY: 100, unit: "%" });
        if (comps.k) outros.push({ id: "ch_disco", nome: "Uso de Disco", t: 'Disco (%) · atual ' + s.k + '%', d: H[s.n].disco_pct, thr: T[s.n].k, cor: "--s3", maxY: 100, unit: "%" });
        if (comps.net) outros.push({ id: "ch_rede", nome: "Tráfego de Rede", t: 'Rede (MB/s) · atual ' + s.net.toFixed(1) + ' MB/s', d: H[s.n].rede_mbps, thr: [], cor: "--s4", maxY: 60, unit: " MB/s" });
        if (comps.sw) outros.push({ id: "ch_swap", nome: "Uso de Swap", t: 'Swap (%) · atual ' + s.sw + '%', d: H[s.n].swap_pct, thr: [], cor: "--s5", maxY: 100, unit: "%" });

        var blocos = "";
        if (comps.c) {
            blocos += '<div class="full' + (outros.length ? ' full-top' : '') + '"><div class="chart-head"><div><h3 id="tit_cpu" style="font-size:14px">CPU (%) · atual ' + s.c + '%</h3><div class="temp">Temperatura: <b id="val_temp" class="' + cls(s.t, T[s.n].t) + '">' + s.t + ' °C</b></div></div>' + legendaHtml("Uso de CPU", "--s1", T[s.n].c, "%") + '</div><div class="chart-box"><canvas id="ch_cpu"></canvas></div></div>';
            fila.push({ id: "ch_cpu", nome: "Uso de CPU", d: H[s.n].cpu_pct, thr: T[s.n].c, cor: "--s1", maxY: 100, unit: "%" });
        }
        outros.forEach(function (o, idx) {
            var largo = outros.length % 2 === 1 && idx === outros.length - 1;
            blocos += '<div' + (largo ? ' class="full"' : '') + '><div class="chart-head"><h3 id="tit_' + o.id + '" style="font-size:14px">' + o.t + '</h3>' + legendaHtml(o.nome, o.cor, o.thr, o.unit) + '</div><div class="chart-box"><canvas id="' + o.id + '"></canvas></div></div>';
            fila.push(o);
        });

        h = '<div class="dh"><h2>' + s.n + ' · Componentes</h2><div class="dh-right"><div class="comp-filters" role="group" aria-label="Componentes exibidos">' + filtros + '</div><div class="btns"><button type="button" class="fs-btn" id="btnFs" onclick="toggleFs()" title="Tela cheia" aria-label="Tela cheia" aria-pressed="false">' + FS_IN + '</button><button type="button" onclick="go(cur,view)">Fechar</button></div></div></div>' +
            '<div class="two">' + blocos + '</div>';
        el.innerHTML = h;
        fila.forEach(function (c) { criarGrafico(c.id, c.nome, c.d, c.thr, c.cor, c.maxY, c.unit); });
    } else {
        var rows = P[cur].slice().sort(function (a, b) { return sortK == "nome" ? (a.nome < b.nome ? -1 : 1) : b[sortK] - a[sortK] });
        h = '<div class="dh"><h2>' + s.n + ' · Processos</h2><div class="btns"><button type="button" onclick="go(cur,view)">Fechar</button></div></div>' +
            '<div class="tw"><table class="pt"><thead><tr><th onclick="sortK=\'pid\';draw()">PID</th><th onclick="sortK=\'nome\';draw()">Processo</th><th onclick="sortK=\'cpu_pct\';draw()">CPU% ▾</th><th onclick="sortK=\'mem_pct\';draw()">MEM%</th><th onclick="sortK=\'rede_mbps\';draw()">Rede (MB/s)</th><th onclick="sortK=\'disco_mb\';draw()">Disco (MB)</th><th>Status</th></tr></thead><tbody>' +
            rows.map(function (r) { return '<tr class="' + (r.critico ? "crit" : "") + '"><td>' + r.pid + '</td><td>' + r.nome + '</td><td>' + r.cpu_pct.toFixed(1) + '</td><td>' + r.mem_pct.toFixed(1) + '</td><td>' + r.rede_mbps.toFixed(2) + '</td><td>' + r.disco_mb + '</td><td>' + r.status + '</td></tr>' }).join("") + '</tbody></table></div>';
        el.innerHTML = h;
    }
    syncFsBtn();
}

function atualizarKpis() {
    var online = S.filter(function (s) { return s.online; });
    var nomesOnline = online.map(function (s) { return s.n; });
    var listaTxt = nomesOnline.length > 1
        ? nomesOnline.slice(0, -1).join(", ") + " e " + nomesOnline[nomesOnline.length - 1] + " respondendo"
        : nomesOnline.length === 1 ? nomesOnline[0] + " respondendo" : "Nenhum servidor respondendo";

    var kOnlineV = document.getElementById("kpiOnlineV");
    kOnlineV.textContent = online.length + " / " + S.length;
    kOnlineV.className = "v " + (online.length === S.length ? "ok" : online.length > 0 ? "wa" : "cr");
    document.getElementById("kpiOnlineD").textContent = listaTxt;

    var maisAcima = null, qtdAcima = 0, detalhesAcima = [];
    var maisCrit = null, qtdCrit = 0, detalhesCrit = [];

    S.forEach(function (s) {
        var acima = [], crit = [];
        if (s.c >= T[s.n].c[0]) acima.push("CPU " + s.c + "%");
        if (s.r >= T[s.n].r[0]) acima.push("RAM " + s.r + "%");
        if (s.k >= T[s.n].k[0]) acima.push("Disco " + s.k + "%");
        if (s.c >= T[s.n].c[1]) crit.push("CPU " + s.c + "%");
        if (s.r >= T[s.n].r[1]) crit.push("RAM " + s.r + "%");
        if (s.k >= T[s.n].k[1]) crit.push("Disco " + s.k + "%");

        if (acima.length > qtdAcima) { qtdAcima = acima.length; maisAcima = s.n; detalhesAcima = acima; }
        if (crit.length > qtdCrit) { qtdCrit = crit.length; maisCrit = s.n; detalhesCrit = crit; }
    });

    var kAvisoV = document.getElementById("kpiAvisoV");
    kAvisoV.textContent = maisAcima || "Nenhum";
    kAvisoV.className = "v " + (maisAcima ? "wa" : "ok");
    document.getElementById("kpiAvisoD").textContent = maisAcima ? detalhesAcima.join(" · ") : "Todos dentro do limite";

    var kCritV = document.getElementById("kpiCritV");
    kCritV.textContent = maisCrit || "Nenhum";
    kCritV.className = "v " + (maisCrit ? "cr" : "ok");
    document.getElementById("kpiCritD").textContent = maisCrit ? detalhesCrit.join(" · ") : "Sem componentes críticos";

    var maiorTemp = S.slice().sort(function (a, b) { return b.t - a.t; })[0];
    if (maiorTemp) {
        var kTempV = document.getElementById("kpiTempV");
        kTempV.textContent = maiorTemp.t + " °C";
        kTempV.className = "v " + cls(maiorTemp.t, T[maiorTemp.n].t);
        document.getElementById("kpiTempD").textContent = maiorTemp.n;
    }
}

function atualizarAlertas(geradoEm) {
    var dt = geradoEm ? new Date(geradoEm) : null;
    var hora = dt && !isNaN(dt.getTime())
        ? dt.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })
        : "--:--";
    var alertas = [];
    S.forEach(function (s) {
        [
            { nome: "CPU", val: s.c, lim: T[s.n].c },
            { nome: "Memória RAM", val: s.r, lim: T[s.n].r },
            { nome: "Disco", val: s.k, lim: T[s.n].k }
        ].forEach(function (m) {
            var niv = cls(m.val, m.lim);
            if (niv === "cr") alertas.push({ c: "cr", g: "Crítico", s: s.n, m: m.nome, v: m.val + "% / " + m.lim[1] + "%", h: hora, p: 2 });
            else if (niv === "wa") alertas.push({ c: "wa", g: "Aviso", s: s.n, m: m.nome, v: m.val + "% / " + m.lim[0] + "%", h: hora, p: 1 });
        });
    });
    alertas.sort(function (a, b) { return b.p - a.p; });

    document.getElementById("al").innerHTML = alertas.length
        ? alertas.map(function (a) {
            return '<tr><td><b class="' + a.c + '">' + a.g + '</b></td><td>' + a.s + '</td><td>' + a.m + '</td><td>' + a.v + '</td><td>' + a.h + '</td><td><button type="button" class="jira">Ver no Jira ↗</button></td></tr>';
        }).join("")
        : '<tr><td colspan="6" class="mu">Nenhum alerta ativo no momento.</td></tr>';
}

function atualizarDetalheAoVivo() {
    if (!cur) return;
    if (view === "p") { draw(); return; }
    var s = S.filter(function (q) { return q.n == cur })[0];
    if (!s || !H[s.n]) return;

    var mapa = {
        ch_cpu: { d: H[s.n].cpu_pct, tit: "tit_cpu", txt: "CPU (%) · atual " + s.c + "%" },
        ch_ram: { d: H[s.n].ram_pct, tit: "tit_ch_ram", txt: "Memória RAM (%) · atual " + s.r + "%" },
        ch_disco: { d: H[s.n].disco_pct, tit: "tit_ch_disco", txt: "Disco (%) · atual " + s.k + "%" },
        ch_rede: { d: H[s.n].rede_mbps, tit: "tit_ch_rede", txt: "Rede (MB/s) · atual " + s.net.toFixed(1) + " MB/s" },
        ch_swap: { d: H[s.n].swap_pct, tit: "tit_ch_swap", txt: "Swap (%) · atual " + s.sw + "%" }
    };

    var elTemp = document.getElementById("val_temp");
    if (elTemp) {
        elTemp.textContent = s.t + " °C";
        elTemp.className = cls(s.t, T[s.n].t);
    }

    graficosAtivos.forEach(function (g) {
        var info = mapa[g.canvas.id];
        if (!info || !info.d) return;
        g.data.labels = labelsTempo(info.d.length);
        g.data.datasets[0].data = info.d;
        g.update("none");
        var elTit = document.getElementById(info.tit);
        if (elTit) elTit.textContent = info.txt;
    });
}

carregarDadosGold();
setInterval(carregarDadosGold, 3000);
