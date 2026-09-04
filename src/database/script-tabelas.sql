CREATE DATABASE Montech;
USE Montech;

CREATE TABLE Empresa (
    idEmpresa INT AUTO_INCREMENT PRIMARY KEY,
    nomeEmpresa VARCHAR(45) NOT NULL,
    token VARCHAR(45) NOT NULL
);

CREATE TABLE Usuario (
    idUsuario INT AUTO_INCREMENT PRIMARY KEY,
    nomeUsuario VARCHAR(45) NOT NULL,
    email VARCHAR(220) NOT NULL,
    senha VARCHAR(45) NOT NULL,
    cargo VARCHAR(20) default 'TI',
    fkEmpresa INT NOT NULL,
    FOREIGN KEY (fkEmpresa) REFERENCES Empresa(idEmpresa),
    CONSTRAINT chk_cargo CHECK (cargo IN ('Administrador', 'Analista', 'TI'))
);

CREATE TABLE Servidor (
    idServidor INT AUTO_INCREMENT PRIMARY KEY,
    nomeServidor VARCHAR(45) NOT NULL,
    hostName VARCHAR(50) NULL
);

CREATE TABLE Usuario_Servidor (
    idUsuario INT NOT NULL,
    fkEmpresa INT NOT NULL,
    idServidor INT NOT NULL,
    PRIMARY KEY (idUsuario, fkEmpresa, idServidor),
    FOREIGN KEY (idUsuario) REFERENCES Usuario(idUsuario),
    FOREIGN KEY (fkEmpresa) REFERENCES Empresa(idEmpresa),
    FOREIGN KEY (idServidor) REFERENCES Servidor(idServidor)
);

CREATE TABLE Componentes (
    idComponentes INT AUTO_INCREMENT PRIMARY KEY,
    nomeComponentes VARCHAR(45) NOT NULL
);

CREATE TABLE Componentes_Servidor (
    idComponentes INT NOT NULL,
    idServidor INT NOT NULL,
    parametros INT,
    PRIMARY KEY (idComponentes, idServidor),
    FOREIGN KEY (idComponentes) REFERENCES Componentes(idComponentes),
    FOREIGN KEY (idServidor) REFERENCES Servidor(idServidor)
);

insert into Empresa (nomeEmpresa, token) values
('Safra', 'SACBD01'),
('Itau', 'ITKLD02'),
('Bradesco', 'BRJDK03');


function pegarUsuariosPeloAdministrador(id) {
    console.log("ACESSEI O USUARIO MODEL \n \n\t\t >> Se aqui der erro de 'Error: connect ECONNREFUSED',\n \t\t >> verifique suas credenciais de acesso ao banco\n \t\t >> e se o servidor de seu BD está rodando corretamente. \n\n function pegarUsuariosPeloAdministrador():", id);
    var instrucaoSql = `
        SELECT 
            idUsuario AS id, nomeUsuario AS nome, email, senha, fkEmpresa AS empresaId, cargo FROM Usuario WHERE idUsuario = ${id};
        `;
    console.log("Executando a instrução SQL: \n" + instrucaoSql);
    return database.executar(instrucaoSql);
}