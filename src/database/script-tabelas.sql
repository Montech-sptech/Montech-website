CREATE DATABASE IF NOT EXISTS montech;

USE montech;

CREATE TABLE empresa (
  idEmpresa INT NOT NULL AUTO_INCREMENT,
  razaoSocial VARCHAR(200) NOT NULL,
  cnpj CHAR(14) NOT NULL,
  email VARCHAR(200),
  cep CHAR(8),
  numero VARCHAR(10),
  statusAtividade TINYINT NOT NULL DEFAULT 1,
  PRIMARY KEY (idEmpresa),
  UNIQUE KEY uq_empresa_cnpj (cnpj)
);

CREATE TABLE aeroporto (
  idAeroporto INT NOT NULL AUTO_INCREMENT,
  nome VARCHAR(100) NOT NULL,
  codigoAeroporto VARCHAR(10) NOT NULL,
  statusAtividade TINYINT NOT NULL DEFAULT 1,
  fkEmpresa INT NOT NULL,
  PRIMARY KEY (idAeroporto),
  UNIQUE KEY uq_aeroporto_empresa_codigo (fkEmpresa, codigoAeroporto),
  CONSTRAINT fk_aeroporto_empresa FOREIGN KEY (fkEmpresa)
    REFERENCES empresa (idEmpresa)
);

CREATE TABLE cargo (
  idCargo INT NOT NULL AUTO_INCREMENT,
  nome VARCHAR(100) NOT NULL,
  descricao VARCHAR(250),
  statusAtividade TINYINT NOT NULL DEFAULT 1,
  empresa_idEmpresa INT NOT NULL,
  PRIMARY KEY (idCargo),
  UNIQUE KEY uq_cargo_nome (nome),
  CONSTRAINT fk_cargo_empresa FOREIGN KEY (empresa_idEmpresa)
    REFERENCES empresa (idEmpresa)
);

CREATE TABLE permissao (
  idPermissao INT NOT NULL AUTO_INCREMENT,
  nome VARCHAR(100) NOT NULL,
  descricao VARCHAR(250),
  PRIMARY KEY (idPermissao),
  UNIQUE KEY uq_permissao_nome (nome)
);

CREATE TABLE componente (
  idComponente INT NOT NULL AUTO_INCREMENT,
  nomeComponente VARCHAR(100) NOT NULL,
  unidadeMedida VARCHAR(30) NOT NULL,
  codigo VARCHAR(100) NOT NULL,
  nomeCodigo VARCHAR(50) NOT NULL,
  PRIMARY KEY (idComponente),
  UNIQUE KEY uq_componente_nome (nomeComponente)
);

CREATE TABLE servidor (
  idServidor INT NOT NULL AUTO_INCREMENT,
  token VARCHAR(32) NOT NULL,
  nomeServidor VARCHAR(100) NOT NULL,
  hostname VARCHAR(100) NOT NULL,
  sistemaOperacional VARCHAR(100),
  intervaloColeta INT DEFAULT NULL,
  statusAtividade TINYINT NOT NULL DEFAULT 1,
  fkAeroporto INT NOT NULL,
  PRIMARY KEY (idServidor),
  UNIQUE KEY uq_servidor_aeroporto_nome (fkAeroporto, nomeServidor),
  CONSTRAINT fk_servidor_aeroporto FOREIGN KEY (fkAeroporto)
    REFERENCES aeroporto (idAeroporto),
  CONSTRAINT ck_servidor_intervalo
    CHECK (intervaloColeta IS NULL OR intervaloColeta > 0)
);

