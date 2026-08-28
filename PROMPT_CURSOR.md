# ESPECIFICAÇÃO TÉCNICA: Plataforma Multi-Loja de Delivery (Estilo Anota AI)

## 1. Visão Geral do Sistema
Sistema web SaaS multi-lojas de cardápio digital e gestão de pedidos de delivery e retirada.
O sistema roda em um único domínio principal (ex: `pedidosbertioga.com.br`) e permite isolar totalmente duas ou mais lojas independentes (Ex: Loja 1 - Açaí/Cuscuz; Loja 2 - Hamburgueria).

Cada loja opera de forma 100% independente para o cliente e para a equipe da cozinha:
- **Link do Cardápio (Cliente):** `/[storeSlug]` (Ex: `/acai` e `/burger`)
- **Painel KDS da Loja (Cozinha):** `/[storeSlug]/admin` (Isolado com login próprio)
- **Painel Geral Plataforma (Master):** `/master` (Dona do sistema)

---

## 2. Stack Tecnológica
- **Framework:** Next.js (App Router) + React
- **Estilização:** Tailwind CSS + Lucide Icons
- **Banco de Dados & Auth:** Supabase (PostgreSQL + Auth + Realtime Subscriptions)
- **Impressão:** Layout de comanda térmica (80mm e 58mm) formatado via `window.print()`

---

## 3. Estrutura de Rotas e Funcionalidades

### A. Visão do Cliente (Pública por Loja)
1. **Cardápio Interativo (`/[storeSlug]`):**
   - Identificação obrigatória antes de enviar: Nome e Telefone.
   - Opção de consumo: **Delivery** ou **Retirada**.
   - Se Delivery: Seleção do Bairro (para cálculo da taxa fixa cadastrada na loja) e Endereço completo.
   - Listagem de Categorias e Produtos específicos da loja (`store_id`).
   - Modal com etapas de personalização por item (Ex: Tamanho -> Coberturas grátis -> Adicionais pagos).
   - Observação individual por item e observação geral do pedido.

2. **Checkout e Pagamento (`/[storeSlug]/checkout`):**
   - Cálculo automático do carrinho + taxa do bairro selecionado.
   - **Opções de Pagamento:**
     1. **PIX (Chave Estática):** Exibe o código PIX Copia e Cola formatado com a chave da loja e o valor exato para a cliente copiar.
     2. **Cartão na Entrega:** Sinaliza que o motoboy deve levar a maquininha.
     3. **Dinheiro na Entrega:** Campo opcional para troco.
   - Botão para finalizar e redirecionar para a tela de status em tempo real.

3. **Acompanhar Pedido (`/[storeSlug]/status/[orderId]`):**
   - Atualização em tempo real (Supabase Realtime) do status do pedido:
     1. *Aguardando Confirmação*
     2. *Em Produção*
     3. *Saiu para Entrega*
     4. *Entregue*

---

### B. Visão da Loja / Painel KDS (`/[storeSlug]/admin`)
1. **Autenticação e Proteção:**
   - Protegido por login e senha via Supabase Auth.
   - O atendente só visualiza os dados e pedidos pertencentes ao `store_id` da sua loja.

2. **Gestão de Pedidos (Cozinha em Tempo Real):**
   - Atualização automática da lista de pedidos sem atualizar a página.
   - **Alerta sonoro em loop (som de notificação)** disparado ao entrar um novo pedido, que só silencia após o clique em "Aceitar Pedido".
   - Botão para avançar o status do pedido com 1 clique.
   - Botão **Imprimir Comanda** formatado para impressora térmica.
   - Dropdown para atribuir o Motoboy responsável por cada entrega (para controle interno).
   - Link rápido para disparar confirmação via WhatsApp para o cliente.

3. **Configurações da Loja:**
   - **Cardápio:** Cadastro, edição e remoção de Produtos, Categorias e Etapas/Adicionais.
   - **Bairros:** Cadastro de bairros e suas taxas fixas de entrega.
   - **Entregadores:** Cadastro de motoboys da loja.
   - **Pagamento:** Campo para cadastrar a Chave PIX da loja.

---

### C. Visão do Super Admin / Master (`/master`)
- Painel para a dona da plataforma gerenciar e criar novas lojas.
- **Funcionalidades:**
  - Cadastrar nova loja (Nome, Slug da URL, Logo, Cor Principal e Chave PIX).
  - Criar contas de e-mail e senha para os administradores das lojas.
  - Ativar ou suspender lojas na plataforma.

---

## 4. Modelagem do Banco de Dados (Supabase PostgreSQL)

Todas as tabelas contêm a referência `store_id` para garantir o isolamento absoluto entre as marcas:

- **`stores`**: `id`, `name`, `slug`, `logo_url`, `primary_color`, `pix_key`, `active`, `created_at`
- **`store_users`**: `id`, `user_id`, `store_id`, `role` (admin / master)
- **`categories`**: `id`, `store_id`, `name`, `order`, `active`
- **`products`**: `id`, `store_id`, `category_id`, `name`, `description`, `price`, `image_url`, `active`
- **`product_options`**: `id`, `store_id`, `product_id`, `title`, `min_choices`, `max_choices`
- **`option_items`**: `id`, `option_id`, `name`, `price`
- **`neighborhoods`**: `id`, `store_id`, `name`, `delivery_fee`
- **`couriers`**: `id`, `store_id`, `name`, `phone`, `active`
- **`orders`**: `id`, `store_id`, `customer_name`, `customer_phone`, `order_type`, `address`, `neighborhood_id`, `payment_method`, `change_for`, `status`, `total_amount`, `courier_id`, `created_at`
- **`order_items`**: `id`, `order_id`, `product_id`, `quantity`, `unit_price`, `observation`, `options_selected_json`

---

## 5. Instruções para o Cursor Agent
1. Crie a estrutura de arquivos e diretórios do Next.js utilizando o App Router (`/app`) e Tailwind CSS.
2. Crie a camada do cliente do Supabase (`lib/supabase/client.ts` e `server.ts`).
3. Configure as rotas dinâmicas:
   - `/[storeSlug]/page.tsx` (Cardápio da loja)
   - `/[storeSlug]/checkout/page.tsx` (Checkout)
   - `/[storeSlug]/status/[orderId]/page.tsx` (Tracking)
   - `/[storeSlug]/admin/page.tsx` (Painel KDS da loja)
   - `/master/page.tsx` (Painel Master)
4. Implemente o alerta de áudio em loop (Web Audio API) no Painel KDS da loja.
5. Crie a folha de estilo de impressão térmica `@media print` para a comanda de 80mm.
6.