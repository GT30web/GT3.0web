// =======================
// ESTADO GLOBAL UNIFICADO
// =======================
let estado = JSON.parse(localStorage.getItem("gt3_estado")) || {
  config: null,
  capital: 0,
  capitalInicial: 0,
  wins: 0,
  losses: 0,
  operaciones: [],
  operacionNumero: 1,
  maxCapital: 0,
  resumen: ""
};

const limitesPorNivel = {
  Iniciante: { win: 3, loss: 1 },
  Intermedio: { win: 4, loss: 2 },
  Avanzado: { win: 5, loss: 2 }
};

function guardarEstado() {
  localStorage.setItem("gt3_estado", JSON.stringify(estado));
}

// =======================
// INICIAR SESIÓN
// =======================
function iniciarSesion() {
  const nombre = document.getElementById("nombre").value.trim();
  const capital = parseFloat(document.getElementById("capital").value);
  const broker = document.getElementById("broker").value.trim();
  const nivelTrader = document.getElementById("nivelTrader").value;
  const nivelRiesgo = document.getElementById("nivelRiesgo").value;
  const modoOperativo = document.getElementById("modoOperativo").value;
  const metaDiaria = parseFloat(document.getElementById("metaDiaria").value) || 0;
  const payout = parseFloat(document.getElementById("payout").value);

  if (!nombre || isNaN(capital) || capital <= 0 || !broker || payout <= 0 || payout > 1) {
    alert("Datos inválidos.");
    return;
  }

  const ratio = limitesPorNivel[nivelTrader].win;
  const riesgoBase = nivelRiesgo === "Conservador" ? 0.02 :
                     nivelRiesgo === "Moderado" ? 0.05 : 0.10;

  const maxMonto = capital * riesgoBase;
  const gananciaEsperada = maxMonto * payout;
  const gananciaMax = gananciaEsperada * ratio;

  if (metaDiaria > 0 && metaDiaria > gananciaMax) {
    alert(`Meta no viable. Máximo posible: ${gananciaMax.toFixed(2)}`);
    return;
  }

  const ahora = new Date();
  const idSesion = `GT3_${ahora.toISOString().slice(0,10)}_${nombre}`;

  estado = {
    config: {
      nombre, broker, nivelTrader, nivelRiesgo,
      modoOperativo, metaDiaria, payout, ratio, idSesion
    },
    capital,
    capitalInicial: capital,
    wins: 0,
    losses: 0,
    operaciones: [],
    operacionNumero: 1,
    maxCapital: capital,
    resumen: ""
  };

  document.getElementById("configPanel").style.display = "none";
  document.getElementById("sistemaPanel").style.display = "block";

  actualizarUI();
  guardarEstado();
}

// =======================
// CALCULAR MONTO
// =======================
function calcularMonto() {
  const c = estado.config;
  const riesgoBase = c.nivelRiesgo === "Conservador" ? 0.02 :
                     c.nivelRiesgo === "Moderado" ? 0.05 : 0.10;

  const acumulado = estado.capital - estado.capitalInicial;
  const restanteMeta = c.metaDiaria - acumulado;
  const winsRestantes = limitesPorNivel[c.nivelTrader].win - estado.wins;

  let monto = 0;

  if (c.modoOperativo === "Adaptativo" && c.metaDiaria > 0) {
    if (winsRestantes <= 0) {
      alert("No hay wins restantes.");
      return;
    }

    const necesario = restanteMeta / (winsRestantes * c.payout);
    const maxPermitido = estado.capital * riesgoBase;
    const minimo = estado.capital * 0.01;

    monto = Math.max(minimo, Math.min(maxPermitido, necesario));

  } else if (c.modoOperativo === "Fijo") {
    monto = estado.capital * riesgoBase;

  } else if (c.modoOperativo === "Compuesto") {
    const excedente = estado.capital - estado.capitalInicial;
    monto = excedente > 0 ? excedente * 0.1 : 0;

  } else {
    const factor = (estado.wins - estado.losses) >= 0 ? 1.1 : 0.9;
    monto = estado.capital * riesgoBase * factor;
  }

  monto = Math.round(monto * 100) / 100;

  document.getElementById("montoSugerido").innerHTML = `💡 USD ${monto}`;
  document.getElementById("montoEditable").value = monto;
}

