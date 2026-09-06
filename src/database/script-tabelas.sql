CREATE DATABASE montech;
USE montech;

CREATE TABLE empresa (
    idEmpresa INT AUTO_INCREMENT PRIMARY KEY,
    razaoSocial VARCHAR(120) NOT NULL,
    cnpj CHAR(14) UNIQUE,
    cep CHAR(8),
    numero VARCHAR(10),
    token VARCHAR(45) NOT NULL
);

CREATE TABLE usuario (
    idUsuario INT AUTO_INCREMENT PRIMARY KEY,
    nomeUsuario VARCHAR(45) NOT NULL,
    email VARCHAR(220) NOT NULL,
    senha VARCHAR(45) NOT NULL,
    cargo VARCHAR(20) DEFAULT 'Analista',
    status BOOLEAN DEFAULT TRUE,
    fkEmpresa INT NOT NULL,
    FOREIGN KEY (fkEmpresa) REFERENCES empresa(idEmpresa),
    CONSTRAINT chkCargo CHECK (cargo IN ('Administrador', 'Analista', 'TI'))
);

CREATE TABLE servidor (
    idServidor INT AUTO_INCREMENT PRIMARY KEY,
    nomeServidor VARCHAR(45) NOT NULL,
    hostName VARCHAR(50) NULL
);

CREATE TABLE relatorio (
    idRelatorio INT AUTO_INCREMENT PRIMARY KEY,
    tituloRelatorio VARCHAR(45) NOT NULL,
    tipo VARCHAR(20) NOT NULL,
    descricao VARCHAR(3000) NOT NULL,
    dataRelatorio DATETIME NOT NULL,
    statusAnalise VARCHAR(10) NOT NULL,
    CONSTRAINT chkTipo CHECK (tipo IN ('Desempenho', 'Segurança', 'Falha Física', 'Falha Virtual')),
    CONSTRAINT chkStatus CHECK (statusAnalise IN ('Em Análise', 'Concluído'))
);

CREATE TABLE usuarioServidor (
    fkUsuario INT NOT NULL,
    fkServidor INT NOT NULL,
    PRIMARY KEY (fkUsuario, fkServidor),
    FOREIGN KEY (fkUsuario) REFERENCES usuario(idUsuario),
    FOREIGN KEY (fkServidor) REFERENCES servidor(idServidor)
);

CREATE TABLE componente (
    idComponente INT AUTO_INCREMENT PRIMARY KEY,
    nomeComponente VARCHAR(45) NOT NULL
);

CREATE TABLE componenteServidor (
    fkComponente INT NOT NULL,
    fkServidor INT NOT NULL,
    parametros INT,
    PRIMARY KEY (fkComponente, fkServidor),
    FOREIGN KEY (fkComponente) REFERENCES componente(idComponente),
    FOREIGN KEY (fkServidor) REFERENCES servidor(idServidor)
);

-- Inserção de dados para teste

INSERT INTO empresa (razaoSocial, token) VALUES
('Safra', 'SACBD01'),
('Itau', 'ITKLD02'),
('Bradesco', 'BRJDK03');

INSERT INTO usuario (nomeUsuario, email, senha, cargo, fkEmpresa) VALUES
('Carlos', 'carlos@gmail.com', '123456', 'Administrador', 2),
('Gabriel', 'gabriel@gmail.com', '123456', 'Analista', 2),
('Thays', 'thays@gmail.com', '123456', 'TI', 2);

INSERT INTO servidor (nomeServidor, hostName) VALUES
('Servidor A', 'srv-web-01'),
('Servidor B', 'srv-db-01'),
('Servidor C', 'srv-api-01');

INSERT INTO usuarioServidor (fkUsuario, fkServidor) VALUES
(1, 1),
(1, 2),
(1, 3),
(3, 2),
(3, 3);