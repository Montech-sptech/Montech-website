var gerServidorModel = require("../models/gerServidoresModel");

async function buscarServidoresAeroporto(req, res) {
  let fkAeroporto = req.params.fkAeroporto;
  
  gerServidorModel
    .buscarServidoresAeroporto(fkAeroporto)
    .then(function (resultado) {
      res.json(resultado);
    })
    .catch(function (erro) {
      console.log(erro);
      res.status(500).json(erro.sqlMessage);
    });
}

async function buscarComponentes(req, res) {  
  gerServidorModel
    .buscarComponentes()
    .then(function (resultado) {
      res.json(resultado);
    })
    .catch(function (erro) {
      console.log(erro);
      res.status(500).json(erro.sqlMessage);
    });
}


function cadastrarServidor(req, res) {
    var token = req.body.tokenServer;
    var nomeServidor = req.body.nomeServidorServer;
    var sistemaOperacional = req.body.sistemaOperacionalServer;
    var fkAeroporto = req.body.fkAeroportoServer;

    if (token == undefined) {
        res.status(400).send("Seu token está undefined!");
    } else if (nomeServidor == undefined) {
        res.status(400).send("Seu nomeServidor está undefined!");
    } else if (sistemaOperacional == undefined) {
        res.status(400).send("Sua sistemaOperacional está undefined!");
    } else if (fkAeroporto == undefined) {
        res.status(400).send("Sua fkAeroporto está undefined!");
    } else {
        gerServidorModel.cadastrarServidor(token, nomeServidor, sistemaOperacional, fkAeroporto)
            .then(
                function (resultado) {
                    res.json(resultado);
                }
            ).catch(
                function (erro) {
                    console.log(erro);
                    console.log(
                        "\nHouve um erro ao realizar o cadastro do servidor! Erro: ",
                        erro.sqlMessage
                    );
                    res.status(500).json(erro.sqlMessage);
                }
            );
    }
}

function cadastrarComponenteServidor(req, res) {
    var fkServidor = req.body.fkServidorServer;
    var componentes = req.body.componentesServer;


    if (!fkServidor) {
        return res.status(400).send("fkServidor Dados inválidos");
    } else if (!Array.isArray(componentes)) {
        return res.status(400).send("Array Dados inválidos");
    }

    if (componentes.length === 0) {
        return res.status(200).json({ mensagem: "Nenhum componente para cadastrar" });
    }


    gerServidorModel.cadastrarComponenteServidor(fkServidor, componentes)
        .then(
            function (resultado) {
                res.json(resultado);
            }
        ).catch(
            function (erro) {
                console.log(erro);
                console.log(
                    "\nHouve um erro ao realizar o cadastro do servidor! Erro: ",
                    erro.sqlMessage
                );
                res.status(500).json(erro.sqlMessage);
            }
        );
}

function deletarServidor(req, res) {
    var idServidor = req.body.idServidorServer;

    if (idServidor == undefined) {
        res.status(400).send("Seu idServidor está undefined!");
    } else {
        gerServidorModel.deletarServidor(idServidor)
        .then(
            function (resultado) {
                res.json(resultado);
            }
        ).catch(
            function (erro) {
                console.log(erro);
                console.log(
                    "\nHouve um erro ao realizar o delete do servidor! Erro: ",
                    erro.sqlMessage
                );
                res.status(500).json(erro.sqlMessage);
            }
        );
    }
}

function deletarComponenteServidor(req, res) {
    var idServidor = req.body.idServidorServer;

    if (idServidor == undefined) {
        res.status(400).send("Seu idServidor está undefined!");
    } else {
        gerServidorModel.deletarComponenteServidor(idServidor)
        .then(
            function (resultado) {
                res.json(resultado);
            }
        ).catch(
            function (erro) {
                console.log(erro);
                console.log(
                    "\nHouve um erro ao realizar o delete do componente! Erro: ",
                    erro.sqlMessage
                );
                res.status(500).json(erro.sqlMessage);
            }
        );
    }
}

async function buscarServidor(req, res) {
  let idServidor = req.params.idServidor;
  
  gerServidorModel
    .buscarServidor(idServidor)
    .then(function (resultado) {
      res.json(resultado);
    })
    .catch(function (erro) {
      console.log(erro);
      res.status(500).json(erro.sqlMessage);
    });
}

async function buscarComponentesServidor(req, res) {
  let idServidor = req.params.idServidor;
  
  gerServidorModel
    .buscarComponentesServidor(idServidor)
    .then(function (resultado) {
      res.json(resultado);
    })
    .catch(function (erro) {
      console.log(erro);
      res.status(500).json(erro.sqlMessage);
    });
}

async function buscarComponentesServidorSemServidor(req, res) {
  let idServidor = req.params.idServidor;
  
  gerServidorModel
    .buscarComponentesServidorSemServidor(idServidor)
    .then(function (resultado) {
      res.json(resultado);
    })
    .catch(function (erro) {
      console.log(erro);
      res.status(500).json(erro.sqlMessage);
    });
}

async function atualizarDadosServidor(req, res) {
    var idServidor = req.body.idServidorServer;
    var nomeServidor = req.body.nomeServidorServer;
    var sistemaOperacional = req.body.sistemaOperacionalServer;
    var statusAtividade = req.body.statusAtividadeServer;
  
  gerServidorModel
    .atualizarDadosServidor(idServidor, nomeServidor, sistemaOperacional, statusAtividade)
    .then(function (resultado) {
      res.json(resultado);
    })
    .catch(function (erro) {
      console.log(erro);
      res.status(500).json(erro.sqlMessage);
    });
}

async function removerComponentesServidor(req, res) {
    var idServidor = req.body.idServidorServer;
    var componentes = req.body.componentesServer;
  
  gerServidorModel
    .removerComponentesServidor(idServidor, componentes)
    .then(function (resultado) {
      res.json(resultado);
    })
    .catch(function (erro) {
      console.log(erro);
      res.status(500).json(erro.sqlMessage);
    });
}

async function atualizarDadosComponentesServidor(req, res) {
    var idServidor = req.body.idServidorServer;
    var componentes = req.body.componentesServer;
  
  gerServidorModel
    .atualizarDadosComponentesServidor(idServidor, componentes)
    .then(function (resultado) {
      res.json(resultado);
    })
    .catch(function (erro) {
      console.log(erro);
      res.status(500).json(erro.sqlMessage);
    });
}


module.exports = {
  buscarServidoresAeroporto,
  buscarComponentes,
  cadastrarServidor,
  cadastrarComponenteServidor,
  deletarServidor,
  deletarComponenteServidor,
  buscarServidor,
  buscarComponentesServidor,
  buscarComponentesServidorSemServidor,
  atualizarDadosServidor,
  removerComponentesServidor,
  atualizarDadosComponentesServidor
};