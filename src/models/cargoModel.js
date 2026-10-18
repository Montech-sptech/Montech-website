var database = require("../database/config");
var mysql = require("mysql2");
function buscarContextoDoUsuario(idUsuario) {
  var instrucaoSql = `
    SELECT
      a.fkEmpresa AS idEmpresa,
      c.nome AS nomeCargo
    FROM usuario u
    JOIN aeroporto a ON a.idAeroporto = u.fkAeroporto
    JOIN cargo c ON c.idCargo = u.fkCargo
    WHERE u.idUsuario = ${Number(idUsuario)};
  `;
  console.log("Executando a instrução SQL: \n" + instrucaoSql);
  return database.executar(instrucaoSql);
}

function listarCargos(idEmpresa) {
  var instrucaoSql = `
    SELECT
      c.idCargo,
      c.nome,
      c.descricao,
      c.statusAtividade,
      (SELECT COUNT(*) FROM usuario u WHERE u.fkCargo = c.idCargo) AS totalUsuarios,
      p.idPermissao,
      p.nome AS nomePermissao
    FROM cargo c
    LEFT JOIN cargopermissao cp ON cp.fkCargo = c.idCargo
    LEFT JOIN permissao p ON p.idPermissao = cp.fkPermissao
    WHERE c.empresa_idEmpresa = ${Number(idEmpresa)}
    ORDER BY c.nome, p.nome;
  `;
  console.log("Executando a instrução SQL: \n" + instrucaoSql);
  return database.executar(instrucaoSql);
}

function listarPermissoes() {
  var instrucaoSql = `
    SELECT idPermissao, nome, descricao
    FROM permissao
    ORDER BY nome;
  `;
  console.log("Executando a instrução SQL: \n" + instrucaoSql);
  return database.executar(instrucaoSql);
}

function buscarCargoDaEmpresa(idCargo, idEmpresa) {
  var instrucaoSql = `
    SELECT idCargo, nome, statusAtividade
    FROM cargo
    WHERE idCargo = ${Number(idCargo)}
      AND empresa_idEmpresa = ${Number(idEmpresa)};
  `;
  console.log("Executando a instrução SQL: \n" + instrucaoSql);
  return database.executar(instrucaoSql);
}

function buscarCargoPorNome(nome, idEmpresa, idCargoIgnorar) {
  var instrucaoSql = `
    SELECT idCargo
    FROM cargo
    WHERE empresa_idEmpresa = ${Number(idEmpresa)}
      AND LOWER(nome) = LOWER(${mysql.escape(nome)})
      AND idCargo <> ${Number(idCargoIgnorar)};
  `;
  console.log("Executando a instrução SQL: \n" + instrucaoSql);
  return database.executar(instrucaoSql);
}

function cadastrarCargo(nome, descricao, idEmpresa) {
  var instrucaoSql = `
    INSERT INTO cargo (nome, descricao, statusAtividade, empresa_idEmpresa)
    VALUES (${mysql.escape(nome)}, ${mysql.escape(descricao)}, 1, ${Number(idEmpresa)});
  `;
  console.log("Executando a instrução SQL: \n" + instrucaoSql);
  return database.executar(instrucaoSql);
}

function atualizarCargo(idCargo, idEmpresa, nome, descricao, status) {
  var instrucaoSql = `
    UPDATE cargo
    SET nome = ${mysql.escape(nome)},
        descricao = ${mysql.escape(descricao)},
        statusAtividade = ${status ? 1 : 0}
    WHERE idCargo = ${Number(idCargo)}
      AND empresa_idEmpresa = ${Number(idEmpresa)};
  `;
  console.log("Executando a instrução SQL: \n" + instrucaoSql);
  return database.executar(instrucaoSql);
}

function contarPermissoesExistentes(idsPermissao) {
  var instrucaoSql = `
    SELECT COUNT(*) AS total
    FROM permissao
    WHERE idPermissao IN (${idsPermissao.map(Number).join(", ")});
  `;
  console.log("Executando a instrução SQL: \n" + instrucaoSql);
  return database.executar(instrucaoSql);
}

function listarPermissoesDoCargo(idCargo) {
  var instrucaoSql = `
    SELECT fkPermissao
    FROM cargopermissao
    WHERE fkCargo = ${Number(idCargo)};
  `;
  console.log("Executando a instrução SQL: \n" + instrucaoSql);
  return database.executar(instrucaoSql);
}

function listarNomesPermissoesDoCargo(idCargo) {
  var instrucaoSql = `
    SELECT p.nome
    FROM cargopermissao cp
    JOIN permissao p ON p.idPermissao = cp.fkPermissao
    WHERE cp.fkCargo = ${Number(idCargo)};
  `;
  console.log("Executando a instrução SQL: \n" + instrucaoSql);
  return database.executar(instrucaoSql);
}

function vincularPermissoes(idCargo, idsPermissao) {
  var valores = idsPermissao
    .map(function (idPermissao) {
      return `(${Number(idCargo)}, ${Number(idPermissao)}, NOW())`;
    })
    .join(", ");

  var instrucaoSql = `
    INSERT INTO cargopermissao (fkCargo, fkPermissao, dataConcessao)
    VALUES ${valores};
  `;
  console.log("Executando a instrução SQL: \n" + instrucaoSql);
  return database.executar(instrucaoSql);
}

function removerPermissoes(idCargo, idsPermissao) {
  var filtro = "";
  if (idsPermissao && idsPermissao.length > 0) {
    filtro = `AND fkPermissao IN (${idsPermissao.map(Number).join(", ")})`;
  }

  var instrucaoSql = `
    DELETE FROM cargopermissao
    WHERE fkCargo = ${Number(idCargo)} ${filtro};
  `;
  console.log("Executando a instrução SQL: \n" + instrucaoSql);
  return database.executar(instrucaoSql);
}

function contarUsuariosDoCargo(idCargo) {
  var instrucaoSql = `
    SELECT COUNT(*) AS total
    FROM usuario
    WHERE fkCargo = ${Number(idCargo)};
  `;
  console.log("Executando a instrução SQL: \n" + instrucaoSql);
  return database.executar(instrucaoSql);
}

function excluirCargo(idCargo, idEmpresa) {
  var instrucaoSql = `
    DELETE FROM cargo
    WHERE idCargo = ${Number(idCargo)}
      AND empresa_idEmpresa = ${Number(idEmpresa)};
  `;
  console.log("Executando a instrução SQL: \n" + instrucaoSql);
  return database.executar(instrucaoSql);
}

module.exports = {
  buscarContextoDoUsuario,
  listarCargos,
  listarPermissoes,
  buscarCargoDaEmpresa,
  buscarCargoPorNome,
  cadastrarCargo,
  atualizarCargo,
  contarPermissoesExistentes,
  listarPermissoesDoCargo,
  listarNomesPermissoesDoCargo,
  vincularPermissoes,
  removerPermissoes,
  contarUsuariosDoCargo,
  excluirCargo,
};
