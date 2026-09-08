var database = require("../database/config")


function adicionarServidoresUsuario(idUsuario, idServidor) {
    console.log("ACESSEI O USUARIO MODEL \n \n\t\t >> Se aqui der erro de 'Error: connect ECONNREFUSED',\n \t\t >> verifique suas credenciais de acesso ao banco\n \t\t >> e se o servidor de seu BD está rodando corretamente. \n\n function adicionarServidoresUsuario():", idUsuario, idServidor);
    var instrucaoSql = `
        INSERT INTO usuarioServidor (fkUsuario, fkServidor) VALUES (${idUsuario}, ${idServidor});
    `;
    console.log("Executando a instrução SQL: \n" + instrucaoSql);
    return database.executar(instrucaoSql);
}

function removerServidorUsuario(idUsuario, idServidor) {
    console.log("ACESSEI O USUARIO MODEL \n \n\t\t >> Se aqui der erro de 'Error: connect ECONNREFUSED',\n \t\t >> verifique suas credenciais de acesso ao banco\n \t\t >> e se o servidor de seu BD está rodando corretamente. \n\n function removerServidorUsuario():", idUsuario, idServidor);
    var instrucaoSql = `
        DELETE FROM usuarioServidor WHERE fkUsuario = ${idUsuario} AND fkServidor = ${idServidor};
    `;
    console.log("Executando a instrução SQL: \n" + instrucaoSql);
    return database.executar(instrucaoSql);
}

function pegarServidoresPorEmpresa(idEmpresa) {
    var instrucaoSql = `
        SELECT idServidor, nomeServidor, hostName FROM servidor;
    `;
    console.log("Executando a instrução SQL: \n" + instrucaoSql);
    return database.executar(instrucaoSql);
}

module.exports = {
    adicionarServidoresUsuario,
    removerServidorUsuario,
    pegarServidoresPorEmpresa
};