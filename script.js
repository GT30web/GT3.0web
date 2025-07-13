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
  let mensajeViabilidad = "";

  if (metaDiaria > 0 && metaDiaria > gananciaPosible) {
    metaViable = false;
    mensajeViabilidad = `
⚠️ Meta establecida: USD ${metaDiaria} excede lo viable para nivel ${nivelTrader}
📉 Ganancia esperada máxima: USD ${gananciaPosible.toFixed(2)} (${ratio}W con riesgo ${nivelRiesgo})
💡 Sugerencias:
– Reducí la meta
– Subí nivel de trader (⚠️ implica mayor riesgo de pérdida)
`;
    alert(mensajeViabilidad);
    return;
  }

  const ahora = new Date();
  const fecha = ahora.toISOString().slice(0, 10);
  const hora = ahora.toTimeString().slice(0, 5).replace(":", "-");
  const idSesion = `GT3_${fecha}_${hora}_${nombre}`;

  document.getElementById("config").style.display = "none";
  document.getElementById("estadoSesion").style.display = "block";
  document.getElementById("registroOperaciones").style.display = "block";

  document.getElementById("datosSesion").innerHTML = `
    🆔 ID de sesión: ${idSesion}<br>
    👤 Operador: ${nombre}<br>
    💼 Capital inicial: USD ${capital.toFixed(2)}<br>
    🏦 Broker: ${broker}<br>
    🧠 Nivel: ${nivelTrader}<br>
    ⚠️ Riesgo: ${nivelRiesgo}<br>
    🛠️ Modo: ${modoOperativo}<br>
    🎯 Meta: USD ${metaDiaria.toFixed(2)}<br>
    📊 Payout: ${payout}
  `;

  window.gt3config = {
    nombre,
    capital,
    capitalInicial: capital,
    broker,
    nivelTrader,
    nivelRiesgo,
    modoOperativo,
    metaDiaria,
    payout,
    maxMontoPorOp,
    ratio,
    metaViable,
    idSesion
  };
}

function calcularMonto() {
  const config = window.gt3config;
  let riesgoBase = config.nivelRiesgo === "Conservador" ? 0.02 :
                   config.nivelRiesgo === "Moderado" ? 0.05 : 0.10;

  let monto = 0;

  const acumuladoActual = config.capital - config.capitalInicial;
  const restanteMeta = config.metaDiaria - acumuladoActual;

  const winsRestantes = limitesPorNivel[config.nivelTrader].win - contadorWin;
  const operacionesRestantes = winsRestantes;

  if (config.modoOperativo === "Adaptativo" && config.metaDiaria > 0 && config.metaViable) {
    const montoNecesarioPorWin = restanteMeta / (operacionesRestantes * config.payout);
    monto = Math.min(config.capital * riesgoBase, montoNecesarioPorWin);
  } else if (config.modoOperativo === "Fijo") {
    monto = config.capital * riesgoBase;
  } else if (config.modoOperativo === "Compuesto") {
    let excedente = config.capital - config.capitalInicial;
    monto = excedente > 0 ? excedente * 0.10 : 0;
  } else {
    let factor = (contadorWin - contadorLoss) >= 0 ? 1.1 : 0.9;
    monto = config.capital * riesgoBase * factor;
  }

  monto = Math.round(monto * 100) / 100;

  const mensaje = config.modoOperativo === "Adaptativo" && config.metaDiaria > 0 && config.metaViable
    ? `🎯 Meta restante: USD ${restanteMeta.toFixed(2)} – Quedan ${operacionesRestantes} operaciones – Sugerencia: USD ${monto} por entrada`
    : `💡 Sugerencia: operá USD ${monto} según el modo ${config.modoOperativo} y riesgo ${config.nivelRiesgo}`;

  document.getElementById("montoSugerido").innerHTML = mensaje;
  document.getElementById("montoEditable").value = monto;
}


function registrarResultado(letra) {
  const resultado = letra === "W" ? "win" : "loss";
  ejecutarOperacion(resultado);
}

function ejecutarOperacion(resultado) {
  const config = window.gt3config;
  if (contadorWin >= limitesPorNivel[config.nivelTrader].win || contadorLoss >= limitesPorNivel[config.nivelTrader].loss) {
    alert("🔴 Sesión cerrada por ratio emocional alcanzado.");
    mostrarResumenFinal();
    return;
  }

  const monto = parseFloat(document.getElementById("montoEditable").value);
  if (isNaN(monto) || monto <= 0) {
    alert("Monto inválido.");
    return;
  }

  const rendimiento = resultado === "win" ? monto * config.payout : 0;
  const resultadoOperacion = resultado === "win"
    ? monto + rendimiento
    : 0;

  config.capital = resultado === "win"
    ? config.capital + rendimiento
    : config.capital - monto;

  config.capital = Math.round(config.capital * 100) / 100;

  if (resultado === "win") contadorWin++;
  else contadorLoss++;

  operaciones.push({
    numero: operacionNumero,
    resultado: resultado.toUpperCase(),
    monto,
    resultadoOperacion: resultadoOperacion.toFixed(2)
  });

  const item = document.createElement("li");
  item.innerHTML = `#${operacionNumero} – ${resultado.toUpperCase()} – Monto operado: USD ${monto} – Resultado: USD ${resultadoOperacion.toFixed(2)}`;
  document.getElementById("listaOperaciones").appendChild(item);

  operacionNumero++;

  if (contadorWin >= limitesPorNivel[config.nivelTrader].win || contadorLoss >= limitesPorNivel[config.nivelTrader].loss) {
    alert("🛑 Ratio alcanzado. Cerrando sesión.");
    mostrarResumenFinal();
  }
}

function mostrarResumenFinal() {
  const config = window.gt3config;
  const capitalInicial = config.capitalInicial;
  const capitalFinal = config.capital;
  const capitalAcumulado = capitalFinal - capitalInicial;

  resumenSesion = `
📘 Resumen de sesión:
ID: ${config.idSesion}
Operador: ${config.nombre}
Broker: ${config.broker}
Nivel: ${config.nivelTrader}
Resultado: ${contadorWin}W / ${contadorLoss}L

💼 Capital inicial: USD ${capitalInicial.toFixed(2)}
💰 Capital final: USD ${capitalFinal.toFixed(2)}
📈 Acumulado neto: USD ${capitalAcumulado.toFixed(2)}

🧭 ¿Qué patrón se repitió? ¿Dónde apareció impulso o congruencia?
`;

  const div = document.createElement("div");
  div.innerHTML = resumenSesion.replace(/\n/g, "<br>");
  document.body.appendChild(div);
}

function guardarSesion() {
  if (operaciones.length === 0) {
    alert("No hay operaciones para guardar.");
    return;
  }

  let contenido = `GT3.0 – Registro de sesión\n\n`;
  operaciones.forEach(op => {
    contenido += `#${op.numero} ${op.resultado} – Monto: USD ${op.monto} – Resultado: USD ${op.resultadoOperacion}\n`;
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
    alert("Ingresá un ID de sesión válido.");
    return;
  }

  document.getElementById("resultadoConsulta").innerHTML = `
📂 Historial no disponible internamente. Usá el archivo descargado: <strong>${id}.txt</strong><br>
🔹 ID ingresado: <strong>${id}</strong>
`;
}
