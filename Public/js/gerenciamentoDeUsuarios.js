function pegarUsuariosPeloAdministrador() {
    idUsuario = sessionStorage.ID;
    fetch(`/usuarios/pegarUsuariosPeloAdministrador/${idUsuario}`, {
        method: "GET",
    })
        .then(response => response.json())
        .then(data => {
            console.log(data);
            let textoDadosTabelaUsuarios = `
                <div class="linhaCabecalho">
                        <div class="col">Usuário</div>
                        <div class="col">Status</div>
                        <div class="col">Servidores</div>
                        <div class="col">Ações</div>
                </div>`

            for (let i = 0; i < data.length; i++) {
                const usuario = data[i];

                let textoStatus = ""
                if (usuario.status == false) {
                    textoStatus = `    
                    <div class="col">
                        <span class="status inativo">Inativo</span>
                     </div>`
                }else{
                    textoStatus = `
                    <div class="col">
                        <span class="status ativo">Ativo</span>
                     </div>`
                }

                let textoServidoresDisponivel = data[i].servidores.length == 0 
                ?  `<span class="servidor inativo">Não possui nenhum servidor disponivel</span>` 
                : ``

                for (let j = 0; j < data[i].servidores.length; j++) {
                    textoServidoresDisponivel += `<span class="servidor ativo">${data[i].servidores[j].nomeServidor}</span>`
                }
                

                textoDadosTabelaUsuarios += `
                 <div class="linhaUsuario">
                            <div class="col">
                                <span class="usuarioNome">${usuario.nomeUsuario}</span>
                                <span class="usuarioEmail">${usuario.email}</span>
                            </div>
                            ${textoStatus}
                            <div class="col">
                                <div class="servidores">
                                    ${textoServidoresDisponivel}
                                </div>
                            </div>
                             <div class="col">
                                <button class="btnEditar">Editar</button>
                            </div>
                        </div>
                        `
            }
            tabelaUsuarios.innerHTML = textoDadosTabelaUsuarios;
        })
        .catch(error => {
            console.error('Error:', error);
        });
}