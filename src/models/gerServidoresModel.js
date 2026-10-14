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


module.exports = {
  buscarServidoresAeroporto
};