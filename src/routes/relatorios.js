var express = require("express");
var router = express.Router();
var relatorioController = require("../controllers/relatorioController");

router.post("/cadastrar", function (req, res) {
    relatorioController.cadastrar(req, res);
});

router.get("/listar/:id", function (req, res) {
    relatorioController.pegarRelatoriosPelaEmpresa(req, res);
});

router.put("/alternarStatus/:id", function (req, res) {
    relatorioController.alternarStatus(req, res);
});

module.exports = router;