var express = require("express");
var servidorController = require("../controllers/servidoresController");
var router = express.Router();
var autorizacaoCargo = require("../middleware/autorizacaoCargo");

router.post("/cadastrar/servidor", function (req, res) {
    servidorController.cadastrarServidor(req, res);
});

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

module.exports = router;