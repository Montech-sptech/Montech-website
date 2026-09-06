var usuarioModel = require("../models/usuarioModel");
var servidorModel = require("../models/servidorerModal");

async function adicionarServidoresUsuario(req, res) {
    let usuarioId = req.body.idUsuario;
    let idServidor = req.body.idServidor;

    servidorModel.adicionarServidoresUsuario(usuarioId, idServidor)
        .then(function (resultado) {
            res.json(resultado);
        })
        .catch(function (erro) {
            console.log(erro);
            console.log("\nHouve um erro ao atualizar os servidores do usuário! Erro: ", erro.sqlMessage);
            res.status(500).json(erro.sqlMessage);
        });
}

async function removerServidorUsuario(req, res) {
    let usuarioId = req.body.idUsuario;
    let idServidor = req.body.idServidor;

    servidorModel.removerServidorUsuario(usuarioId, idServidor)
        .then(function (resultado) {
            res.json(resultado);
        })
        .catch(function (erro) {
            console.log(erro);
            console.log("\nHouve um erro ao remover o servidor do usuário! Erro: ", erro.sqlMessage);
            res.status(500).json(erro.sqlMessage);
        });
}

async function pegarServidoresPorEmpresa(req, res) {
    let usuarioId = req.params.id;

    let usuario = await usuarioModel.encontrarUsuarioPorId(usuarioId);
    if (!usuario[0]) {
        return res.status(404).json({ mensagem: 'Usuário não encontrado.' });
    }

    let fkEmpresa = usuario[0].fkEmpresa;

    servidorModel.pegarServidoresPorEmpresa(fkEmpresa)
        .then(function (resultado) {
            res.json(resultado);
        })
        .catch(function (erro) {
            console.log(erro);
            res.status(500).json(erro.sqlMessage);
        });
}

module.exports = {
    adicionarServidoresUsuario,
    removerServidorUsuario,
    pegarServidoresPorEmpresa
};