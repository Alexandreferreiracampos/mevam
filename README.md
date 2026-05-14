# Sistema de Controle de Entrada - Versão Simplificada

Um sistema web **super simples** para gerenciar entrada de participantes em eventos. Sem autenticação complexa, sem pagamentos, apenas **Firebase Firestore** para armazenar dados.

## 🚀 Características

- ✅ Login simples (usuário e senha fixos no código)
- ✅ Check-in rápido com busca
- ✅ Importação de CSV
- ✅ Adição de participantes na hora
- ✅ Contadores em tempo real
- ✅ Relatórios e exportação
- ✅ Sem autenticação Firebase
- ✅ Sem métodos de pagamento
- ✅ Interface responsiva

## 📋 Credenciais Padrão

```
Usuário: admin
Senha: 1234
```

**Você pode alterar no arquivo `app.js`** (procure por `VALID_CREDENTIALS`)

## ⚙️ Configuração Rápida

### 1. Criar Projeto Firebase

1. Acesse [firebase.google.com](https://firebase.google.com)
2. Clique em "Ir para console"
3. Clique em "Criar projeto"
4. Digite um nome (ex: "Controle Eventos")
5. Clique em "Criar projeto"

### 2. Ativar Firestore

1. No Firebase Console, clique em **"Firestore Database"**
2. Clique em **"Criar banco de dados"**
3. Escolha **"Modo de teste"** (para desenvolvimento)
4. Escolha a região mais próxima
5. Clique em **"Criar"**

### 3. Configurar Regras de Segurança

1. Na aba **"Regras"** do Firestore, substitua tudo por:

```firestore
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /{document=**} {
      allow read, write: if true;
    }
  }
}
```

2. Clique em **"Publicar"**

⚠️ **Nota:** Estas regras permitem acesso livre. Para produção, restrinja o acesso!

### 4. Obter Credenciais

1. Clique no ícone ⚙️ (engrenagem) no topo esquerdo
2. Clique em **"Configurações do projeto"**
3. Vá para a aba **"Geral"**
4. Role para baixo até **"Seus aplicativos"**
5. Clique em **"Adicionar app"** → **"Web"** (ícone `</>`)
6. Copie o objeto `firebaseConfig`

### 5. Atualizar Credenciais

Abra `firebase-config.js` e substitua:

```javascript
const firebaseConfig = {
  apiKey: "SUA_API_KEY",
  authDomain: "seu-projeto.firebaseapp.com",
  projectId: "seu-projeto",
  storageBucket: "seu-projeto.appspot.com",
  messagingSenderId: "123456789012",
  appId: "1:123456789012:web:abcdef1234567890",
};
```

### 6. Abrir a Aplicação

Abra `index.html` em um navegador (ou use um servidor local):

```bash
# Opção 1: Python
python3 -m http.server 8000

# Opção 2: Node.js
npx http-server

# Depois acesse: http://localhost:8000
```

## 📖 Como Usar

### Login

1. Abra a aplicação
2. Digite: `admin` (usuário) e `1234` (senha)
3. Clique em "Entrar"

### Check-in

1. Clique na aba **"Check-in"**
2. Digite o nome ou ID do participante
3. Clique em "Buscar"
4. Clique em "Dar Baixa" para confirmar entrada

### Adicionar Novo Participante

1. Clique em **"+ Adicionar Novo"**
2. Digite o nome
3. Adicione uma observação (obrigatório)
4. Clique em "Salvar"

### Importar Lista

1. Clique na aba **"Gerenciamento"**
2. Selecione um arquivo CSV
3. Clique em "Importar"

**Formato do CSV:**

```
João Silva, ID001
Maria Santos, ID002
Pedro Oliveira, ID003
```

### Relatório

1. Clique na aba **"Relatório"**
2. Use filtros para buscar
3. Clique em "Exportar CSV" para baixar

## 📁 Arquivos

| Arquivo              | Descrição                |
| -------------------- | ------------------------ |
| `index.html`         | Estrutura HTML           |
| `style.css`          | Estilos e design         |
| `app.js`             | Lógica da aplicação      |
| `firebase-config.js` | Configuração do Firebase |
| `README.md`          | Este arquivo             |

## 🔧 Alterar Credenciais de Login

Abra `app.js` e procure por:

```javascript
const VALID_CREDENTIALS = {
  username: "admin",
  password: "1234",
};
```

Altere para o que desejar.

## 🐛 Troubleshooting

### "Firebase is not defined"

- Verifique se os scripts do Firebase estão carregando
- Abra o console (F12) e procure por erros

### "Permission denied" ao salvar

- Verifique se as regras do Firestore estão corretas
- Certifique-se de que o banco está em "Modo de teste"

### Dados não aparecem

- Verifique a conexão com a internet
- Verifique se o `projectId` está correto em `firebase-config.js`
- Abra o console (F12) e procure por mensagens de erro

## 📝 Estrutura de Dados

Os dados são salvos no Firestore assim:

```
participantes/
├── {doc1}
│   ├── nome: "João Silva"
│   ├── idUnico: "ID123456"
│   ├── origem: "lista_paga"
│   ├── Confirmado: true
│   ├── horaEntrada: 2026-05-13T14:30:00
│   ├── observacao: ""
│   └── idEvento: "evento_padrao"
└── {doc2}
    ├── nome: "Maria Santos"
    ├── idUnico: "ID789012"
    ├── origem: "adicionado_na_hora"
    ├── Confirmado: true
    ├── horaEntrada: 2026-05-13T14:35:00
    ├── observacao: "Pagou na hora"
    └── idEvento: "evento_padrao"
```

## 🎨 Personalização

### Mudar Cores

Abra `style.css` e procure por:

```css
background: linear-gradient(135deg, #4fb9d1 0%, #01606e 100%);
```

### Mudar Título

Abra `index.html` e altere:

```html
<h1>Controle de Entrada de Eventos</h1>
```

## 📱 Responsividade

O sistema funciona perfeitamente em:

- 📱 Smartphones
- 📱 Tablets
- 💻 Desktops

## ⚡ Performance

- Sincronização em tempo real com Firestore
- Sem lag ou atrasos
- Funciona offline (com limitações)

## 🚀 Deploy

Para colocar online, use:

1. **Firebase Hosting** (recomendado)
2. **Netlify**
3. **Vercel**
4. **GitHub Pages**

## 📞 Suporte

Se tiver dúvidas, verifique:

1. O console do navegador (F12)
2. As regras do Firestore
3. A configuração em `firebase-config.js`

## 📄 Licença

Livre para usar e modificar.

---

**Desenvolvido para simplicidade e eficiência!** 🎉
