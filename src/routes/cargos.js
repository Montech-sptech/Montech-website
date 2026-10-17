var express = require("express");
var router = express.Router();

var cargoController = require("../controllers/cargoController");

router.get("/listar/:id", function (req, res) {
  cargoController.listar(req, res);
});

router.get("/permissoes/:id", function (req, res) {
  cargoController.listarPermissoes(req, res);
});

router.post("/cadastrar/:id", function (req, res) {
  cargoController.cadastrar(req, res);
});

router.put("/atualizar/:id", function (req, res) {
  cargoController.atualizar(req, res);
});

router.delete("/excluir/:id", function (req, res) {
  cargoController.excluir(req, res);
});

module.exports = router;
