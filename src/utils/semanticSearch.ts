import { Customer, Product, Sale } from '../types';

/**
 * Remove accents/diacritics and convert to lowercase trimmed text
 */
export function normalizeText(text: string = ''): string {
  return text
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim();
}

/**
 * Clean alphanumeric string (useful for documents, phones, barcodes)
 */
export function cleanAlphanumeric(text: string = ''): string {
  return text.replace(/[^a-zA-Z0-9]/g, '').toLowerCase();
}

/**
 * Levenshtein Distance for typo tolerance
 */
export function levenshteinDistance(a: string, b: string): number {
  if (a === b) return 0;
  if (!a.length) return b.length;
  if (!b.length) return a.length;

  const row = Array.from({ length: b.length + 1 }, (_, i) => i);

  for (let i = 1; i <= a.length; i++) {
    let prev = i;
    for (let j = 1; j <= b.length; j++) {
      const val = a[i - 1] === b[j - 1] ? row[j - 1] : Math.min(row[j - 1], row[j], prev) + 1;
      row[j - 1] = prev;
      prev = val;
    }
    row[b.length] = prev;
  }

  return row[b.length];
}

/**
 * Test whether token matches a target token partially or with minor typo tolerance
 */
export function matchesTokenFuzzy(token: string, targetToken: string): boolean {
  if (targetToken.includes(token)) return true;
  if (token.includes(targetToken) && targetToken.length >= 3) return true;

  // Typo tolerance
  if (token.length >= 4 && targetToken.length >= 4) {
    const maxDiff = token.length >= 7 ? 2 : 1;
    if (Math.abs(token.length - targetToken.length) <= maxDiff) {
      if (levenshteinDistance(token, targetToken) <= maxDiff) {
        return true;
      }
    }
  }

  return false;
}

// Semantic intents and category synonyms dictionary
const SEMANTIC_PRODUCT_INTENTS = {
  // Stock availability intents
  outOfStock: ['sem estoque', 'esgotado', 'zerado', 'acabou', 'falta', 'zerados', 'sem produto'],
  lowStock: ['baixo estoque', 'pouco estoque', 'acabando', 'minimo', 'mínimo', 'critico', 'crítico', 'repor'],
  inStock: ['em estoque', 'disponivel', 'disponível', 'com estoque', 'tem'],

  // Price intents
  cheap: ['barato', 'mais barato', 'menor preco', 'menor preço', 'economico', 'econômico', 'promocao', 'promoção', 'oferta'],
  expensive: ['caro', 'mais caro', 'maior preco', 'maior preço', 'premium'],

  // Category & topic synonyms
  beverages: {
    intentWords: ['bebida', 'refri', 'refrigerante', 'gelada', 'gelado', 'cerveja', 'breja', 'suco', 'agua', 'água', 'energetico', 'energético', 'cha', 'chá', 'leite', 'vinho', 'destilado', 'whisky', 'vodka', 'copo', 'lata', 'garrafa', 'fardo', 'long neck'],
    relatedTerms: ['bebida', 'refrigerante', 'coca', 'guarana', 'cerveja', 'heineken', 'skol', 'brahma', 'agua', 'suco', 'red bull', 'monster']
  },
  construction: {
    intentWords: ['construcao', 'construção', 'obra', 'reforma', 'ferramenta', 'tinta', 'cimento', 'cano', 'tubo', 'parafuso', 'prego', 'eletrica', 'elétrica', 'hidraulica', 'hidráulica', 'fio', 'cabo', 'disjuntor', 'tomada', 'lampada', 'lâmpada', 'led', 'chave', 'alicate', 'martelo', 'areia', 'pedra', 'tijolo', 'argamassa', 'pincel', 'rolo'],
    relatedTerms: ['tinta', 'construcao', 'ferramenta', 'cimento', 'cano', 'parafuso', 'prego', 'fio', 'suvinil', 'coral', 'quartzolit', 'tigre', 'amanco']
  },
  safety: {
    intentWords: ['seguranca', 'segurança', 'epi', 'protecao', 'proteção', 'luva', 'bota', 'capacete', 'oculos', 'óculos', 'mascara', 'máscara', 'protetor', 'abafador'],
    relatedTerms: ['segurança', 'seguranca', 'epi', 'luva', 'bota', 'capacete', 'óculos', 'máscara']
  },
  cleaning: {
    intentWords: ['limpeza', 'higiene', 'sabao', 'sabão', 'detergente', 'desinfetante', 'vassoura', 'rodo', 'pano', 'saco de lixo', 'papel', 'alcool', 'álcool', 'cloro', 'sanitaria', 'sanitária'],
    relatedTerms: ['limpeza', 'detergente', 'sabao', 'desinfetante', 'ypê', 'veja', 'omo', 'cloro']
  },
  food: {
    intentWords: ['alimento', 'comida', 'doce', 'salgado', 'snack', 'biscoito', 'bolacha', 'chocolate', 'bala', 'chiclete', 'salgadinho', 'cafe', 'café', 'acucar', 'açúcar', 'arroz', 'feijao', 'feijão', 'oleo', 'óleo'],
    relatedTerms: ['alimento', 'comida', 'snack', 'chocolate', 'biscoito', 'café', 'arroz']
  }
};

