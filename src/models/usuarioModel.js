var database = require("../database/config")

function autenticar(email, senha) {
    console.log("ACESSEI O USUARIO MODEL \n \n\t\t >> Se aqui der erro de 'Error: connect ECONNREFUSED',\n \t\t >> verifique suas credenciais de acesso ao banco\n \t\t >> e se o servidor de seu BD está rodando corretamente. \n\n function entrar(): ", email, senha);
    var instrucaoSql = `
        SELECT 
            idUsuario AS id, nomeUsuario AS nome, email, senha, fkEmpresa AS empresaId, cargo 
        FROM usuario 
        WHERE email = '${email}' AND senha = '${senha}';
    `;
    console.log("Executando a instrução SQL: \n" + instrucaoSql);
    return database.executar(instrucaoSql);
}

function cadastrar(nome, email, senha, fkEmpresa, cargo) {
    console.log("ACESSEI O USUARIO MODEL \n \n\t\t >> Se aqui der erro de 'Error: connect ECONNREFUSED',\n \t\t >> verifique suas credenciais de acesso ao banco\n \t\t >> e se o servidor de seu BD está rodando corretamente. \n\n function cadastrar():", nome, email, senha, fkEmpresa);

    var instrucaoSql = `
        INSERT INTO usuario (nomeUsuario, email, senha, fkEmpresa, cargo) 
        VALUES ('${nome}', '${email}', '${senha}', '${fkEmpresa}', '${cargo}');
    `;
    console.log("Executando a instrução SQL: \n" + instrucaoSql);
    return database.executar(instrucaoSql);
}

function encontrarUsuarioPorId(idUsuario) {
    console.log("ACESSEI O USUARIO MODEL \n \n\t\t >> Se aqui der erro de 'Error: connect ECONNREFUSED',\n \t\t >> verifique suas credenciais de acesso ao banco\n \t\t >> e se o servidor de seu BD está rodando corretamente. \n\n function encontrarPorId():", idUsuario);

    var instrucaoSql = `
        SELECT 
            * 
        FROM usuario 
        WHERE idUsuario = ${idUsuario};
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
        FROM usuario u
        LEFT JOIN usuarioServidor us ON us.fkUsuario = u.idUsuario
        LEFT JOIN servidor s ON s.idServidor = us.fkServidor
        WHERE u.fkEmpresa = ${idEmpresa};
    `;
    console.log("Executando a instrução SQL: \n" + instrucaoSql);
    return database.executar(instrucaoSql);
}

function adicionarServidoresUsuario(idUsuario, idServidor) {
    console.log("ACESSEI O USUARIO MODEL \n \n\t\t >> Se aqui der erro de 'Error: connect ECONNREFUSED',\n \t\t >> verifique suas credenciais de acesso ao banco\n \t\t >> e se o servidor de seu BD está rodando corretamente. \n\n function adicionarServidoresUsuario():", idUsuario, idServidor);
    var instrucaoSql = `
        INSERT INTO usuarioServidor (fkUsuario, fkServidor) VALUES (${idUsuario}, ${idServidor});
    `;
    console.log("Executando a instrução SQL: \n" + instrucaoSql);
    return database.executar(instrucaoSql);
}

function removerServidorUsuario(idUsuario, idServidor) {
    console.log("ACESSEI O USUARIO MODEL \n \n\t\t >> Se aqui der erro de 'Error: connect ECONNREFUSED',\n \t\t >> verifique suas credenciais de acesso ao banco\n \t\t >> e se o servidor de seu BD está rodando corretamente. \n\n function removerServidorUsuario():", idUsuario, idServidor);
    var instrucaoSql = `
        DELETE FROM usuarioServidor WHERE fkUsuario = ${idUsuario} AND fkServidor = ${idServidor};
    `;
    console.log("Executando a instrução SQL: \n" + instrucaoSql);
    return database.executar(instrucaoSql);
}

function inativarUsuario(idUsuario) {
    console.log("ACESSEI O USUARIO MODEL \n \n\t\t >> Se aqui der erro de 'Error: connect ECONNREFUSED',\n \t\t >> verifique suas credenciais de acesso ao banco\n \t\t >> e se o servidor de seu BD está rodando corretamente. \n\n function inativarUsuario():", idUsuario);
    var instrucaoSql = `
        UPDATE usuario SET status = false WHERE idUsuario = ${idUsuario};
    `;
    console.log("Executando a instrução SQL: \n" + instrucaoSql);
    return database.executar(instrucaoSql);
}

module.exports = {
    autenticar,
    cadastrar,
    encontrarUsuarioPorId,
    pegarUsuariosPelaEmpresa,
    adicionarServidoresUsuario,
    removerServidorUsuario,
    inativarUsuario
};