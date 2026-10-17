var usuarioModel = require("../models/usuarioModel");

function autenticar(req, res) {
  var email = req.body.emailServer;
  var senha = req.body.senhaServer;

  if (email == undefined) {
    res.status(400).send("Seu email está undefined!");
  } else if (senha == undefined) {
    res.status(400).send("Sua senha está indefinida!");
  } else {
    usuarioModel
      .autenticar(email, senha)
      .then(function (resultadoAutenticar) {
        console.log(`\nResultados encontrados: ${resultadoAutenticar.length}`);

        console.log(`Resultados: ${JSON.stringify(resultadoAutenticar)}`);

        if (resultadoAutenticar.length == 1) {
          res.json({
            id: resultadoAutenticar[0].idUsuario,
            email: resultadoAutenticar[0].email,
            nome: resultadoAutenticar[0].nome,
            empresaId: resultadoAutenticar[0].empresaId,
            aeroportoId: resultadoAutenticar[0].aeroportoId,
            cargo: resultadoAutenticar[0].cargo
        });
        } else if (resultadoAutenticar.length == 0) {
          res.status(403).send("Email e/ou senha inválido(s)");
        } else {
          res.status(403).send("Mais de um usuário com o mesmo login e senha!");
        }
      })
      .catch(function (erro) {
        console.log(erro);

        console.log(
          "\nHouve um erro ao realizar o login! Erro:",
          erro.sqlMessage,
        );

        res.status(500).json(erro.sqlMessage);
      });
  }
}

function cadastrar(req, res) {
  var nome = req.body.nome;
  var cpf = req.body.cpf;
  var email = req.body.email;
  var telefone = req.body.telefone;
  var senha = req.body.senha;
  var statusAtividade = req.body.statusAtividade;
  var fkAeroporto = req.body.fkAeroporto;
  var fkCargo = req.body.fkCargo;

  if (nome == undefined) {
    return res.status(400).send("Seu nome está undefined!");
  } else if(cpf == undefined){
    return res.status(400).send("Seu cpf está undefined!")
  } else if (email == undefined) {
    return res.status(400).send("Seu email está undefined!");
  } else if(statusAtividade == undefined){
    return res.status(400).send("Seu statusAtividade está undefined!")
  } else if (senha == undefined) {
    return res.status(400).send("Sua senha está undefined!");
  } else if (fkAeroporto == undefined) {
    return res.status(400).send("Seu aeroporto a vincular está undefined!");
  } else if (fkCargo == undefined) {
    return res.status(400).send("Cargo inválido");
  } else {
    usuarioModel
      .cadastrar(nome, cpf, email, telefone, senha, statusAtividade, fkAeroporto, fkCargo)
      .then(function (resultado) {
        res.json(resultado);
      })
      .catch(function (erro) {
        console.log(erro);
        console.log(
          "\nHouve um erro ao realizar o cadastro! Erro: ",
          erro.sqlMessage,
        );
        res.status(500).json(erro.sqlMessage);
      });
  }
}

async function pegarUsuariosPeloAdministrador(req, res) {
  var usuarioId = req.params.id;

  var usuario = await usuarioModel.encontrarUsuarioPorId(usuarioId);

  if (!usuario[0]) {
    return res.status(404).json({ mensagem: "Usuário não encontrado." });
  }

  var aeroportoId = usuario[0].fkAeroporto;
  var jsonBruto = await usuarioModel.pegarUsuariosPeloAeroporto(aeroportoId);

  var Usuarios = {};

  for (var i = 0; i < jsonBruto.length; i++) {
    var linha = jsonBruto[i];
    var idAtual = linha.idUsuario;

    if (!Usuarios[idAtual]) {
      Usuarios[idAtual] = {
        idUsuario: linha.idUsuario,
        nomeUsuario: linha.nomeUsuario,
        email: linha.email,
        nomeCargo: linha.nomeCargo,
        status: linha.status,
        servidores: [],
      };
    }

    if (linha.idServidor) {
      Usuarios[idAtual].servidores.push({
        idServidor: linha.idServidor,
        nomeServidor: linha.nomeServidor,
        hostName: linha.hostName,
      });
    }
  }

  var usuariosAgrupados = [];
  for (id in Usuarios) {
    usuariosAgrupados.push(Usuarios[id]);
  }

  return res.json(usuariosAgrupados);
}

function editarUsuario(req, res) {
  var usuarioId = Number(req.params.id);
  var nome = typeof req.body.nome === "string" ? req.body.nome.trim() : "";
  var email = typeof req.body.email === "string" ? req.body.email.trim() : "";
  var statusAtividade = req.body.statusAtividade;

  if (!Number.isInteger(usuarioId) || usuarioId <= 0) {
    return res.status(400).json({ mensagem: "ID de usuário inválido." });
  }
  if (!nome || !email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return res.status(400).json({ mensagem: "Nome ou email inválido." });
  }
  if (typeof statusAtividade !== "boolean") {
    return res.status(400).json({ mensagem: "Status de atividade inválido." });
  }

  usuarioModel
    .editarUsuario(usuarioId, nome, email, statusAtividade)
    .then(function (resultado) {
      res.json(resultado);
    })
    .catch(function (erro) {
      console.log(erro);
      console.log(
        "\nHouve um erro ao editar o usuário! Erro:",
        erro.sqlMessage,
      );
      res.status(500).json({ mensagem: "Não foi possível editar o usuário." });
    });
}

function inativarUsuario(req, res) {
  var usuarioId = req.body.idUsuario;

  usuarioModel
    .inativarUsuario(usuarioId)
    .then(function (resultado) {
      res.json(resultado);
    })
    .catch(function (erro) {
      console.log(erro);
      console.log(
        "\nHouve um erro ao inativar o usuário! Erro: ",
        erro.sqlMessage,
      );
      res.status(500).json(erro.sqlMessage);
    });
}

function ativarUsuario(req, res) {
  var usuarioId = req.body.idUsuario;

  usuarioModel
    .ativarUsuario(usuarioId)
    .then(function (resultado) {
      res.json(resultado);
    })
    .catch(function (erro) {
      console.log(erro);
      console.log(
        "\nHouve um erro ao ativar o usuário! Erro: ",
        erro.sqlMessage,
      );
      res.status(500).json(erro.sqlMessage);
    });
}

function listarCargos(req, res) {
  var empresaId = Number(req.query.empresaId);

  if (!Number.isInteger(empresaId) || empresaId <= 0) {
    return res.status(400).json({
      mensagem: "ID da empresa inválido."
    });
  }

  usuarioModel
    .listarCargosPorEmpresa(empresaId)
    .then(function (resultado) {
      res.json(resultado);
    })
    .catch(function (erro) {
      console.log("Erro ao buscar cargos:", erro);
      res.status(500).json({
        mensagem: "Não foi possível buscar os cargos."
      });
    });
}

module.exports = {
  autenticar,
  cadastrar,
  editarUsuario,
  pegarUsuariosPeloAdministrador,
  inativarUsuario,
  ativarUsuario,
  listarCargos
};
