
"use strict";

function verificarSessao(req, res, next) {
  const usuarioId = req.session?.usuarioId;

  if (!Number.isSafeInteger(usuarioId) || usuarioId <= 0) {
    return res.status(401).json({
      erro: "Usuário não autenticado."
    });
  }

  req.usuarioId = usuarioId;

  next();
}

module.exports = {
  verificarSessao
};