// =======================
// OPERAR
// =======================
function registrarResultado(letra) {
  ejecutarOperacion(letra === "W" ? "win" : "loss");
}

function ejecutarOperacion(resultado) {
  const c = estado.config;
  const limites = limitesPorNivel[c.nivelTrader];

  if (estado.wins >= limites.win || estado.losses >= limites.loss) {
    alert("Sesión cerrada por ratio.");
    mostrarResumenFinal();
    return;
  }

  const monto = parseFloat(document.getElementById("montoEditable").value);
  if (isNaN(monto) || monto <= 0) {
    alert("Monto inválido.");
    return;
  }

  let ganancia = 0;

  if (resultado === "win") {
    ganancia = monto * c.payout;
    estado.capital += ganancia;
    estado.wins++;
  } else {
    estado.capital -= monto;
    estado.losses++;
  }

  estado.capital = Math.round(estado.capital * 100) / 100;
  estado.maxCapital = Math.max(estado.maxCapital, estado.capital);

  const resultadoTotal = resultado === "win" ? monto + ganancia : -monto;

  estado.operaciones.push({
    numero: estado.operacionNumero,
    resultado: resultado.toUpperCase(),
    monto,
    ganancia: ganancia.toFixed(2),
    resultadoTotal: resultadoTotal.toFixed(2),
    capital: estado.capital.toFixed(2)
  });

  const li = document.createElement("li");
  li.textContent = `#${estado.operacionNumero} ${resultado.toUpperCase()} | $${monto} → ${resultadoTotal.toFixed(2)}`;
  document.getElementById("listaOperaciones").appendChild(li);

  estado.operacionNumero++;

  actualizarUI();
  guardarEstado();

  if (estado.wins >= limites.win || estado.losses >= limites.loss) {
    alert("Ratio alcanzado.");
    mostrarResumenFinal();
  }
}

// =======================
// UI + MÉTRICAS
// =======================
function actualizarUI() {
  const total = estado.wins + estado.losses;
  const winrate = total > 0 ? (estado.wins / total * 100).toFixed(2) : 0;
  const drawdown = estado.maxCapital - estado.capital;

  document.getElementById("datosSesion").innerHTML = `
💰 Capital: ${estado.capital.toFixed(2)}<br>
📊 Winrate: ${winrate}%<br>
⚖️ W/L: ${estado.wins}/${estado.losses}<br>
📉 Drawdown: ${drawdown.toFixed(2)}
  `;
}

// =======================
// RESUMEN
// =======================
function mostrarResumenFinal() {
  const acumulado = estado.capital - estado.capitalInicial;

  estado.resumen = `
ID: ${estado.config.idSesion}
Operador: ${estado.config.nombre}
Resultado: ${estado.wins}W / ${estado.losses}L
Capital final: ${estado.capital.toFixed(2)}
Acumulado: ${acumulado.toFixed(2)}
  `;

  document.getElementById("resumenSesion").innerHTML =
    estado.resumen.replace(/\n/g, "<br>");

  guardarEstado();
}

// =======================
// EXPORTAR
// =======================
function guardarSesion() {
  if (estado.operaciones.length === 0) {
    alert("No hay datos.");
    return;
  }

  // TXT
  let txt = "GT3.0\n\n";
  estado.operaciones.forEach(o => {
    txt += `#${o.numero} ${o.resultado} $${o.monto} → ${o.resultadoTotal}\n`;
  });
  txt += `\n${estado.resumen}`;

  descargar(txt, "txt");

  // JSON (pro)
  descargar(JSON.stringify(estado, null, 2), "json");
}

function descargar(contenido, tipo) {
  const blob = new Blob([contenido], { type: "text/plain" });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = `${estado.config.idSesion}.${tipo}`;
  a.click();
}

// =======================
// RESTAURAR SESIÓN
// =======================
window.onload = function () {
  if (estado.config) {
    document.getElementById("configPanel").style.display = "none";
    document.getElementById("sistemaPanel").style.display = "block";

    estado.operaciones.forEach(op => {
      const li = document.createElement("li");
      li.textContent = `#${op.numero} ${op.resultado} $${op.monto}`;
      document.getElementById("listaOperaciones").appendChild(li);
    });

    actualizarUI();
  }
};
