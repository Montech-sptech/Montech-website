var usuarioModel = require("../models/usuarioModel");
var servidorModel = require("../models/servidoresModel");

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

async function cadastrarServidor(req, res) {
    console.log("Acessei o servidoresController - cadastrar");

    var nomeServidor = req.body.nomeServidorServer;
    var hostName = req.body.hostNameServer;
    var tipoServidor = req.body.tipoServidorServer;
    var metodoDeColeta = req.body.metodoDeColetaServer;
    var porta = req.body.portaServer;
    var intervaloDeColeta = req.body.intervaloDeColetaServer;
    var componentes = req.body.componentesServer;

    if (!nomeServidor) {
        res.status(400).send("O nome do servidor está vazio ou undefined!");
    } else if (!porta) {
        res.status(400).send("A porta está vazia ou undefined!");
    } else if (isNaN(porta)) {
        res.status(400).send("A porta precisa ser um número!");
    } else if (!Array.isArray(componentes) || componentes.length === 0) {
        res.status(400).send("Selecione ao menos um componente para monitorar!");
    } else {

        try {
            let resultadoServidor = await servidorModel.cadastrarServidor(
                nomeServidor,
                hostName,
                tipoServidor,
                metodoDeColeta,
                porta,
                intervaloDeColeta
            );

            let idServidor = resultadoServidor.insertId;

            for (let componenteInfo of componentes) {
                let resultadoComponente = await servidorModel.buscarIdComponentePorNome(componenteInfo.nomeComponente);

                if (!resultadoComponente || resultadoComponente.length === 0) {
                    console.log(`Componente '${componenteInfo.nomeComponente}' não encontrado no cadastro, ignorando limite de alerta.`);
                } else {
                    let fkComponente = resultadoComponente[0].idComponente;

                    await servidorModel.adicionarComponenteServidor(
                        fkComponente,
                        idServidor,
                        componenteInfo.limiteAtencao,
                        componenteInfo.limiteCritico
                    );
                }
            }

            res.json({ idServidor: idServidor });

        } catch (erro) {
            console.log(erro);
            console.log("\nHouve um erro ao cadastrar o servidor! Erro: ", erro.sqlMessage);
            res.status(500).json(erro.sqlMessage || "Erro interno no servidor.");
        }
    }
}
module.exports = {
    adicionarServidoresUsuario,
    removerServidorUsuario,
    pegarServidoresPorEmpresa,
    cadastrarServidor
};