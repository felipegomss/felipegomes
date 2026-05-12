# LinkedIn — Variações de post (tools)

Link: https://lfng.dev/tools

---

## Variação 1 — Storytelling curto

Toda vez que precisava formatar um JSON, eu abria jsonformatter.org. Pra decodificar um JWT, jwt.io. Cron expression? crontab.guru. CPF de teste? Algum gerador aleatório de qualidade duvidosa.

Não era falta de ferramenta. Era ter que sair do editor, abrir uma aba nova, lembrar do site e — pra coisas como JWT — saber que o payload tava sendo enviado pro servidor de alguém.

Construí uma página de ferramentas no meu próprio site. 22 utilitários em 6 categorias: formatadores (JSON, Markdown com KaTeX e syntax highlight), encoders/decoders (JWT, Base64, URL, image → base64), geradores (UUID v4/v7, hash SHA, senha, QR code), mock data (pessoa, endereço, empresa — todos com CPF/CNPJ válido pelo dígito verificador), conversores (timestamp, cor com OKLCH, case, slug, JSON↔YAML) e diff/inspeção (regex tester, cron parser, text diff).

Tudo roda no navegador. Sidebar tipo docs com busca por categoria e keyword pra navegar.

→ https://lfng.dev/tools

---

## Variação 2 — Lista de takeaways

Cansei de abrir jsonformatter.org, jwt.io, crontab.guru e 4devs toda vez que precisava de algo simples. Construí minha própria coleção de ferramentas client-side no portfólio.

O que tem:

→ JSON formatter/validator e Markdown preview com KaTeX + syntax highlighting
→ JWT decoder, Base64 (texto e arquivo), URL encode/decode, image → data URI
→ UUID v4 e v7, SHA-1/256/512, gerador de senha, QR code
→ Pessoa, endereço e empresa fake com **CPF e CNPJ válidos** (dígito verificador correto, não é random)
→ Timestamp converter, conversor de cor com OKLCH, case converter, slugify, JSON↔YAML
→ Regex tester com highlight inline, cron parser (descrição em PT-BR + próximas execuções), diff de texto

22 ferramentas em 6 categorias, com sidebar tipo docs e busca por keyword. Cada uma tem rota própria pra compartilhar link direto.

→ https://lfng.dev/tools

---

## Variação 3 — Pergunta-isca

Quantas abas você abre por dia pra coisas que poderiam estar num lugar só? jsonformatter, jwt.io, crontab.guru, gerador de CPF...

Construí uma página de ferramentas no meu site pra parar de depender desses sites de terceiros. 22 utilitários client-side: formatadores, encoders, geradores (com CPF e CNPJ válidos pelo dígito verificador), conversores (incluindo OKLCH e timestamp via Intl.RelativeTimeFormat), regex tester com highlight, cron parser em PT-BR, diff, QR code e markdown com KaTeX.

Organizei em 6 categorias com sidebar tipo docs (estilo shadcn) e busca por keyword. Cada ferramenta tem rota própria, link compartilhável. Faker fica lazy-loaded só quando você abre uma das rotas de mock data, pra não inflar o bundle das outras.

A peça que faltava no portfólio era isso: usar o próprio site pra resolver os problemas pequenos do dia a dia.

👉 https://lfng.dev/tools
