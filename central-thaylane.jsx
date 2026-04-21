import { useState, useEffect, useRef } from "react";

// ── DADOS ────────────────────────────────────────────────────────────────────

const CHECKLIST = [
  {
    hora: "até 9h30 · camada 1", cor: "#185FA5", bg: "#E6F1FB", badge: "#B5D4F4",
    label: "Meta geral do e-commerce",
    items: [
      { id: "c1", texto: "Faturamento total vs meta geral", hint: "Sem filtro de carteira — visão do time inteiro. Estamos no ritmo ou devendo?" },
      { id: "c2", texto: "Qual carteira está travando o total?", hint: "Se o geral está abaixo, identificar quem está puxando para baixo antes de entrar no detalhe." },
    ]
  },
  {
    hora: "até 9h30 · camada 2", cor: "#27500A", bg: "#EAF3DE", badge: "#C0DD97",
    label: "Eletro — profundidade",
    items: [
      { id: "c3", texto: "Checar matriz de competitividade", hint: "Algum ar ou TV fora de preço? Se sim → aciona o comprador agora." },
      { id: "c4", texto: "Rodar query de top SKUs de eletro", hint: "SQL Developer → query top 10 do dia → compradores 18877, 19364, 29057." },
      { id: "c5", texto: "Tem SKU fora do ar ou com problema?", hint: "Nível de segurança → ERP → mix → atributos → PUBLICA." },
    ]
  },
  {
    hora: "até 9h30 · camada 3", cor: "#534AB7", bg: "#EEEDFE", badge: "#CECBF6",
    label: "Metais — diagnóstico rápido com Amanda",
    items: [
      { id: "c6", texto: "Metais está crescendo vs ano anterior?", hint: "Se não está crescendo → identificar categoria ofensora e acionar Amanda." },
      { id: "c7", texto: "Tem ruptura em metais?", hint: "Checar % indisponíveis. Chuveiros, fechaduras e filtros são os mais críticos." },
      { id: "c8", texto: "Tem SKU ofensor travando a carteira?", hint: "Se sim → acionar Amanda com o SKU e a causa. Se tudo ok → fecha em 1 min." },
    ]
  },
  {
    hora: "até 9h30", cor: "#27500A", bg: "#EAF3DE", badge: "#C0DD97",
    label: "Daily pulse",
    items: [
      { id: "c9", texto: "Mandar daily pulse no Teams", hint: "Foco · risco · número. Antes das 9h30 — esse não pula." },
    ]
  },
  {
    hora: "11h", cor: "#633806", bg: "#FAEEDA", badge: "#FAC775",
    label: "Checagem de meio dia",
    items: [
      { id: "c10", texto: "Faturamento no ritmo?", hint: "Queda > 20% do esperado → aciona comprador da categoria afetada." },
      { id: "c11", texto: "JIRA novo para alimentar?", hint: "Gio avisa no chat. Se tiver → pegar SKU e preço com comprador." },
    ]
  },
  {
    hora: "14h", cor: "#0C6170", bg: "#DDF1F1", badge: "#9FD4D4",
    label: "Monitoramento de share — olhar pra fora",
    items: [
      { id: "c12a", texto: "Comparar preço do SKU Top 1 vs. principal concorrente (Amazon/ML)", hint: "Às 14h em ponto. Se estou ≥ 3% acima → aciona comprador antes do pico da tarde." },
      { id: "c12b", texto: "Checar se algum concorrente rodou promoção relâmpago hoje", hint: "Olhar os 3 top SKUs da carteira. Preço caiu na Amazon/ML sem eu saber? → registra e diagnostica." },
      { id: "c12c", texto: "Se perdi share, o que explica? (preço · estoque · mídia)", hint: "Não leva só o problema — leva a hipótese. É isso que separa jr de pleno." },
    ]
  },
  {
    hora: "14h · camada 4", cor: "#534AB7", bg: "#EEEDFE", badge: "#CECBF6",
    label: "Inteligência de mercado",
    items: [
      { id: "c_im1", texto: "Comparar preço do Top 1 SKU com a Amazon", hint: "Entrar no PDP da Amazon, bater com o nosso. Diferença > 3%? → print + acionar comprador com screenshot." },
      { id: "c_im2", texto: "Frete do concorrente está mais agressivo em Recife?", hint: "CEP PE no checkout deles. Se chega mais rápido ou mais barato → registra no diário, pauta de logística." },
      { id: "c_im3", texto: "Banner da categoria de Beleza está ativo na home?", hint: "Confere home + categoria. Se caiu → aciona MKT direto, não espera o weekly." },
    ]
  },
  {
    hora: "15h", cor: "#791F1F", bg: "#FCEBEB", badge: "#F09595",
    label: "Verificação de emergência",
    items: [
      { id: "c12", texto: "Anúncios Google acima de 100?", hint: "Acima de 100 → acionar mídia antes de perder o fim do dia." },
      { id: "c13", texto: "Concorrência baixou preço em alguma categoria?", hint: "Diagnosticar: preço, estoque ou mídia? → acionar comprador com diagnóstico pronto." },
    ]
  },
  {
    hora: "17h", cor: "#444441", bg: "#F1EFE8", badge: "#D3D1C7",
    label: "Fechamento",
    items: [
      { id: "c14", texto: "Como fechou o dia vs meta?", hint: "Anotar o número — vai para o report de sexta." },
      { id: "c15", texto: "Aconteceu algo para registrar?", hint: "Identifiquei X → agi com Y → resultado Z. Guarda nas evidências." },
    ]
  },
];

