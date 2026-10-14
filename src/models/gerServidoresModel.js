var database = require("../database/config");


function buscarServidoresAeroporto(idAeroporto) {
  var instrucaoSql = `
        SELECT 
            idServidor,
            nomeServidor,
            sistemaOperacional,
            statusAtividade
        FROM servidor
        WHERE fkAeroporto = ${idAeroporto};
    `;
  console.log("Executando a instrução SQL: \n" + instrucaoSql);
  return database.executar(instrucaoSql);
}

function buscarComponentes() {
  var instrucaoSql = `
        SELECT
            idComponente,
            nomeComponente,
            unidadeMedida
        FROM componente;
    `;
  console.log("Executando a instrução SQL: \n" + instrucaoSql);
  return database.executar(instrucaoSql);
}


function cadastrarServidor(token, nomeServidor, sistemaOperacional, fkAeroporto) {
    console.log("ACESSEI O USUARIO MODEL \n \n\t\t >> Se aqui der erro de 'Error: connect ECONNREFUSED',\n \t\t >> verifique suas credenciais de acesso ao banco\n \t\t >> e se o servidor de seu BD está rodando corretamente. \n\n function cadastrar():");

    var instrucaoSql = `
        INSERT INTO servidor (token, nomeServidor, sistemaOperacional, intervaloColeta, statusAtividade, fkAeroporto) VALUES
        ('${token}', '${nomeServidor}', '${sistemaOperacional}', 5, 1, ${fkAeroporto});
    `;
    console.log("Executando a instrução SQL: \n" + instrucaoSql);
    return database.executar(instrucaoSql);
}

function deletarServidor(idServidor) {
    console.log("ACESSEI O USUARIO MODEL \n \n\t\t >> Se aqui der erro de 'Error: connect ECONNREFUSED',\n \t\t >> verifique suas credenciais de acesso ao banco\n \t\t >> e se o servidor de seu BD está rodando corretamente. \n\n function cadastrar():");

    var instrucaoSql = `
        DELETE FROM servidor WHERE idServidor = ${Number(idServidor)};
    `;
    console.log("Executando a instrução SQL: \n" + instrucaoSql);
    return database.executar(instrucaoSql);
}

function deletarComponenteServidor(idServidor) {
    console.log("ACESSEI O USUARIO MODEL \n \n\t\t >> Se aqui der erro de 'Error: connect ECONNREFUSED',\n \t\t >> verifique suas credenciais de acesso ao banco\n \t\t >> e se o servidor de seu BD está rodando corretamente. \n\n function cadastrar():");

    var instrucaoSql = `
        DELETE FROM servidorcomponente WHERE fkServidor = ${Number(idServidor)};
    `;
    console.log("Executando a instrução SQL: \n" + instrucaoSql);
    return database.executar(instrucaoSql);
}

function cadastrarComponenteServidor(fkServidor, componentes) {
    console.log("ACESSEI O USUARIO MODEL \n \n\t\t >> Se aqui der erro de 'Error: connect ECONNREFUSED',\n \t\t >> verifique suas credenciais de acesso ao banco\n \t\t >> e se o servidor de seu BD está rodando corretamente. \n\n function cadastrar():");
    const valores = componentes
        .map(c => `(${Number(fkServidor)}, ${Number(c.fkComponente)}, ${Number(c.limiteAtencao)}, ${Number(c.limiteCritico)})`)
        .join(",\n");

    
    var instrucaoSql = `
        INSERT INTO servidorcomponente (fkServidor, fkComponente, limiteAtencao, limiteCritico) VALUES
        ${valores}
    `;
    console.log("Executando a instrução SQL: \n" + instrucaoSql);
    return database.executar(instrucaoSql);
}


module.exports = {
  buscarServidoresAeroporto,
  buscarComponentes,
  cadastrarServidor,
  cadastrarComponenteServidor,
  deletarServidor,
  deletarComponenteServidor
};