var express = require("express");
var gerServidorController = require("../controllers/gerServidoresController");
var router = express.Router();

router.get("/buscarServidoresAeroporto/:fkAeroporto", function (req, res) {
    gerServidorController.buscarServidoresAeroporto(req, res);
});

router.get("/buscarComponentes", function (req, res) {
    gerServidorController.buscarComponentes(req, res);
});

router.post("/cadastrarServidor", function (req, res) {
    gerServidorController.cadastrarServidor(req, res);
});

router.delete("/deletarServidor", function (req, res) {
    gerServidorController.deletarServidor(req, res);
});

router.delete("/deletarComponenteServidor", function (req, res) {
    gerServidorController.deletarComponenteServidor(req, res);
});

router.post("/cadastrarComponenteServidor", function (req, res) {
    gerServidorController.cadastrarComponenteServidor(req, res);
});

module.exports = router;