const QUERIES = [
  {
    id: "q1", label: "Top 10 do dia", badge: "diário", badgeCor: "#185FA5", badgeBg: "#E6F1FB",
    hint: "Toda manhã antes do daily pulse",
    sql: `SELECT P.CODIGO, P.DESCRICAO,
    ROUND(SUM(I.QUANTIDADE)) AS QTDE,
    ROUND(SUM(I.PRECO * I.QUANTIDADE)) AS VALOR_VENDIDO,
    ROUND(COUNT(DISTINCT I.ID_CARRINHO)) AS PEDIDOS,
    Y.NOME AS COMPRADOR
FROM PROD P
INNER JOIN SFC_CARRINHO_ITEM I ON I.PRODUTO = P.CODIGO
INNER JOIN AGTC Y ON P.COMPRADOR = Y.CODIGO
WHERE I.STATUS_PEDIDO IN (0,251,95,114,14,18,7,13,3,25,71)
  AND TRUNC(I.DT_CRIACAO) = TRUNC(SYSDATE)
  AND Y.CODIGO IN (18877, 19364, 29057)
GROUP BY P.CODIGO, P.DESCRICAO, Y.NOME
ORDER BY VALOR_VENDIDO DESC
FETCH FIRST 10 ROWS ONLY;`
  },
  {
    id: "q2", label: "Faturamento por comprador", badge: "diário", badgeCor: "#185FA5", badgeBg: "#E6F1FB",
    hint: "Qual carteira está puxando ou travando",
    sql: `SELECT Y.NOME AS COMPRADOR,
    ROUND(SUM(I.PRECO * I.QUANTIDADE)) AS VALOR_VENDIDO,
    ROUND(COUNT(DISTINCT I.ID_CARRINHO)) AS PEDIDOS,
    ROUND(COUNT(DISTINCT P.CODIGO)) AS SKUs_DISTINTOS
FROM PROD P
INNER JOIN SFC_CARRINHO_ITEM I ON I.PRODUTO = P.CODIGO
INNER JOIN AGTC Y ON P.COMPRADOR = Y.CODIGO
WHERE I.STATUS_PEDIDO IN (0,251,95,114,14,18,7,13,3,25,71)
  AND TRUNC(I.DT_CRIACAO) = TRUNC(SYSDATE)
  AND Y.CODIGO IN (18877, 19364, 29057)
GROUP BY Y.NOME
ORDER BY VALOR_VENDIDO DESC;`
  },
  {
    id: "q3", label: "Alerta de ruptura", badge: "preventivo", badgeCor: "#A32D2D", badgeBg: "#FCEBEB",
    hint: "SKUs que venderam nos últimos 7 dias mas zeraram hoje",
    sql: `SELECT P.CODIGO, P.DESCRICAO, Y.NOME AS COMPRADOR,
    ROUND(SUM(I.PRECO * I.QUANTIDADE)) AS VALOR_7_DIAS,
    MAX(TRUNC(I.DT_CRIACAO)) AS ULTIMA_VENDA
FROM PROD P
INNER JOIN SFC_CARRINHO_ITEM I ON I.PRODUTO = P.CODIGO
INNER JOIN AGTC Y ON P.COMPRADOR = Y.CODIGO
WHERE I.STATUS_PEDIDO IN (0,251,95,114,14,18,7,13,3,25,71)
  AND TRUNC(I.DT_CRIACAO) BETWEEN TRUNC(SYSDATE)-7 AND TRUNC(SYSDATE)-1
  AND Y.CODIGO IN (18877, 19364, 29057)
  AND P.CODIGO NOT IN (
    SELECT DISTINCT I2.PRODUTO FROM SFC_CARRINHO_ITEM I2
    WHERE I2.STATUS_PEDIDO IN (0,251,95,114,14,18,7,13,3,25,71)
      AND TRUNC(I2.DT_CRIACAO) = TRUNC(SYSDATE)
  )
GROUP BY P.CODIGO, P.DESCRICAO, Y.NOME
ORDER BY VALOR_7_DIAS DESC
FETCH FIRST 15 ROWS ONLY;`
  },
  {
    id: "q4", label: "Top da semana", badge: "semanal", badgeCor: "#854F0B", badgeBg: "#FAEEDA",
    hint: "Toda sexta para o report semanal",
    sql: `SELECT P.CODIGO, P.DESCRICAO, Y.NOME AS COMPRADOR,
    ROUND(SUM(I.QUANTIDADE)) AS QTDE,
    ROUND(SUM(I.PRECO * I.QUANTIDADE)) AS VALOR_VENDIDO,
    ROUND(AVG(I.PRECO), 2) AS PRECO_MEDIO
FROM PROD P
INNER JOIN SFC_CARRINHO_ITEM I ON I.PRODUTO = P.CODIGO
INNER JOIN AGTC Y ON P.COMPRADOR = Y.CODIGO
WHERE I.STATUS_PEDIDO IN (0,251,95,114,14,18,7,13,3,25,71)
  AND TRUNC(I.DT_CRIACAO) >= TRUNC(SYSDATE) - 7
  AND TRUNC(I.DT_CRIACAO) < TRUNC(SYSDATE)
  AND Y.CODIGO IN (18877, 19364, 29057)
GROUP BY P.CODIGO, P.DESCRICAO, Y.NOME
ORDER BY VALOR_VENDIDO DESC
FETCH FIRST 15 ROWS ONLY;`
  },
  {
    id: "q5", label: "Elasticidade de preço (semana vs semana)", badge: "estratégico", badgeCor: "#0C6170", badgeBg: "#DDF1F1",
    hint: "Se o preço caiu 5%, o volume subiu quanto? Leitura de negócio para o comprador",
    sql: `WITH SEMANA_ATUAL AS (
  SELECT P.CODIGO, P.DESCRICAO,
      ROUND(AVG(I.PRECO), 2) AS PRECO,
      ROUND(SUM(I.QUANTIDADE)) AS QTDE
  FROM PROD P
  INNER JOIN SFC_CARRINHO_ITEM I ON I.PRODUTO = P.CODIGO
  INNER JOIN AGTC Y ON P.COMPRADOR = Y.CODIGO
  WHERE I.STATUS_PEDIDO IN (0,251,95,114,14,18,7,13,3,25,71)
    AND TRUNC(I.DT_CRIACAO) >= TRUNC(SYSDATE) - 7
    AND TRUNC(I.DT_CRIACAO) <  TRUNC(SYSDATE)
    AND Y.CODIGO IN (18877, 19364, 29057)
  GROUP BY P.CODIGO, P.DESCRICAO
),
SEMANA_ANT AS (
  SELECT P.CODIGO,
      ROUND(AVG(I.PRECO), 2) AS PRECO,
      ROUND(SUM(I.QUANTIDADE)) AS QTDE
  FROM PROD P
  INNER JOIN SFC_CARRINHO_ITEM I ON I.PRODUTO = P.CODIGO
  INNER JOIN AGTC Y ON P.COMPRADOR = Y.CODIGO
  WHERE I.STATUS_PEDIDO IN (0,251,95,114,14,18,7,13,3,25,71)
    AND TRUNC(I.DT_CRIACAO) >= TRUNC(SYSDATE) - 14
    AND TRUNC(I.DT_CRIACAO) <  TRUNC(SYSDATE) - 7
    AND Y.CODIGO IN (18877, 19364, 29057)
  GROUP BY P.CODIGO
)
SELECT A.CODIGO, A.DESCRICAO,
    B.PRECO AS PRECO_SEM_ANT,
    A.PRECO AS PRECO_SEM_ATUAL,
    ROUND(((A.PRECO - B.PRECO) / B.PRECO) * 100, 2) AS VAR_PRECO_PCT,
    B.QTDE  AS QTDE_SEM_ANT,
    A.QTDE  AS QTDE_SEM_ATUAL,
    ROUND(((A.QTDE  - B.QTDE)  / B.QTDE)  * 100, 2) AS VAR_QTDE_PCT,
    ROUND(
      ((A.QTDE  - B.QTDE)  / B.QTDE) /
      NULLIF((A.PRECO - B.PRECO) / B.PRECO, 0)
    , 2) AS ELASTICIDADE
FROM SEMANA_ATUAL A
INNER JOIN SEMANA_ANT B ON A.CODIGO = B.CODIGO
WHERE B.PRECO > 0
  AND B.QTDE  > 0
  AND A.PRECO <> B.PRECO
ORDER BY A.QTDE DESC
FETCH FIRST 15 ROWS ONLY;`
  },
  {
    id: "q6", label: "Alerta de anomalia (hoje vs média 15d)", badge: "crítico", badgeCor: "#791F1F", badgeBg: "#F09595",
    hint: "SKUs zerados hoje que vendem muito — ou quedas bruscas vs média recente",
    sql: `WITH MEDIA_15D AS (
  SELECT P.CODIGO, P.DESCRICAO, Y.NOME AS COMPRADOR,
      ROUND(AVG(VD.VALOR_DIA), 2) AS MEDIA_DIARIA_RS,
      ROUND(AVG(VD.QTDE_DIA), 2)  AS MEDIA_DIARIA_QTDE,
      COUNT(VD.DIA)               AS DIAS_COM_VENDA
  FROM PROD P
  INNER JOIN AGTC Y ON P.COMPRADOR = Y.CODIGO
  INNER JOIN (
    SELECT I.PRODUTO,
        TRUNC(I.DT_CRIACAO)       AS DIA,
        SUM(I.PRECO * I.QUANTIDADE) AS VALOR_DIA,
        SUM(I.QUANTIDADE)         AS QTDE_DIA
    FROM SFC_CARRINHO_ITEM I
    WHERE I.STATUS_PEDIDO IN (0,251,95,114,14,18,7,13,3,25,71)
      AND TRUNC(I.DT_CRIACAO) >= TRUNC(SYSDATE) - 15
      AND TRUNC(I.DT_CRIACAO) <  TRUNC(SYSDATE)
    GROUP BY I.PRODUTO, TRUNC(I.DT_CRIACAO)
  ) VD ON VD.PRODUTO = P.CODIGO
  WHERE Y.CODIGO IN (18877, 19364, 29057)
  GROUP BY P.CODIGO, P.DESCRICAO, Y.NOME
),
HOJE AS (
  SELECT I.PRODUTO,
      ROUND(SUM(I.PRECO * I.QUANTIDADE), 2) AS VALOR_HOJE,
      ROUND(SUM(I.QUANTIDADE))              AS QTDE_HOJE
  FROM SFC_CARRINHO_ITEM I
  WHERE I.STATUS_PEDIDO IN (0,251,95,114,14,18,7,13,3,25,71)
    AND TRUNC(I.DT_CRIACAO) = TRUNC(SYSDATE)
  GROUP BY I.PRODUTO
)
SELECT M.CODIGO, M.DESCRICAO, M.COMPRADOR,
    M.MEDIA_DIARIA_RS,
    NVL(H.VALOR_HOJE, 0)                                  AS VALOR_HOJE,
    ROUND(NVL(H.VALOR_HOJE, 0) - M.MEDIA_DIARIA_RS, 2)    AS GAP_RS,
    ROUND(((NVL(H.VALOR_HOJE, 0) - M.MEDIA_DIARIA_RS)
           / M.MEDIA_DIARIA_RS) * 100, 2)                 AS GAP_PCT,
    CASE
      WHEN NVL(H.VALOR_HOJE, 0) = 0 AND M.MEDIA_DIARIA_RS >= 500 THEN 'ZERADO · ALTO RISCO'
      WHEN NVL(H.VALOR_HOJE, 0) = 0                              THEN 'ZERADO'
      WHEN NVL(H.VALOR_HOJE, 0) < M.MEDIA_DIARIA_RS * 0.3        THEN 'QUEDA > 70%'
      WHEN NVL(H.VALOR_HOJE, 0) < M.MEDIA_DIARIA_RS * 0.5        THEN 'QUEDA > 50%'
      ELSE 'NORMAL'
    END AS SEVERIDADE
FROM MEDIA_15D M
LEFT JOIN HOJE H ON H.PRODUTO = M.CODIGO
WHERE M.MEDIA_DIARIA_RS > 0
  AND M.DIAS_COM_VENDA  >= 3
  AND NVL(H.VALOR_HOJE, 0) < M.MEDIA_DIARIA_RS * 0.5
ORDER BY
    CASE WHEN NVL(H.VALOR_HOJE, 0) = 0 THEN 0 ELSE 1 END,
    M.MEDIA_DIARIA_RS DESC
FETCH FIRST 20 ROWS ONLY;`
  },
];

