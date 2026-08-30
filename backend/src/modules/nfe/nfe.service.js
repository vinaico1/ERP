/**
 * NF-e Service - Integração com Focus NFe API
 * Documentação: https://focusnfe.com.br/doc/
 *
 * Para usar em produção configure as variáveis no .env:
 *   NFE_PROVIDER=focusnfe
 *   NFE_TOKEN=seu_token_aqui
 *   NFE_AMBIENTE=homologacao  (ou producao)
 *   NFE_EMITENTE_CNPJ=00000000000000
 *   NFE_EMITENTE_NOME=Sua Empresa Ltda
 *   ... (demais campos do emitente)
 */

const https = require('https');
const http = require('http');

const FOCUS_BASE_URL = {
  homologacao: 'homologacao.focusnfe.com.br',
  producao: 'api.focusnfe.com.br'
};

/**
 * Realiza requisição HTTP para o Focus NFe
 */
function focusRequest(method, path, body, token, ambiente) {
  return new Promise((resolve, reject) => {
    const host = FOCUS_BASE_URL[ambiente] || FOCUS_BASE_URL.homologacao;
    const auth = Buffer.from(`${token}:`).toString('base64');

    const options = {
      hostname: host,
      port: 443,
      path,
      method,
      headers: {
        'Authorization': `Basic ${auth}`,
        'Content-Type': 'application/json'
      }
    };

    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', chunk => { data += chunk; });
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, data: JSON.parse(data) });
        } catch {
          resolve({ status: res.statusCode, data });
        }
      });
    });

    req.on('error', reject);

    if (body) {
      req.write(JSON.stringify(body));
    }
    req.end();
  });
}

/**
 * Monta o objeto NF-e a partir do pedido de venda
 */
function montarNfe(order, emitente, customer, paymentMethod) {
  const ambiente = process.env.NFE_AMBIENTE || 'homologacao';

  // Mapeia forma de pagamento para código NF-e
  const formaPagamentoMap = {
    cash: '01',          // Dinheiro
    credit_card: '03',   // Cartão de Crédito
    debit_card: '04',    // Cartão de Débito
    pix: '17',           // PIX
    mixed: '99'          // Outros
  };

  const formaPagamentoCodigo = formaPagamentoMap[paymentMethod] || '01';

  // Dados do destinatário (cliente)
  const destinatario = {};
  if (customer) {
    destinatario.nome = customer.name;
    destinatario.email = customer.email || undefined;

    if (customer.document) {
      const doc = customer.document.replace(/\D/g, '');
      if (doc.length === 11) {
        destinatario.cpf = doc;
      } else if (doc.length === 14) {
        destinatario.cnpj = doc;
      }
    }

    if (customer.address) {
      destinatario.logradouro = customer.address;
      destinatario.numero = customer.number || 'S/N';
      destinatario.complemento = customer.complement || undefined;
      destinatario.bairro = customer.neighborhood || 'Centro';
      destinatario.municipio = customer.city || 'São Paulo';
      destinatario.uf = customer.state || 'SP';
      destinatario.cep = (customer.zipCode || '').replace(/\D/g, '') || '01310100';
      destinatario.pais = 'Brasil';
    }

    destinatario.indicador_ie_dest = '9'; // Não contribuinte
  } else {
    // Consumidor não informado — venda sem identificação
    destinatario.nome = 'CONSUMIDOR NAO INFORMADO';
    destinatario.cpf = '00000000000';
  }

  // Itens da NF-e
  const itens = order.items.map((item, index) => {
    const product = item.product;
    const ncm = (product.ncm || '84713012').replace(/\D/g, '');

    return {
      numero_item: index + 1,
      codigo_produto: product.code,
      descricao: product.name,
      codigo_ncm: ncm,
      cfop: '5102', // Venda de mercadorias adquiridas ou recebidas de terceiros
      unidade_comercial: product.unit || 'UN',
      quantidade_comercial: item.quantity,
      valor_unitario_comercial: item.unitPrice,
      valor_bruto: item.total,
      unidade_tributavel: product.unit || 'UN',
      quantidade_tributavel: item.quantity,
      valor_unitario_tributavel: item.unitPrice,
      codigo_barras: undefined,
      inclui_no_total: 1,
      icms_origem: 0,
      icms_modalidade: 102,      // CSOSN 102 - Tributada pelo Simples Nacional sem permissão de crédito
      pis_modalidade: '07',      // Operação Isenta da Contribuição
      cofins_modalidade: '07'
    };
  });

  return {
    natureza_operacao: 'VENDA DE MERCADORIAS',
    forma_pagamento: 0,
    modelo: 55,
    serie: process.env.NFE_SERIE || '1',
    numero: undefined, // gerado pela SEFAZ / provider
    data_emissao: new Date().toISOString(),
    data_entrada_saida: new Date().toISOString(),
    tipo_documento: 1, // 1=Saída
    local_destino: 1,  // 1=Operação interna
    finalidade_emissao: 1, // 1=Normal
    consumidor_final: 1,
    presenca_comprador: 1, // 1=Operação presencial

    emitente: {
      cnpj: (process.env.NFE_EMITENTE_CNPJ || '').replace(/\D/g, ''),
      nome: process.env.NFE_EMITENTE_NOME || 'EMPRESA TESTE',
      nome_fantasia: process.env.NFE_EMITENTE_FANTASIA || undefined,
      logradouro: process.env.NFE_EMITENTE_LOGRADOURO || 'Rua Teste',
      numero: process.env.NFE_EMITENTE_NUMERO || '1',
      complemento: process.env.NFE_EMITENTE_COMPLEMENTO || undefined,
      bairro: process.env.NFE_EMITENTE_BAIRRO || 'Centro',
      municipio: process.env.NFE_EMITENTE_MUNICIPIO || 'São Paulo',
      uf: process.env.NFE_EMITENTE_UF || 'SP',
      cep: (process.env.NFE_EMITENTE_CEP || '01310100').replace(/\D/g, ''),
      telefone: (process.env.NFE_EMITENTE_TELEFONE || '').replace(/\D/g, '') || undefined,
      inscricao_estadual: process.env.NFE_EMITENTE_IE || 'ISENTO',
      regime_tributario: parseInt(process.env.NFE_REGIME_TRIBUTARIO || '1') // 1=Simples Nacional
    },

    destinatario,
    itens,

    formas_pagamento: [
      {
        forma_pagamento: formaPagamentoCodigo,
        valor: order.total
      }
    ],

    informacoes_adicionais_contribuinte: `Pedido: ${order.number}. Ambiente: ${ambiente === 'homologacao' ? 'HOMOLOGAÇÃO - SEM VALOR FISCAL' : 'PRODUÇÃO'}`
  };
}