CREATE TABLE usuario (
  idUsuario INT NOT NULL AUTO_INCREMENT,
  nome VARCHAR(100) NOT NULL,
  email VARCHAR(200) NOT NULL,
  senha VARCHAR(50) NOT NULL,
  cpf CHAR(11) NOT NULL,
  telefone VARCHAR(20),
  statusAtividade TINYINT NOT NULL DEFAULT 1,
  fkCargo INT NOT NULL,
  fkAeroporto INT NOT NULL,
  PRIMARY KEY (idUsuario),
  UNIQUE KEY uq_usuario_email (email),
  UNIQUE KEY uq_usuario_cpf (cpf),
  CONSTRAINT fk_usuario_cargo FOREIGN KEY (fkCargo)
    REFERENCES cargo (idCargo),
  CONSTRAINT fk_usuario_aeroporto FOREIGN KEY (fkAeroporto)
    REFERENCES aeroporto (idAeroporto)
);

CREATE TABLE servidorcomponente (
  idServidorComponente INT NOT NULL AUTO_INCREMENT,
  fkServidor INT NOT NULL,
  fkComponente INT NOT NULL,
  limiteAtencao DECIMAL(10,2),
  limiteCritico DECIMAL(10,2),
  PRIMARY KEY (idServidorComponente),
  UNIQUE KEY uq_servidor_componente_instancia
    (fkServidor, fkComponente),
  CONSTRAINT fk_servidorcomponente_servidor FOREIGN KEY (fkServidor)
    REFERENCES servidor (idServidor),
  CONSTRAINT fk_servidorcomponente_componente FOREIGN KEY (fkComponente)
    REFERENCES componente (idComponente),
  CONSTRAINT ck_servidorcomponente_limites CHECK (
    limiteAtencao IS NULL OR limiteCritico IS NULL
    OR limiteAtencao <= limiteCritico
  )
);

CREATE TABLE cargopermissao (
  idCargoPermissao INT NOT NULL AUTO_INCREMENT,
  fkCargo INT NOT NULL,
  fkPermissao INT NOT NULL,
  dataConcessao DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (idCargoPermissao),
  UNIQUE KEY uq_cargopermissao (fkCargo, fkPermissao),
  CONSTRAINT fk_cargopermissao_cargo FOREIGN KEY (fkCargo)
    REFERENCES cargo (idCargo),
  CONSTRAINT fk_cargopermissao_permissao FOREIGN KEY (fkPermissao)
    REFERENCES permissao (idPermissao)
);

CREATE TABLE visualizacao (
  idVisualizacao INT NOT NULL AUTO_INCREMENT,
  fkUsuario INT NOT NULL,
  fkServidor INT NOT NULL,
  dataInicioAcesso DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  dataFimAcesso DATETIME,
  PRIMARY KEY (idVisualizacao),
  UNIQUE KEY uq_visualizacao_usuario_servidor (fkUsuario, fkServidor),
  CONSTRAINT fk_visualizacao_usuario FOREIGN KEY (fkUsuario)
    REFERENCES usuario (idUsuario),
  CONSTRAINT fk_visualizacao_servidor FOREIGN KEY (fkServidor)
    REFERENCES servidor (idServidor),
  CONSTRAINT ck_visualizacao_periodo CHECK (
    dataFimAcesso IS NULL OR dataFimAcesso >= dataInicioAcesso
  )
);

-- ------------------------------------------------------------
-- EMPRESA (ids 1 e 2)
-- ------------------------------------------------------------
INSERT INTO empresa (razaoSocial, cnpj, email, cep, numero, statusAtividade) VALUES
('Aeroportos Paulistas S.A.',    '11222333000181', 'contato@aeroportospaulistas.com.br', '01310100', '1578', 1),  -- 1
('Campinas Aero Operações LTDA', '45723174000110', 'ti@campinasaero.com.br',             '13054750', '300',  1);  -- 2
 
