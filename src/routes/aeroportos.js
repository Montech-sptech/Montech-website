var express = require("express");

var router = express.Router();

var empresaController = require("../controllers/aeroportoController");

router.get("/verificarCadastrados", function (req, res) {
  empresaController.verificarCadastrados(req, res);
});

router.get("/aeroportosCadastrados", function (req, res) {
  empresaController.carregarAeroportos(req, res);
});

router.post("/cadastrar", function (req, res) {
  empresaController.cadastrar(req, res);
});

module.exports = router;
