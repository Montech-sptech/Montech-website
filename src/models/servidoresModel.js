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
            s.intervaloDeColeta
        FROM servidor s
        WHERE s.fkEmpresa = ${idEmpresa}
        ORDER BY s.idServidor;
    `;
  console.log("Executando a instrução SQL: \n" + instrucaoSql);
  return database.executar(instrucaoSql);
}

function cadastrarServidor(
  nomeServidor,
  hostName,
  sistemaOperacional,
  metodoColeta,
  intervaloColeta,
  statusAtividade,
) {
  var hostNameSql = hostName ? `'${hostName}'` : "NULL";
  var sistemaOperacionalSql = sistemaOperacional
    ? `'${sistemaOperacional}'`
    : "NULL";
  var metodoDeColetaSql = metodoColeta ? `'${metodoColeta}'` : "NULL";
  var intervaloDeColetaSql = intervaloColeta ? intervaloColeta : "NULL";
  var statusAtividadeSql =
    statusAtividade !== undefined && statusAtividade !== null
      ? statusAtividade
      : "NULL";

  var instrucaoSql = `
        INSERT INTO servidor (nomeServidor, hostName, sistemaOperacional, metodoColeta, intervaloColeta, statusAtividade)
        VALUES ('${nomeServidor}', ${hostNameSql}, ${sistemaOperacionalSql}, ${metodoDeColetaSql}, ${intervaloDeColetaSql}, ${statusAtividadeSql});
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
  componentePrincipal,
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
        INSERT INTO componenteServidor (fkComponente, fkServidor, fkTipoMetrica, componentePrincipal, limiteAtencao, limiteCritico)
        VALUES (${fkComponente}, ${fkServidor}, ${fkTipoMetrica}, ${componentePrincipal}, ${limiteAtencaoSql}, ${limiteCriticoSql});
  `;
  return database.executar(instrucaoComponenteServidor);
}

module.exports = {
  adicionarServidoresUsuario,
  removerServidorUsuario,
  pegarServidoresPorEmpresa,
  cadastrarServidor,
  buscarIdComponentePorNome,
  adicionarComponenteServidor,
};
