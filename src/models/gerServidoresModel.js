var database = require("../database/config");


function buscarServidoresAeroporto(idAeroporto) {
  var instrucaoSql = `
        SELECT 
            idServidor,
            nomeServidor,
            sistemaOperacional,
            statusAtividade
        FROM servidor
        WHERE fkAeroporto = ${idAeroporto};
    `;
  console.log("Executando a instrução SQL: \n" + instrucaoSql);
  return database.executar(instrucaoSql);
}

function buscarComponentes() {
  var instrucaoSql = `
        SELECT
            idComponente,
            nomeComponente,
            unidadeMedida
        FROM componente;
    `;
  console.log("Executando a instrução SQL: \n" + instrucaoSql);
  return database.executar(instrucaoSql);
}


function cadastrarServidor(token, nomeServidor, sistemaOperacional, fkAeroporto) {
    console.log("ACESSEI O USUARIO MODEL \n \n\t\t >> Se aqui der erro de 'Error: connect ECONNREFUSED',\n \t\t >> verifique suas credenciais de acesso ao banco\n \t\t >> e se o servidor de seu BD está rodando corretamente. \n\n function cadastrar():");

    var instrucaoSql = `
        INSERT INTO servidor (token, nomeServidor, sistemaOperacional, intervaloColeta, statusAtividade, fkAeroporto) VALUES
        ('${token}', '${nomeServidor}', '${sistemaOperacional}', 5, 0, ${fkAeroporto});
    `;
    console.log("Executando a instrução SQL: \n" + instrucaoSql);
    return database.executar(instrucaoSql);
}

function deletarServidor(idServidor) {
    console.log("ACESSEI O USUARIO MODEL \n \n\t\t >> Se aqui der erro de 'Error: connect ECONNREFUSED',\n \t\t >> verifique suas credenciais de acesso ao banco\n \t\t >> e se o servidor de seu BD está rodando corretamente. \n\n function cadastrar():");

    var instrucaoSql = `
        DELETE FROM servidor WHERE idServidor = ${Number(idServidor)};
    `;
    console.log("Executando a instrução SQL: \n" + instrucaoSql);
    return database.executar(instrucaoSql);
}

function deletarComponenteServidor(idServidor) {
    console.log("ACESSEI O USUARIO MODEL \n \n\t\t >> Se aqui der erro de 'Error: connect ECONNREFUSED',\n \t\t >> verifique suas credenciais de acesso ao banco\n \t\t >> e se o servidor de seu BD está rodando corretamente. \n\n function cadastrar():");

    var instrucaoSql = `
        DELETE FROM servidorcomponente WHERE fkServidor = ${Number(idServidor)};
    `;
    console.log("Executando a instrução SQL: \n" + instrucaoSql);
    return database.executar(instrucaoSql);
}

function cadastrarComponenteServidor(fkServidor, componentes) {
    console.log("ACESSEI O USUARIO MODEL \n \n\t\t >> Se aqui der erro de 'Error: connect ECONNREFUSED',\n \t\t >> verifique suas credenciais de acesso ao banco\n \t\t >> e se o servidor de seu BD está rodando corretamente. \n\n function cadastrar():");
    const valores = componentes
        .map(c => `(${Number(fkServidor)}, ${Number(c.fkComponente)}, ${Number(c.limiteAtencao)}, ${Number(c.limiteCritico)})`)
        .join(",\n");

    
    var instrucaoSql = `
        INSERT INTO servidorcomponente (fkServidor, fkComponente, limiteAtencao, limiteCritico) VALUES
        ${valores}
    `;
    console.log("Executando a instrução SQL: \n" + instrucaoSql);
    return database.executar(instrucaoSql);
}


function buscarServidor(idServidor) {
  var instrucaoSql = `
        SELECT token, nomeServidor, sistemaOperacional, statusAtividade FROM servidor WHERE idServidor = ${Number(idServidor)};
    `;
  console.log("Executando a instrução SQL: \n" + instrucaoSql);
  return database.executar(instrucaoSql);
}

