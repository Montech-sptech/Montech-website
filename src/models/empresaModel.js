var database = require("../database/config");

function listarEmpresas() {
  var instrucaoSql = `
        SELECT 
            idEmpresa, razaoSocial, cnpj, cep, numero, statusAtividade FROM Empresa;
    `;

  console.log("Executando instrução SQL:\n" + instrucaoSql);

  return database.executar(instrucaoSql);
}

function verificarCadastrados() {
  var instrucaoSql = `
        select u.idUsuario, u.nome, u.email from Empresa e
            join Usuario u on u.fkEmpresa = e.idEmpresa; 
    `;

  return database.executar(instrucaoSql);
}

function cadastrar(razaoSocial, cnpj, email, cep, numero) {
  console.log("Acessei o empresaModel - cadastrar");

  var instrucaoSql = `INSERT INTO Empresa (razaoSocial, cnpj, email, cep, numero, statusAtividade)
        VALUES ('${razaoSocial}', '${cnpj}', '${email}', '${cep}', '${numero}', 0);`;

  console.log("Executando a instrução SQL: \n" + instrucaoSql);
  return database.executar(instrucaoSql);
}

function verificarCnpj(cnpj) {
  console.log("Acessei o empresaModel - verificarCnpj");

  var instrucaoSql = `SELECT COUNT(*) AS qtdCnpj FROM Empresa WHERE cnpj = '${cnpj}';`;

  console.log("Executando a instrução SQL: \n" + instrucaoSql);
  return database.executar(instrucaoSql);
}

module.exports = {
  listarEmpresas,
  verificarCadastrados,
  cadastrar,
  verificarCnpj,
};
