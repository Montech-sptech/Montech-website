# ✈️ Montech - Deploy com Docker

> Passo a passo para subir a aplicação Node.js em um container Docker na VM, conectando a um container MySQL já existente.

---

## 📋 Índice

- [Pré-requisitos](#-pré-requisitos)
- [1. Clonar o repositório na VM](#1-clonar-o-repositório-na-vm)
- [2. Configurar o `.env`](#2-configurar-o-env)
- [3. Subir o container](#3-subir-o-container)
- [4. Acessar o site](#4-acessar-o-site)
- [5. Atualizar a aplicação](#5-atualizar-a-aplicação)
- [Comandos úteis](#-comandos-úteis)

---

## ✅ Pré-requisitos

- VM Linux (Ubuntu/Debian) com acesso SSH
- Network `montech-net` já criada (o `docker-compose.yml` deste projeto já está configurado para usá-la)
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

## 3. Subir o container

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

> Se aparecer o erro `network montech-net declared as external, but could not be found`, a network ainda não foi criada. Suba antes o projeto que a cria.

---

## 4. Acessar o site

```
http://IP_PUBLICO_DA_VM:8080
```

- Use o **IP público** da instância (não o `172.31.x.x`, que é privado).
- Use `http://`, não `https://`.
- Se a instância foi parada e iniciada, o IP público pode ter mudado (a menos que use Elastic IP).

---

## 5. Atualizar a aplicação

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