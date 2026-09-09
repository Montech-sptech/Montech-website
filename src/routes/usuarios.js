var express = require("express");
var router = express.Router();
var autorizacaoCargo = require("../middleware/autorizacaoCargo");

var usuarioController = require("../controllers/usuarioController");

router.post("/cadastrar", function (req, res) {
    usuarioController.cadastrar(req, res);
})

router.post("/autenticar", function (req, res) {
    usuarioController.autenticar(req, res);
});

router.get("/pegarUsuariosPeloAdministrador/:id", function (req, res) {
    autorizacaoCargo.verificarAdministrador(req, res, () => {
        usuarioController.pegarUsuariosPeloAdministrador(req, res);
    });
});

router.put("/inativarUsuario/:id", function (req, res) {
    autorizacaoCargo.verificarAdministrador(req, res, () => {
        usuarioController.inativarUsuario(req, res);
    });
});

router.put("/ativarUsuario/:id", function (req, res) {
    autorizacaoCargo.verificarAdministrador(req, res, () => {
        usuarioController.ativarUsuario(req, res);
    });
});

router.put("/atualizarFotoPerfil/:id", function (req, res) {
    usuarioController.atualizarFotoPerfil(req, res);
});

module.exports = router;