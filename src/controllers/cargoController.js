var cargoModel = require("../models/cargoModel");

var CARGO_PROTEGIDO = "administrador";

function ehProtegido(nomeCargo) {
  return String(nomeCargo).trim().toLowerCase() == CARGO_PROTEGIDO;
}

function erro(res, codigo, mensagem) {
  return res.status(codigo).json({ mensagem: mensagem });
}

function erroInesperado(res, e, acao) {
  console.log("\nHouve um erro ao " + acao + "! Erro: ", e.sqlMessage || e);
  return erro(res, 500, "Erro interno ao " + acao + ".");
}

async function exigirAdministrador(req, res) {
  var contexto = await cargoModel.buscarContextoDoUsuario(req.params.id);

  if (!contexto[0]) {
    erro(res, 404, "Usuário não encontrado.");
    return null;
  }
  if (!ehProtegido(contexto[0].nomeCargo)) {
    erro(res, 403, "Acesso negado.");
    return null;
  }
  return contexto[0];
}

function validarCorpo(body) {
  var nome = typeof body.nome == "string" ? body.nome.trim() : "";
  var descricao =
    typeof body.descricao == "string" ? body.descricao.trim() : "";
  var permissoes = body.permissoes;

  if (nome.length < 2 || nome.length > 100) {
    return { mensagem: "O nome do cargo deve ter entre 2 e 100 caracteres." };
  }
  if (descricao.length > 250) {
    return { mensagem: "A descrição deve ter no máximo 250 caracteres." };
  }
  if (permissoes == null) {
    return { mensagem: "Lista de permissões inválida." };
  }
  if (permissoes.length == 0) {
    return { mensagem: "Selecione ao menos uma permissão." };
  }

  return {
    dados: { nome: nome, descricao: descricao, permissoes: permissoes },
  };
}

async function permissoesExistem(ids) {
  var resultado = await cargoModel.contarPermissoesExistentes(ids);
  return Number(resultado[0].total) == ids.length;
}

async function listar(req, res) {
  try {
    var contexto = await exigirAdministrador(req, res);
    if (!contexto) return;

    var linhas = await cargoModel.listarCargos(contexto.idEmpresa);

    var cargos = [];
    var porId = {};

    for (var i = 0; i < linhas.length; i++) {
      var linha = linhas[i];

      if (!porId[linha.idCargo]) {
        porId[linha.idCargo] = {
          idCargo: linha.idCargo,
          nome: linha.nome,
          descricao: linha.descricao || "",
          status: linha.statusAtividade ? true : false,
          totalUsuarios: Number(linha.totalUsuarios),
          protegido: ehProtegido(linha.nome),
          permissoes: [],
        };
        cargos.push(porId[linha.idCargo]);
      }

      if (linha.idPermissao) {
        porId[linha.idCargo].permissoes.push({
          idPermissao: linha.idPermissao,
          nome: linha.nomePermissao,
        });
      }
    }

    return res.json(cargos);
  } catch (e) {
    return erroInesperado(res, e, "listar os cargos");
  }
}

async function listarPermissoes(req, res) {
  try {
    var contexto = await exigirAdministrador(req, res);
    if (!contexto) return;

    var permissoes = await cargoModel.listarPermissoes();
    return res.json(permissoes);
  } catch (e) {
    return erroInesperado(res, e, "listar as permissões");
  }
}

async function cadastrar(req, res) {
  try {
    var contexto = await exigirAdministrador(req, res);
    if (!contexto) return;

    var validacao = validarCorpo(req.body);
    if (!validacao.dados) return erro(res, 400, validacao.mensagem);
    var dados = validacao.dados;

    var repetido = await cargoModel.buscarCargoPorNome(
      dados.nome,
      contexto.idEmpresa,
      0,
    );
    if (repetido.length > 0) {
      return erro(res, 409, "Já existe um cargo com esse nome.");
    }

    if (!(await permissoesExistem(dados.permissoes))) {
      return erro(res, 400, "Alguma das permissões selecionadas não existe.");
    }

    var novoCargo = await cargoModel.cadastrarCargo(
      dados.nome,
      dados.descricao,
      contexto.idEmpresa,
    );

    try {
      await cargoModel.vincularPermissoes(novoCargo.insertId, dados.permissoes);
    } catch (e) {
      await cargoModel.excluirCargo(novoCargo.insertId, contexto.idEmpresa);
      throw e;
    }

    return res.status(201).json({ idCargo: novoCargo.insertId });
  } catch (e) {
    return erroInesperado(res, e, "cadastrar o cargo");
  }
}

