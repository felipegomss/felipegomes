# LinkedIn — Variações de post

Link do artigo: https://lfng.dev/blog/notebook-corporativo-servidor-remoto

---

## Variação 1 — Storytelling curto

A empresa me deu um Windows. Eu tenho um Mac pessoal e uso ambiente Unix há anos. Toda vez que eu sentava no Windows pra trabalhar, travava numa coisa boba. Barra invertida, PowerShell, atalho diferente.

Aí parei de tentar me adaptar e fiz o contrário: transformei o notebook corporativo num servidor remoto. WSL2 no Windows, Tailscale pra VPN mesh, SSH com port forwarding. O notebook fica fechado numa estante, plugado na tomada, e eu programo do Mac normalmente.

O Next.js roda no WSL. O browser acessa localhost:3000. OAuth funciona como se fosse local. O notebook não toco há dias.

Escrevi o passo a passo completo, incluindo as armadilhas (Modern Standby, GPO corporativa, performance do /mnt/c/) e como contornar cada uma:

https://lfng.dev/blog/notebook-corporativo-servidor-remoto

---

## Variação 2 — Lista de takeaways

WSL2 + Tailscale + SSH = notebook corporativo fechado num canto da casa, eu programando normalmente do Mac.

Montei esse setup e documentei tudo. O que tem no artigo:

→ Como instalar WSL2 e configurar Ubuntu do zero
→ Por que instalar o Tailscale dentro do WSL (não no Windows host)
→ SSH config com port forwarding pra acessar localhost:3000 no Mac
→ Autostart no boot do Windows pra nunca perder acesso remotamente
→ Configurações de energia pra não quebrar com Modern Standby
→ Como checar política de GPO corporativa que pode ignorar tudo

Depois de configurado, o notebook desaparece. É isso que eu queria desde o começo.

https://lfng.dev/blog/notebook-corporativo-servidor-remoto

---

## Variação 3 — Pergunta-isca

Você já pensou em transformar seu notebook corporativo em servidor remoto?

A empresa me deu um Windows. Eu tenho um Mac pessoal e uso ambiente Unix há anos. A solução que encontrei foi parar de tentar adaptar o Windows e fazer ele virar só infraestrutura: os repos ficam nele, o Node roda nele, eu controlo tudo via SSH do Mac.

A peça que torna isso possível em qualquer Wi-Fi, sem abrir porta no roteador, é o Tailscale. Mesh VPN, hostname fixo, funciona de casa, do café ou da casa dos seus pais. Com SSH e port forwarding, o localhost:3000 do WSL aparece como localhost:3000 no Mac. OAuth funciona, cookies funcionam, HMR funciona.

Documentei cada passo, incluindo as armadilhas que a maioria esquece: Modern Standby, inicialização automática do WSL e política de GPO corporativa.

👉 https://lfng.dev/blog/notebook-corporativo-servidor-remoto
