var empresaModel = require("../models/cadastroEmpresasModel");

async function cadastrar(req, res) {
    console.log("Acessei o empresaController - cadastrar");

    var razaoSocial = req.body.razaoSocialServer;
    var cnpj = req.body.cnpjServer;
    var cep = req.body.cepServer;
    var numero = req.body.numeroServer;

    // Validação dos campos obrigatórios
    if (!razaoSocial) {
        res.status(400).send("A Razão social está vazia ou undefined!");
    } else if (!cnpj) {
        res.status(400).send("O CNPJ está vazio ou undefined!");
    } else if (!cep) {
        res.status(400).send("O CEP está vazio ou undefined!");
    } else if (!numero) {
        res.status(400).send("O Número está vazio ou undefined!");
    } else {

        try {
            // Verificação de CNPJ duplicado
            let resultadoCnpj = await empresaModel.verificarCnpj(cnpj);
            
            if (resultadoCnpj && resultadoCnpj.length > 0 && resultadoCnpj[0].qtdCnpj > 0) {
                res.status(400).send("CNPJ já cadastrado!");
                return;
            }

            // Geração de código único (Token)
            let codigoValido = false;
            let codigo = "";

            while (!codigoValido) {
                const caracteres = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
                codigo = 'MNT'; // Prefixo da MonTech

                for (let i = 3; i < 8; i++) {
                    codigo += caracteres.charAt(Math.floor(Math.random() * caracteres.length));
                }

                console.log('Código gerado: ', codigo);

                let resultado = await empresaModel.verificarCodigoCadastro(codigo);
                
                if (resultado && resultado.length > 0 && resultado[0].qtdEmpresa == 0) {
                    codigoValido = true;
                    console.log('Código válido');
                    break;
                } else {
                    console.log("Código inválido, tentando novamente");
                }
            }

            // Inserção no banco
            empresaModel.cadastrar(razaoSocial, cnpj, codigo, cep, numero)
                .then(function (resultado) {
                    res.json({
                        empresa_id: resultado.insertId,
                        codigo_empresa: codigo
                    });
                })
                .catch(function (erro) {
                    console.log("\nHouve erro ao cadastrar empresa! ERRO: ", erro.sqlMessage);
                    res.status(500).json(erro.sqlMessage);
                });

        } catch (erro) {
            console.log("\nErro na verificação de dados: ", erro);
            res.status(500).json("Erro interno no servidor.");
        }
    }
}

module.exports = {
    cadastrar
};