var S = [
    { n: "GRU-SPA", d: "Planos de voo e informações aeronáuticas", st: "Aviso", c: 74, r: 88, k: 52, t: 67, p: "4/4", sw: 38, net: 14.8 },
    { n: "GRU-SDV", d: "Dados de vigilância e trilhas", st: "Crítico", c: 46, r: 94, k: 44, t: 52, p: "4/4", sw: 62, net: 21.3 },
    { n: "GRU-AIS", d: "Serviço de informação aeronáutica", st: "Aviso", c: 31, r: 49, k: 78, t: 44, p: "4/4", sw: 19, net: 8.5 }
];
var T = {
    "GRU-SPA": { c: [70, 90], r: [85, 92], k: [75, 90], t: [75, 85] },
    "GRU-SDV": { c: [75, 92], r: [80, 90], k: [70, 85], t: [72, 82] },
    "GRU-AIS": { c: [65, 85], r: [88, 95], k: [72, 88], t: [70, 80] }
};
var P = {
    "GRU-SPA": [[1204, "teste 123", "teste", 31.2, 24.5, "Rodando", 1], [1311, "teste 1234", "teste", 18.4, 19.8, "Rodando", 1], [1420, "teste 12345", "teste", 12.7, 22.1, "Rodando", 1], [1502, "teste 123456", "teste", 6.1, 8.3, "Rodando", 1], [980, "teste", "montech", 4.9, 9.6, "Rodando", 0], [2210, "teste 7", "montech", 1.2, 1.4, "Rodando", 0], [611, "teste 8", "root", 0.1, 0.2, "Ocioso", 0]],
    "GRU-SDV": [[1102, "teste 123", "teste", 22.8, 28.4, "Rodando", 1], [1177, "teste 1234", "teste", 9.2, 31.6, "Rodando", 1], [1240, "teste 12345", "teste", 14.3, 12.1, "Rodando", 1], [1388, "teste 123456", "teste", 5.5, 9.9, "Rodando", 1], [2210, "teste", "montech", 1.1, 1.3, "Rodando", 0], [611, "teste 8", "root", 0.1, 0.2, "Dormindo", 0]],
    "GRU-AIS": [[1050, "teste 123", "teste", 9.6, 14.2, "Rodando", 1], [1098, "teste 1234", "teste", 7.2, 11.5, "Rodando", 1], [1160, "teste 12345", "teste", 4.8, 10.4, "Rodando", 1], [1215, "teste 123456", "teste", 3.1, 6.7, "Rodando", 1], [2210, "teste", "montech", 1.0, 1.2, "Rodando", 0], [611, "teste 8", "root", 0.1, 0.2, "Dormindo", 0]]
};
var X = { "GRU-SPA": [[420, 310], [180, 95], [95, 140], [40, 22], [12, 0], [3, 0], [0, 0]], "GRU-SDV": [[610, 520], [240, 380], [130, 60], [35, 18], [4, 0], [0, 0]], "GRU-AIS": [[150, 40], [110, 25], [70, 18], [25, 6], [2, 0], [0, 0]] };
Object.keys(P).forEach(function (k) { P[k].forEach(function (r, i) { r[7] = X[k][i][0]; r[8] = X[k][i][1] }) });
var A = [["cr", "Crítico", "GRU-SDV", "Memória RAM", "94% / 90%", "09:42"], ["wa", "Aviso", "GRU-SPA", "Memória RAM", "88% / 85%", "09:31"], ["wa", "Aviso", "GRU-AIS", "Disco /var/data", "78% / 72%", "08:10"], ["wa", "Aviso", "GRU-SPA", "CPU", "74% / 70%", "09:36"]];
function cls(v, t) { return v >= t[1] ? "cr" : v >= t[0] ? "wa" : "ok" }
function col(c) { return "var(--" + c + ")" }
function meter(l, v, t) { var c = cls(v, t); return '<div class="m"><span>' + l + '</span><div class="track"><div class="fill" style="width:' + v + '%;background:' + col(c) + '"></div></div><b class="' + c + '">' + v + '%</b></div>' }

