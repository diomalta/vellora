// Derive the committed fixture data (fixtures/<id>/data*.json) from fidelity/corpus/inputs/*.json.
// Everything a validator can recompute (check digits, barcode, linha digitavel, bar geometry,
// totals) is computed here, so a hand edit to data.json is caught by the drift test.
import {
  composeBarcode,
  fatorVencimento,
  linhaDigitavel,
  validateLinha,
  valorField,
} from "./boleto.mjs";
import { cnpjCheckDigits, cpfCheckDigits, sigcbDv } from "./check-digits.mjs";
import { code128cPattern, code128cValues } from "./code128c.mjs";
import { itfElements, itfNarrowForLength } from "./itf.mjs";
import { composeChave, formatChave } from "./nfe.mjs";

/** CSS px in mm (1 px = 1/96 in, CSS Values 4 section 6.2). */
export const PX_MM = 25.4 / 96;

/** 1234567 centavos -> "12.345,67" (pt-BR grouping, no Intl so output never depends on ICU). */
export function brl(centavos) {
  const negative = centavos < 0;
  const abs = Math.abs(centavos);
  const units = String(Math.floor(abs / 100)).replace(/\B(?=(\d{3})+(?!\d))/g, ".");
  const cents = String(abs % 100).padStart(2, "0");
  return `${negative ? "-" : ""}${units},${cents}`;
}

export function dateBR(iso) {
  const [y, m, d] = iso.split("-");
  return `${d}/${m}/${y}`;
}

export function formatCnpj(d) {
  return `${d.slice(0, 2)}.${d.slice(2, 5)}.${d.slice(5, 8)}/${d.slice(8, 12)}-${d.slice(12)}`;
}

export function formatCpf(d) {
  return `${d.slice(0, 3)}.${d.slice(3, 6)}.${d.slice(6, 9)}-${d.slice(9)}`;
}

function enderecoLinha(e) {
  const comp = e.complemento ? `, ${e.complemento}` : "";
  return `${e.logradouro}, ${e.numero}${comp} — ${e.bairro}`;
}

/** ITF elements -> [{ w, k }] for the template; k is "b" (bar) or "s" (space). */
function itfTemplateElements(digits, geometry) {
  const elements = itfElements(digits);
  if (geometry.unit === "mm") {
    const narrow = itfNarrowForLength(digits.length, geometry.lengthMm, geometry.ratio);
    const fmt = (v) => `${v.toFixed(geometry.decimals)}mm`;
    return {
      narrowMm: Number(narrow.toFixed(geometry.decimals)),
      wideMm: Number((narrow * geometry.ratio).toFixed(geometry.decimals)),
      elements: elements.map((e, i) => ({
        w: fmt(e === "w" ? narrow * geometry.ratio : narrow),
        k: i % 2 === 0 ? "b" : "s",
      })),
    };
  }
  return {
    narrowMm: Number((geometry.narrowPx * PX_MM).toFixed(4)),
    wideMm: Number((geometry.widePx * PX_MM).toFixed(4)),
    elements: elements.map((e, i) => ({
      w: `${e === "w" ? geometry.widePx : geometry.narrowPx}px`,
      k: i % 2 === 0 ? "b" : "s",
    })),
  };
}

/** Width string ("0.2543mm" / "3px") -> mm. */
export function widthToMm(w) {
  if (w.endsWith("mm")) {
    return Number(w.slice(0, -2));
  }
  if (w.endsWith("px")) {
    return Number(w.slice(0, -2)) * PX_MM;
  }
  throw new RangeError(`unsupported width ${w}`);
}

