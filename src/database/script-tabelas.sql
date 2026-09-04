CREATE DATABASE Montech;
USE Montech;

CREATE TABLE Empresa (
    idEmpresa INT AUTO_INCREMENT PRIMARY KEY,
    razaoSocial VARCHAR(120) NOT NULL,
	cnpj CHAR(14) UNIQUE,
    cep CHAR(8),
    numero VARCHAR(10),
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

CREATE TAble Relatorio (
	idRelatorio INT auto_increment PRIMARY KEY,
    tituloRelatorio varchar(45) NOT NULL,
    tipo VARCHAR(20) NOT NULL,
    descricao VARCHAR(3000) NOT NULL,
    dataRelatorio datetime NOT NULL,
    statusAnalise varchar(10) NOT NULL,
    CONSTRAINT chk_tipo CHECK (tipo in ('Desempenho', 'Segurança', 'Falha Física', 'Falha Virtual')),
    CONSTRAINT chk_status CHECK (statusAnalise in ('Em Análise', 'Concluído'))
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

insert into Empresa (razaoSocial, token) values
('Safra', 'SACBD01'),
('Itau', 'ITKLD02'),
('Bradesco', 'BRJDK03');