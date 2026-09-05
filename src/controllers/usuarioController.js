var usuarioModel = require("../models/usuarioModel");

function autenticar(req, res) {

    var email = req.body.emailServer;
    var senha = req.body.senhaServer;

    if (email == undefined) {

        res.status(400).send("Seu email está undefined!");

    } else if (senha == undefined) {

        res.status(400).send("Sua senha está indefinida!");

    } else {

        usuarioModel.autenticar(email, senha)
            .then(function (resultadoAutenticar) {

                console.log(
                    `\nResultados encontrados: ${resultadoAutenticar.length}`
                );

                console.log(
                    `Resultados: ${JSON.stringify(resultadoAutenticar)}`
                );

                if (resultadoAutenticar.length == 1) {

                    res.json({
                        id: resultadoAutenticar[0].id,
                        email: resultadoAutenticar[0].email,
                        nome: resultadoAutenticar[0].nome,
                        senha: resultadoAutenticar[0].senha,
                        empresaId: resultadoAutenticar[0].empresaId,
                        cargo: resultadoAutenticar[0].cargo
                    });

                } else if (resultadoAutenticar.length == 0) {

                    res.status(403).send(
                        "Email e/ou senha inválido(s)"
                    );

                } else {

                    res.status(403).send(
                        "Mais de um usuário com o mesmo login e senha!"
                    );

                }

            })
            .catch(function (erro) {

                console.log(erro);

                console.log(
                    "\nHouve um erro ao realizar o login! Erro:",
                    erro.sqlMessage
                );

                res.status(500).json(erro.sqlMessage);
            });
    }
}

function cadastrar(req, res) {
    var nome = req.body.nomeServer;
    var email = req.body.emailServer;
    var senha = req.body.senhaServer;
    var fkEmpresa = req.body.idEmpresaVincularServer;
    var cargo = req.body.cargoServer;

    if (nome == undefined) {
        res.status(400).send("Seu nome está undefined!");
    } else if (email == undefined) {
        res.status(400).send("Seu email está undefined!");
    } else if (senha == undefined) {
        res.status(400).send("Sua senha está undefined!");
    } else if (fkEmpresa == undefined) {
        res.status(400).send("Sua empresa a vincular está undefined!");
    } else if (cargo == undefined) {
        res.status(400).send("Cargo inválido");
    } else {
        usuarioModel.cadastrar(nome, email, senha, fkEmpresa, cargo)
            .then(
                function (resultado) {
                    res.json(resultado);
                }
            ).catch(
                function (erro) {
                    console.log(erro);
                    console.log(
                        "\nHouve um erro ao realizar o cadastro! Erro: ",
                        erro.sqlMessage
                    );
                    res.status(500).json(erro.sqlMessage);
                }
            );
    }
}

async function pegarUsuariosPeloAdministrador(req, res) {
    var usuarioId = req.params.id;

    var usuario = await usuarioModel.encontrarUsuarioPorId(usuarioId);

    if (!usuario[0]) {
        return res.status(404).json({ mensagem: 'Usuário não encontrado.' });
    }

    var empresaId = usuario[0].fkEmpresa;
    var jsonBruto = await usuarioModel.pegarUsuariosPelaEmpresa(empresaId);

    var Usuarios = {};

    for (var i = 0; i < jsonBruto.length; i++) {
        var linha = jsonBruto[i];
        var idAtual = linha.idUsuario;

        if (!Usuarios[idAtual]) {
            Usuarios[idAtual] = {
                idUsuario: linha.idUsuario,
                nomeUsuario: linha.nomeUsuario,
                email: linha.email,
                cargo: linha.cargo,
                status: linha.status,
                servidores: []
            };
        }

        if (linha.idServidor) {
            Usuarios[idAtual].servidores.push({
                idServidor: linha.idServidor,
                nomeServidor: linha.nomeServidor,
                hostName: linha.hostName
            });
        }
    }
    
    var usuariosAgrupados = [];
    for (id in Usuarios) {
        usuariosAgrupados.push(Usuarios[id]);
    }

    return res.json(usuariosAgrupados);
}

async function adicionarServidoresUsuario(req, res) {
    var usuarioId = req.body.idUsuario;

    usuario = await usuarioModel.encontrarUsuarioPorId(usuarioId);

    if (!usuario[0]) {
        return res.status(404).json({ mensagem: 'Usuário não encontrado.' });
    }

    fkEmpresa = usuario[0].fkEmpresa;

    var idServidor = req.body.idServidor;

    usuarioModel.adicionarServidoresUsuario(usuarioId, fkEmpresa, idServidor)
        .then(function (resultado) {
            res.json(resultado);
        })
        .catch(function (erro) {
            console.log(erro);
            console.log("\nHouve um erro ao atualizar os servidores do usuário! Erro: ", erro.sqlMessage);
            res.status(500).json(erro.sqlMessage);
        });
}

async function removerServidorUsuario(req, res) {
    var usuarioId = req.body.idUsuario;
    var idServidor = req.body.idServidor;

    var usuario = await usuarioModel.encontrarUsuarioPorId(usuarioId);

    if (!usuario[0]) {
        return res.status(404).json({ mensagem: 'Usuário não encontrado.' });
    }

    var fkEmpresa = usuario[0].fkEmpresa;

    usuarioModel.removerServidorUsuario(usuarioId, fkEmpresa, idServidor)
        .then(function (resultado) {
            res.json(resultado);
        })
        .catch(function (erro) {
            console.log(erro);
            console.log("\nHouve um erro ao remover o servidor do usuário! Erro: ", erro.sqlMessage);
            res.status(500).json(erro.sqlMessage);
        });
}

function inativarUsuario(req, res) {
    var usuarioId = req.body.idUsuario;

    usuarioModel.inativarUsuario(usuarioId)
        .then(function (resultado) {
            res.json(resultado);
        })
        .catch(function (erro) {
            console.log(erro);
            console.log("\nHouve um erro ao inativar o usuário! Erro: ", erro.sqlMessage);
            res.status(500).json(erro.sqlMessage);
        });
}

module.exports = {
    autenticar,
    cadastrar,
    pegarUsuariosPeloAdministrador,
    adicionarServidoresUsuario,
    removerServidorUsuario
}