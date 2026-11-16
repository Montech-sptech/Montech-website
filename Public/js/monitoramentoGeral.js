var S = [
    { n: "GRU-SPA", d: "Planos de voo e informações aeronáuticas", st: "Aviso", c: 74, r: 88, k: 52, t: 67, p: "4/4" },
    { n: "GRU-SDV", d: "Dados de vigilância e trilhas", st: "Crítico", c: 46, r: 94, k: 44, t: 52, p: "4/4" },
    { n: "GRU-AIS", d: "Serviço de informação aeronáutica", st: "Aviso", c: 31, r: 49, k: 78, t: 44, p: "4/4" }
];
var T = { "GRU-SPA": { c: [70, 90], r: [85, 92], k: [75, 90], t: [75, 85] }, "GRU-SDV": { c: [75, 92], r: [80, 90], k: [70, 85], t: [72, 82] }, "GRU-AIS": { c: [65, 85], r: [88, 95], k: [72, 88], t: [70, 80] } };
var P = {
    "GRU-SPA": [[1204, "teste 123", "teste", 31.2, 24.5, "Rodando", 1], [1311, "teste 1234", "teste", 18.4, 19.8, "Rodando", 1], [1420, "teste 12345", "teste", 12.7, 22.1, "Rodando", 1], [1502, "teste 123456", "teste", 6.1, 8.3, "Rodando", 1], [980, "teste", "montech", 4.9, 9.6, "Rodando", 0], [2210, "teste 7", "montech", 1.2, 1.4, "Rodando", 0], [611, "teste 8", "root", 0.1, 0.2, "Dormindo", 0]],
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
function cards() {
    var h = "";
    S.forEach(function (s) {
        var sc = s.st == "Crítico" ? "cr" : "wa";
        h += '<article class="card' + (cur == s.n ? " sel" : "") + '"><div class="top"><div><h3>' + s.n + '</h3><small>' + s.d + '</small></div><span class="pill ' + sc + '">' + s.st + '</span></div>' + meter("CPU", s.c, T[s.n].c) + meter("RAM", s.r, T[s.n].r) + meter("Disco", s.k, T[s.n].k) +
            '<div class="meta"><div class="btns"><button type="button" aria-pressed="' + (cur == s.n && view == "c") + '" onclick="go(\'' + s.n + '\',\'c\')">Analisar componentes</button><button type="button" aria-pressed="' + (cur == s.n && view == "p") + '" onclick="go(\'' + s.n + '\',\'p\')">Processos</button></div></div></article>';
    });
    document.getElementById("srv").innerHTML = h;
}
function go(n, v) {
    if (cur == n && view == v) { cur = null; view = null } else { cur = n; view = v }
    cards(); draw();
}
function rnd(seed) { var x = seed; return function () { x = (x * 9301 + 49297) % 233280; return x / 233280 } }
function series(base, amp, seed, end) {
    var r = rnd(seed), a = [], v = base; for (var i = 0; i < 60; i++) { v += (r() - .5) * amp; v = Math.max(5, Math.min(98, v)); a.push(v) }
    for (var j = 0; j < 60; j++) { a[j] = a[j] * (1 - j / 59 * .55) + end * (j / 59 * .55) } return a
}
function chart(d, thr, color) {
    var W = 600, H = 220, L = 34, B = 22, Q = 8, x = function (i) { return L + i * (W - L - Q) / 59 }, y = function (v) { return Q + (100 - v) * (H - B - Q) / 100 };
    var s = '<svg viewBox="0 0 ' + W + ' ' + H + '" role="img" aria-label="Gráfico de linha">';
    [0, 25, 50, 75, 100].forEach(function (g) { s += '<line x1="' + L + '" x2="' + (W - Q) + '" y1="' + y(g) + '" y2="' + y(g) + '" stroke="var(--line)"/><text x="' + (L - 6) + '" y="' + (y(g) + 4) + '" text-anchor="end" font-size="11" fill="var(--mu)">' + g + '</text>' });
    ["-60 min", "-45", "-30", "-15", "agora"].forEach(function (t, i) { s += '<text x="' + (L + i * (W - L - Q) / 4) + '" y="' + (H - 5) + '" text-anchor="' + (i == 0 ? "start" : i == 4 ? "end" : "middle") + '" font-size="11" fill="var(--mu)">' + t + '</text>' });
    s += '<line x1="' + L + '" x2="' + (W - Q) + '" y1="' + y(thr) + '" y2="' + y(thr) + '" stroke="var(--wa)" stroke-dasharray="5 4"/><text x="' + (W - Q) + '" y="' + (y(thr) - 4) + '" text-anchor="end" font-size="11" fill="var(--wa)">limite de aviso ' + thr + '%</text>';
    s += '<polyline fill="none" stroke="' + color + '" stroke-width="2" points="' + d.map(function (v, i) { return x(i).toFixed(1) + "," + y(v).toFixed(1) }).join(" ") + '"/></svg>';
    return s;
}
function draw() {
    var el = document.getElementById("det");
    if (!cur) { el.style.display = "none"; return }
    el.style.display = "block";
    var s = S.filter(function (q) { return q.n == cur })[0], i = S.indexOf(s), h;
    if (view == "c") {
        h = '<div class="dh"><h2>' + s.n + ' · Componentes</h2><button type="button" onclick="go(cur,view)">Fechar</button></div><div class="two"><div><h3 style="font-size:14px">CPU (%) · atual ' + s.c + '%</h3><div class="temp">Temperatura: <b class="' + cls(s.t, T[s.n].t) + '">' + s.t + ' °C</b></div>' + chart(series(s.c - 12, 10, 3 + i * 4, s.c), T[s.n].c[0], "var(--s1)") + '</div><div><h3 style="font-size:14px">Memória RAM (%) · atual ' + s.r + '%</h3><div class="temp">&nbsp;</div>' + chart(series(s.r - 10, 5, 5 + i * 4, s.r), T[s.n].r[0], "var(--s2)") + '</div></div>';
    } else {
        var rows = P[cur].slice().sort(function (a, b) { return sortK == 1 ? (a[1] < b[1] ? -1 : 1) : b[sortK] - a[sortK] }).filter(function (r) { return !onlyC || r[6] });
        h = '<div class="dh"><h2>' + s.n + ' · Processos</h2><div class="btns"><button type="button" aria-pressed="' + onlyC + '" onclick="onlyC=!onlyC;draw()">Só críticos</button><button type="button" onclick="go(cur,view)">Fechar</button></div></div>' +
            '<div class="hm">' + meter("CPU", s.c, T[s.n].c) + meter("RAM", s.r, T[s.n].r) + meter("Disco", s.k, T[s.n].k) + '</div><div class="tw"><table class="pt"><thead><tr><th onclick="sortK=0;draw()">PID</th><th onclick="sortK=1;draw()">Processo</th><th>Usuário</th><th onclick="sortK=3;draw()">CPU% ▾</th><th onclick="sortK=4;draw()">MEM%</th><th onclick="sortK=7;draw()">Rede (KB/s)</th><th onclick="sortK=8;draw()">Swap (MB)</th><th>Crítico</th></tr></thead><tbody>' +
            rows.map(function (r) { var stp = r[5] == "Parado"; return '<tr class="' + (r[6] ? "crit" : "") + '"><td>' + r[0] + '</td><td>' + r[1] + '</td><td>' + r[2] + '</td><td>' + r[3].toFixed(1) + '</td><td>' + r[4].toFixed(1) + '</td><td>' + r[7] + '</td><td>' + r[8] + '</td><td>' + (r[6] ? "Sim" : "Não") + '</td></tr>' }).join("") + '</tbody></table></div>';
    }
    el.innerHTML = h;
}
document.getElementById("al").innerHTML = A.map(function (a) { return '<tr><td><b class="' + a[0] + '">' + a[1] + '</b></td><td>' + a[2] + '</td><td>' + a[3] + '</td><td>' + a[4] + '</td><td>' + a[5] + '</td><td><button type="button" class="jira">Ver no Jira ↗</button></td></tr>' }).join("");
cards();