-- ------------------------------------------------------------
-- AEROPORTO (ids 1 a 3) -> fkEmpresa
-- ------------------------------------------------------------
INSERT INTO aeroporto (nome, codigoAeroporto, statusAtividade, fkEmpresa) VALUES
('Aeroporto Internacional de Guarulhos', 'GRU', 1, 1),  -- 1 (Aeroportos Paulistas)
('Aeroporto de Congonhas',               'CGH', 1, 1),  -- 2 (Aeroportos Paulistas)
('Aeroporto Internacional de Viracopos', 'VCP', 1, 2);  -- 3 (Campinas Aero)
 
-- ------------------------------------------------------------
-- CARGO (ids 1 a 5) -> empresa_idEmpresa
-- ------------------------------------------------------------
INSERT INTO cargo (nome, descricao, statusAtividade, empresa_idEmpresa) VALUES
('Administrador',              'Acesso total: gerencia usuários, servidores, limites e relatórios',       1, 1),  -- 1
('Analista de Infraestrutura', 'Configura servidores e limites e acompanha a saúde da infraestrutura',    1, 1),  -- 2
('Operador de Monitoramento',  'Acompanha os painéis em tempo real e sinaliza incidentes',                1, 1),  -- 3
('Gerente de TI',              'Responsável pela área de TI do aeroporto, gestão de equipe e relatórios', 1, 2),  -- 4
('Técnico de Campo',           'Realiza manutenção e cadastro físico dos servidores',                     1, 2);  -- 5
 
-- ------------------------------------------------------------
-- PERMISSAO (ids 1 a 5)
-- ------------------------------------------------------------
INSERT INTO permissao (nome, descricao) VALUES
('VISUALIZAR_DASHBOARD', 'Permite visualizar os painéis de monitoramento'),             -- 1
('GERENCIAR_SERVIDORES', 'Permite cadastrar, editar e desativar servidores'),           -- 2
('GERENCIAR_USUARIOS',   'Permite cadastrar, editar e desativar usuários'),             -- 3
('CONFIGURAR_LIMITES',   'Permite definir os limites de atenção e crítico dos componentes'),  -- 4
('EXPORTAR_RELATORIOS',  'Permite gerar e exportar relatórios de desempenho');          -- 5
 
-- ------------------------------------------------------------
-- CARGOPERMISSAO -> (fkCargo, fkPermissao)
-- ------------------------------------------------------------
INSERT INTO cargopermissao (fkCargo, fkPermissao) VALUES
-- Administrador: tudo
(1, 1), (1, 2), (1, 3), (1, 4), (1, 5),
-- Analista de Infraestrutura: dashboard, servidores, limites, relatórios
(2, 1), (2, 2), (2, 4), (2, 5),
-- Operador de Monitoramento: só dashboard
(3, 1),
-- Gerente de TI: dashboard, usuários, limites, relatórios
(4, 1), (4, 3), (4, 4), (4, 5),
-- Técnico de Campo: dashboard e servidores
(5, 1), (5, 2);
 
