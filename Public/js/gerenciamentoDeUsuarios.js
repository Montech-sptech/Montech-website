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

                textoStatus = usuario.status ? "Ativo" : "Inativo";
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


                textoDadosTabelaUsuarios += `
                 <div class="linhaUsuario">
                            <div class="col">
                                <span class="usuarioNome">${usuario.nomeUsuario}</span>
                                <span class="usuarioEmail">${usuario.email}</span>
                            </div>
                            ${textoStatus}
                            <div class="col">
                                <div class="servidores">
                                    <span class="servidor ativo">Captura</span>
                                    <span class="servidor ativo">Processamento</span>
                                    <span class="servidor ativo">Exibição</span>
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