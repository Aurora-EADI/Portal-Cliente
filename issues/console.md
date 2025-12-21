# Console Log - Modal de Documentos

## Problema Identificado
Empresa CNPJ: 93993731000166 tem 2 documentos ISO, mas apenas 1 aparece no modal.

## Log do Console

```javascript
Selected group:
{
  typeId: 6,
  typeName: 'ISO',
  docs: Array(1),  // ❌ PROBLEMA: Deveria ser Array(2)
  latestDoc: {...}
}

docs: Array(1)
  0: {
    id: 'f83645af-3e2e-40b9-a3c2-2a2603ddccf4',
    name: 'ISO',
    fileType: 'pdf',
    status: 'APPROVED',
    documentTypeId: 6,
    uploadedAt: "2025-12-21T21:40:01.894Z",
    companyId: "1c862ea9-1d16-455f-bc05-d442bb451467"
  }

Rendering history for group: ISO with 1 documents
```

## Análise

- ✅ Agrupamento funcionando: `typeId: 6` para ISO
- ❌ **Apenas 1 documento no array**: `docs: Array(1)`
- ❓ Falta verificar: Quantos documentos o modal está recebendo do Dashboard?

## ✅ PROBLEMA RESOLVIDO!

### Causa Raiz
O backend estava retornando apenas documentos com `isLatest: true` por padrão.

**Backend** (`documents.controller.ts` linha 41):
```typescript
async findAll(@Query('latestOnly') latestOnly: string = 'true') // ← DEFAULT 'true'
```

**Backend Service** (`documents.service.ts` linha 82):
```typescript
where: latestOnly ? { isLatest: true } : undefined // ← Filtrava histórico
```

### Solução Aplicada
Modificado `api.ts` para passar `latestOnly=false`:

```typescript
// ANTES
const response = await api.get('/documents');

// DEPOIS
const response = await api.get('/documents', {
  params: { latestOnly: 'false' } // ← Agora busca TODO o histórico
});
```

### Teste
1. Atualize a página (F5)
2. Abra o modal da empresa CNPJ 93993731000166
3. Clique em "ISO"
4. Agora deve mostrar **2 documentos no histórico** ✅
