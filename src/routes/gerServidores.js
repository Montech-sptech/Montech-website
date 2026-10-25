var express = require("express");
var gerServidorController = require("../controllers/gerServidoresController");
var router = express.Router();

router.get("/buscarServidoresAeroporto/:fkAeroporto", function (req, res) {
    gerServidorController.buscarServidoresAeroporto(req, res);
});

router.get("/buscarComponentes", function (req, res) {
    gerServidorController.buscarComponentes(req, res);
});

router.get("/buscarServidor/:idServidor", function (req, res) {
    gerServidorController.buscarServidor(req, res);
});

router.get("/buscarComponentesServidor/:idServidor", function (req, res) {
    gerServidorController.buscarComponentesServidor(req, res);
});

router.get("/buscarComponentesServidorSemServidor/:idServidor", function (req, res) {
    gerServidorController.buscarComponentesServidorSemServidor(req, res);
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

router.delete("/excluirVisualizao", function (req, res) {
    gerServidorController.excluirVisualizao(req, res);
});

router.delete("/deletarVisualicaoServidor", function (req, res) {
    gerServidorController.deletarComponenteServidor(req, res);
});

router.post("/cadastrarComponenteServidor", function (req, res) {
    gerServidorController.cadastrarComponenteServidor(req, res);
});

router.put("/atualizarDadosServidor", function (req, res) {
    gerServidorController.atualizarDadosServidor(req, res);
});

router.delete("/removerComponentesServidor", function (req, res) {
    gerServidorController.removerComponentesServidor(req, res);
});

router.put("/atualizarDadosComponentesServidor", function (req, res) {
    gerServidorController.atualizarDadosComponentesServidor(req, res);
});

module.exports = router;
