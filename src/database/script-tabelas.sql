CREATE DATABASE Montech;
USE Montech;


-- 1. Criação da Tabela Empresa
CREATE TABLE Empresa (
    idEmpresa INT AUTO_INCREMENT PRIMARY KEY,
    nomeEmpresa VARCHAR(45) NOT NULL,
    token VARCHAR(45) NOT NULL
);

-- 2. Criação da Tabela Usuario (Com restrição CHECK no campo cargo)
CREATE TABLE Usuario (
    idUsuario INT AUTO_INCREMENT PRIMARY KEY,
    nomeUsuario VARCHAR(45) NOT NULL,
    email VARCHAR(220) NOT NULL,
    senha VARCHAR(45) NOT NULL,
    cargo VARCHAR(20) default 'ti',
    fkEmpresa INT NOT NULL,
    FOREIGN KEY (fkEmpresa) REFERENCES Empresa(idEmpresa),
    CONSTRAINT chk_cargo CHECK (cargo IN ('adm', 'ti', 'supervisor'))
);

-- 3. Criação da Tabela Servidor
CREATE TABLE Servidor (
    idServidor INT AUTO_INCREMENT PRIMARY KEY,
    nomeServidor VARCHAR(45) NOT NULL,
    MAC VARCHAR(45) NULL
);

-- 4. Criação da Tabela Intermediária Usuario_Servidor (Associativa N:M)
CREATE TABLE Usuario_Servidor (
    idUsuario INT NOT NULL,
    fkEmpresa INT NOT NULL,
    idServidor INT NOT NULL,
    PRIMARY KEY (idUsuario, fkEmpresa, idServidor),
    FOREIGN KEY (idUsuario) REFERENCES Usuario(idUsuario),
    FOREIGN KEY (fkEmpresa) REFERENCES Empresa(idEmpresa),
    FOREIGN KEY (idServidor) REFERENCES Servidor(idServidor)
);

-- 5. Criação da Tabela Componentes
CREATE TABLE Componentes (
    idComponentes INT AUTO_INCREMENT PRIMARY KEY,
    nomeComponentes VARCHAR(45) NOT NULL,
    codigo VARCHAR(67),
    medida VARCHAR(45)
);

-- 6. Criação da Tabela Intermediária Componentes_Servidor (Associativa N:M)
CREATE TABLE Componentes_Servidor (
    idComponentes INT NOT NULL,
    idServidor INT NOT NULL,
    parametros INT,
    PRIMARY KEY (idComponentes, idServidor),
    FOREIGN KEY (idComponentes) REFERENCES Componentes(idComponentes),
    FOREIGN KEY (idServidor) REFERENCES Servidor(idServidor)
);


INSERT INTO Componentes (nomeComponentes, codigo) VALUES 
	("PercentCPU", "cpu_percent(interval=1)"),
    ("UsoDisco", "disk_usage('/')"),
    ("UsoRAM", "virtual_memory()");

insert into Empresa (nomeEmpresa, token) values
('Safra', 'SACBD01'),
('Itau', 'ITKLD02'),
('Bradesco', 'BRJDK03');