/**
 * Filter and Rank products using Partial, Token, and Semantic Intent matching
 */
export function filterAndRankProducts(
  products: Product[],
  searchQuery: string,
  categoryFilter?: string
): Product[] {
  const normQuery = normalizeText(searchQuery);
  const cleanNumericQuery = cleanAlphanumeric(searchQuery);

  // Apply category filter if provided
  let pool = products;
  if (categoryFilter && categoryFilter !== 'all') {
    pool = pool.filter((p) => p.category === categoryFilter);
  }

  if (!normQuery) {
    return [...pool].sort((a, b) => a.name.localeCompare(b.name, 'pt-BR', { sensitivity: 'base' }));
  }

  // 1. Detect explicit Stock Intent
  const isOutOfStockIntent = SEMANTIC_PRODUCT_INTENTS.outOfStock.some((w) => normQuery.includes(normalizeText(w)));
  const isLowStockIntent = SEMANTIC_PRODUCT_INTENTS.lowStock.some((w) => normQuery.includes(normalizeText(w)));
  const isInStockIntent = SEMANTIC_PRODUCT_INTENTS.inStock.some((w) => normQuery.includes(normalizeText(w)));

  // 2. Detect Price Intent
  const isCheapIntent = SEMANTIC_PRODUCT_INTENTS.cheap.some((w) => normQuery.includes(normalizeText(w)));
  const isExpensiveIntent = SEMANTIC_PRODUCT_INTENTS.expensive.some((w) => normQuery.includes(normalizeText(w)));

  // Filter by stock intent if strictly querying stock intent without other terms
  const queryTokens = normQuery.split(/\s+/).filter(Boolean);

  // Score each product
  const scoredProducts: Array<{ product: Product; score: number }> = [];

  for (const product of pool) {
    let score = 0;
    const normName = normalizeText(product.name);
    const normCode = normalizeText(product.code);
    const normBarcode = normalizeText(product.barcode);
    const cleanBarcode = cleanAlphanumeric(product.barcode);
    const normCategory = normalizeText(product.category);
    const normDesc = normalizeText(product.description || '');

    const nameTokens = normName.split(/\s+/).filter(Boolean);
    const catTokens = normCategory.split(/\s+/).filter(Boolean);

    // Stock intent alignment
    if (isOutOfStockIntent) {
      if (product.stock <= 0) score += 60;
      else if (queryTokens.length <= 2) continue; // Skip if user specifically asked for out-of-stock
    }
    if (isLowStockIntent) {
      if (product.stock > 0 && product.stock <= product.minStock) score += 60;
      else if (queryTokens.length <= 2) continue;
    }
    if (isInStockIntent) {
      if (product.stock > 0) score += 30;
      else if (queryTokens.length <= 2) continue;
    }

    // Exact barcode / code match
    if (normBarcode === normQuery || (cleanNumericQuery && cleanBarcode === cleanNumericQuery)) {
      score += 200;
    } else if (normCode === normQuery || normCode.endsWith(normQuery)) {
      score += 150;
    } else if (cleanBarcode && cleanNumericQuery && cleanBarcode.includes(cleanNumericQuery)) {
      score += 100;
    }

    // Whole query contained in name
    if (normName.includes(normQuery)) {
      score += 80;
      if (normName.startsWith(normQuery)) score += 30;
    }

    // Whole query contained in category or description
    if (normCategory.includes(normQuery)) {
      score += 50;
    }
    if (normDesc.includes(normQuery)) {
      score += 30;
    }

    // Token by token matching (partial match)
    let matchedTokenCount = 0;
    for (const token of queryTokens) {
      // Skip pure intent words that are handled separately
      if (['sem', 'estoque', 'baixo', 'com', 'mais', 'menor', 'maior', 'preco'].includes(token)) {
        continue;
      }

      let tokenMatched = false;

      // Check name tokens
      for (const nTok of nameTokens) {
        if (matchesTokenFuzzy(token, nTok)) {
          score += 25;
          tokenMatched = true;
          break;
        }
      }

      // Check code or barcode partial
      if (!tokenMatched && (normCode.includes(token) || normBarcode.includes(token))) {
        score += 30;
        tokenMatched = true;
      }

      // Check category tokens
      if (!tokenMatched) {
        for (const cTok of catTokens) {
          if (matchesTokenFuzzy(token, cTok)) {
            score += 20;
            tokenMatched = true;
            break;
          }
        }
      }

      // Check description
      if (!tokenMatched && normDesc.includes(token)) {
        score += 15;
        tokenMatched = true;
      }

      // Check semantic concepts & synonyms
      if (!tokenMatched) {
        for (const concept of Object.values(SEMANTIC_PRODUCT_INTENTS)) {
          if ('intentWords' in concept && 'relatedTerms' in concept) {
            const hasIntentWord = concept.intentWords.some((iw) => matchesTokenFuzzy(token, normalizeText(iw)));
            if (hasIntentWord) {
              const matchesConcept = concept.relatedTerms.some((rt) =>
                normName.includes(normalizeText(rt)) || normCategory.includes(normalizeText(rt))
              );
              if (matchesConcept) {
                score += 35;
                tokenMatched = true;
                break;
              }
            }
          }
        }
      }

      if (tokenMatched) {
        matchedTokenCount++;
      }
    }

    // Require matching if query has meaningful tokens
    const meaningfulTokens = queryTokens.filter(
      (t) => !['sem', 'estoque', 'baixo', 'com', 'mais', 'menor', 'maior', 'preco'].includes(t)
    );

    if (meaningfulTokens.length > 0 && matchedTokenCount === 0 && !isOutOfStockIntent && !isLowStockIntent) {
      continue;
    }

    if (score > 0) {
      scoredProducts.push({ product, score });
    }
  }

  // Sort results
  if (isCheapIntent) {
    scoredProducts.sort(
      (a, b) =>
        a.product.sellPrice - b.product.sellPrice ||
        b.score - a.score ||
        a.product.name.localeCompare(b.product.name, 'pt-BR', { sensitivity: 'base' })
    );
  } else if (isExpensiveIntent) {
    scoredProducts.sort(
      (a, b) =>
        b.product.sellPrice - a.product.sellPrice ||
        b.score - a.score ||
        a.product.name.localeCompare(b.product.name, 'pt-BR', { sensitivity: 'base' })
    );
  } else {
    scoredProducts.sort(
      (a, b) =>
        b.score - a.score ||
        a.product.name.localeCompare(b.product.name, 'pt-BR', { sensitivity: 'base' })
    );
  }

  return scoredProducts.map((sp) => sp.product);
}

