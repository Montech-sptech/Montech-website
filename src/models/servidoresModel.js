var database = require("../database/config");

function adicionarServidoresUsuario(idUsuario, idServidor) {
  var instrucaoSql = `
        INSERT INTO visualizacao (fkUsuario, fkServidor) VALUES (${idUsuario}, ${idServidor});
    `;
  console.log("Executando a instrução SQL: \n" + instrucaoSql);
  return database.executar(instrucaoSql);
}

function removerServidorUsuario(idUsuario, idServidor) {
  var instrucaoSql = `
        DELETE FROM visualizacao WHERE fkUsuario = ${idUsuario} AND fkServidor = ${idServidor};
    `;
  console.log("Executando a instrução SQL: \n" + instrucaoSql);
  return database.executar(instrucaoSql);
}

function pegarServidoresPorAeroporto(idAeroporto) {
  var instrucaoSql = `
        SELECT 
            idServidor,
            token,
            nomeServidor,
            hostname,
            sistemaOperacional,
            intervaloColeta,
            statusAtividade,
            fkAeroporto
        FROM servidor
        WHERE fkAeroporto = ${idAeroporto}
    `;
  console.log("Executando a instrução SQL: \n" + instrucaoSql);
  return database.executar(instrucaoSql);
}

function cadastrarServidor(
  nomeServidor,
  hostName,
  sistemaOperacional,
  tipoServidor,
  metodoColeta,
  intervaloColeta,
  statusAtividade,
  fkAeroporto,
  fkTipoServidor,
) {
  var hostNameSql = hostName ? `'${hostName}'` : "NULL";
  var sistemaOperacionalSql = sistemaOperacional
    ? `'${sistemaOperacional}'`
    : "NULL";
  var tipoServidorSql = tipoServidor ? `'${tipoServidor}'` : "NULL";
  var metodoDeColetaSql = metodoColeta ? `'${metodoColeta}'` : "NULL";
  var intervaloDeColetaSql = intervaloColeta ? intervaloColeta : "NULL";
  var statusAtividadeSql =
    statusAtividade !== undefined && statusAtividade !== null
      ? statusAtividade
      : "NULL";
  var fkTipoServidorSql = fkTipoServidor ? fkTipoServidor : "NULL";
  var fkAeroportoSql = fkAeroporto ? fkAeroporto : "NULL";

  var instrucaoSql = `
        INSERT INTO servidor (nomeServidor, hostName, sistemaOperacional, tipoServidor, metodoColeta, intervaloColeta, statusAtividade, fkAeroporto, fkTipoServidor)
        VALUES ('${nomeServidor}', ${hostNameSql}, ${sistemaOperacionalSql}, ${tipoServidorSql}, ${metodoDeColetaSql}, ${intervaloDeColetaSql}, ${statusAtividadeSql}, ${fkAeroportoSql}, ${fkTipoServidorSql});
    `;
  return database.executar(instrucaoSql);
}

function buscarIdComponentePorNome(nomeComponente) {
  var instrucaoSql = `SELECT idComponente FROM componente WHERE nomeComponente = '${nomeComponente}';`;
  return database.executar(instrucaoSql);
}

function adicionarComponenteServidor(
  fkComponente,
  fkServidor,
  limiteAtencao,
  limiteCritico,
  fkTipoMetrica,
) {
  var limiteAtencaoSql =
    limiteAtencao !== undefined &&
    limiteAtencao !== null &&
    limiteAtencao !== ""
      ? limiteAtencao
      : "NULL";
  var limiteCriticoSql =
    limiteCritico !== undefined &&
    limiteCritico !== null &&
    limiteCritico !== ""
      ? limiteCritico
      : "NULL";

  var instrucaoComponenteServidor = `
        INSERT INTO componenteServidor (fkComponente, fkServidor, fkTipoMetrica, limiteAtencao, limiteCritico)
        VALUES (${fkComponente}, ${fkServidor}, ${fkTipoMetrica}, ${limiteAtencaoSql}, ${limiteCriticoSql});
  `;
  return database.executar(instrucaoComponenteServidor);
}

module.exports = {
  adicionarServidoresUsuario,
  removerServidorUsuario,
  pegarServidoresPorAeroporto,
  cadastrarServidor,
  buscarIdComponentePorNome,
  adicionarComponenteServidor,
};
