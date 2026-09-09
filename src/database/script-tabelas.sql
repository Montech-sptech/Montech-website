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
    hostName VARCHAR(50) NULL,
    tipoServidor CHAR(3),
    metodoDeColeta VARCHAR(50),
    porta INT NOT NULL,
    intervaloDeColeta INT
);

CREATE TABLE relatorio (
    idRelatorio INT AUTO_INCREMENT PRIMARY KEY,
    tituloRelatorio VARCHAR(45) NOT NULL,
    tipo VARCHAR(20) NOT NULL,
    resumo VARCHAR(100) not null,
    descricao VARCHAR(3000) NOT NULL,
    dataRelatorio DATETIME NOT NULL,
    statusAnalise VARCHAR(10) NOT NULL,
    fkEmpresa INT NOT NULL,
    foreign key (fkEmpresa) REFERENCES empresa(idEmpresa),
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

CREATE TABLE contato (
    idContato INT PRIMARY KEY AUTO_INCREMENT,
    nomeEmpresa VARCHAR(100),
    email VARCHAR(100),
    telefone CHAR(11),
    dataMensagem  TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);


-- Inserção de dados para teste

INSERT INTO empresa (razaoSocial, cnpj, cep, numero, token) VALUES
('Aero Controle Curitiba Ltda', '12345678000101', '80010000', '150', 'MNT9rNZ8'),
('Gestão Aeroespacial Paraná Ltda', '23456789000102', '80020000', '320', 'MNtmr47t'),
('Soluções em Navegação Aérea Ltda', '34567890000103', '80030000', '85', 'MNTIzdM3'),
('Tecnologia e Controle Aéreo Sul Ltda', '45678901000104', '80040000', '470', 'MNTHS2TQ'),
('Infraestrutura Aeronáutica Curitiba Ltda', '56789012000105', '80050000', '210', 'MNTLFshy');

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

INSERT INTO contato (nomeEmpresa, email, telefone) VALUES
('AeroTech Solutions', 'contato@aerotech.com.br', '11987654321'),
('Paraná Air Systems', 'comercial@paranaair.com.br', '41998765432'),
('SkyControl Tecnologia', 'contato@skycontrol.com.br', '11345678901'),
('AeroData Sistemas', 'comercial@aerodata.com.br', '41987651234'),
('FlightSafe Solutions', 'contato@flightsafe.com.br', '11965437821'),
('NavegaAir Tecnologia', 'comercial@navegair.com.br', '41991234567'),
('Control Tower Systems', 'contato@controltower.com.br', '11398765432'),
('Aviation Tech Brasil', 'comercial@aviationtech.com.br', '11981234567');