// ── HELPERS ──────────────────────────────────────────────────────────────────

const today = () => new Date().toLocaleDateString("pt-BR", { weekday: "long", day: "2-digit", month: "long" });
const todayKey = () => new Date().toISOString().split("T")[0];

function useStorage(key, def) {
  const [val, setVal] = useState(() => {
    try { const s = localStorage.getItem(key); return s ? JSON.parse(s) : def; } catch { return def; }
  });
  const set = (v) => { setVal(v); try { localStorage.setItem(key, JSON.stringify(v)); } catch {} };
  return [val, set];
}

// ── COMPONENTES BASE ─────────────────────────────────────────────────────────

function Btn({ onClick, children, primary, small, disabled }) {
  return (
    <button onClick={onClick} disabled={disabled} style={{
      fontFamily: "'DM Sans', sans-serif",
      fontSize: small ? 12 : 13, fontWeight: 500,
      padding: small ? "5px 12px" : "9px 18px",
      borderRadius: 9, cursor: disabled ? "default" : "pointer",
      border: primary ? "none" : "0.5px solid #d0cfc8",
      background: disabled ? "#e0e0e0" : primary ? "#111" : "transparent",
      color: disabled ? "#aaa" : primary ? "#fff" : "#555",
      transition: "opacity 0.15s",
    }}>{children}</button>
  );
}

