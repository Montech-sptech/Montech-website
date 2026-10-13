var database = require("../database/config");

function listarAeroportos() {
  var instrucaoSql = `
        SELECT 
            idAeroporto, nome, codigoAeroporto, statusAtividade FROM Aeroporto;
    `;

  console.log("Executando instrução SQL:\n" + instrucaoSql);

  return database.executar(instrucaoSql);
}

function verificarCadastrados() {
  var instrucaoSql = `
        select u.idUsuario, u.nome, u.email from Aeroporto a
            join Usuario u on u.fkAeroporto = a.idAeroporto; 
    `;

  return database.executar(instrucaoSql);
}

function cadastrar(nome, codigoAeroporto) {
  console.log("Acessei o aeroportoModel - cadastrar");

  var instrucaoSql = `INSERT INTO Aeroporto (nome, codigoAeroporto, statusAtividade)
        VALUES ('${nome}', '${codigoAeroporto}', 0);`;

  console.log("Executando a instrução SQL: \n" + instrucaoSql);
  return database.executar(instrucaoSql);
}

module.exports = {
  listarAeroportos,
  verificarCadastrados,
  cadastrar,
};
