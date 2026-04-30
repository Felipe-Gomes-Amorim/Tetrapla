# 🚀 INSTALAR NODE.JS NO WINDOWS

## ⚠️ Problema
```
npm : O termo 'npm' não é reconhecido...
```

**Causa**: Node.js não está instalado no seu computador.

## ✅ Solução (5 minutos)

### Passo 1: Baixar Node.js
1. Abra navegador: **https://nodejs.org/**
2. Clique em versão verde grande **LTS** (18.19.0 ou superior)
3. Arquivo `.msi` vai baixar

### Passo 2: Instalar
1. Clique 2x no arquivo baixado (node-vXX.XX.X-x64.msi)
2. **Next** → **I Agree** → **Next** → **Next** → **Next**
3. ✅ **Install**
4. Aguarde terminar (30 segundos)
5. ✅ **Finish**

### Passo 3: Verificar
1. **Feche PowerShell completamente**
2. Abra **PowerShell NOVO**
3. Digite: `node --version`
4. Digite: `npm --version`

Deve aparecer versões como `v18.19.0` e `10.2.0`

## 🎯 Depois de Instalar

Volte ao terminal e execute:

```powershell
cd c:\Users\felipe\Documents\biblia-app
npm install
npm start
```

---

**Se não funcionar depois de instalar:**
- Reinicie o computador
- Ou procure "Editar variáveis de ambiente" no Windows
- Adicione `C:\Program Files\nodejs` ao PATH

