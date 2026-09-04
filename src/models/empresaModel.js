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

module.exports = {
    listar,
    verificarCadastrados
};