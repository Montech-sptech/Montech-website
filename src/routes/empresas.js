var express = require("express");

var router = express.Router();

var empresaController = require("../controllers/empresaController");

router.get("/listar", function (req, res) {

    empresaController.listar(req, res);

});

router.get("/verificarCadastrados", function (req, res) {

    empresaController.verificarCadastrados(req, res);

});

router.get("/empresasCadastradas", function (req, res) {
    empresaController.carregarEmpresas(req, res);
});

router.post("/cadastrar", function (req, res) {
    empresaController.cadastrar(req, res);
});

router.get("/mensagensContatos", function (req, res) {
    empresaController.mensagensContatos(req, res);
});

module.exports = router;