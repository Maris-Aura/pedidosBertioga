# Pedidos Bertioga

Plataforma multi-loja de cardápio digital em [pedidosbertioga.com.br](https://pedidosbertioga.com.br).

Lojas:
- Fast Cuscuz e Açaí → `/acai`
- Carioca Burguers → `/burger`

## Como rodar

```bash
npm install
npm run dev
```

Abra [http://localhost:3000](http://localhost:3000).

## Senha master (segura)

O e-mail e a senha da dona da plataforma **não ficam no código**. Configure no arquivo `.env.local` (na raiz do projeto):

```
MASTER_EMAIL=mariapaularibeiro105@gmail.com
MASTER_PASSWORD=sua-senha-forte
AUTH_SECRET=uma-chave-longa-aleatoria
```

Depois reinicie o `npm run dev`. Em produção (Vercel), coloque as mesmas variáveis no painel de Environment Variables.

## Acessos das lojas (demonstração)

- Cliente: `/acai` e `/burger`
- Admin Fast Cuscuz e Açaí: `acai@loja.com` / `admin123` em `/acai/admin`
- Admin Carioca Burguers: `burger@loja.com` / `admin123` em `/burger/admin`
- Master: `/master` com o e-mail e a senha do `.env.local`

## Supabase

Copie `.env.example` para `.env.local` e rode `supabase/schema.sql` no SQL Editor quando for conectar o banco real. Sem essas variáveis, o app usa um banco local no navegador (localStorage) para você testar o fluxo completo.
