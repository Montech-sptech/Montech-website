const BotaoVoltar = document.getElementById('btn-voltar');
BotaoVoltar.addEventListener('click', function() {
    window.location.href = './gerenciamentoServidor.html';
});



const urlParams = new URLSearchParams(window.location.search);
const idServidor = urlParams.get('id');


async function buscarInformacoes(idServidor) {
        try {
        let resposta = await fetch(`/gerServidores/buscarServidor/${idServidor}`);
            
        if(resposta.ok) {
            let dados = await resposta.json();
            if (dados && dados.length >= 0) {
                let nomeServidor = document.getElementById('nome-servidor');
                let sistemaOperacional = document.getElementById('sistema-operacional');
                let statusServidor = document.getElementById('status-servidor');
                let tokenUnico = document.getElementById('token-unico');

                nomeServidor.value = dados[0].nomeServidor;
                sistemaOperacional.value = dados[0].sistemaOperacional;
                tokenUnico.value = dados[0].token;

                if (dados[0].statusAtividade == 1) {
                    statusServidor.value = 'Ativo';
                } else {
                    statusServidor.value = 'Desativo';
                }
            }

            let respostaComp = await fetch(`/gerServidores/buscarComponentesServidor/${idServidor}`);
            let dadosComp = await respostaComp.json();
            let listaComponente = document.getElementById('lista-componentes');

            dadosComp.forEach(item => {
                const divItem = document.createElement('div');
                divItem.className = 'componente-item';

                divItem.innerHTML = `
                    <div class="componente-nome">
                        <img src="../img/Servidores/cpuIcon.svg" alt="${item.nomeComponente}">
                        <span>${item.nomeComponente}</span>
                    </div>

                    <div class="componente-campo">
                        <label for="${item.idComponente}-metrica">Métrica</label>
                        <input type="text" id="${item.idComponente}-metrica" readonly value="${item.unidadeMedida}">
                    </div>

                    <div class="componente-campo">
                        <label for="${item.idComponente}-atencao">Atenção</label>
                        <input type="number" id="${item.idComponente}-atencao" value="${item.limiteAtencao}">
                    </div>

                    <div class="componente-campo">
                        <label for="${item.idComponente}-critico">Crítico</label>
                        <input type="number" id="${item.idComponente}-critico" value="${item.limiteCritico}">
                    </div>
                `;

                listaComponente.appendChild(divItem);
            })


            console.log("Tudo certo");
            return true;
        } else {
            console.log("Erro")
        }
    } catch (erro) {
        console.log(erro);
        alert("erro")
        return false;
    }
}

buscarInformacoes(idServidor)