/**
 * Emite uma NF-e via Focus NFe
 */
async function emitirNfe(order, customer, paymentMethod) {
  const token = process.env.NFE_TOKEN;
  const ambiente = process.env.NFE_AMBIENTE || 'homologacao';

  if (!token) {
    throw new Error('NFE_TOKEN não configurado. Configure o token do Focus NFe no .env');
  }

  const emitente = {}; // Dados do emitente vêm das env vars via montarNfe
  const nfeData = montarNfe(order, emitente, customer, paymentMethod);

  // Referência única para a NF-e
  const ref = `pdv_${order.number.replace(/\D/g, '')}_${Date.now()}`;

  const response = await focusRequest(
    'POST',
    `/v2/nfe?ref=${ref}`,
    nfeData,
    token,
    ambiente
  );

  return { ref, response, nfeData };
}

/**
 * Consulta status de uma NF-e pelo ref
 */
async function consultarNfe(ref) {
  const token = process.env.NFE_TOKEN;
  const ambiente = process.env.NFE_AMBIENTE || 'homologacao';

  if (!token) {
    throw new Error('NFE_TOKEN não configurado');
  }

  const response = await focusRequest(
    'GET',
    `/v2/nfe/${ref}`,
    null,
    token,
    ambiente
  );

  return response;
}

/**
 * Cancela uma NF-e
 */
async function cancelarNfe(ref, justificativa) {
  const token = process.env.NFE_TOKEN;
  const ambiente = process.env.NFE_AMBIENTE || 'homologacao';

  if (!token) {
    throw new Error('NFE_TOKEN não configurado');
  }

  const response = await focusRequest(
    'DELETE',
    `/v2/nfe/${ref}`,
    { justificativa },
    token,
    ambiente
  );

  return response;
}

module.exports = { emitirNfe, consultarNfe, cancelarNfe, montarNfe };
