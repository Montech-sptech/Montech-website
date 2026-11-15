# ✈️ Montech - Deploy com Docker

> Passo a passo para subir a aplicação Node.js em um container Docker na VM, conectando a um container MySQL já existente.

---

## 📋 Índice

- [Pré-requisitos](#-pré-requisitos)
- [1. Clonar o repositório na VM](#1-clonar-o-repositório-na-vm)
- [2. Configurar o `.env`](#2-configurar-o-env)
- [3. Configurar a rede Docker](#3-configurar-a-rede-docker)
- [4. Subir o container](#4-subir-o-container)
- [5. Acessar o site](#5-acessar-o-site)
- [6. Atualizar a aplicação](#6-atualizar-a-aplicação)
- [Docker Network (explicação detalhada)](#-docker-network)
- [Comandos úteis](#-comandos-úteis)

---

## ✅ Pré-requisitos

- VM Linux (Ubuntu/Debian) com acesso SSH
- Container MySQL já criado e em execução (nome usado neste guia: `montech-db`)
- Banco `montech` e usuário com permissão criados nesse MySQL
- Porta da aplicação (`8080`) liberada no **Security Group** da AWS
- Pelo menos alguns GB livres no disco onde o Docker guarda as imagens (`df -h`)

---

## 1. Clonar o repositório na VM

```bash
git clone <URL_DO_REPOSITORIO>
cd <PASTA_DO_PROJETO>
```

> Antes de clonar, confirme que `Dockerfile`, `docker-compose.yml`, `.dockerignore` e `package-lock.json` foram commitados e enviados (`git push`). Sem eles, o build falha na VM.

---

## 2. Configurar o `.env`

O `.env` não vai para o repositório (está no `.gitignore`), então **crie manualmente na VM**, na raiz do projeto:

```bash
nano .env
```

```bash
AMBIENTE_PROCESSO=producao

# Banco de dados (container MySQL)
DB_HOST=montech-db
DB_PORT=3306
DB_DATABASE=montech
DB_USER=montech
DB_PASSWORD=sua_senha_aqui

# Aplicação
APP_PORT=8080
APP_HOST=IP_PUBLICO_DA_VM
```

Pontos importantes:

- `DB_HOST` é o **nome do container** MySQL (veja em `docker ps`), nunca `localhost`.
- `DB_PORT` é sempre a porta **interna** do MySQL (`3306`), mesmo que ele esteja publicado em outra porta na VM.
- `APP_HOST` só aparece na mensagem de log do `app.js`, não afeta o funcionamento.
- Evite `$` nas senhas (o Compose interpreta como variável). Se precisar, escreva `$$`.
- Não use aspas nos valores.
- Nunca coloque senhas reais no README nem no repositório.

---

## 3. Configurar a rede Docker

Para o app enxergar o MySQL pelo nome, os dois containers precisam estar na **mesma rede personalizada**. Resumo dos comandos (explicação completa na seção [Docker Network](#-docker-network)):

```bash
docker network create montech-net
docker network connect montech-net montech-db
```

---

## 4. Subir o container

```bash
docker compose up -d --build
```

Isso lê o `docker-compose.yml`, constrói a imagem usando o `Dockerfile` e sobe o container `montech-app`.

Confira o status e os logs:

```bash
docker compose ps
docker compose logs -f --tail 30 app
```

O log deve mostrar o banner **"Servidor do seu site já está rodando!"**. Para sair do `logs -f`, use `Ctrl+C` (o container continua rodando).

---

## 5. Acessar o site

```
http://IP_PUBLICO_DA_VM:8080
```

- Use o **IP público** da instância (não o `172.31.x.x`, que é privado).
- Use `http://`, não `https://`.
- Se a instância foi parada e iniciada, o IP público pode ter mudado (a menos que use Elastic IP).

---

## 6. Atualizar a aplicação

| Situação | Comando |
| --- | --- |
| Mudou o **código** (após `git pull`) | `docker compose up -d --build` |
| Mudou só o **`.env`** | `docker compose up -d --force-recreate` |
| Quer apenas reiniciar | `docker compose restart app` |

> `restart` **não** relê o `.env`. Para aplicar mudanças no `.env`, use `--force-recreate`.

Fluxo típico de atualização:

```bash
git pull
docker compose up -d --build
```

---

## 🌐 Docker Network

### Por que isso é necessário?

Cada container tem seu próprio `localhost`. Dentro do container do app, `localhost` aponta para o **próprio app**, e não para o MySQL. Para os containers conversarem, eles precisam estar na mesma rede Docker e usar o **nome do container** como host.

Existe uma limitação importante: a rede padrão `bridge` **não resolve nomes** entre containers. Por isso é preciso uma rede personalizada.

### Passo 1: descobrir em qual rede o MySQL está

```bash
docker inspect montech-db --format '{{json .NetworkSettings.Networks}}'
```

Para listar só os nomes das redes:

```bash
docker inspect montech-db --format '{{range $k, $v := .NetworkSettings.Networks}}{{$k}}{{"\n"}}{{end}}'
```

Se aparecer `bridge`, siga para o passo 2. Se já for uma rede personalizada, use o nome dela no `docker-compose.yml` (nas duas partes: dentro do serviço e na seção `networks`) e pule o passo 2.

### Passo 2: criar a rede e conectar o MySQL

```bash
docker network create montech-net
docker network connect montech-net montech-db
```

O `montech-db` **não precisa ser recriado nem reiniciado**. Ele passa a estar na `bridge` e na `montech-net` ao mesmo tempo.

### Passo 3: usar a rede no `docker-compose.yml`

```yaml
services:
  app:
    # ...
    networks:
      - montech-net

networks:
  montech-net:
    external: true
```

`external: true` indica que a rede **já existe** (criada no passo 2) e o Compose não deve criá-la nem removê-la.

### Passo 4: apontar o `.env` para o nome do container

```bash
DB_HOST=montech-db
DB_PORT=3306
```

### Passo 5: verificar

Veja quais containers estão na rede:

```bash
docker network inspect montech-net
```

Em `Containers` devem aparecer **`montech-app`** e **`montech-db`**.

Teste a conexão com o banco usando as credenciais do `.env`:

```bash
docker exec -it montech-db mysql -u montech -p montech
```

### Comandos de rede úteis

```bash
docker network ls                                  # lista as redes
docker network inspect montech-net                 # detalhes e containers conectados
docker network connect montech-net <container>     # conecta um container existente
docker network disconnect montech-net <container>  # desconecta
docker network rm montech-net                      # remove (sem containers conectados)
```

## 🧰 Comandos úteis

```bash
docker compose ps                       # status dos containers
docker compose logs app                 # logs do app
docker compose logs -f --tail 50 app    # acompanha os logs em tempo real
docker compose stop                     # para o app
docker compose down                     # para e remove o container do app
docker exec -it montech-app sh          # abre um terminal dentro do app
docker exec montech-app env | grep DB_  # confere as variáveis carregadas
docker ps -a                            # lista todos os containers
docker system df                        # espaço usado pelo Docker
```