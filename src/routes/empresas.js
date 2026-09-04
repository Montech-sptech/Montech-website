var express = require("express");

var router = express.Router();

var empresaController = require("../controllers/empresaController");

router.get("/listar", function (req, res) {

    empresaController.listar(req, res);

});

router.get("/verificarCadastrados", function (req, res) {

    empresaController.verificarCadastrados(req, res);

});

module.exports = router;