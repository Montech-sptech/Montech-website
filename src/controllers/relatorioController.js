var relatorioModel = require("../models/relatorioModel");

function cadastrar(req, res) {
    var titulo = req.body.tituloServer;
    var tipo = req.body.tipoServer;
    var resumo = req.body.resumoServer;
    var descricao = req.body.descricaoServer;
    var dataRelatorio = req.body.dataRelatorioServer;
    var statusAnalise = req.body.statusAnaliseServer;
    var fkEmpresa = req.body.fkEmpresaServer;
    if (titulo == undefined) {
        res.status(400).send("O título do relatório está undefined!");
    } else if (tipo == undefined) {
        res.status(400).send("O tipo do relatório está undefined!");
    } else if (resumo == undefined) {
        res.status(400).send("O resumo do relatório está undefined!");
    } else if (descricao == undefined) {
        res.status(400).send("A descrição do relatório está undefined!");
    } else if (dataRelatorio == undefined) {
        res.status(400).send("A data do relatório está undefined!");
    } else if (statusAnalise == undefined) {
        res.status(400).send("O status do relatório está undefined!");
    } else if (fkEmpresa == undefined) {
        res.status(400).send("A empresa do relatório está undefined!");
    } else {
        relatorioModel.cadastrar(
            titulo,
            tipo,
            resumo,
            descricao,
            dataRelatorio,
            statusAnalise,
            fkEmpresa
        )
            .then(function (resultado) {

                res.json(resultado);

            })
            .catch(function (erro) {
                console.log(erro);

                console.log(
                    "\nHouve um erro ao realizar o cadastro do relatório! Erro: ",
                    erro.sqlMessage
                );

                res.status(500).json(erro.sqlMessage);
            });
    }
}

function pegarRelatoriosPelaEmpresa(req, res) {
    var idEmpresa = req.params.id;

    relatorioModel.pegarRelatoriosPelaEmpresa(idEmpresa)
        .then(function (resultado) {
            res.json(resultado);
        })
        .catch(function (erro) {
            console.log(erro);
            console.log(
                "\nHouve um erro ao buscar os relatórios! Erro: ",
                erro.sqlMessage
            );

            res.status(500).json(erro.sqlMessage);
        });
}

module.exports = {
    cadastrar,
    pegarRelatoriosPelaEmpresa
};