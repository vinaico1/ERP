const prisma = require('../../config/database');
const nfeService = require('./nfe.service');

/**
 * Emite NF-e para um pedido de venda
 * POST /api/nfe/emitir
 */
async function emitir(req, res, next) {
  try {
    const { orderId, paymentMethod } = req.body;

    if (!orderId) {
      return res.status(400).json({ error: 'orderId é obrigatório' });
    }

    // Busca o pedido com itens e cliente
    const order = await prisma.salesOrder.findUnique({
      where: { id: orderId },
      include: {
        items: { include: { product: true } },
        customer: true
      }
    });

    if (!order) {
      return res.status(404).json({ error: 'Pedido não encontrado' });
    }

    if (order.status === 'cancelled') {
      return res.status(400).json({ error: 'Não é possível emitir NF-e para pedido cancelado' });
    }

    // Verifica se já existe NF-e autorizada para este pedido
    const nfeExistente = await prisma.nfeDocument.findFirst({
      where: { orderId, status: { in: ['authorized', 'processing'] } }
    });

    if (nfeExistente) {
      return res.status(409).json({
        error: 'Já existe uma NF-e em processamento ou autorizada para este pedido',
        nfe: nfeExistente
      });
    }

    // Cria registro NF-e com status pending
    const nfeDoc = await prisma.nfeDocument.create({
      data: {
        orderId,
        status: 'processing',
        ambiente: process.env.NFE_AMBIENTE || 'homologacao'
      }
    });

    // Tenta emitir via Focus NFe
    let focusRef, focusResponse;
    try {
      const result = await nfeService.emitirNfe(order, order.customer, paymentMethod || order.paymentMethod);
      focusRef = result.ref;
      focusResponse = result.response;

      // Atualiza com dados do retorno
      let novoStatus = 'processing';
      let chaveAcesso = null;
      let motivoRejeicao = null;
      let urlDanfe = null;
      let protocolo = null;

      if (focusResponse.status === 200 || focusResponse.status === 201) {
        const data = focusResponse.data;
        if (data.status === 'autorizado') {
          novoStatus = 'authorized';
          chaveAcesso = data.chave_nfe;
          urlDanfe = data.caminho_danfe;
          protocolo = data.protocolo;
        } else if (data.status === 'rejeitado' || data.status === 'erro_autorizacao') {
          novoStatus = 'rejected';
          motivoRejeicao = data.mensagem_sefaz || data.erros?.map(e => e.mensagem).join('; ');
        }
      } else if (focusResponse.status === 422) {
        novoStatus = 'rejected';
        motivoRejeicao = JSON.stringify(focusResponse.data);
      }

      await prisma.nfeDocument.update({
        where: { id: nfeDoc.id },
        data: {
          focusNfeRef: focusRef,
          status: novoStatus,
          chaveAcesso,
          urlDanfe,
          protocolo,
          motivoRejeicao,
          xmlRetorno: JSON.stringify(focusResponse.data),
          emitidaEm: novoStatus === 'authorized' ? new Date() : undefined
        }
      });

    } catch (err) {
      // Falha na comunicação com o provider - salva o erro
      await prisma.nfeDocument.update({
        where: { id: nfeDoc.id },
        data: {
          status: 'rejected',
          motivoRejeicao: err.message
        }
      });

      return res.status(502).json({
        error: 'Falha ao comunicar com o serviço de NF-e',
        detail: err.message,
        nfe: nfeDoc
      });
    }

    const nfeAtualizada = await prisma.nfeDocument.findUnique({ where: { id: nfeDoc.id } });

    return res.json({
      message: nfeAtualizada.status === 'authorized'
        ? 'NF-e emitida com sucesso'
        : 'NF-e enviada para processamento',
      nfe: nfeAtualizada
    });

  } catch (err) {
    next(err);
  }
}

/**
 * Consulta status de uma NF-e
 * GET /api/nfe/:id
 */
