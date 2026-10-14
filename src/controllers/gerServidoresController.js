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

module.exports = {
  buscarServidoresAeroporto,
  buscarComponentes
};