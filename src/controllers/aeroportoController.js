var empresaModel = require("../models/aeroportoModel");

function verificarCadastrados(req, res) {
  empresaModel
    .verificarCadastrados()
    .then(function (resultado) {
      res.json(resultado);
    })
    .catch(function (erro) {
      console.log(erro);

      res.status(500).json(erro.sqlMessage);
    });
}

function carregarAeroportos(req, res) {
  empresaModel
    .listarAeroportos()
    .then(function (resultado) {
      res.status(200).json(resultado);
    })
    .catch(function (erro) {
      console.log(erro);
      console.log("Erro ao buscar aeroportos cadastrados");

      res.status(500).json(erro.sqlMessage);
    });
}

async function cadastrar(req, res) {
  console.log("Acessei o aeroportoController - cadastrar");

  var razaoSocial = req.body.razaoSocialServer;
  var cnpj = req.body.cnpjServer;
  var email = req.body.emailServer;
  var cep = req.body.cepServer;
  var numero = req.body.numeroServer;

  if (!razaoSocial) {
    res.status(400).send("A Razão social está vazia ou undefined!");
  } else if (!cnpj) {
    res.status(400).send("O CNPJ está vazio ou undefined!");
  } else if (!email) {
    res.status(400).send("O Email está vazio ou undefined!");
  } else if (!cep) {
    res.status(400).send("O CEP está vazio ou undefined!");
  } else if (!numero) {
    res.status(400).send("O Número está vazio ou undefined!");
  } else {
    try {
      let resultadoCnpj = await empresaModel.verificarCnpj(cnpj);

      if (
        resultadoCnpj &&
        resultadoCnpj.length > 0 &&
        resultadoCnpj[0].qtdCnpj > 0
      ) {
        res.status(400).send("CNPJ já cadastrado!");
        return;
      }

      empresaModel
        .cadastrar(razaoSocial, cnpj, email, cep, numero)
        .then(function (resultado) {
          res.json({
            aeroporto_id: resultado.insertId,
            codigo_aeroporto: codigo,
          });
        })
        .catch(function (erro) {
          console.log(
            "\nHouve erro ao cadastrar aeroporto! ERRO: ",
            erro.sqlMessage,
          );
          res.status(500).json(erro.sqlMessage);
        });
    } catch (erro) {
      console.log("\nErro na verificação de dados: ", erro);
      res.status(500).json("Erro interno no servidor.");
    }
  }
}

module.exports = {
  verificarCadastrados,
  carregarAeroportos,
  cadastrar,
};
