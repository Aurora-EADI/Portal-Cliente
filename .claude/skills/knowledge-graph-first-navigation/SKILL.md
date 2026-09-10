---
name: knowledge-graph-first-navigation
description: >
  Use em qualquer repositório grande do grupo que tenha um grafo de conhecimento gerado (ex: via
  graphify) — consultar o grafo antes de grep manual/leitura exaustiva de arquivos para perguntas
  de arquitetura ou navegação de código.
---

## Navegação por grafo de conhecimento

Se o projeto tem um grafo de conhecimento de código gerado (tipicamente um diretório de saída
com `graph.json` e/ou uma wiki navegável), prefira consultá-lo a grep cru ou releitura exaustiva
do repositório para perguntas de arquitetura.

## Regras

- Para perguntas de código ou arquitetura, quando o grafo existir, rode a consulta pela
  ferramenta do grafo (CLI ou MCP equivalente) antes de grep manual — o resultado é um subgrafo
  focado na pergunta, normalmente muito menor que ler um relatório de arquitetura inteiro ou
  gregar o repositório inteiro.
- Para relações entre dois pontos do código (ex: "como A chega em B"), use a consulta de caminho
  do grafo em vez de navegar manualmente por imports.
- Para entender um conceito específico, use a consulta de explicação/nó focado do grafo.
- Se existir uma wiki gerada a partir do grafo, navegue por ela em vez de ler arquivos-fonte
  brutos quando a pergunta for sobre estrutura/arquitetura, não sobre uma linha de código
  específica.
- Leia o relatório de arquitetura completo do grafo só para revisão ampla, ou quando consulta
  pontual/caminho/explicação não trouxerem contexto suficiente.
- Depois de modificar arquivos de código na sessão, atualize o grafo (comando de update do
  projeto) para mantê-lo corrente — a atualização costuma ser baseada só em AST, sem custo de
  API.

## Por que isso importa

Um grafo de conhecimento devolve um subgrafo relevante para a pergunta feita, em vez de forçar
quem pergunta a inferir a resposta a partir de uma busca textual ampla ou de ler o repositório
inteiro. O princípio é ferramenta-agnóstico — vale para qualquer repositório grande do grupo que
adote graphify ou uma ferramenta equivalente de indexação semântica de código.