async function consultar(req, res, next) {
  try {
    const { id } = req.params;

    const nfeDoc = await prisma.nfeDocument.findUnique({
      where: { id },
      include: { order: { include: { customer: true } } }
    });

    if (!nfeDoc) {
      return res.status(404).json({ error: 'NF-e não encontrada' });
    }

    // Se tem ref no Focus NFe, consulta status atualizado
    if (nfeDoc.focusNfeRef && nfeDoc.status === 'processing') {
      try {
        const focusResponse = await nfeService.consultarNfe(nfeDoc.focusNfeRef);
        const data = focusResponse.data;

        let updates = { xmlRetorno: JSON.stringify(data) };

        if (data.status === 'autorizado') {
          updates.status = 'authorized';
          updates.chaveAcesso = data.chave_nfe;
          updates.urlDanfe = data.caminho_danfe;
          updates.protocolo = data.protocolo;
          updates.emitidaEm = new Date();
        } else if (data.status === 'rejeitado' || data.status === 'erro_autorizacao') {
          updates.status = 'rejected';
          updates.motivoRejeicao = data.mensagem_sefaz;
        } else if (data.status === 'cancelado') {
          updates.status = 'cancelled';
          updates.canceladaEm = new Date();
        }

        await prisma.nfeDocument.update({ where: { id }, data: updates });
        Object.assign(nfeDoc, updates);
      } catch (err) {
        // Se falhar ao consultar, retorna o que temos
      }
    }

    return res.json({ data: nfeDoc });
  } catch (err) {
    next(err);
  }
}

/**
 * Lista NF-es de um pedido
 * GET /api/nfe/order/:orderId
 */
async function listarPorPedido(req, res, next) {
  try {
    const { orderId } = req.params;

    const nfes = await prisma.nfeDocument.findMany({
      where: { orderId },
      orderBy: { createdAt: 'desc' }
    });

    return res.json({ data: nfes });
  } catch (err) {
    next(err);
  }
}

/**
 * Cancela uma NF-e
 * POST /api/nfe/:id/cancelar
 */
async function cancelar(req, res, next) {
  try {
    const { id } = req.params;
    const { justificativa } = req.body;

    if (!justificativa || justificativa.length < 15) {
      return res.status(400).json({ error: 'Justificativa deve ter pelo menos 15 caracteres' });
    }

    const nfeDoc = await prisma.nfeDocument.findUnique({ where: { id } });

    if (!nfeDoc) {
      return res.status(404).json({ error: 'NF-e não encontrada' });
    }

    if (nfeDoc.status !== 'authorized') {
      return res.status(400).json({ error: 'Somente NF-e autorizada pode ser cancelada' });
    }

    if (!nfeDoc.focusNfeRef) {
      return res.status(400).json({ error: 'Referência Focus NFe não encontrada' });
    }

    const response = await nfeService.cancelarNfe(nfeDoc.focusNfeRef, justificativa);

    let updates = { xmlRetorno: JSON.stringify(response.data) };
    if (response.status === 200) {
      updates.status = 'cancelled';
      updates.canceladaEm = new Date();
    }

    await prisma.nfeDocument.update({ where: { id }, data: updates });
    const nfeAtualizada = await prisma.nfeDocument.findUnique({ where: { id } });

    return res.json({ message: 'Solicitação de cancelamento enviada', nfe: nfeAtualizada });
  } catch (err) {
    next(err);
  }
}

/**
 * Retorna configurações NF-e (sem dados sensíveis)
 * GET /api/nfe/config
 */
async function getConfig(req, res) {
  return res.json({
    data: {
      configurado: !!process.env.NFE_TOKEN,
      ambiente: process.env.NFE_AMBIENTE || 'homologacao',
      emitente: {
        nome: process.env.NFE_EMITENTE_NOME || '',
        cnpj: process.env.NFE_EMITENTE_CNPJ ? '**configurado**' : '',
        municipio: process.env.NFE_EMITENTE_MUNICIPIO || '',
        uf: process.env.NFE_EMITENTE_UF || ''
      }
    }
  });
}

module.exports = { emitir, consultar, listarPorPedido, cancelar, getConfig };
