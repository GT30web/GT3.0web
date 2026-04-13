let operacionNumero = 1;
let contadorWin = 0;
let contadorLoss = 0;
let operaciones = [];
let resumenSesion = "";

const limitesPorNivel = {
  Iniciante: { win: 3, loss: 1 },
  Intermedio: { win: 4, loss: 2 },
  Avanzado: { win: 5, loss: 2 }
};

function iniciarSesion() {
  const nombre = document.getElementById("nombre").value;
  const capital = parseFloat(document.getElementById("capital").value);
  const broker = document.getElementById("broker").value;
  const nivelTrader = document.getElementById("nivelTrader").value;
  const nivelRiesgo = document.getElementById("nivelRiesgo").value;
  const modoOperativo = document.getElementById("modoOperativo").value;
  const metaDiaria = parseFloat(document.getElementById("metaDiaria").value) || 0;
  const payout = parseFloat(document.getElementById("payout").value) || 0.88;

  if (!nombre || isNaN(capital) || !broker) {
    alert("Completá todos los campos correctamente.");
    return;
  }

  const ratio = limitesPorNivel[nivelTrader].win;
  const riesgoBase = nivelRiesgo === "Conservador" ? 0.02 :
                     nivelRiesgo === "Moderado" ? 0.05 : 0.10;

  const maxMontoPorOp = capital * riesgoBase;
  const gananciaEsperadaPorOp = maxMontoPorOp * payout;
  const gananciaPosible = gananciaEsperadaPorOp * ratio;

  let metaViable = true;
  if (metaDiaria > 0 && metaDiaria > gananciaPosible) {
    metaViable = false;
    alert(`⚠️ La meta establecida supera lo viable para el nivel ${nivelTrader}.
Ganancia máxima posible: USD ${gananciaPosible.toFixed(2)} con riesgo ${nivelRiesgo} y payout ${payout}`);
    return;
  }

  const ahora = new Date();
  const fecha = ahora.toISOString().slice(0, 10);
  const hora = ahora.toTimeString().slice(0, 5).replace(":", "-");
  const idSesion = `GT3_${fecha}_${hora}_${nombre}`;

  document.getElementById("datosSesion").innerHTML = `
🆔 ID: ${idSesion}<br>
👤 ${nombre} | 💼 USD ${capital} | 🏦 ${broker}<br>
📊 ${modoOperativo} | ⚠️ Riesgo: ${nivelRiesgo} | 🧠 Nivel: ${nivelTrader}<br>
🎯 Meta: USD ${metaDiaria.toFixed(2)} | 📈 Payout: ${payout}
  `;

  document.getElementById("configPanel").style.display = "none";
  document.getElementById("sistemaPanel").style.display = "block";

  window.gt3config = {
    nombre, capital, capitalInicial: capital, broker,
    nivelTrader, nivelRiesgo, modoOperativo, metaDiaria,
    payout, maxMontoPorOp, ratio, metaViable, idSesion
  };
}

function calcularMonto() {
  const config = window.gt3config;
  const riesgoBase = config.nivelRiesgo === "Conservador" ? 0.02 :
                     config.nivelRiesgo === "Moderado" ? 0.05 : 0.10;

  const acumulado = config.capital - config.capitalInicial;
  const restanteMeta = config.metaDiaria - acumulado;
  const winsRestantes = limitesPorNivel[config.nivelTrader].win - contadorWin;

  let monto = 0;

  if (config.modoOperativo === "Adaptativo" && config.metaDiaria > 0 && config.metaViable) {
    const necesario = restanteMeta / (winsRestantes * config.payout);
    monto = Math.min(config.capital * riesgoBase, necesario);
  } else if (config.modoOperativo === "Fijo") {
    monto = config.capital * riesgoBase;
  } else if (config.modoOperativo === "Compuesto") {
    const excedente = config.capital - config.capitalInicial;
    monto = excedente > 0 ? excedente * 0.10 : 0;
  } else {
    const factor = (contadorWin - contadorLoss) >= 0 ? 1.1 : 0.9;
    monto = config.capital * riesgoBase * factor;
  }

  monto = Math.round(monto * 100) / 100;
  document.getElementById("montoSugerido").innerHTML = `💡 Sugerencia: USD ${monto}`;
  document.getElementById("montoEditable").value = monto;
}

