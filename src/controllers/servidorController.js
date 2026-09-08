function cadastrar(req, res) {
    console.log("Acessei o servidoresController - cadastrar");

    var nomeServidor = req.body.nomeServidorServer;
    var hostName = req.body.hostNameServer;
    var tipoServidor = req.body.tipoServidorServer;
    var metodoDeColeta = req.body.metodoDeColetaServer;
    var porta = req.body.portaServer;
    var intervaloDeColeta = req.body.intervaloDeColetaServer;
    var componentesAMonitorar = req.body.componentesAMonitorarServer;

    if (!nomeServidor) {
        res.status(400).send("O nome do servidor está vazio ou undefined!");
    } else if (!porta) {
        res.status(400).send("A porta está vazia ou undefined!");
    } else if (isNaN(porta)) {
        res.status(400).send("A porta precisa ser um número!");
    } else {
        servidorModel.cadastrar(
            nomeServidor, hostName, tipoServidor, metodoDeColeta,
            porta, intervaloDeColeta, componentesAMonitorar
        )
            .then(function (resultado) {
                res.json({ idServidor: resultado.insertId });
            })
            .catch(function (erro) {
                console.log(erro);
                console.log("\nHouve um erro ao cadastrar o servidor! Erro: ", erro.sqlMessage);
                res.status(500).json(erro.sqlMessage);
            });
    }
}

module.exports = {
    adicionarServidoresUsuario,
    removerServidorUsuario,
    pegarServidoresPorEmpresa,
    cadastrar
};