/**
 * Filter and Rank sales using partial code, customer, items, and payment/status intent
 */
export function filterAndRankSales(sales: Sale[], searchQuery: string): Sale[] {
  const normQuery = normalizeText(searchQuery);
  const cleanNumericQuery = cleanAlphanumeric(searchQuery);

  if (!normQuery) {
    return sales;
  }

  const queryTokens = normQuery.split(/\s+/).filter(Boolean);

  // Intent detection for payment methods
  const isPixIntent = ['pix', 'qrcode', 'qr code', 'chave pix'].some((w) => normQuery.includes(w));
  const isMoneyIntent = ['dinheiro', 'especie', 'espécie', 'a vista', 'à vista', 'cash'].some((w) => normQuery.includes(w));
  const isCreditIntent = ['credito', 'crédito', 'cartao de credito', 'cartão de crédito', 'parcelado'].some((w) => normQuery.includes(w));
  const isDebitIntent = ['debito', 'débito', 'cartao de debito', 'cartão de débito'].some((w) => normQuery.includes(w));
  const isCardIntent = ['cartao', 'cartão', 'maquininha'].some((w) => normQuery.includes(w));
  const isCreditAccountIntent = ['fiado', 'conta', 'crediario', 'crediário', 'a prazo'].some((w) => normQuery.includes(w));

  // Intent detection for status
  const isCompletedIntent = ['concluida', 'concluída', 'concluido', 'concluído', 'efetivada', 'sucesso', 'paga'].some((w) => normQuery.includes(w));
  const isCancelledIntent = ['cancelada', 'cancelado', 'estornada', 'estornado', 'anulada'].some((w) => normQuery.includes(w));
  const isRefundedIntent = ['reembolsada', 'reembolsado', 'devolvida', 'devolvido', 'estorno', 'devolucao', 'devolução'].some((w) => normQuery.includes(w));
  const isDiscountIntent = ['desconto', 'com desconto', 'promocao', 'promoção', 'abatimento'].some((w) => normQuery.includes(w));

  const scoredSales: Array<{ sale: Sale; score: number }> = [];

  for (const sale of sales) {
    let score = 0;
    const normCode = normalizeText(sale.code);
    const cleanSaleCode = cleanAlphanumeric(sale.code);
    const normCustomerName = normalizeText(sale.customerName || '');
    const cleanCustomerDoc = cleanAlphanumeric(sale.customerDocument || '');
    const normOperator = normalizeText(sale.operatorName || '');

    // 1. Direct Code / ID Match
    if (normCode === normQuery || cleanSaleCode === cleanNumericQuery) {
      score += 200;
    } else if (normCode.includes(normQuery) || (cleanNumericQuery && cleanSaleCode.includes(cleanNumericQuery))) {
      score += 100;
    }

    // 2. Customer Match
    if (normCustomerName.includes(normQuery)) {
      score += 80;
    }
    if (cleanNumericQuery && cleanCustomerDoc.includes(cleanNumericQuery)) {
      score += 90;
    }

    // 3. Operator Match
    if (normOperator.includes(normQuery)) {
      score += 50;
    }

    // 4. Products inside Sale match
    const matchedItem = sale.items.some((item) => {
      const normItemName = normalizeText(item.productName);
      const cleanItemBarcode = cleanAlphanumeric(item.barcode);
      const normItemCode = normalizeText(item.productCode);
      return (
        normItemName.includes(normQuery) ||
        (cleanNumericQuery && cleanItemBarcode.includes(cleanNumericQuery)) ||
        normItemCode.includes(normQuery) ||
        queryTokens.some((t) => normItemName.includes(t))
      );
    });

    if (matchedItem) {
      score += 70;
    }

    // 5. Payment method intent match
    if (isPixIntent && sale.paymentMethod === 'pix') score += 60;
    if (isMoneyIntent && sale.paymentMethod === 'money') score += 60;
    if (isCreditIntent && sale.paymentMethod === 'credit') score += 60;
    if (isDebitIntent && sale.paymentMethod === 'debit') score += 60;
    if (isCardIntent && (sale.paymentMethod === 'credit' || sale.paymentMethod === 'debit')) score += 50;
    if (isCreditAccountIntent && sale.paymentMethod === 'credit_account') score += 60;

    // 6. Status intent match
    if (isCompletedIntent && sale.status === 'completed') score += 50;
    if (isCancelledIntent && (sale.status === 'cancelled' || sale.status === 'refunded')) score += 50;
    if (isRefundedIntent && sale.status === 'refunded') score += 60;

    // 7. Discount intent match
    if (isDiscountIntent && sale.discount > 0) score += 60;

    // 8. Partial token matching for multi-word queries
    for (const token of queryTokens) {
      if (normCode.includes(token)) score += 20;
      if (normCustomerName.includes(token)) score += 20;
      if (normOperator.includes(token)) score += 15;
    }

    if (score > 0) {
      scoredSales.push({ sale, score });
    }
  }

  scoredSales.sort((a, b) => b.score - a.score);
  return scoredSales.map((s) => s.sale);
}