function registrarResultado(letra) {
  const resultado = letra === "W" ? "win" : "loss";
  ejecutarOperacion(resultado);
}

function ejecutarOperacion(resultado) {
  const config = window.gt3config;
  if (contadorWin >= limitesPorNivel[config.nivelTrader].win || contadorLoss >= limitesPorNivel[config.nivelTrader].loss) {
    alert("🔴 Sesión cerrada por ratio alcanzado.");
    mostrarResumenFinal();
    return;
  }

  const monto = parseFloat(document.getElementById("montoEditable").value);
  if (isNaN(monto) || monto <= 0) {
    alert("Monto inválido.");
    return;
  }

  const rendimiento = resultado === "win" ? monto * config.payout : 0;
  config.capital += resultado === "win" ? rendimiento : -monto;
  config.capital = Math.round(config.capital * 100) / 100;

  if (resultado === "win") contadorWin++;
  else contadorLoss++;

  const resultadoTotal = resultado === "win" ? monto + rendimiento : 0;

  operaciones.push({
    numero: operacionNumero,
    resultado: resultado.toUpperCase(),
    monto,
    ganancia: rendimiento.toFixed(2),
    resultadoTotal: resultadoTotal.toFixed(2)
  });

  const li = document.createElement("li");
  li.textContent = `#${operacionNumero} ${resultado.toUpperCase()} – Invertido: USD ${monto} – Ganancia: USD ${rendimiento.toFixed(2)} – Resultado: USD ${resultadoTotal.toFixed(2)}`;
  document.getElementById("listaOperaciones").appendChild(li);
  operacionNumero++;

  if (contadorWin >= limitesPorNivel[config.nivelTrader].win || contadorLoss >= limitesPorNivel[config.nivelTrader].loss) {
    alert("🛑 Ratio emocional alcanzado. Cerrando sesión.");
    mostrarResumenFinal();
  }
}

function mostrarResumenFinal() {
  const config = window.gt3config;
  const acumulado = config.capital - config.capitalInicial;

  resumenSesion = `
📘 Resumen de sesión:
ID: ${config.idSesion}
Operador: ${config.nombre}
Broker: ${config.broker}
Nivel: ${config.nivelTrader}
Resultado: ${contadorWin}W / ${contadorLoss}L

💼 Capital inicial: USD ${config.capitalInicial.toFixed(2)}
💰 Capital final: USD ${config.capital.toFixed(2)}
📈 Acumulado: USD ${acumulado.toFixed(2)}

🧭 ¿Qué patrón apareció? ¿Dónde hubo impulso o coherencia?
  `;

  document.getElementById("resumenSesion").innerHTML = resumenSesion.replace(/\n/g, "<br>");
}

function guardarSesion() {
  if (operaciones.length === 0) {
    alert("No hay operaciones para guardar.");
    return;
  }

  let contenido = `GT3.0 – Registro de sesión\n\n`;
  operaciones.forEach(op => {
    contenido += `#${op.numero} ${op.resultado} – Invertido: USD ${op.monto} – Ganancia: USD ${op.ganancia} – Resultado: USD ${op.resultadoTotal}\n`;
  });
  contenido += `\n${resumenSesion}`;

  const blob = new Blob([contenido], { type: "text/plain" });
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = `${window.gt3config.idSesion}.txt`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

function cerrarSesion() {
  mostrarResumenFinal();
}

function nuevaSesion() {
  location.reload();
}

function consultarHistorial() {
  const id = document.getElementById("idConsulta").value.trim();
  if (!id) {
    alert("Ingresá un ID válido.");
    return;
  }
  document.getElementById("resultadoConsulta").innerHTML = `
📂 Usá el archivo descargado: <strong>${id}.txt</strong><br>
🔹 ID ingresado: <strong>${id}</strong>
`;
}