function Tab({ label, active, onClick, dot }) {
  return (
    <button onClick={onClick} style={{
      fontFamily: "'DM Sans', sans-serif",
      fontSize: 13, fontWeight: 500,
      padding: "7px 16px", borderRadius: 20,
      border: active ? "none" : "0.5px solid #d0cfc8",
      background: active ? "#111" : "transparent",
      color: active ? "#fff" : "#888",
      cursor: "pointer", position: "relative",
    }}>
      {label}
      {dot && <span style={{ position: "absolute", top: 4, right: 4, width: 7, height: 7, borderRadius: "50%", background: "#E24B4A" }} />}
    </button>
  );
}

// ── SEÇÃO: CHECKLIST ─────────────────────────────────────────────────────────

function SecaoChecklist() {
  const key = "chk_" + todayKey();
  const [done, setDone] = useStorage(key, {});
  const total = CHECKLIST.reduce((s, b) => s + b.items.length, 0);
  const count = Object.values(done).filter(Boolean).length;
  const pct = Math.round((count / total) * 100);

  const toggle = (id) => setDone({ ...done, [id]: !done[id] });
  const reset = () => setDone({});

  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
        <span style={{ fontSize: 12, color: "#888" }}>{count} de {total} itens · {pct}% do dia concluído</span>
        <Btn small onClick={reset}>Reiniciar</Btn>
      </div>
      <div style={{ height: 4, background: "#eee", borderRadius: 2, marginBottom: 16 }}>
        <div style={{ height: 4, width: pct + "%", background: pct === 100 ? "#639922" : "#111", borderRadius: 2, transition: "width 0.3s" }} />
      </div>

      {pct === 100 && (
        <div style={{ background: "#EAF3DE", border: "0.5px solid #97C459", borderRadius: 10, padding: "10px 14px", marginBottom: 14, fontSize: 13, color: "#27500A", fontWeight: 500, textAlign: "center" }}>
          Rotina completa — você está operando como analista pleno.
        </div>
      )}

      {CHECKLIST.map((bloco) => (
        <div key={bloco.hora} style={{ background: "#fff", border: "0.5px solid #e8e6e0", borderRadius: 14, overflow: "hidden", marginBottom: 10 }}>
          <div style={{ background: bloco.bg, padding: "9px 16px", display: "flex", alignItems: "center", gap: 10 }}>
            <span style={{ fontSize: 11, fontWeight: 700, padding: "2px 8px", borderRadius: 4, background: bloco.badge, color: bloco.cor, whiteSpace: "nowrap" }}>{bloco.hora}</span>
            {bloco.label && <span style={{ fontSize: 13, fontWeight: 500, color: bloco.cor }}>{bloco.label}</span>}
          </div>
          {bloco.items.map((item) => (
            <div key={item.id} onClick={() => toggle(item.id)}
              style={{ display: "flex", gap: 12, alignItems: "flex-start", padding: "11px 16px", borderTop: "0.5px solid #f3f3f3", cursor: "pointer" }}>
              <div style={{ width: 18, height: 18, borderRadius: 4, border: "1.5px solid " + (done[item.id] ? "#639922" : "#ccc"), background: done[item.id] ? "#639922" : "transparent", flexShrink: 0, marginTop: 2, display: "flex", alignItems: "center", justifyContent: "center", transition: "all 0.12s" }}>
                {done[item.id] && <svg width="10" height="8" viewBox="0 0 10 8"><polyline points="1,4 3.5,6.5 9,1" stroke="white" strokeWidth="1.8" fill="none" strokeLinecap="round" strokeLinejoin="round" /></svg>}
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 13, color: done[item.id] ? "#aaa" : "#111", textDecoration: done[item.id] ? "line-through" : "none", lineHeight: 1.5 }}>{item.texto}</div>
                {!done[item.id] && <div style={{ fontSize: 11, color: "#bbb", marginTop: 2 }}>{item.hint}</div>}
              </div>
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}

// ── SEÇÃO: QUERIES ───────────────────────────────────────────────────────────

function SecaoQueries() {
  const [open, setOpen] = useState(null);
  const [copied, setCopied] = useState(null);

  const copy = (id, sql) => {
    navigator.clipboard.writeText(sql).then(() => { setCopied(id); setTimeout(() => setCopied(null), 2000); });
  };

  return (
    <div>
      <div style={{ background: "#E6F1FB", border: "0.5px solid #B5D4F4", borderRadius: 10, padding: "10px 14px", marginBottom: 14 }}>
        <span style={{ fontSize: 12, color: "#185FA5" }}>Compradores eletro: <strong>18877 · 19364 · 29057</strong> — todas usam SYSDATE, sem precisar editar a data.</span>
      </div>

      {QUERIES.map((q) => {
        const isOpen = open === q.id;
        return (
          <div key={q.id} style={{ background: "#fff", border: "0.5px solid " + (isOpen ? "#888" : "#e8e6e0"), borderRadius: 14, overflow: "hidden", marginBottom: 8 }}>
            <div onClick={() => setOpen(isOpen ? null : q.id)} style={{ display: "flex", alignItems: "center", gap: 12, padding: "12px 16px", cursor: "pointer" }}>
              <div style={{ flex: 1 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 3 }}>
                  <span style={{ fontSize: 13, fontWeight: 500, color: "#111" }}>{q.label}</span>
                  <span style={{ fontSize: 10, fontWeight: 700, padding: "1px 7px", borderRadius: 4, background: q.badgeBg, color: q.badgeCor }}>{q.badge}</span>
                </div>
                <span style={{ fontSize: 12, color: "#aaa" }}>{q.hint}</span>
              </div>
              <span style={{ fontSize: 12, color: "#bbb" }}>{isOpen ? "▲" : "▼"}</span>
            </div>
            {isOpen && (
              <div style={{ borderTop: "0.5px solid #f3f3f3" }}>
                <pre style={{ margin: 0, padding: "12px 16px", fontSize: 11, lineHeight: 1.7, fontFamily: "monospace", color: "#333", background: "#F7F6F2", overflowX: "auto", whiteSpace: "pre-wrap", wordBreak: "break-word" }}>{q.sql}</pre>
                <div style={{ padding: "10px 16px", borderTop: "0.5px solid #f3f3f3" }}>
                  <Btn primary small onClick={() => copy(q.id, q.sql)}>{copied === q.id ? "✓ Copiado!" : "Copiar SQL"}</Btn>
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

// ── SEÇÃO: DIÁRIO ────────────────────────────────────────────────────────────

const parseBRL = (s) => {
  if (s === null || s === undefined || s === "") return null;
  const cleaned = String(s).replace(/[^\d,.-]/g, "").replace(/\./g, "").replace(",", ".");
  const n = parseFloat(cleaned);
  return isNaN(n) ? null : n;
};
const formatBRL = (n) => new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(n);

function SecaoDiario() {
  const [registros, setRegistros] = useStorage("diario_registros", []);
  const [oq, setOq] = useState("");
  const [pq, setPq] = useState("");
  const [ac, setAc] = useState("");
  const [im, setIm] = useState("");

  const impactoNum = parseBRL(im);

  const salvar = () => {
    if (!oq && !pq && !ac && impactoNum === null) return;
    const novo = {
      id: Date.now(),
      data: new Date().toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" }),
      hora: new Date().toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" }),
      oq, pq, ac,
      impacto: impactoNum,
    };
    setRegistros([novo, ...registros]);
    setOq(""); setPq(""); setAc(""); setIm("");
  };

  const limpar = () => { setOq(""); setPq(""); setAc(""); setIm(""); };
  const remover = (id) => setRegistros(registros.filter(r => r.id !== id));

  const taStyle = { border: "0.5px solid #e0deda", borderRadius: 8, padding: "9px 12px", fontSize: 13, color: "#111", fontFamily: "'DM Sans', sans-serif", lineHeight: 1.6, outline: "none", resize: "none", background: "#FAFAF8", width: "100%", boxSizing: "border-box" };
  const inStyle = { ...taStyle, padding: "8px 12px", lineHeight: 1.4 };
  const tags = [
    { tag: "O QUÊ", bg: "#FAEEDA", cor: "#854F0B", val: oq, set: setOq, ph: "O que aconteceu hoje?" },
    { tag: "POR QUÊ", bg: "#E6F1FB", cor: "#185FA5", val: pq, set: setPq, ph: "Por que isso importa?" },
    { tag: "AÇÃO", bg: "#EAF3DE", cor: "#3B6D11", val: ac, set: setAc, ph: "O que você fez ou vai fazer?" },
  ];

  return (
    <div>
      <div style={{ background: "#fff", border: "0.5px solid #e8e6e0", borderRadius: 14, overflow: "hidden", marginBottom: 14 }}>
        <div style={{ background: "#F7F6F2", padding: "10px 16px", fontSize: 12, fontWeight: 500, color: "#888" }}>Novo registro — {new Date().toLocaleDateString("pt-BR", { day: "2-digit", month: "long" })}</div>
        {tags.map((t) => (
          <div key={t.tag} style={{ display: "flex", gap: 12, alignItems: "flex-start", padding: "10px 16px", borderTop: "0.5px solid #f3f3f3" }}>
            <span style={{ fontSize: 10, fontWeight: 700, padding: "2px 7px", borderRadius: 4, background: t.bg, color: t.cor, flexShrink: 0, marginTop: 8, whiteSpace: "nowrap" }}>{t.tag}</span>
            <textarea value={t.val} onChange={e => t.set(e.target.value)} placeholder={t.ph} rows={2} style={taStyle} />
          </div>
        ))}
        <div style={{ display: "flex", gap: 12, alignItems: "flex-start", padding: "10px 16px", borderTop: "0.5px solid #f3f3f3" }}>
          <span style={{ fontSize: 10, fontWeight: 700, padding: "2px 7px", borderRadius: 4, background: "#DDF1F1", color: "#0C6170", flexShrink: 0, marginTop: 8, whiteSpace: "nowrap" }}>IMPACTO (R$)</span>
          <div style={{ flex: 1 }}>
            <input
              value={im}
              onChange={e => setIm(e.target.value)}
              placeholder="ex: 1500 · 1.500,50 · -800 (prejuízo)"
              inputMode="decimal"
              style={inStyle}
            />
            {im && impactoNum !== null && (
              <div style={{ fontSize: 11, color: impactoNum < 0 ? "#A32D2D" : "#0C6170", marginTop: 4, fontWeight: 500 }}>
                = {formatBRL(impactoNum)}
              </div>
            )}
            {im && impactoNum === null && (
              <div style={{ fontSize: 11, color: "#A32D2D", marginTop: 4 }}>Valor inválido</div>
            )}
          </div>
        </div>
        <div style={{ padding: "10px 16px", borderTop: "0.5px solid #f3f3f3", display: "flex", gap: 8 }}>
          <Btn primary onClick={salvar} disabled={!oq && !pq && !ac && impactoNum === null}>Salvar registro</Btn>
          <Btn small onClick={limpar}>Limpar</Btn>
        </div>
      </div>

      {registros.length === 0 && (
        <div style={{ textAlign: "center", padding: "2rem", color: "#bbb", fontSize: 13 }}>Nenhum registro ainda. Preencha o formulário acima.</div>
      )}

      {registros.map((r) => (
        <div key={r.id} style={{ background: "#fff", border: "0.5px solid #e8e6e0", borderRadius: 14, overflow: "hidden", marginBottom: 8 }}>
          <div style={{ background: "#F7F6F2", padding: "8px 16px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span style={{ fontSize: 11, color: "#888", fontWeight: 500 }}>{r.data} às {r.hora}</span>
            <button onClick={() => remover(r.id)} style={{ fontSize: 13, color: "#ccc", background: "none", border: "none", cursor: "pointer", padding: "0 4px" }}>×</button>
          </div>
          {[["O QUÊ", r.oq, "#FAEEDA", "#854F0B"], ["POR QUÊ", r.pq, "#E6F1FB", "#185FA5"], ["AÇÃO", r.ac, "#EAF3DE", "#3B6D11"]].filter(([, v]) => v).map(([tag, val, bg, cor]) => (
            <div key={tag} style={{ display: "flex", gap: 12, alignItems: "flex-start", padding: "9px 16px", borderTop: "0.5px solid #f3f3f3" }}>
              <span style={{ fontSize: 10, fontWeight: 700, padding: "2px 7px", borderRadius: 4, background: bg, color: cor, flexShrink: 0, marginTop: 1, whiteSpace: "nowrap" }}>{tag}</span>
              <span style={{ fontSize: 13, color: "#222", lineHeight: 1.5 }}>{val}</span>
            </div>
          ))}
          {typeof r.impacto === "number" && (
            <div style={{ display: "flex", gap: 12, alignItems: "center", padding: "9px 16px", borderTop: "0.5px solid #f3f3f3" }}>
              <span style={{ fontSize: 10, fontWeight: 700, padding: "2px 7px", borderRadius: 4, background: "#DDF1F1", color: "#0C6170", flexShrink: 0, whiteSpace: "nowrap" }}>IMPACTO</span>
              <span style={{ fontSize: 13, color: r.impacto < 0 ? "#A32D2D" : "#0C6170", fontWeight: 600 }}>{formatBRL(r.impacto)}</span>
              {r.impacto < 0 && <span style={{ fontSize: 11, color: "#aaa" }}>prejuízo</span>}
              {r.impacto > 0 && <span style={{ fontSize: 11, color: "#aaa" }}>ganho / evitado</span>}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

// ── SEÇÃO: DAILY PULSE ───────────────────────────────────────────────────────

function SecaoPulse() {
  const [fat, setFat] = useState("");
  const [meta, setMeta] = useState("");
  const [foco, setFoco] = useState("");
  const [risco, setRisco] = useState("");
  const [loading, setLoading] = useState(false);
  const [pulse, setPulse] = useState("");
  const [copied, setCopied] = useState(false);

  const gerar = async () => {
    setLoading(true); setPulse("");
    const contexto = [
      fat && meta ? `Faturamento atual: R$ ${fat}k de uma meta de R$ ${meta}k.` : "",
      foco ? `Foco do dia: ${foco}.` : "",
      risco ? `Risco identificado: ${risco}.` : "",
    ].filter(Boolean).join(" ") || "Dia normal de monitoramento.";

    try {
      const resp = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "claude-sonnet-4-20250514",
          max_tokens: 1000,
          system: "Você é assistente de inteligência comercial de e-commerce brasileiro. Escreva um daily pulse para o Microsoft Teams em português, tom direto e profissional, máximo 5 linhas. Use emojis com moderação. Formato: saudação curta + foco do dia + número ou risco + ação prevista. Nunca invente dados.",
          messages: [{ role: "user", content: `Escreve meu daily pulse para o Teams com base nisso: ${contexto}` }]
        })
      });
      const data = await resp.json();
      setPulse(data.content?.map(b => b.text || "").join("").trim() || "");
    } catch { setPulse("Erro ao gerar. Tente novamente."); }
    setLoading(false);
  };

  const copiar = () => {
    navigator.clipboard.writeText(pulse).then(() => { setCopied(true); setTimeout(() => setCopied(false), 2500); });
  };

  const inStyle = { border: "0.5px solid #e0deda", borderRadius: 8, padding: "8px 12px", fontSize: 13, color: "#111", fontFamily: "'DM Sans', sans-serif", outline: "none", background: "#FAFAF8", width: "100%", boxSizing: "border-box" };

  return (
    <div>
      <div style={{ background: "#fff", border: "0.5px solid #e8e6e0", borderRadius: 14, overflow: "hidden", marginBottom: 14 }}>
        <div style={{ background: "#F7F6F2", padding: "10px 16px", fontSize: 12, fontWeight: 500, color: "#888" }}>Preencha o que souber — o resto a IA completa</div>
        <div style={{ padding: "14px 16px", display: "flex", flexDirection: "column", gap: 10 }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
            <div>
              <div style={{ fontSize: 11, color: "#888", marginBottom: 5, fontWeight: 500 }}>Faturamento atual (R$k)</div>
              <input value={fat} onChange={e => setFat(e.target.value)} placeholder="ex: 650" style={inStyle} />
            </div>
            <div>
              <div style={{ fontSize: 11, color: "#888", marginBottom: 5, fontWeight: 500 }}>Meta do dia (R$k)</div>
              <input value={meta} onChange={e => setMeta(e.target.value)} placeholder="ex: 1400" style={inStyle} />
            </div>
          </div>
          <div>
            <div style={{ fontSize: 11, color: "#888", marginBottom: 5, fontWeight: 500 }}>Foco do dia</div>
            <input value={foco} onChange={e => setFoco(e.target.value)} placeholder="ex: monitorar ar condicionado após queda de ontem" style={inStyle} />
          </div>
          <div>
            <div style={{ fontSize: 11, color: "#888", marginBottom: 5, fontWeight: 500 }}>Risco ou alerta identificado</div>
            <input value={risco} onChange={e => setRisco(e.target.value)} placeholder="ex: concorrência com preço abaixo em LG 12k" style={inStyle} />
          </div>
        </div>
        <div style={{ padding: "10px 16px", borderTop: "0.5px solid #f3f3f3" }}>
          <Btn primary onClick={gerar} disabled={loading}>{loading ? "Gerando..." : "Gerar daily pulse com IA ⚡"}</Btn>
        </div>
      </div>

      {pulse && (
        <div style={{ background: "#fff", border: "0.5px solid #e8e6e0", borderRadius: 14, overflow: "hidden" }}>
          <div style={{ background: "#EAF3DE", padding: "10px 16px", fontSize: 12, fontWeight: 600, color: "#27500A" }}>Daily pulse gerado — pronto para colar no Teams</div>
          <div style={{ padding: "14px 16px", fontSize: 13, color: "#111", lineHeight: 1.8, whiteSpace: "pre-wrap" }}>{pulse}</div>
          <div style={{ padding: "10px 16px", borderTop: "0.5px solid #f3f3f3" }}>
            <Btn primary onClick={copiar}>{copied ? "✓ Copiado!" : "Copiar para Teams"}</Btn>
          </div>
        </div>
      )}
    </div>
  );
}


// ── SEÇÃO: SEMANA ────────────────────────────────────────────────────────────

const REUNIOES = [
  {
    dia: "Segunda", icone: "S", cor: "#185FA5", bg: "#E6F1FB", badge: "#B5D4F4",
    nome: "Sprint Planning — Squad vendas",
    horario: "11h · com Bruna",
    descricao: "Cada analista fala sobre sua carteira. Você precisa chegar com a semana anterior resumida e o foco da semana que começa.",
    preparo: [
      "Rodar a query top da semana — ver quais SKUs mais venderam nos últimos 7 dias",
      "Saber o faturamento da semana vs meta: estamos acima ou abaixo?",
      "Ter pelo menos 1 caso da semana: identifiquei X, agi com Y, resultado foi Z",
      "Definir o foco da carteira para a semana que começa",
    ],
    roteiro: [
      { label: "Faturamento geral", pergunta: "Quanto faturamos até agora? Estamos acima ou abaixo da meta? Qual o % de atingimento?", exemplo: "ex: R$ 15,3M de R$ 23,5M de meta — 65% atingido, crescendo 37% vs AA" },
      { label: "Quem puxou?", pergunta: "Qual comprador ou categoria teve o melhor desempenho? Por quê?", exemplo: "ex: Saboya puxou com TV e split — campanha de ar no fim do verão converteu bem" },
      { label: "Quem travou?", pergunta: "Qual comprador ou categoria ficou abaixo do esperado? Qual foi a causa?", exemplo: "ex: Vinicius com ventiladores — ruptura em Salvador, estoque preso em transferência" },
      { label: "Regiões", pergunta: "Alguma região se destacou ou travou? O que explica isso?", exemplo: "ex: PE puxando com 17% do total, BA travada por limitação de 220v em linha branca" },
      { label: "Categoria destaque", pergunta: "Quais categorias cresceram acima do esperado?", exemplo: "ex: TVs, Lavadoras, Fogões, Adegas, Fritadeiras e Cápsulas" },
      { label: "Categoria ofensora", pergunta: "Quais categorias estão abaixo? Qual a causa raiz?", exemplo: "ex: Freezers, Ar condicionado, Ventiladores e Cafeteiras" },
      { label: "Próxima ação", pergunta: "Qual é a ação prioritária desta semana? Com quem você vai agir?", exemplo: "ex: CRM + campanha Mães — alinhar SKUs e preços com compradores até quarta" },
    ]
  },
  {
    dia: "Quarta", icone: "Q", cor: "#854F0B", bg: "#FAEEDA", badge: "#FAC775",
    nome: "Weekly Sync — e-Commerce",
    horario: "10h · com Volpa e todo o time",
    descricao: "Contexto da semana, como está até agora e quais são as próximas ações. Tom estratégico — Volpa quer leitura de negócio, não só tarefas.",
    preparo: [
      "% atingimento de meta até ontem — número exato, não aproximação",
      "Qual categoria está puxando e qual está travando",
      "Uma ação proativa que você tomou ou vai tomar esta semana",
      "Se houver alerta de ruptura ou competitividade, trazer o diagnóstico pronto",
    ]
  },
  {
    dia: "Quarta", icone: "Q", cor: "#3B6D11", bg: "#EAF3DE", badge: "#C0DD97",
    nome: "Reunião Ecomm + MKT + Comercial",
    horario: "9h · antes do Weekly",
    descricao: "Alinhamento entre squads antes do Weekly. Use para antecipar o que vai apresentar para o Volpa às 10h.",
    preparo: [
      "Checar se há algum JIRA de campanha pendente para alimentar com preço",
      "Ver se as ofertas da semana estão com preço definido e comunicado para o CRM",
      "Antecipar se alguma categoria precisa de reforço de mídia",
    ]
  },
  {
    dia: "Quinta", icone: "Q", cor: "#534AB7", bg: "#EEEDFE", badge: "#CECBF6",
    nome: "Mídia + Vendas — alinhamento quinzenal",
    horario: "14h · com coordenadora de mídia",
    descricao: "A coordenadora de mídia criou um dashboard de ROAS e investimento por categoria. Reunião recente — foco em entender o que está sendo investido e se está gerando retorno.",
    preparo: [
      "Olhar o faturamento de eletro por categoria antes da reunião: TV, ar, linha branca",
      "Pensar: tem alguma categoria com muita verba mas pouco retorno? Ou o contrário?",
      "Ter em mente quais SKUs são os top de cada carteira — pode ajudar a cruzar com o ROAS",
      "Perguntar: como posso te ajudar com dados comerciais para melhorar o ROAS por categoria?",
    ]
  },
];

function SecaoSemana() {
  const diasSemana = ["Domingo","Segunda","Terça","Quarta","Quinta","Sexta","Sábado"];
  const hoje = diasSemana[new Date().getDay()];
  const [aberto, setAberto] = useState(null);

  return (
    <div>
      <div style={{ background: "#E6F1FB", border: "0.5px solid #B5D4F4", borderRadius: 10, padding: "10px 14px", marginBottom: 14 }}>
        <span style={{ fontSize: 12, color: "#185FA5" }}>
          Hoje é <strong>{hoje}</strong>. As reuniões do seu dia estão destacadas abaixo.
        </span>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {REUNIOES.map((r, i) => {
          const ehHoje = r.dia === hoje;
          const isOpen = aberto === i;
          return (
            <div key={i} style={{ background: "#fff", border: "0.5px solid " + (ehHoje ? r.cor : "#e8e6e0"), borderRadius: 14, overflow: "hidden", outline: ehHoje ? "2px solid " + r.badge : "none" }}>
              <div onClick={() => setAberto(isOpen ? null : i)} style={{ display: "flex", alignItems: "center", gap: 12, padding: "12px 16px", cursor: "pointer" }}>
                <div style={{ width: 36, height: 36, borderRadius: 10, background: r.bg, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                  <span style={{ fontSize: 13, fontWeight: 700, color: r.cor }}>{r.dia.slice(0,3).toUpperCase()}</span>
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 3, flexWrap: "wrap" }}>
                    <span style={{ fontSize: 13, fontWeight: 500, color: "#111" }}>{r.nome}</span>
                    {ehHoje && <span style={{ fontSize: 10, fontWeight: 700, padding: "1px 7px", borderRadius: 4, background: r.bg, color: r.cor }}>hoje</span>}
                  </div>
                  <span style={{ fontSize: 12, color: "#aaa" }}>{r.horario}</span>
                </div>
                <span style={{ fontSize: 12, color: "#bbb" }}>{isOpen ? "▲" : "▼"}</span>
              </div>
              {isOpen && (
                <div style={{ borderTop: "0.5px solid #f3f3f3" }}>
                  <div style={{ padding: "12px 16px", background: r.bg }}>
                    <div style={{ fontSize: 12, color: r.cor, lineHeight: 1.6, marginBottom: 12 }}>{r.descricao}</div>
                    <div style={{ fontSize: 11, fontWeight: 700, color: r.cor, letterSpacing: "0.06em", textTransform: "uppercase", marginBottom: 8 }}>O que preparar antes</div>
                    {r.preparo.map((p, j) => (
                      <div key={j} style={{ display: "flex", gap: 8, alignItems: "flex-start", marginBottom: 6 }}>
                        <div style={{ width: 6, height: 6, borderRadius: "50%", background: r.cor, marginTop: 5, flexShrink: 0 }} />
                        <span style={{ fontSize: 13, color: r.cor, lineHeight: 1.5 }}>{p}</span>
                      </div>
                    ))}
                  </div>
                  {r.roteiro && (
                    <div style={{ padding: "14px 16px", borderTop: "0.5px solid #f3f3f3" }}>
                      <div style={{ fontSize: 11, fontWeight: 700, color: "#555", letterSpacing: "0.06em", textTransform: "uppercase", marginBottom: 12 }}>Roteiro para preencher o Loop</div>
                      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                        {r.roteiro.map((step, j) => (
                          <div key={j} style={{ background: "#FAFAF8", border: "0.5px solid #e8e6e0", borderRadius: 10, padding: "12px 14px" }}>
                            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
                              <div style={{ width: 22, height: 22, borderRadius: "50%", background: r.bg, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                                <span style={{ fontSize: 11, fontWeight: 700, color: r.cor }}>{j + 1}</span>
                              </div>
                              <span style={{ fontSize: 13, fontWeight: 500, color: "#111" }}>{step.label}</span>
                            </div>
                            <div style={{ fontSize: 13, color: "#444", lineHeight: 1.6, marginBottom: 6, paddingLeft: 30 }}>{step.pergunta}</div>
                            <div style={{ fontSize: 11, color: "#aaa", paddingLeft: 30, fontStyle: "italic" }}>{step.exemplo}</div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ── APP ──────────────────────────────────────────────────────────────────────

export default function App() {
  const [aba, setAba] = useState("checklist");
  const [registros] = useStorage("diario_registros", []);
  const hoje = todayKey();
  const [chkDone] = useStorage("chk_" + hoje, {});
  const total = CHECKLIST.reduce((s, b) => s + b.items.length, 0);
  const count = Object.values(chkDone).filter(Boolean).length;
  const pct = Math.round((count / total) * 100);

  const agora = new Date();
  const registrosMes = registros.filter(r => {
    const d = new Date(r.id);
    return d.getMonth() === agora.getMonth() && d.getFullYear() === agora.getFullYear();
  }).length;
  const META_PLENO = 20;
  const pctPleno = Math.min(100, Math.round((registrosMes / META_PLENO) * 100));
  const plenoMet = registrosMes >= META_PLENO;

  return (
    <div style={{ fontFamily: "'DM Sans', sans-serif", maxWidth: 720, margin: "0 auto", padding: "1.5rem 1.5rem", background: "#FAFAF8", minHeight: "100vh" }}>
      <link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600&display=swap" rel="stylesheet" />

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "1rem" }}>
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 4 }}>
            <div style={{ width: 28, height: 28, borderRadius: 8, background: "#111", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14 }}>⚡</div>
            <h1 style={{ fontSize: 18, fontWeight: 600, color: "#111", margin: 0 }}>Central Thaylane</h1>
          </div>
          <p style={{ fontSize: 12, color: "#aaa", margin: 0, paddingLeft: 38, textTransform: "capitalize" }}>{today()}</p>
        </div>
        <div style={{ textAlign: "right" }}>
          <div style={{ fontSize: 22, fontWeight: 600, color: pct === 100 ? "#639922" : "#111" }}>{pct}%</div>
          <div style={{ fontSize: 11, color: "#aaa" }}>do dia</div>
        </div>
      </div>

      <div style={{ marginBottom: "1.5rem" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 5 }}>
          <span style={{ fontSize: 11, fontWeight: 500, color: plenoMet ? "#8A6A10" : "#888", letterSpacing: "0.01em" }}>
            Evolução para Pleno{plenoMet ? " · meta do mês atingida" : ""}
          </span>
          <span style={{ fontSize: 11, color: plenoMet ? "#8A6A10" : "#bbb" }}>
            {registrosMes} de {META_PLENO} registros este mês
          </span>
        </div>
        <div style={{ height: 3, background: "#ececec", borderRadius: 2 }}>
          <div style={{ height: 3, width: pctPleno + "%", background: plenoMet ? "#D4AF37" : "#534AB7", borderRadius: 2, transition: "width 0.4s, background 0.3s" }} />
        </div>
      </div>

      <div style={{ display: "flex", gap: 6, marginBottom: "1.5rem", flexWrap: "wrap" }}>
        <Tab label="Checklist" active={aba === "checklist"} onClick={() => setAba("checklist")} />
        <Tab label="Daily pulse" active={aba === "pulse"} onClick={() => setAba("pulse")} />
        <Tab label="Semana" active={aba === "semana"} onClick={() => setAba("semana")} />
        <Tab label="Diário" active={aba === "diario"} onClick={() => setAba("diario")} dot={registros.length === 0} />
        <Tab label="Queries SQL" active={aba === "queries"} onClick={() => setAba("queries")} />
      </div>

      {aba === "checklist" && <SecaoChecklist />}
      {aba === "pulse" && <SecaoPulse />}
      {aba === "semana" && <SecaoSemana />}
      {aba === "diario" && <SecaoDiario />}
      {aba === "queries" && <SecaoQueries />}
    </div>
  );
}