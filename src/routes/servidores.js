var express = require("express");
var router = express.Router();
var autorizacaoCargo = require("../middleware/autorizacaoCargo");
var servidorController = require("../controllers/servidoresController");

router.post("/adicionarServidoresUsuario/:id", function (req, res) {
    autorizacaoCargo.verificarAdministrador(req, res, () => {
        servidorController.adicionarServidoresUsuario(req, res);
    });
});

router.delete("/removerServidorUsuario/:id", function (req, res) {
    autorizacaoCargo.verificarAdministrador(req, res, () => {
        servidorController.removerServidorUsuario(req, res);
    });
});

router.get("/pegarServidoresPorEmpresa/:id", function (req, res) {
    autorizacaoCargo.verificarAdministrador(req, res, () => {
        servidorController.pegarServidoresPorEmpresa(req, res);
    });
});

router.post("/cadastrar", function (req, res) {
    servidorController.cadastrar(req, res);
});

module.exports = router;