-- ------------------------------------------------------------
-- USUARIO (ids 1 a 26) -> fkCargo, fkAeroporto
-- Senha em texto puro porque o coletor compara senha = %s direto.
-- Cargo e aeroporto sempre da mesma empresa.
-- ------------------------------------------------------------
INSERT INTO usuario (nome, email, senha, cpf, telefone, statusAtividade, fkCargo, fkAeroporto) VALUES
('Carlos Silva',      'carlos.silva@aeroportospaulistas.com.br',  'Admin@123',    '11144477735', '11987654321', 1, 1, 1),  -- 1 Administrador / GRU
('Mariana Souza',     'mariana.souza@aeroportospaulistas.com.br', 'Analista@123', '52998224725', '11976543210', 1, 2, 1),  -- 2 Analista / GRU
('Rafael Lima',       'rafael.lima@aeroportospaulistas.com.br',   'Operador@123', '39053344705', '11965432109', 1, 3, 2),  -- 3 Operador / CGH
('Fernanda Oliveira', 'fernanda.oliveira@campinasaero.com.br',    'Gerente@123',  '16899535009', '19987654321', 1, 4, 3),  -- 4 Gerente de TI / VCP
('João Pereira',      'joao.pereira@campinasaero.com.br',         'Tecnico@123',  '71428793860', '19976543210', 1, 5, 3),  -- 5 Técnico de Campo / VCP
('Beatriz Costa',     'beatriz.costa@aeroportospaulistas.com.br',  'Teste@123',    '90123456780', '11987654322', 1, 2, 1),  -- 6 Analista / GRU
('Lucas Almeida',     'lucas.almeida@aeroportospaulistas.com.br',  'Teste@123',    '81234567891', '11987654323', 1, 3, 1),  -- 7 Operador / GRU
('Camila Rodrigues',  'camila.rodrigues@aeroportospaulistas.com.br','Teste@123',   '72345678902', '11987654324', 1, 2, 1),  -- 8 Analista / GRU
('Pedro Santos',      'pedro.santos@aeroportospaulistas.com.br',   'Teste@123',    '63456789013', '11987654325', 1, 3, 1),  -- 9 Operador / GRU
('Julia Martins',     'julia.martins@aeroportospaulistas.com.br',  'Teste@123',    '54567890124', '11987654326', 1, 2, 1),  -- 10 Analista / GRU
('André Ferreira',    'andre.ferreira@aeroportospaulistas.com.br', 'Teste@123',    '45678901235', '11987654327', 1, 1, 1),  -- 11 Administrador / GRU
('Renata Carvalho',   'renata.carvalho@aeroportospaulistas.com.br','Teste@123',    '34567890126', '11987654328', 1, 2, 1),  -- 12 Analista / GRU
('Gustavo Ribeiro',   'gustavo.ribeiro@aeroportospaulistas.com.br','Teste@123',    '23456789017', '11987654329', 1, 3, 1),  -- 13 Operador / GRU
('Patricia Mendes',   'patricia.mendes@aeroportospaulistas.com.br','Teste@123',    '12345678908', '11987654330', 0, 2, 1),  -- 14 Analista inativa / GRU
('Eduardo Nunes',     'eduardo.nunes@aeroportospaulistas.com.br',  'Teste@123',    '98765432109', '11987654331', 1, 1, 1),  -- 15 Administrador / GRU
('Larissa Gomes',     'larissa.gomes@aeroportospaulistas.com.br',  'Teste@123',    '87654321090', '11987654332', 1, 2, 2),  -- 16 Analista / CGH
('Bruno Azevedo',     'bruno.azevedo@aeroportospaulistas.com.br',  'Teste@123',    '76543210981', '11987654333', 1, 3, 2),  -- 17 Operador / CGH
('Isabela Moreira',   'isabela.moreira@aeroportospaulistas.com.br','Teste@123',    '65432109872', '11987654334', 0, 2, 2),  -- 18 Analista inativa / CGH
('Felipe Cardoso',    'felipe.cardoso@aeroportospaulistas.com.br', 'Teste@123',    '54321098763', '11987654335', 1, 1, 2),  -- 19 Administrador / CGH
('Amanda Teixeira',   'amanda.teixeira@aeroportospaulistas.com.br','Teste@123',   '43210987654', '11987654336', 1, 3, 2),  -- 20 Operador / CGH
('Marcos Vieira',     'marcos.vieira@campinasaero.com.br',         'Teste@123',    '32109876545', '19987654322', 1, 4, 3),  -- 21 Gerente de TI / VCP
('Sofia Barbosa',     'sofia.barbosa@campinasaero.com.br',         'Teste@123',    '21098765436', '19987654323', 1, 5, 3),  -- 22 Técnica de Campo / VCP
('Diego Monteiro',    'diego.monteiro@campinasaero.com.br',        'Teste@123',    '10987654327', '19987654324', 0, 4, 3),  -- 23 Gerente de TI inativo / VCP
('Clara Dias',        'clara.dias@campinasaero.com.br',            'Teste@123',    '09876543218', '19987654325', 1, 5, 3),  -- 24 Técnica de Campo / VCP
('Thiago Lopes',      'thiago.lopes@campinasaero.com.br',          'Teste@123',    '88776655449', '19987654326', 1, 4, 3),  -- 25 Gerente de TI / VCP
('Natalia Freitas',   'natalia.freitas@campinasaero.com.br',       'Teste@123',    '77665544330', '19987654327', 1, 5, 3);  -- 26 Técnica de Campo / VCP
 
