var express = require("express");
var gerServidorController = require("../controllers/gerServidoresController");
var router = express.Router();

router.get("/buscarServidoresAeroporto/:fkAeroporto", function (req, res) {
    gerServidorController.buscarServidoresAeroporto(req, res);
});

module.exports = router;
