var database = require("../database/config");
var mysql = require("mysql2");

function autenticar(email, senha) {
  console.log(
    "ACESSEI O USUARIO MODEL \n \n\t\t >> Se aqui der erro de 'Error: connect ECONNREFUSED',\n \t\t >> verifique suas credenciais de acesso ao banco\n \t\t >> e se o servidor de seu BD está rodando corretamente. \n\n function entrar(): ",
    email,
    senha,
  );
  var instrucaoSql = `
        SELECT 
            idUsuario AS id, nome, email, senha, fkAeroporto AS aeroportoId, fkCargo
        FROM usuario 
        WHERE email = '${email}' AND senha = '${senha}';
    `;
  console.log("Executando a instrução SQL: \n" + instrucaoSql);
  return database.executar(instrucaoSql);
}

function cadastrar(nome, email, senha, fkAeroporto, fkCargo) {
  console.log(
    "ACESSEI O USUARIO MODEL \n \n\t\t >> Se aqui der erro de 'Error: connect ECONNREFUSED',\n \t\t >> verifique suas credenciais de acesso ao banco\n \t\t >> e se o servidor de seu BD está rodando corretamente. \n\n function cadastrar():",
    nome,
    email,
    senha,
    fkAeroporto,
    fkCargo,
  );

  var instrucaoSql = `
        INSERT INTO usuario (nome, email, senha, fkAeroporto, fkCargo) 
        VALUES ('${nome}', '${email}', '${senha}', '${fkAeroporto}', '${fkCargo}');
    `;
  console.log("Executando a instrução SQL: \n" + instrucaoSql);
  return database.executar(instrucaoSql);
}

function encontrarUsuarioPorId(idUsuario) {
  console.log(
    "ACESSEI O USUARIO MODEL \n \n\t\t >> Se aqui der erro de 'Error: connect ECONNREFUSED',\n \t\t >> verifique suas credenciais de acesso ao banco\n \t\t >> e se o servidor de seu BD está rodando corretamente. \n\n function encontrarPorId():",
    idUsuario,
  );

  var instrucaoSql = `
        SELECT 
            * 
        FROM usuario 
        WHERE idUsuario = ${idUsuario};
    `;
  console.log("Executando a instrução SQL: \n" + instrucaoSql);
  return database.executar(instrucaoSql);
}

function pegarUsuariosPeloAeroporto(idAeroporto) {
  console.log(
    "ACESSEI O USUARIO MODEL \n \n\t\t >> Se aqui der erro de 'Error: connect ECONNREFUSED',\n \t\t >> verifique suas credenciais de acesso ao banco\n \t\t >> e se o servidor de seu BD está rodando corretamente. \n\n function pegarUsuariosPeloAeroporto():",
    idAeroporto,
  );
  var instrucaoSql = `
        SELECT 
            u.idUsuario,
            u.nome AS nomeUsuario,
            u.email,
            u.statusAtividade AS status,
            c.nome AS nomeCargo,
            s.idServidor,
            s.nomeServidor,
            s.hostname
        FROM usuario u
        LEFT JOIN visualizacao v ON v.fkUsuario = u.idUsuario
        LEFT JOIN servidor s ON s.idServidor = v.fkServidor
        LEFT JOIN cargo c ON c.idCargo = u.fkCargo
        WHERE u.fkAeroporto = ${idAeroporto};
    `;
  console.log("Executando a instrução SQL: \n" + instrucaoSql);
  return database.executar(instrucaoSql);
}

function editarUsuario(idUsuario, nome, email, statusAtividade) {
  var instrucaoSql = `
        UPDATE usuario
        SET nome = ${mysql.escape(nome)},
            email = ${mysql.escape(email)},
            statusAtividade = ${statusAtividade ? 1 : 0}
        WHERE idUsuario = ${Number(idUsuario)};
    `;
  console.log("Executando a instrução SQL: \n" + instrucaoSql);
  return database.executar(instrucaoSql);
}

function inativarUsuario(idUsuario) {
  console.log(
    "ACESSEI O USUARIO MODEL \n \n\t\t >> Se aqui der erro de 'Error: connect ECONNREFUSED',\n \t\t >> verifique suas credenciais de acesso ao banco\n \t\t >> e se o servidor de seu BD está rodando corretamente. \n\n function inativarUsuario():",
    idUsuario,
  );
  var instrucaoSql = `
        UPDATE usuario SET statusAtividade = 0 WHERE idUsuario = ${idUsuario};
    `;
  console.log("Executando a instrução SQL: \n" + instrucaoSql);
  return database.executar(instrucaoSql);
}

function ativarUsuario(idUsuario) {
  console.log(
    "ACESSEI O USUARIO MODEL \n \n\t\t >> Se aqui der erro de 'Error: connect ECONNREFUSED',\n \t\t >> verifique suas credenciais de acesso ao banco\n \t\t >> e se o servidor de seu BD está rodando corretamente. \n\n function ativarUsuario():",
    idUsuario,
  );
  var instrucaoSql = `
        UPDATE usuario SET statusAtividade = 1 WHERE idUsuario = ${idUsuario};
    `;
  console.log("Executando a instrução SQL: \n" + instrucaoSql);
  return database.executar(instrucaoSql);
}

module.exports = {
  autenticar,
  cadastrar,
  encontrarUsuarioPorId,
  pegarUsuariosPeloAeroporto,
  editarUsuario,
  ativarUsuario,
  inativarUsuario,
};
