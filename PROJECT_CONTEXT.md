# PROJECT_CONTEXT.md - Marcador de Truco

Gerado em: 2026-06-16 11:49:50

## Descricao

Marcador de truco, igual ao Marcador de Truco que existe na play store, porem ire colocar algumas pegadinhas em relacao a pontuacao

## Objetivo

contabilizar as jogdas de truco paulista porem com algumas pegadinhas e vozes ao inserir os pontos

## Publico Alvo

Nao definido

## Caracteristicas Informadas

- Interface visual: Sim
- Login/autenticacao: Nao
- Banco de dados: Nao
- Offline/PWA: Sim
- Mobile: Sim
- Dashboard/graficos: Nao
- API propria: Nao
- Integracoes externas: Nao
- Multiusuario: Sim

## Stack Escolhida

```text
React + Vite + Supabase
```

## Motivo Da Stack

O projeto tem interface e sinais de login, multiusuario ou dados persistentes. React organiza telas/estado e Supabase reduz custo inicial de auth e banco.

## Alternativas Rejeitadas

HTML/CSS/JS vanilla: pode limitar evolucao com varias telas. Backend customizado: rejeitado no inicio para evitar manutencao antes da necessidade real.

## Revisao Obrigatoria De Stack

Antes da primeira feature real, o `senior-dev` deve validar se a stack escolhida ainda faz sentido.

Se houver front-end, `ui-ux-expert` deve validar impacto visual e UX.

O `code-reviewer` deve apontar risco de stack inadequada, excesso de complexidade ou falta de base para evolucao.

## Revisao De Stack Realizada (2026-06-16)

`senior-dev` validou a stack antes da primeira feature. Decisao: trocar
`React + Vite + Supabase` por **PWA vanilla (HTML/CSS/JS + Service Worker)**.

Motivo: o app e offline-first, sem login, sem banco remoto e sem multiusuario
real (PROJECT_CONTEXT marca Login=Nao, Banco=Nao, Offline/PWA=Sim). Supabase
nao tem proposito aqui e React+Vite adiciona build/node_modules sem ganho para
um marcador simples. Vanilla mantem zero dependencias, 100% offline, instalavel
e testavel com o `node --test` ja existente. Persistencia local via IndexedDB
(partidas e audios) e localStorage (config).

A stack documentada original fica registrada acima como historico da decisao.

## Workflow Padrao

1. `senior-dev`
2. `ui-ux-expert`, quando houver front-end
3. `code-reviewer`
4. `qa-senior`
5. `qa-automate`
6. Validacao final com testes e diff
7. Commit/push em `develop` e PR `develop -> main`

## Comandos De Validacao

```powershell
.\test.cmd
npm.cmd test
git diff --check
```

## Notas De Escopo

- Trabalhar sempre em `develop`.
- Nunca fazer push direto para `main`.
- Preservar alteracoes existentes do usuario.
- Fazer staging explicito por arquivo.
- Manter documentacao de contexto versionada neste arquivo.