export function buildBoleto(inputs, geometryKey) {
  const geometry = inputs.barcodeGeometry[geometryKey];
  if (!geometry) {
    throw new RangeError(`unknown geometry ${geometryKey}`);
  }
  const t = inputs.titulo;
  const b = inputs.beneficiario;
  const cnpj = `${b.cnpjBase}${cnpjCheckDigits(b.cnpjBase)}`;
  const cpf = `${inputs.pagador.cpfBase}${cpfCheckDigits(inputs.pagador.cpfBase)}`;
  // Caixa 67.119 v014: codigo do beneficiario DV (Anexo VI), nosso numero XY + 15 livres (4.2.4.6)
  // with its DV (Anexo IV), campo livre layout (4.2.10.1.1) and its DV (Anexo III).
  const dvBeneficiario = sigcbDv(b.codigo);
  const nn = `${t.tipoCobranca}${t.emissao}${t.nossoNumeroLivre}`;
  if (nn.length !== 17) {
    throw new RangeError("nosso numero must be 17 digits");
  }
  const dvNossoNumero = sigcbDv(nn);
  const campoLivre24 = `${b.codigo}${dvBeneficiario}${nn.slice(2, 5)}${nn[0]}${nn.slice(5, 8)}${nn[1]}${nn.slice(8, 17)}`;
  const campoLivre = `${campoLivre24}${sigcbDv(campoLivre24)}`;
  const fator = fatorVencimento(t.vencimento);
  const barcode = composeBarcode({
    banco: inputs.banco.codigo,
    moeda: "9",
    fator,
    valor: valorField(t.valorCentavos),
    campoLivre,
  });
  const linha = linhaDigitavel(barcode);
  const linhaCheck = validateLinha(linha.formatted);
  if (!linhaCheck.ok || linhaCheck.barcode !== barcode) {
    throw new Error("internal: linha digitavel does not round-trip to the barcode");
  }
  const demonstrativoTotal = inputs.demonstrativo.reduce((s, d) => s + d.valorCentavos, 0);
  if (demonstrativoTotal !== t.valorCentavos) {
    throw new Error(`demonstrativo sums to ${demonstrativoTotal}, titulo is ${t.valorCentavos}`);
  }
  const itf = itfTemplateElements(barcode, geometry);
  const lengthMm = itf.elements.reduce((s, e) => s + widthToMm(e.w), 0);
  return {
    _generated: `DERIVED by fidelity/corpus/build-fixtures.mjs from fidelity/corpus/inputs/boleto-febraban.json (geometry: ${geometryKey}). Do not edit.`,
    banco: {
      identificacao: inputs.banco.identificacao,
      codigoCompensacao: `${inputs.banco.codigo}-${inputs.banco.dvCompensacao}`,
    },
    beneficiario: {
      nome: b.nome,
      cnpj: formatCnpj(cnpj),
      enderecoLinha: enderecoLinha(b.endereco),
      cidadeUfCep: `${b.endereco.cidade} / ${b.endereco.uf} — CEP ${b.endereco.cep}`,
      agenciaCodigo: `${b.agencia} / ${b.codigo}-${dvBeneficiario}`,
    },
    pagador: {
      nome: inputs.pagador.nome,
      cpf: formatCpf(cpf),
      enderecoLinha: enderecoLinha(inputs.pagador.endereco),
      cidadeUfCep: `${inputs.pagador.endereco.cidade} / ${inputs.pagador.endereco.uf} — CEP ${inputs.pagador.endereco.cep}`,
    },
    titulo: {
      nossoNumero: `${nn.slice(0, 2)}/${nn.slice(2)}-${dvNossoNumero}`,
      numeroDocumento: t.numeroDocumento,
      especie: t.especie,
      aceite: t.aceite,
      dataDocumento: dateBR(t.dataDocumento),
      dataProcessamento: dateBR(t.dataProcessamento),
      vencimento: dateBR(t.vencimento),
      valor: brl(t.valorCentavos),
      carteira: t.carteira,
      moeda: t.moeda,
    },
    localPagamento: inputs.localPagamento,
    instrucoes: inputs.instrucoes,
    demonstrativo: inputs.demonstrativo.map((d) => ({
      referencia: d.referencia,
      descricao: d.descricao,
      valor: brl(d.valorCentavos),
    })),
    linhaDigitavel: {
      formatada: linha.formatted,
      campos: linha.formatted.split(" "),
    },
    codigoBarras: {
      digitos: barcode,
      geometria: geometry.label,
      narrowMm: itf.narrowMm,
      wideMm: itf.wideMm,
      lengthMm: Number(lengthMm.toFixed(4)),
      heightMm: 13,
      elementos: itf.elements,
    },
    expected: {
      barcodeDigits: barcode,
      linhaDigits: linha.digits,
      dvGeral: Number(barcode[4]),
      fatorVencimento: fator,
      vencimentoIso: t.vencimento,
      valorCentavos: t.valorCentavos,
      campoLivre,
      dvCampoLivre: Number(campoLivre[24]),
      dvBeneficiario,
      dvNossoNumero,
    },
  };
}

/** Deterministic 32-bit LCG (Numerical Recipes constants); never Math.random (determinism rule). */
function lcg(seed) {
  let state = seed >>> 0;
  return () => {
    state = (Math.imul(state, 1664525) + 1013904223) >>> 0;
    return state / 2 ** 32;
  };
}

