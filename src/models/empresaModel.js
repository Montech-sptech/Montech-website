var database = require("../database/config");

function listar() {

    var instrucaoSql = `
        SELECT 
            idEmpresa, nomeEmpresa, token FROM Empresa;
    `;

    console.log("Executando instrução SQL:\n" + instrucaoSql);

    return database.executar(instrucaoSql);
}

module.exports = {
    listar
};