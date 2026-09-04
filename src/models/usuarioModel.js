var database = require("../database/config")

function autenticar(email, senha) {
    console.log("ACESSEI O USUARIO MODEL \n \n\t\t >> Se aqui der erro de 'Error: connect ECONNREFUSED',\n \t\t >> verifique suas credenciais de acesso ao banco\n \t\t >> e se o servidor de seu BD está rodando corretamente. \n\n function entrar(): ", email, senha)
    var instrucaoSql = `
        SELECT 
            idUsuario AS id, nomeUsuario AS nome, email, senha, fkEmpresa AS empresaId, cargo FROM Usuario WHERE email = '${email}' AND senha = '${senha}';
    `;
    console.log("Executando a instrução SQL: \n" + instrucaoSql);
    return database.executar(instrucaoSql);
}

function cadastrar(nome, email, senha, fkEmpresa, cargo) {
    console.log("ACESSEI O USUARIO MODEL \n \n\t\t >> Se aqui der erro de 'Error: connect ECONNREFUSED',\n \t\t >> verifique suas credenciais de acesso ao banco\n \t\t >> e se o servidor de seu BD está rodando corretamente. \n\n function cadastrar():", nome, email, senha, fkEmpresa);

    var instrucaoSql = `
        INSERT INTO usuario (nomeUsuario, email, senha, fkEmpresa, cargo) VALUES ('${nome}', '${email}', '${senha}', '${fkEmpresa}', '${cargo}');
    `;
    console.log("Executando a instrução SQL: \n" + instrucaoSql);
    return database.executar(instrucaoSql);
}

function encontrarUsuarioPorId(idUsuario) {
    console.log("ACESSEI O USUARIO MODEL \n \n\t\t >> Se aqui der erro de 'Error: connect ECONNREFUSED',\n \t\t >> verifique suas credenciais de acesso ao banco\n \t\t >> e se o servidor de seu BD está rodando corretamente. \n\n function encontrarPorId():", idUsuario);

    var instrucaoSql = `
        SELECT 
            * FROM Usuario WHERE idUsuario = ${idUsuario};
    `;
    console.log("Executando a instrução SQL: \n" + instrucaoSql);
    return database.executar(instrucaoSql);
}

function pegarUsuariosPelaEmpresa(idEmpresa) {
    console.log("ACESSEI O USUARIO MODEL \n \n\t\t >> Se aqui der erro de 'Error: connect ECONNREFUSED',\n \t\t >> verifique suas credenciais de acesso ao banco\n \t\t >> e se o servidor de seu BD está rodando corretamente. \n\n function pegarUsuariosPelaEmpresa():", idEmpresa);
    var instrucaoSql = `
                SELECT 
                u.idUsuario,
                u.nomeUsuario,
                u.email,
                u.cargo,
                u.status,
                s.idServidor,
                s.nomeServidor,
                s.hostName
            FROM Usuario u
            LEFT JOIN Usuario_Servidor us ON us.idUsuario = u.idUsuario
            LEFT JOIN Servidor s ON s.idServidor = us.idServidor
            WHERE u.fkEmpresa = ${idEmpresa};`
    console.log("Executando a instrução SQL: \n" + instrucaoSql);
    return database.executar(instrucaoSql);
}

async function pegarUsuariosPeloAdministrador(req, res) {
    var usuarioId = req.params.id;

    try {
        var usuario = await usuarioModel.encontrarUsuarioPorId(usuarioId);
        
        if (!usuario[0]) {
            return res.status(404).json({ mensagem: 'Usuário não encontrado.' });
        }

        var empresaId = usuario[0].fkEmpresa;
        var resultadoQuery = await usuarioModel.pegarUsuariosPelaEmpresa(empresaId);

        // Agrupa os servidores dentro do objeto de cada usuário
        var usuariosAgrupados = resultadoQuery.reduce((acc, row) => {
            let usuarioExistente = acc.find(u => u.idUsuario === row.idUsuario);

            if (!usuarioExistente) {
                usuarioExistente = {
                    idUsuario: row.idUsuario,
                    nomeUsuario: row.nomeUsuario,
                    email: row.email,
                    cargo: row.cargo,
                    status: row.status,
                    servidores: []
                };
                acc.push(usuarioExistente);
            }

            // Adiciona o servidor caso ele exista no JOIN (evita adicionar nulls de LEFT JOIN)
            if (row.idServidor) {
                usuarioExistente.servidores.push({
                    idServidor: row.idServidor,
                    nomeServidor: row.nomeServidor,
                    hostName: row.hostName
                });
            }

            return acc;
        }, []);

        return res.json(usuariosAgrupados);

    } catch (erro) {
        console.log(erro);
        console.log("\nHouve um erro ao buscar os usuários! Erro: ", erro.sqlMessage);
        return res.status(500).json(erro.sqlMessage);
    }
}

module.exports = {
    autenticar,
    cadastrar,
    encontrarUsuarioPorId,
    pegarUsuariosPelaEmpresa,
};