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

O arquivo [traefik.prod.yml](./traefik.prod.yml) é a configuração estática.
O arquivo [dynamic.yml](./dynamic.yml) contém somente a declaração opcional de
certificados TLS; não contém routers nem serviços da aplicação.

## Certificado fornecido pela TI

Arquivos necessários, em PEM:

```text
fullchain.pem  certificado do domínio com cadeia intermediária
privkey.pem    chave privada correspondente
```

Ponto de montagem somente leitura esperado:

```text
/etc/traefik/certs/portal.seudominio.com/fullchain.pem
/etc/traefik/certs/portal.seudominio.com/privkey.pem
```

Não criar arquivos fictícios, self-signed ou vazios como certificado de
produção. O domínio e o caminho final devem ser substituídos pela TI quando
forem definidos.