/**
 * Filter and Rank customers with partial document, phone, name and intent
 */
export function filterAndRankCustomers(customers: Customer[], searchQuery: string): Customer[] {
  const normQuery = normalizeText(searchQuery);
  const cleanNumericQuery = cleanAlphanumeric(searchQuery);

  if (!normQuery) {
    return customers;
  }

  const isBuyersIntent = ['comprador', 'compradores', 'compra', 'ativo', 'com compras'].some((w) => normQuery.includes(w));
  const isDebtorIntent = ['saldo', 'devedor', 'devendo', 'conta', 'aberto', 'pendente'].some((w) => normQuery.includes(w));

  const scoredCustomers: Array<{ customer: Customer; score: number }> = [];

  for (const customer of customers) {
    let score = 0;
    const normName = normalizeText(customer.name);
    const cleanDoc = cleanAlphanumeric(customer.document);
    const cleanPhone = cleanAlphanumeric(customer.phone);
    const normEmail = normalizeText(customer.email || '');
    const normAddress = normalizeText(customer.address || '');

    // Name match
    if (normName.includes(normQuery)) {
      score += 80;
      if (normName.startsWith(normQuery)) score += 30;
    }

    // Document match (dots/slashes ignored)
    if (cleanNumericQuery && cleanDoc.includes(cleanNumericQuery)) {
      score += 100;
    }

    // Phone match (parentheses/dashes ignored)
    if (cleanNumericQuery && cleanPhone.includes(cleanNumericQuery)) {
      score += 90;
    }

    // Email match
    if (normEmail.includes(normQuery)) {
      score += 60;
    }

    // Address / City match
    if (normAddress.includes(normQuery)) {
      score += 40;
    }

    // Intents
    if (isBuyersIntent && customer.purchasesCount > 0) score += 50;
    if (isDebtorIntent && (customer.outstandingBalance || 0) > 0) score += 60;

    // Token matching
    const queryTokens = normQuery.split(/\s+/).filter(Boolean);
    for (const token of queryTokens) {
      if (normName.includes(token)) score += 15;
    }

    if (score > 0) {
      scoredCustomers.push({ customer, score });
    }
  }

  scoredCustomers.sort((a, b) => b.score - a.score);
  return scoredCustomers.map((c) => c.customer);
}
