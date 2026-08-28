# Pedidos Bertioga

Plataforma multi-loja de cardápio digital, checkout, acompanhamento de pedidos e painel KDS.

## Como rodar

```bash
npm install
npm run dev
```

Abra [http://localhost:3000](http://localhost:3000).

## Acessos de demonstração

- Cliente: `/acai` e `/burger`
- Admin Açaí: `acai@loja.com` / `admin123` em `/acai/admin`
- Admin Burger: `burger@loja.com` / `admin123` em `/burger/admin`
- Master: `master@pedidosbertioga.com` / `master123` em `/master`

## Supabase

Copie `.env.example` para `.env.local` e rode `supabase/schema.sql` no SQL Editor quando for conectar o banco real. Sem essas variáveis, o app usa um banco local no navegador (localStorage) para você testar o fluxo completo.
