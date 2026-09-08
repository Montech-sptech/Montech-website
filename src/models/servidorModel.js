function cadastrar(nomeServidor, hostName, tipoServidor, metodoDeColeta, porta, intervaloDeColeta, componentesAMonitorar) {
    console.log("Acessei o servidorModel - cadastrar");

    var hostNameSql = hostName ? `'${hostName}'` : "NULL";
    var tipoServidorSql = tipoServidor ? `'${tipoServidor}'` : "NULL";
    var metodoDeColetaSql = metodoDeColeta ? `'${metodoDeColeta}'` : "NULL";
    var intervaloDeColetaSql = intervaloDeColeta ? intervaloDeColeta : "NULL";
    var componentesAMonitorarSql = componentesAMonitorar ? `'${componentesAMonitorar}'` : "NULL";

    var instrucaoSql = `INSERT INTO Servidor (nomeServidor, hostName, tipoServidor, metodoDeColeta, porta, intervaloDeColeta, componentesAMonitorar)
        VALUES ('${nomeServidor}', ${hostNameSql}, ${tipoServidorSql}, ${metodoDeColetaSql}, ${porta}, ${intervaloDeColetaSql}, ${componentesAMonitorarSql});`;

    console.log("Executando a instrução SQL: \n" + instrucaoSql);
    return database.executar(instrucaoSql);
}

module.exports = {
    adicionarServidoresUsuario,
    removerServidorUsuario,
    pegarServidoresPorEmpresa,
    cadastrar
};