var express = require("express");
var servidorController = require("../controllers/servidoresController");
var router = express.Router();

router.post("/cadastrar/servidor", function (req, res) {
    servidorController.cadastrarServidor(req, res);
});

module.exports = router;