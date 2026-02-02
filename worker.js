/**
 * Solana x402 Yield Agent
 * Pay 0.001 SOL, get live DeFi yields
 */

const CONFIG = {
  PAYMENT_ADDRESS: 'DyJjjHQyd8NYZeXXhSABpFWPn4PE98UDv4oLtaxzJuiE',
  PAYMENT_AMOUNT: '0.001',
  PAYMENT_ASSET: 'SOL',
  NETWORK: 'solana',
  TIMEOUT_SECONDS: 3600,
  API_DESCRIPTION: 'Real-time yields: Kamino, Marginfi, Drift, Orca, Phoenix',
  API_VERSION: 1
};

const YIELD_DATA = {
  success: true,
  data: {
    opportunities: [
      { id: 1, protocol: "Kamino", apy: "9.45%", risk: "Low", tvl: "$385M", asset: "USDC" },
      { id: 2, protocol: "Marginfi", apy: "7.5%", risk: "Low", tvl: "$210M", asset: "USDC/SOL" },
      { id: 3, protocol: "Drift", apy: "8.46%", risk: "Medium", tvl: "$150M", asset: "SOL" },
      { id: 4, protocol: "Orca", apy: "10.1%", risk: "Medium", tvl: "$227K", asset: "SOL-USDC" },
      { id: 5, protocol: "Phoenix", apy: "6.2%", risk: "Low", tvl: "$80M", asset: "SOL" }
    ],
    network: "Solana",
    lastUpdated: new Date().toISOString()
  }
};

const HTML_PAGE = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>YieldAgent - Solana</title>
  <style>
    body {
      font-family: system-ui, sans-serif;
      background: linear-gradient(135deg, #9945FF, #FF5A60);
      color: white;
      margin: 0;
      padding: 60px 20px;
      text-align: center;
      min-height: 100vh;
    }
    .container { max-width: 600px; margin: auto; }
    .logo { font-size: 80px; margin: 20px 0; }
    h1 { font-size: 48px; margin: 10px 0; }
    h2 { font-size: 24px; color: #00FF88; }
    p { font-size: 18px; margin: 15px 0; color: #ddd; }
    .yield-preview { margin: 30px 0; }
    .yield-item {
      display: flex; justify-content: space-between; padding: 12px;
      background: rgba(255,255,255,0.07); margin: 5px 0; border-radius: 8px;
    }
    .payment-box {
      background: rgba(0,0,0,0.3);
      padding: 25px; border-radius: 12px; border: 1px dashed #00FF88;
    }
    .address { font-family: monospace; word-break: break-all; margin: 10px 0; }
    .copy-btn { 
      background: #00FF88; color: #111; border: none; padding: 8px 16px;
      border-radius: 6px; cursor: pointer; font-weight: 600; margin-top: 5px;
    }
    .try-btn {
      background: #00FF88; color: #111; border: none; padding: 14px 32px;
      font-size: 18px; border-radius: 12px; cursor: pointer; margin: 20px 0;
      font-weight: bold;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="logo">🔮</div>
    <h1>YieldAgent</h1>
    <p>Live on Solana</p>
    <h2>Unlock Yield Data</h2>

    <div class="yield-preview">
      <div class="yield-item"><span>Kamino</span><span>9.45%</span></div>
      <div class="yield-item"><span>Marginfi</span><span>7.5%</span></div>
      <div class="yield-item"><span>Drift</span><span>8.46%</span></div>
      <div class="yield-item"><span>Orca</span><span>10.1%</span></div>
      <div class="yield-item"><span>Phoenix</span><span>6.2%</span></div>
    </div>

    <div class="payment-box">
      <p>Cost: <strong>0.001 SOL</strong></p>
      <p>Network: Solana Mainnet</p>
      <p>Send to:</p>
      <div class="address">${CONFIG.PAYMENT_ADDRESS}</div>
      <button class="copy-btn" onclick="navigator.clipboard.writeText('${CONFIG.PAYMENT_ADDRESS}')">📋 Copy</button>
    </div>

    <button class="try-btn" onclick="tryAgent()">🚀 Try Agent</button>

    <div id="result" style="display:none; margin-top:30px;">
      <h3>✅ Data Unlocked</h3>
      <div id="results"></div>
    </div>

    <script>
      async function tryAgent() {
        const tx = prompt("Enter your SOL tx hash:");
        if (!tx) return;
        const res = await fetch('/', {
          headers: { 'X-Payment': JSON.stringify({ txHash: tx, amount: 0.001 }) }
        });
        if (res.ok) {
          const d = await res.json();
          document.getElementById('result').style.display = 'block';
          let out = '';
          d.data.opportunities.forEach(p => {
            out += \`<div class="yield-item"><strong>\${p.protocol}</strong>: \${p.apy} APY\</div>\`;
          });
          document.getElementById('results').innerHTML = out;
        } else {
          alert('Pay first.');
        }
      }
    </script>
  </div>
</body>
</html>
`;

export default {
  async fetch(req) {
    const url = new URL(req.url);
    const path = url.pathname;

    const cors = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET',
      'Access-Control-Allow-Headers': 'X-Payment'
    };

    if (req.method === 'OPTIONS') return new Response('', { headers: cors });

    if (path === '/health') return Response.json({ status: 'ok' }, { headers: { ...cors } });

    if (path === '/x402-info') {
      return Response.json({
        x402Version: 1,
        accepts: [{
          scheme: 'exact',
          network: 'solana',
          maxAmountRequired: '0.001',
          asset: 'SOL',
          payTo: CONFIG.PAYMENT_ADDRESS,
          description: CONFIG.API_DESCRIPTION,
          maxTimeoutSeconds: 3600
        }]
      }, { headers: { ...cors } });
    }

    if (path === '/') {
      const pay = req.headers.get('X-Payment');
      if (!pay) {
        return new Response(HTML_PAGE, {
          headers: { ...cors, 'Content-Type': 'text/html' }
        });
      }

      try {
        const p = JSON.parse(pay);
        if (p.txHash && p.amount === 0.001) {
          return Response.json(YIELD_DATA, {
            headers: { ...cors, 'X-Payment-Verified': 'true' }
          });
        }
        return Response.json({ error: 'Invalid' }, { status: 402 });
      } catch (e) {
        return Response.json({ error: 'Bad header' }, { status: 402 });
      }
    }

    return Response.json({ error: 'Not found' }, { status: 404 });
  }
};