-- ------------------------------------------------------------
-- COMPONENTE (ids 1 a 11)
-- "codigo" = expressão Python executada pelo eval() do coletor
-- "nomeCodigo" = nome da coluna no CSV
-- ------------------------------------------------------------
INSERT INTO componente (nomeComponente, unidadeMedida, codigo, nomeCodigo) VALUES
('Uso de CPU (Geral)',     '%',         'psutil.cpu_percent(interval=1)',                                  'UsoCPU_Geral'),          -- 1
('Uso de CPU (Por Core)',  '%',         'psutil.cpu_percent(percpu=True)',                                 'UsoCPU_Por_Core'),       -- 2
('Uso de RAM',             '%',         'psutil.virtual_memory().percent',                                 'UsoRAM'),                -- 3
('Swap In',                'bytes',     'psutil.swap_memory().sin',                                        'Swap_In'),               -- 4
('Swap Out',               'bytes',     'psutil.swap_memory().sout',                                       'Swap_Out'),              -- 5
('Uso de Disco',           '%',         'psutil.disk_usage("C:\\\\" if os.name == "nt" else "/").percent', 'UsoDisco'),              -- 6
('Leitura de Disco',       'bytes',     'psutil.disk_io_counters().read_bytes',                            'Disco_Read_Bytes'),      -- 7
('Escrita de Disco',       'bytes',     'psutil.disk_io_counters().write_bytes',                           'Disco_Write_Bytes'),     -- 8
('Rede - Bytes Enviados',  'bytes',     'psutil.net_io_counters().bytes_sent',                             'Rede_Bytes_Enviados'),   -- 9
('Rede - Bytes Recebidos', 'bytes',     'psutil.net_io_counters().bytes_recv',                             'Rede_Bytes_Recebidos'),  -- 10
('Processos Ativos',       'processos', 'len(psutil.pids())',                                              'Qtd_Processos');         -- 11
 
-- ------------------------------------------------------------
-- SERVIDOR (ids 1 a 4) -> fkAeroporto
-- token com exatamente 32 caracteres; intervaloColeta em segundos (NULL = padrão)
-- ------------------------------------------------------------
INSERT INTO servidor (token, nomeServidor, hostname, sistemaOperacional, intervaloColeta, statusAtividade, fkAeroporto) VALUES
('3b12f1df-5232-4df4-8d48-64a938c2', 'SDV-GRU-01', 'sdv-gru-01.montech.local', 'Ubuntu 22.04 LTS',    3,    1, 1),  -- 1 GRU (servidor de teste)
('5d2e8b7a1c4f4963b0a7e21f9c6d3a85', 'SPA-GRU-01', 'spa-gru-01.montech.local', 'Windows Server 2022', 5,    1, 1),  -- 2 GRU
('9b7c3e5f2a1d48c6847f0e3b6a2d1c90', 'AIS-CGH-01', 'ais-cgh-01.montech.local', 'Debian 12',           10,   1, 2),  -- 3 CGH
('c4e1a7b92d3f45068e9a1b7c5d3f2e64', 'SPA-VCP-01', 'spa-vcp-01.montech.local', 'Ubuntu 24.04 LTS',    NULL, 1, 3);  -- 4 VCP
 