/** Statement histories that are credits; every other history is a debit. */
const CREDIT_HISTORY = /^(PIX recebido|Rendimento|Estorno|Depósito)/;

/** U+2212 minus for negative amounts, so text extraction must preserve a non-ASCII sign. */
function signed(centavos) {
  return centavos < 0 ? `−${brl(-centavos)}` : brl(centavos);
}

export function buildStatement(inputs) {
  const rand = lcg(inputs.seed);
  let saldo = inputs.saldoInicialCentavos;
  let totalDebitos = 0;
  let totalCreditos = 0;
  let rows = 0;
  const meses = inputs.meses.map((nome, m) => {
    const lancamentos = [];
    for (let i = 0; i < inputs.lancamentosPorMes; i++) {
      const dia = 1 + Math.floor(((i + rand()) * 28) / inputs.lancamentosPorMes);
      const historico = inputs.historicos[Math.floor(rand() * inputs.historicos.length)];
      const credito = CREDIT_HISTORY.test(historico);
      // Amounts span 3 orders of magnitude so the right-aligned columns get 1-9 digit widths.
      const valor = Math.round(10 ** (2 + rand() * 4.2));
      if (credito) {
        saldo += valor;
        totalCreditos += valor;
      } else {
        saldo -= valor;
        totalDebitos += valor;
      }
      rows++;
      lancamentos.push({
        data: `${String(dia).padStart(2, "0")}/${String(m + 1).padStart(2, "0")}/2026`,
        historico,
        documento: String(Math.floor(rand() * 1e6)).padStart(6, "0"),
        debito: credito ? "" : signed(-valor),
        credito: credito ? brl(valor) : "",
        saldo: signed(saldo),
      });
    }
    return { nome, saldoMes: signed(saldo), lancamentos };
  });
  return {
    _generated:
      "DERIVED by fidelity/corpus/build-fixtures.mjs from fidelity/corpus/inputs/text-stress-ptbr.json. Do not edit.",
    titular: inputs.titular,
    conta: inputs.conta,
    periodo: `${dateBR(inputs.periodo.inicio)} a ${dateBR(inputs.periodo.fim)}`,
    saldoInicial: signed(inputs.saldoInicialCentavos),
    meses,
    totais: {
      debitos: signed(-totalDebitos),
      creditos: brl(totalCreditos),
      saldoFinal: signed(saldo),
    },
    expected: { rows, saldoFinalCentavos: saldo, saldoFinal: signed(saldo) },
  };
}

/** CODE-128C pattern -> template elements with a 1 CSS px module (immune to px snapping). */
function code128TemplateElements(digits) {
  const pattern = code128cPattern(digits);
  return [...pattern].map((run, i) => ({ w: `${run}px`, k: i % 2 === 0 ? "b" : "s" }));
}

function qtd4(q) {
  return `${brl(q * 100)}00`;
}

