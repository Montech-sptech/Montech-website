
"use strict";

const diagnosticoModel = require(
    "../models/diagnosticoTecnicoModel"
);

// Aceita apenas IDs inteiros positivos.
function validarId(valor) {
    const numero = Number(valor);

    return Number.isSafeInteger(numero) && numero > 0
        ? numero
        : null;
}

function tratarErro(res, erro) {
    console.error("Erro no Diagnóstico Técnico:", erro);

    return res.status(500).json({
        erro: "Erro interno ao consultar os dados."
    });
}

// GET /diagnosticoTecnico/servidores?idAeroporto=2
async function listarServidores(req, res) {
    const idAeroporto = validarId(req.query.idAeroporto);

    if (!idAeroporto) {
        return res.status(400).json({
            erro: "Informe um idAeroporto válido."
        });
    }

    try {
        const servidores = await diagnosticoModel
            .listarServidores(idAeroporto);

        return res.status(200).json({
            idAeroporto,
            total: servidores.length,
            servidores
        });
    } catch (erro) {
        return tratarErro(res, erro);
    }
}

// GET /diagnosticoTecnico/servidores/:id/configuracao

async function obterConfiguracao(req, res) {
    const idServidor = validarId(req.params.idServidor);

    if (!idServidor) {
        return res.status(400).json({
            erro: "Informe um idServidor válido."
        });
    }

    try {
        const servidor = await diagnosticoModel
            .buscarServidor(idServidor);

        if (!servidor) {
            return res.status(404).json({
                erro: "Servidor ativo não encontrado."
            });
        }

        const componentes = await diagnosticoModel
            .listarComponentes(idServidor);

        return res.status(200).json({
            servidor: {
                idServidor: servidor.idServidor,
                nomeServidor: servidor.nomeServidor,
                intervaloColeta: servidor.intervaloColeta,
                idAeroporto: servidor.fkAeroporto,
                nomeAeroporto: servidor.nomeAeroporto
            },
            componentes: componentes.map(componente => ({
                idComponente: componente.idComponente,
                nome: componente.nomeComponente,
                codigo: componente.nomeCodigo,
                unidade: componente.unidadeMedida,
                limiteAtencao:
                    componente.limiteAtencao == null
                        ? null
                        : Number(componente.limiteAtencao),
                limiteCritico:
                    componente.limiteCritico == null
                        ? null
                        : Number(componente.limiteCritico)
            }))
        });
    } catch (erro) {
        return tratarErro(res, erro);
    }
}


// Reservado para a integração com a Silver.
// Não retorna métricas fictícias.
function obterDiagnostico(req, res) {
    const idServidor = validarId(req.params.idServidor);

    if (!idServidor) {
        return res.status(400).json({
            erro: "Informe um idServidor válido."
        });
    }

    return res.status(501).json({
        codigo: "DIAGNOSTICO_PENDENTE",
        mensagem:
            "Endpoint preparado. A leitura das métricas da Silver ainda não foi integrada."
    });
}

module.exports = {
    listarServidores,
    obterConfiguracao,
    obterDiagnostico
};
