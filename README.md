# Marcador de Truco Paulista

PWA offline para marcar pontos de truco paulista, com ranking, áudios
customizados e pegadinhas secretas. Sem build, sem dependências.

## Rodar

Sirva a pasta por HTTP (Service Worker exige http/https, não funciona via `file://`):

```powershell
npx --yes serve .
# ou
python -m http.server 8080
```

Abra o endereço no navegador do celular e use "Adicionar à tela inicial" para instalar.

## Testes

```powershell
.\test.cmd
```

## Uso

- **Marcador**: escolha o valor da mão (1 / Truco / 6 / 9 / 12) e toque `+` no time.
  `−1` corrige, `Desfazer` reverte a última jogada. Vence quem chega a 12.
- **Ranking**: vitórias agregadas por dupla + histórico de partidas finalizadas.
- **Config**: nomes dos times, importação de áudios (tocam quando o "Nós" pontua)
  e liga/desliga das pegadinhas.

## Pegadinhas (🤫)

Somam +1 ao "Nós" de forma discreta, sem som e sem animação:

1. **Zona invisível** — toque no canto superior direito da tela.
2. **Toque longo** — segure (~0,6s) sobre o nome do time "Nós".
3. **Código** — 3 toques rápidos no título "🃏 Truco".

Cada uma pode ser desativada em Config.