export function buildDanfe(inputs) {
  const ide = inputs.ide;
  const emitCnpj = `${inputs.emitente.cnpjBase}${cnpjCheckDigits(inputs.emitente.cnpjBase)}`;
  const destCnpj = `${inputs.destinatario.cnpjBase}${cnpjCheckDigits(inputs.destinatario.cnpjBase)}`;
  const transpCnpj = `${inputs.transportador.cnpjBase}${cnpjCheckDigits(inputs.transportador.cnpjBase)}`;
  const aamm = `${ide.dataEmissao.slice(2, 4)}${ide.dataEmissao.slice(5, 7)}`;
  const chave = composeChave({
    cUF: ide.cUF,
    aamm,
    cnpj: emitCnpj,
    mod: ide.mod,
    serie: ide.serie,
    nNF: ide.nNF,
    tpEmis: ide.tpEmis,
    cNF: ide.cNF,
  });
  const aliq = inputs.aliquotaIcms;
  const itens = inputs.itens.map((it) => {
    const vProd = it.qtd * it.vUnCentavos;
    const vIcms = Math.round((vProd * aliq) / 100);
    const vIpi = Math.round((vProd * it.aliqIpi) / 100);
    return {
      codigo: it.codigo,
      descricao: it.descricao,
      ncm: it.ncm,
      cst: it.cst,
      cfop: it.cfop,
      un: it.un,
      qtd: qtd4(it.qtd),
      vUn: brl(it.vUnCentavos),
      vTotal: brl(vProd),
      bcIcms: brl(vProd),
      vIcms: brl(vIcms),
      vIpi: brl(vIpi),
      aliqIcms: brl(aliq * 100),
      aliqIpi: brl(it.aliqIpi * 100),
      _c: { vProd, vIcms, vIpi },
    };
  });
  const sum = (k) => itens.reduce((s, it) => s + it._c[k], 0);
  const vProd = sum("vProd");
  const vIcms = sum("vIcms");
  const vIpi = sum("vIpi");
  const vNF = vProd + vIpi;
  let remaining = vNF;
  const duplicatas = inputs.duplicatas.map((d, i) => {
    const v = i === inputs.duplicatas.length - 1 ? remaining : Math.round(vNF * d.fracao);
    remaining -= v;
    return { numero: d.numero, vencimento: dateBR(d.vencimento), valor: brl(v) };
  });
  const nNF9 = ide.nNF.padStart(9, "0");
  const e = inputs.emitente.endereco;
  const de = inputs.destinatario.endereco;
  const tr = inputs.transportador;
  const elements = code128TemplateElements(chave);
  const modules = elements.reduce((s, x) => s + Number(x.w.slice(0, -2)), 0);
  return {
    _generated:
      "DERIVED by fidelity/corpus/build-fixtures.mjs from fidelity/corpus/inputs/danfe.json. Do not edit.",
    chave: { digitos: chave, formatada: formatChave(chave) },
    codigoBarras: {
      simbologia: "CODE-128C",
      moduloPx: 1,
      moduloMm: Number(PX_MM.toFixed(4)),
      modulos: modules,
      lengthMm: Number((modules * PX_MM).toFixed(4)),
      heightMm: 10,
      elementos: elements,
    },
    nf: {
      numero: `${nNF9.slice(0, 3)}.${nNF9.slice(3, 6)}.${nNF9.slice(6)}`,
      serie: ide.serie.padStart(3, "0"),
      tipo: ide.tpNF,
      folha: "1/1",
      naturezaOperacao: ide.naturezaOperacao,
      protocolo: `${ide.protocolo} ${ide.dataHoraAutorizacao}`,
      dataEmissao: dateBR(ide.dataEmissao),
      dataSaida: dateBR(ide.dataSaida),
      horaSaida: ide.horaSaida,
    },
    emitente: {
      razaoSocial: inputs.emitente.razaoSocial,
      enderecoLinha1: `${e.logradouro}, ${e.numero}${e.complemento ? ` — ${e.complemento}` : ""}`,
      enderecoLinha2: `${e.bairro} — ${e.municipio} / ${e.uf} — CEP ${e.cep}`,
      fone: `Fone: ${inputs.emitente.fone}`,
      cnpj: formatCnpj(emitCnpj),
      ie: inputs.emitente.ie,
      ieSt: inputs.emitente.ieSt,
    },
    destinatario: {
      razaoSocial: inputs.destinatario.razaoSocial,
      cnpj: formatCnpj(destCnpj),
      endereco: `${de.logradouro}, ${de.numero}`,
      bairro: de.bairro,
      cep: de.cep,
      municipio: de.municipio,
      uf: de.uf,
      fone: inputs.destinatario.fone,
      ie: inputs.destinatario.ie,
    },
    duplicatas,
    imposto: {
      bcIcms: brl(vProd),
      vIcms: brl(vIcms),
      bcIcmsSt: brl(0),
      vIcmsSt: brl(0),
      vProd: brl(vProd),
      vFrete: brl(0),
      vSeguro: brl(0),
      vDesc: brl(0),
      vOutro: brl(0),
      vIpi: brl(vIpi),
      vNF: brl(vNF),
    },
    transportador: {
      razaoSocial: tr.razaoSocial,
      modFrete: tr.modFrete,
      codigoAntt: tr.codigoAntt,
      placa: tr.placa,
      ufPlaca: tr.ufPlaca,
      cnpj: formatCnpj(transpCnpj),
      endereco: tr.endereco,
      municipio: tr.municipio,
      uf: tr.uf,
      ie: tr.ie,
      volumes: tr.volumes,
    },
    itens: itens.map(({ _c, ...rest }) => rest),
    informacoesComplementares: inputs.informacoesComplementares,
    expected: {
      chaveDigits: chave,
      chaveDv: Number(chave[43]),
      code128Values: code128cValues(chave),
      vProdCentavos: vProd,
      vIcmsCentavos: vIcms,
      vNFCentavos: vNF,
      itemCount: itens.length,
    },
  };
}
