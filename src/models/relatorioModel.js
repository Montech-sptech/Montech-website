var database = require("../database/config")

function cadastrar(titulo, tipo, resumo, descricao, dataRelatorio, statusAnalise, fkEmpresa) {
    var instrucaoSql = `
        INSERT INTO relatorio
        (tituloRelatorio, tipo, resumo, descricao, dataRelatorio, statusAnalise, fkEmpresa)
        VALUES
        ('${titulo}', '${tipo}', '${resumo}', '${descricao}', '${dataRelatorio}', '${statusAnalise}', '${fkEmpresa}');
    `;

    console.log("Executando a instrução SQL: \n" + instrucaoSql);

    return database.executar(instrucaoSql);
}

function pegarRelatoriosPelaEmpresa(idEmpresa) {
    var instrucaoSql = `
        SELECT
            idRelatorio,
            fkEmpresa,
            tituloRelatorio,
            tipo,
            resumo,
            descricao,
            dataRelatorio,
            statusAnalise
        FROM relatorio
        WHERE fkEmpresa = ${idEmpresa}
        ORDER BY dataRelatorio ASC;
    `;

    console.log("Executando a instrução SQL: \n" + instrucaoSql);

    return database.executar(instrucaoSql);
}

function alternarStatus(idRelatorio) {
    var instrucaoSql = `
        UPDATE relatorio
        SET statusAnalise =
            CASE
                WHEN statusAnalise = 'Em Análise' THEN 'Concluído'
                ELSE 'Em Análise'
            END
        WHERE idRelatorio = ${idRelatorio};
    `;

    return database.executar(instrucaoSql);
}

module.exports = {
    cadastrar,
    pegarRelatoriosPelaEmpresa,
    alternarStatus
};