async function atualizar(req, res) {
  try {
    var contexto = await exigirAdministrador(req, res);
    if (!contexto) return;

    var idCargo = Number(req.body.idCargo);
    var status =
      req.body.status === false || req.body.status === 0 ? false : true;

    var validacao = validarCorpo(req.body);
    if (!validacao.dados) return erro(res, 400, validacao.mensagem);
    var dados = validacao.dados;

    var cargoAtual = await cargoModel.buscarCargoDaEmpresa(
      idCargo,
      contexto.idEmpresa,
    );
    if (!cargoAtual[0]) return erro(res, 404, "Cargo não encontrado.");

    if (ehProtegido(cargoAtual[0].nome)) {
      if (!ehProtegido(dados.nome)) {
        return erro(res, 400, "O cargo Administrador não pode ser renomeado.");
      }
      if (!status) {
        return erro(res, 400, "O cargo Administrador não pode ser desativado.");
      }
    }

    var repetido = await cargoModel.buscarCargoPorNome(
      dados.nome,
      contexto.idEmpresa,
      idCargo,
    );
    if (repetido.length > 0) {
      return erro(res, 409, "Já existe um cargo com esse nome.");
    }

    if (!(await permissoesExistem(dados.permissoes))) {
      return erro(res, 400, "Alguma das permissões selecionadas não existe.");
    }

    await cargoModel.atualizarCargo(
      idCargo,
      contexto.idEmpresa,
      dados.nome,
      dados.descricao,
      status,
    );

    var linhasAtuais = await cargoModel.listarPermissoesDoCargo(idCargo);
    var atuais = [];
    for (var i = 0; i < linhasAtuais.length; i++) {
      atuais.push(linhasAtuais[i].fkPermissao);
    }

    var paraAdicionar = dados.permissoes.filter(function (id) {
      return atuais.indexOf(id) == -1;
    });
    var paraRemover = atuais.filter(function (id) {
      return dados.permissoes.indexOf(id) == -1;
    });

    if (paraRemover.length > 0) {
      await cargoModel.removerPermissoes(idCargo, paraRemover);
    }
    if (paraAdicionar.length > 0) {
      await cargoModel.vincularPermissoes(idCargo, paraAdicionar);
    }

    return res.json({ idCargo: idCargo });
  } catch (e) {
    return erroInesperado(res, e, "atualizar o cargo");
  }
}

async function excluir(req, res) {
  try {
    var contexto = await exigirAdministrador(req, res);
    if (!contexto) return;

    var idCargo = Number(req.body.idCargo);

    var cargoAtual = await cargoModel.buscarCargoDaEmpresa(
      idCargo,
      contexto.idEmpresa,
    );
    if (!cargoAtual[0]) return erro(res, 404, "Cargo não encontrado.");

    if (ehProtegido(cargoAtual[0].nome)) {
      return erro(res, 400, "O cargo Administrador não pode ser excluído.");
    }

    var usuarios = await cargoModel.contarUsuariosDoCargo(idCargo);
    var total = Number(usuarios[0].total);
    if (total > 0) {
      return erro(
        res,
        409,
        "Existem " +
          total +
          " usuário(s) com esse cargo. Mude o cargo deles antes de excluir.",
      );
    }

    await cargoModel.removerPermissoes(idCargo);
    await cargoModel.excluirCargo(idCargo, contexto.idEmpresa);

    return res.json({ idCargo: idCargo });
  } catch (e) {
    return erroInesperado(res, e, "excluir o cargo");
  }
}

module.exports = {
  listar,
  listarPermissoes,
  cadastrar,
  atualizar,
  excluir,
};
