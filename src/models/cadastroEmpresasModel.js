var database = require("../database/config");

function cadastrar(razaoSocial, cnpj, codigoCadastro, cep, numero) {
    console.log("Acessei o empresaModel - cadastrar");

    var instrucaoSql = `INSERT INTO Empresa (razaoSocial, cnpj, cep, numero, token)
        VALUES ('${razaoSocial}', '${cnpj}', '${cep}', '${numero}', '${codigoCadastro}');`;

    console.log("Executando a instrução SQL: \n" + instrucaoSql);
    return database.executar(instrucaoSql);
}

function verificarCnpj(cnpj) {
    console.log("Acessei o empresaModel - verificarCnpj");

    var instrucaoSql = `SELECT COUNT(*) AS qtdCnpj FROM Empresa WHERE cnpj = '${cnpj}';`;

    console.log("Executando a instrução SQL: \n" + instrucaoSql);
    return database.executar(instrucaoSql);
}

function verificarCodigoCadastro(codigo) {
    console.log("Acessei o empresaModel - verificarCodigoCadastro");

    var instrucaoSql = `SELECT COUNT(*) AS qtdEmpresa FROM Empresa WHERE token = '${codigo}';`;

    console.log("Executando a instrução SQL: \n" + instrucaoSql);
    return database.executar(instrucaoSql);
}


module.exports = {
    cadastrar,
    verificarCnpj,
    verificarCodigoCadastro
};