var cur = null, view = null, sortK = 3, onlyC = false;
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
        var sc = s.st == "Crítico" ? "cr" : "wa";
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
    if (!b) return;
    var on = isFs();
    b.innerHTML = on ? FS_OUT : FS_IN;
    b.setAttribute("aria-pressed", String(on));
    b.title = on ? "Sair da tela cheia" : "Tela cheia";
    b.setAttribute("aria-label", b.title);
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
function rnd(seed) { var x = seed; return function () { x = (x * 9301 + 49297) % 233280; return x / 233280 } }
function series(base, amp, seed, end, maxVal) {
    var hi = maxVal ? maxVal * 0.96 : 98, lo = maxVal ? maxVal * 0.04 : 5;
    var r = rnd(seed), a = [], v = Math.max(lo, base); for (var i = 0; i < 60; i++) { v += (r() - .5) * amp; v = Math.max(lo, Math.min(hi, v)); a.push(v) }
    for (var j = 0; j < 60; j++) { a[j] = a[j] * (1 - j / 59 * .55) + end * (j / 59 * .55) } return a
}
function chart(d, thr, color, W, H, maxY, unit) {
    W = W || 600; H = H || 220; maxY = maxY || 100; unit = unit || "%";
    var L = 34, B = 22, Q = 8, x = function (i) { return L + i * (W - L - Q) / 59 }, y = function (v) { return Q + (maxY - v) * (H - B - Q) / maxY };
    var limits = Array.isArray(thr) ? thr : [thr];
    var s = '<svg viewBox="0 0 ' + W + ' ' + H + '" role="img" aria-label="Gráfico de linha">';
    [0, 0.25, 0.5, 0.75, 1].forEach(function (f) { var g = Math.round(maxY * f); s += '<line x1="' + L + '" x2="' + (W - Q) + '" y1="' + y(g) + '" y2="' + y(g) + '" stroke="var(--line)"/><text x="' + (L - 6) + '" y="' + (y(g) + 4) + '" text-anchor="end" font-size="11" fill="var(--mu)">' + g + '</text>' });
    ["-60 min", "-45", "-30", "-15", "agora"].forEach(function (t, i) { s += '<text x="' + (L + i * (W - L - Q) / 4) + '" y="' + (H - 5) + '" text-anchor="' + (i == 0 ? "start" : i == 4 ? "end" : "middle") + '" font-size="11" fill="var(--mu)">' + t + '</text>' });
    var close = limits.length > 1 && limits[1] != null && y(limits[0]) - y(limits[1]) < 16;
    [
        { v: limits[0], c: "var(--wa)", l: "limite de aviso", dy: close ? 12 : -4 },
        { v: limits[1], c: "var(--cr)", l: "limite crítico", dy: -4 }
    ].forEach(function (t) {
        if (t.v == null) return;
        s += '<line x1="' + L + '" x2="' + (W - Q) + '" y1="' + y(t.v) + '" y2="' + y(t.v) + '" stroke="' + t.c + '" stroke-dasharray="5 4"/><text x="' + (W - Q) + '" y="' + (y(t.v) + t.dy) + '" text-anchor="end" font-size="11" fill="' + t.c + '">' + t.l + ' ' + t.v + unit + '</text>';
    });
    s += '<polyline fill="none" stroke="' + color + '" stroke-width="2" points="' + d.map(function (v, i) { return x(i).toFixed(1) + "," + y(v).toFixed(1) }).join(" ") + '"/></svg>';
    return s;
}
function draw() {
    var el = document.getElementById("det");
    if (!cur) { el.style.display = "none"; return }
    el.style.display = "block";
    var s = S.filter(function (q) { return q.n == cur })[0], i = S.indexOf(s), h;
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

        var outros = [];
        if (comps.r) outros.push({
            t: 'Memória RAM (%) · atual ' + s.r + '%',
            g: function (w, hh) { return chart(series(s.r - 10, 5, 5 + i * 4, s.r), T[s.n].r, "var(--s2)", w, hh); }
        });
        if (comps.k) outros.push({
            t: 'Disco (%) · atual ' + s.k + '%',
            g: function (w, hh) { return chart(series(s.k - 6, 4, 7 + i * 4, s.k), T[s.n].k, "var(--s3)", w, hh); }
        });
        if (comps.net) outros.push({
            t: 'Rede (MB/s) · atual ' + s.net.toFixed(1) + ' MB/s',
            g: function (w, hh) { return chart(series(s.net * 0.8, 4.5, 9 + i * 4, s.net, 60), [], "var(--s4)", w, hh, 60, " MB/s"); }
        });
        if (comps.sw) outros.push({
            t: 'Swap (%) · atual ' + s.sw + '%',
            g: function (w, hh) { return chart(series(s.sw - 8, 5, 11 + i * 4, s.sw), [], "var(--s5)", w, hh); }
        });

        var blocos = "";
        if (comps.c) {
            blocos += '<div class="full' + (outros.length ? ' full-top' : '') + '"><h3 style="font-size:14px">CPU (%) · atual ' + s.c + '%</h3><div class="temp">Temperatura: <b class="' + cls(s.t, T[s.n].t) + '">' + s.t + ' °C</b></div>' + chart(series(s.c - 12, 10, 3 + i * 4, s.c), T[s.n].c, "var(--s1)", 1200, 250) + '</div>';
        }
        outros.forEach(function (o, idx) {
            var largo = outros.length % 2 === 1 && idx === outros.length - 1;
            blocos += '<div' + (largo ? ' class="full"' : '') + '><h3 style="font-size:14px">' + o.t + '</h3>' + o.g(largo ? 1200 : 600, largo ? 230 : 220) + '</div>';
        });

        h = '<div class="dh"><h2>' + s.n + ' · Componentes</h2><div class="dh-right"><div class="comp-filters" role="group" aria-label="Componentes exibidos">' + filtros + '</div><div class="btns"><button type="button" class="fs-btn" id="btnFs" onclick="toggleFs()" title="Tela cheia" aria-label="Tela cheia" aria-pressed="false">' + FS_IN + '</button><button type="button" onclick="go(cur,view)">Fechar</button></div></div></div>' +
            '<div class="two">' + blocos + '</div>';
    } else {
        var rows = P[cur].slice().sort(function (a, b) { return sortK == 1 ? (a[1] < b[1] ? -1 : 1) : b[sortK] - a[sortK] });
        h = '<div class="dh"><h2>' + s.n + ' · Processos</h2><div class="btns"><button type="button" onclick="go(cur,view)">Fechar</button></div></div>' +
            '<div class="tw"><table class="pt"><thead><tr><th onclick="sortK=0;draw()">PID</th><th onclick="sortK=1;draw()">Processo</th><th onclick="sortK=3;draw()">CPU% ▾</th><th onclick="sortK=4;draw()">MEM%</th><th onclick="sortK=7;draw()">Rede (MB/s)</th><th onclick="sortK=8;draw()">Disco (MB)</th><th>Status</th></tr></thead><tbody>' +
            rows.map(function (r) { return '<tr class="' + (r[6] ? "crit" : "") + '"><td>' + r[0] + '</td><td>' + r[1] + '</td><td>' + r[3].toFixed(1) + '</td><td>' + r[4].toFixed(1) + '</td><td>' + (r[7] / 1024).toFixed(2) + '</td><td>' + r[8] + '</td><td>' + r[5] + '</td></tr>' }).join("") + '</tbody></table></div>';
    }
    el.innerHTML = h;
    syncFsBtn();
}
document.getElementById("al").innerHTML = A.map(function (a) { return '<tr><td><b class="' + a[0] + '">' + a[1] + '</b></td><td>' + a[2] + '</td><td>' + a[3] + '</td><td>' + a[4] + '</td><td>' + a[5] + '</td><td><button type="button" class="jira">Ver no Jira ↗</button></td></tr>' }).join("");
cards();
