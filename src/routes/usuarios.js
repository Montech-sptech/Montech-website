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

router.post("/adicionarServidoresUsuario/:id", function (req, res) {
    autorizacaoCargo.verificarAdministrador(req, res, () => {
        usuarioController.adicionarServidoresUsuario(req, res);
    });
});

router.delete("/removerServidorUsuario/:id", function (req, res) {
    autorizacaoCargo.verificarAdministrador(req, res, () => {
        usuarioController.removerServidorUsuario(req, res);
    });
});

router.put("/inativarUsuario/:id", function (req, res) {
    autorizacaoCargo.verificarAdministrador(req, res, () => {
        usuarioController.inativarUsuario(req, res);
    });
});

module.exports = router;