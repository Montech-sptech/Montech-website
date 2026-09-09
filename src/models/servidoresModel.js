var database = require("../database/config");

function adicionarServidoresUsuario(idUsuario, idServidor) {
    var instrucaoSql = `
        INSERT INTO usuarioServidor (fkUsuario, fkServidor) VALUES (${idUsuario}, ${idServidor});
    `;
    console.log("Executando a instrução SQL: \n" + instrucaoSql);
    return database.executar(instrucaoSql);
}

function removerServidorUsuario(idUsuario, idServidor) {
    var instrucaoSql = `
        DELETE FROM usuarioServidor WHERE fkUsuario = ${idUsuario} AND fkServidor = ${idServidor};
    `;
    console.log("Executando a instrução SQL: \n" + instrucaoSql);
    return database.executar(instrucaoSql);
}

function pegarServidoresPorEmpresa(idEmpresa) {
    var instrucaoSql = `
        SELECT 
    s.idServidor,
    s.nomeServidor,
    s.hostName,
    s.tipoServidor,
    s.metodoDeColeta,
    s.intervaloDeColeta,
    c.nomeComponente,
    cs.limiteAtencao,
    cs.limiteCritico
FROM servidor s
INNER JOIN componenteServidor cs 
    ON s.idServidor = cs.fkServidor
INNER JOIN componente c 
    ON cs.fkComponente = c.idComponente
ORDER BY s.idServidor, c.idComponente;
    `;
    console.log("Executando a instrução SQL: \n" + instrucaoSql);
    return database.executar(instrucaoSql);
}

function cadastrarServidor(nomeServidor, hostName, tipoServidor, metodoDeColeta, intervaloDeColeta) {
    var hostNameSql = hostName ? `'${hostName}'` : "NULL";
    var tipoServidorSql = tipoServidor ? `'${tipoServidor}'` : "NULL";
    var metodoDeColetaSql = metodoDeColeta ? `'${metodoDeColeta}'` : "NULL";
    var intervaloDeColetaSql = intervaloDeColeta ? intervaloDeColeta : "NULL";

    var instrucaoSql = `
        INSERT INTO servidor (nomeServidor, hostName, tipoServidor, metodoDeColeta, intervaloDeColeta)
        VALUES ('${nomeServidor}', ${hostNameSql}, ${tipoServidorSql}, ${metodoDeColetaSql}, ${intervaloDeColetaSql});
    `;
    return database.executar(instrucaoSql);
}

function buscarIdComponentePorNome(nomeComponente) {
    var instrucaoSql = `SELECT idComponente FROM componente WHERE nomeComponente = '${nomeComponente}';`;
    return database.executar(instrucaoSql);
}

function adicionarComponenteServidor(fkComponente, fkServidor, limiteAtencao, limiteCritico) {
    var limiteAtencaoSql = (limiteAtencao !== undefined && limiteAtencao !== null && limiteAtencao !== "") ? limiteAtencao : "NULL";
    var limiteCriticoSql = (limiteCritico !== undefined && limiteCritico !== null && limiteCritico !== "") ? limiteCritico : "NULL";

    var instrucaoSql = `
        INSERT INTO componenteServidor (fkComponente, fkServidor, limiteAtencao, limiteCritico)
        VALUES (${fkComponente}, ${fkServidor}, ${limiteAtencaoSql}, ${limiteCriticoSql});
    `;
    return database.executar(instrucaoSql);
}

module.exports = {
    adicionarServidoresUsuario,
    removerServidorUsuario,
    pegarServidoresPorEmpresa,
    cadastrarServidor,
    buscarIdComponentePorNome,
    adicionarComponenteServidor
};