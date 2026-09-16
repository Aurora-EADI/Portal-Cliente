# Traefik externo

O Traefik de produção não pertence ao `docker-compose.yml` da aplicação.

Requisitos da instância externa:

- Docker provider habilitado;
- `exposedByDefault=false`;
- rede Docker externa `portal_net`;
- entrypoints `web=:80` e `websecure=:443`;
- redirecionamento global de `web` para `websecure`;
- dashboard desabilitado ou restrito à administração interna;
- socket montado somente leitura:

```text
/var/run/docker.sock:/var/run/docker.sock:ro
```

O arquivo [traefik.prod.yml](./traefik.prod.yml) é a configuração estática e
configura o resolver ACME `letsencrypt`. O arquivo [dynamic.yml](./dynamic.yml)
não contém certificados, routers ou serviços da aplicação.

## Certificado ACME / Let's Encrypt

O Traefik externo deve montar armazenamento persistente fora do repositório:

```text
/opt/traefik/letsencrypt:/letsencrypt
```

No servidor, crie o arquivo com acesso restrito antes de iniciar Traefik:

```sh
install -d -m 700 /opt/traefik/letsencrypt
install -m 600 /dev/null /opt/traefik/letsencrypt/acme.json
```

Não monte `acme.json` a partir do repositório nem o versione: ele contém o
estado e as chaves privadas ACME. Execute uma única réplica de Traefik usando
esse storage. A porta pública `80` precisa alcançar o entrypoint `web`; o
redirect global para HTTPS é compatível com HTTP-01. Os routers da aplicação
selecionam o resolver `letsencrypt` nas labels do Compose.
