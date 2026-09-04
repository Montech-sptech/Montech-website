var database = require("../database/config");

function listar() {

    var instrucaoSql = `
        SELECT 
            idEmpresa, razaoSocial, token FROM Empresa;
    `;

    console.log("Executando instrução SQL:\n" + instrucaoSql);

    return database.executar(instrucaoSql);
}

function verificarCadastrados(){
    var instrucaoSql = `
        select u.idUsuario from Empresa e
            join Usuario u on u.fkEmpresa = e.idEmpresa; 
    `;

    return database.executar(instrucaoSql);
}

function carregarEmpresas() {

    var instrucao = `
    SELECT
        razaoSocial,cnpj,token FROM Empresa;
    `;

    console.log("executando a instrução sql: \n" + instrucao);

    return database.executar(instrucao);
}

module.exports = {
    listar,
    verificarCadastrados,
    carregarEmpresas
};