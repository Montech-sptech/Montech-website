var empresaModel = require("../models/empresaModel");

function listar(req, res) {

    empresaModel.listar()
        .then(function (resultado) {

            res.json(resultado);

        })
        .catch(function (erro) {

            console.log(erro);

            res.status(500).json(erro.sqlMessage);
        });
}

function verificarCadastrados(req, res) {
    empresaModel.verificarCadastrados()
        .then(function (resultado) {

            res.json(resultado);

        })
        .catch(function (erro) {

            console.log(erro);

            res.status(500).json(erro.sqlMessage);
        });
}

function carregarEmpresas(req, res) {

    empresaModel.carregarEmpresas()
        .then(function (resultado) {

            res.status(200).json(resultado);

        })
        .catch(function (erro) {

            console.log(erro);
            console.log("Erro ao buscar empresas cadastradas");

            res.status(500).json(erro.sqlMessage);
        });
}

module.exports = {
    listar,
    verificarCadastrados,
    carregarEmpresas
};