
"use strict";

const express = require("express");

const controller = require(
  "../controllers/diagnosticoTecnicoController"
);

const router = express.Router();

// Listagem dos servidores de um aeroporto.
router.get(
  "/servidores",
  controller.listarServidores
);

// Configuração do servidor e limites dos componentes.
router.get(
  "/servidores/:idServidor/configuracao",
  controller.obterConfiguracao
);

// Futuro diagnóstico calculado a partir da Silver.
router.get(
  "/servidores/:idServidor/diagnostico",
  controller.obterDiagnostico
);

module.exports = router;
