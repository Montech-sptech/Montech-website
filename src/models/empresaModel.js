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


function mensagensContatos() {
    console.log("Acessei o contatoModel/empresaModel - mensagensContatos");

    var instrucaoSql = `
        SELECT nomeEmpresa, email, telefone, DATE_FORMAT(dataMensagem, '%d/%m/%Y %H:%i:%s') AS dataMensagem FROM Contato
        ORDER BY dataMensagem DESC;
    `;

    console.log("Executando a instrução SQL: \n" + instrucaoSql);
    return database.executar(instrucaoSql);
}

module.exports = {
    listar,
    verificarCadastrados,
    carregarEmpresas,
    cadastrar,
    verificarCnpj,
    verificarCodigoCadastro,
    mensagensContatos
};