var usuarioModel = require("../models/usuarioModel");


async function verificarAdministrador(req, res, next) {
    const usuario = await usuarioModel.encontrarUsuarioPorId(req.params.id);
    console.log(usuario);

    if (!usuario[0]) {
        return res.status(404).json({ mensagem: 'Usuário não encontrado.' });
    }
    if (usuario[0].cargo != 'Administrador') {
        return res.status(403).json({ mensagem: 'Acesso negado' });
    }

    req.usuarioLogado = usuario;

    next();

};

module.exports = { 
    verificarAdministrador 
};