function buscarComponentesServidor(idServidor) {
  var instrucaoSql = `
    SELECT c.idComponente, c.nomeComponente, c.unidadeMedida, sc.limiteAtencao, sc.limiteCritico FROM servidorcomponente sc
    JOIN componente c ON c.Idcomponente = fkComponente WHERE fkServidor = ${Number(idServidor)};
    `;
  console.log("Executando a instrução SQL: \n" + instrucaoSql);
  return database.executar(instrucaoSql);
}

function buscarComponentesServidorSemServidor(idServidor) {
  var instrucaoSql = `
    SELECT
    c.idComponente,
    c.nomeComponente,
    c.unidadeMedida,
    IF(sc.idServidorComponente IS NULL, 0, 1) AS pertenceAoServidor,
    IF(sc.idServidorComponente IS NULL, 0, sc.limiteAtencao) AS limiteAtencao,
    IF(sc.idServidorComponente IS NULL, 0, sc.limiteCritico) AS limiteCritico
    FROM componente c
    LEFT JOIN servidorcomponente sc
        ON sc.fkComponente = c.idComponente
        AND sc.fkServidor = ${Number(idServidor)}
    ORDER BY c.nomeComponente;
    `;
  console.log("Executando a instrução SQL: \n" + instrucaoSql);
  return database.executar(instrucaoSql);
}

function atualizarDadosServidor(idServidor, nomeServidor, sistemaOperacional, statusAtividade) {
  var instrucaoSql = `
    UPDATE servidor
    SET nomeServidor = '${nomeServidor}',
        sistemaOperacional = '${sistemaOperacional}',
        statusAtividade = ${Number(statusAtividade)}
    WHERE idServidor = ${Number(idServidor)};
    `;
  console.log("Executando a instrução SQL: \n" + instrucaoSql);
  return database.executar(instrucaoSql);
}

function removerComponentesServidor(idServidor, componentes) {
    if (!componentes || componentes.length === 0) {
        var instrucaoSql = `DELETE FROM servidorcomponente WHERE fkServidor = ${idServidor};`;
        console.log("Executando (Deletar tudo): " + instrucaoSql);
        return database.executar(instrucaoSql);
    }
    var identificaoComponentes = componentes.map((id) => `${id}`).join(', ');
    
    var instrucaoSql = `
        DELETE FROM servidorcomponente 
        WHERE fkServidor = ${idServidor} AND fkComponente NOT IN (${identificaoComponentes});
    `;

    console.log("Executando a instrução SQL parametrizada: \n" + instrucaoSql);
        return database.executar(instrucaoSql);
}

function atualizarDadosComponentesServidor(idServidor, componentes) {
    if (!componentes || componentes.length === 0) {
        console.log("Nenhum componente enviado para atualização.");
        return Promise.resolve(null); 
    }

    var blocosValues = componentes.map(comp => {
        return `(${Number(idServidor)}, ${Number(comp.idComponente)}, ${Number(comp.limiteAtencao)}, ${Number(comp.limiteCritico)})`;
    }).join(',\n        ');

    var instrucaoSql = `
        INSERT INTO servidorcomponente (fkServidor, fkComponente, limiteAtencao, limiteCritico)
        VALUES 
            ${blocosValues}
        ON DUPLICATE KEY UPDATE
            limiteAtencao = VALUES(limiteAtencao),
            limiteCritico = VALUES(limiteCritico);
    `;
    
    console.log("Executando a instrução SQL Dinâmica: \n" + instrucaoSql);
    return database.executar(instrucaoSql);
}




module.exports = {
  buscarServidoresAeroporto,
  buscarComponentes,
  cadastrarServidor,
  cadastrarComponenteServidor,
  deletarServidor,
  deletarComponenteServidor,
  buscarServidor,
  buscarComponentesServidor,
  buscarComponentesServidorSemServidor,
  atualizarDadosServidor,
  removerComponentesServidor,
  atualizarDadosComponentesServidor
};