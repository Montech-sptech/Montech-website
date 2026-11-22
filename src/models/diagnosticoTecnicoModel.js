
"use strict";

const mysql = require("mysql2/promise");

// Pool independente para consultas parametrizadas.
// Futuramente pode ser centralizado em database/config.js.
const pool = mysql.createPool({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_DATABASE || process.env.DB_NAME,
    port: Number(process.env.DB_PORT || 3306),
    waitForConnections: true,
    connectionLimit: 5
});

// Lista os servidores ativos de um aeroporto.
async function listarServidores(idAeroporto) {
    const sql = `
  SELECT
    s.idServidor,
    s.nomeServidor,
    s.intervaloColeta,
    s.statusAtividade,
    s.fkAeroporto
  FROM servidor s
  WHERE s.fkAeroporto = ?
    AND s.statusAtividade = 1
  ORDER BY s.nomeServidor
`;

    const [linhas] = await pool.execute(sql, [idAeroporto]);
    return linhas;
}

// Busca a identificação do servidor.
// O token será usado internamente na futura consulta ao S3.

async function buscarServidor(idServidor) {
  const sql = `
    SELECT
      s.idServidor,
      s.token,
      s.nomeServidor,
      s.intervaloColeta,
      s.fkAeroporto,
      a.nome AS nomeAeroporto,
      e.idEmpresa
    FROM servidor s
    INNER JOIN aeroporto a
      ON a.idAeroporto = s.fkAeroporto
    INNER JOIN empresa e
      ON e.idEmpresa = a.fkEmpresa
    WHERE s.idServidor = ?
      AND s.statusAtividade = 1
  `;

  const [linhas] = await pool.execute(sql, [idServidor]);
  return linhas[0] || null;
}


// Busca componentes e limites cadastrados para o servidor.
async function listarComponentes(idServidor) {
    const sql = `
    SELECT
      c.idComponente,
      c.nomeComponente,
      c.nomeCodigo,
      c.unidadeMedida,
      sc.limiteAtencao,
      sc.limiteCritico
    FROM servidorcomponente sc
    INNER JOIN componente c
      ON c.idComponente = sc.fkComponente
    WHERE sc.fkServidor = ?
    ORDER BY c.nomeComponente
  `;

    const [linhas] = await pool.execute(sql, [idServidor]);
    return linhas;
}

module.exports = {
    listarServidores,
    buscarServidor,
    listarComponentes
};