-- ------------------------------------------------------------
-- SERVIDORCOMPONENTE -> (fkServidor, fkComponente, limiteAtencao, limiteCritico)
-- Limite NULL = métrica sem limite (lista por core, contadores acumulados...)
-- ------------------------------------------------------------
INSERT INTO servidorcomponente (fkServidor, fkComponente, limiteAtencao, limiteCritico) VALUES
-- Servidor 1 (SDV-GRU-01): todos os 11 componentes
(1, 1,  70.00,  90.00),   -- Uso de CPU (Geral)
(1, 2,  NULL,   NULL),    -- Uso de CPU (Por Core)
(1, 3,  75.00,  90.00),   -- Uso de RAM
(1, 4,  NULL,   NULL),    -- Swap In
(1, 5,  NULL,   NULL),    -- Swap Out
(1, 6,  80.00,  95.00),   -- Uso de Disco
(1, 7,  NULL,   NULL),    -- Leitura de Disco
(1, 8,  NULL,   NULL),    -- Escrita de Disco
(1, 9,  NULL,   NULL),    -- Rede - Bytes Enviados
(1, 10, NULL,   NULL),    -- Rede - Bytes Recebidos
(1, 11, 300.00, 500.00),  -- Processos Ativos
 
-- Servidor 2 (SPA-GRU-01): RAM, disco e rede recebida
(2, 3,  80.00,  92.00),   -- Uso de RAM
(2, 6,  80.00,  95.00),   -- Uso de Disco
(2, 7,  NULL,   NULL),    -- Leitura de Disco
(2, 8,  NULL,   NULL),    -- Escrita de Disco
(2, 10, NULL,   NULL),    -- Rede - Bytes Recebidos
 
-- Servidor 3 (AIS-CGH-01): RAM, disco e rede
(3, 3,  80.00,  92.00),   -- Uso de RAM
(3, 6,  80.00,  95.00),   -- Uso de Disco
(3, 7,  NULL,   NULL),    -- Leitura de Disco
(3, 8,  NULL,   NULL),    -- Escrita de Disco
(3, 9,  NULL,   NULL),    -- Rede - Bytes Enviados
(3, 10, NULL,   NULL),    -- Rede - Bytes Recebidos
 
-- Servidor 4 (SPA-VCP-01): RAM e disco
(4, 3,  80.00,  92.00),   -- Uso de RAM
(4, 6,  85.00,  95.00),   -- Uso de Disco
(4, 7,  NULL,   NULL),    -- Leitura de Disco
(4, 8,  NULL,   NULL);    -- Escrita de Disco
 
-- ------------------------------------------------------------
-- VISUALIZACAO -> (fkUsuario, fkServidor, dataInicioAcesso, dataFimAcesso)
-- dataFimAcesso NULL = acesso ainda ativo
-- Cada usuário só visualiza servidores da própria empresa.
-- ------------------------------------------------------------
INSERT INTO visualizacao (fkUsuario, fkServidor, dataInicioAcesso, dataFimAcesso) VALUES
(1, 1, '2026-09-01 08:00:00', NULL),                    -- Carlos  -> SDV-GRU-01
(1, 2, '2026-09-01 08:00:00', NULL),                    -- Carlos  -> SPA-GRU-01
(1, 3, '2026-09-01 08:00:00', NULL),                    -- Carlos  -> AIS-CGH-01
(2, 1, '2026-09-02 09:30:00', NULL),                    -- Mariana -> SDV-GRU-01
(2, 2, '2026-09-02 09:30:00', NULL),                    -- Mariana -> SPA-GRU-01
(3, 3, '2026-09-03 07:45:00', '2026-09-25 18:00:00'),   -- Rafael  -> AIS-CGH-01 (acesso encerrado)
(4, 4, '2026-09-05 10:15:00', NULL),                    -- Fernanda -> SPA-VCP-01
(5, 4, '2026-09-08 13:00:00', '2026-09-20 17:30:00');   -- João    -> SPA-VCP-01 (acesso encerrado)