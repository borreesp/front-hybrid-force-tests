export type HelpCopy = {
  title?: string;
  body: string;
};

type HelpRegistry = Record<string, HelpCopy>;

export const helpText: HelpRegistry = {
  "dashboard.xp": {
    title: "XP total",
    body: "Suma de experiencia que has ganado. No tiene tope fijo: cada WOD analizado o aplicado añade XP según dificultad y tu nivel. Ejemplo: un WOD intenso puede darte +120 XP."
  },
  "dashboard.sessionsWeek": {
    title: "Sesiones semana",
    body: "Número de WODs registrados en los últimos 7 días. Te sirve para seguir consistencia semanal. Ejemplo: si hoy hiciste 2 y ayer 1, verás 3."
  },
  "dashboard.load7d": {
    title: "Carga 7d",
    body: "Carga aguda acumulada de los últimos 7 días. Escala con el impacto de cada WOD (fatiga, volumen, intensidad). Si aumenta rápido, modera la intensidad."
  },
  "dashboard.fatigue": {
    title: "Fatiga",
    body: "Va de 0 a 100. Sube según el impacto de los WODs y tu nivel; valores altos sugieren bajar intensidad o priorizar recuperación. Ejemplo: de 35 a 70 tras dos WODs duros."
  },
  "dashboard.capacities": {
    title: "Capacidades",
    body: "Radar/anel con tus capacidades clave (fuerza, resistencia, metcon, gimnásticos, etc.). Rango 0-100. Sube cuando acumulas entrenos que trabajan esa capacidad."
  },
  "dashboard.weeklyLoad": {
    title: "Carga semanal",
    body: "Barras por día con carga aguda y crónica. Rango habitual 0-300. Úsalo para ver picos y equilibrar la semana. Ejemplo: 3 WODs el domingo → barra más alta."
  },
  "athlete.radar": {
    title: "Radar de capacidades",
    body: "Comparativa de tus capacidades frente a tu nivel actual. Rango 0-100. Útil para detectar desequilibrios (p.ej. gimnásticos bajos vs. metcon alto)."
  },
  "athlete.fatigueStatus": {
    title: "Estado de fatiga",
    body: "Resumen de tu carga y fatiga actuales. Si la fatiga y ratio son altos, limita intensidad o sube descanso. Objetivo de ratio 0.8-1.2."
  },
  "athlete.loadRatio": {
    title: "Load ratio",
    body: "Relación entre carga aguda y crónica. Ideal 0.8–1.2. >1.2 indica pico; <0.8 señala baja carga reciente."
  },
  "athlete.progress": {
    title: "Progreso y nivel",
    body: "Nivel y XP alcanzados. El progreso % indica cuánto falta para el siguiente nivel. Entrenos más duros aceleran la subida."
  },
  "athlete.metrics.hrRest": {
    title: "FC reposo",
    body: "Frecuencia cardiaca en reposo (bpm). Rango típico 40–80. Bajadas sostenidas pueden indicar mejora aeróbica; subidas repentinas, fatiga."
  },
  "athlete.metrics.vo2": {
    title: "VO2 estimado",
    body: "Consumo máximo de oxígeno estimado (ml/kg/min). A mayor valor, mejor capacidad aeróbica. Mejora con trabajo de resistencia y metcon."
  },
  "athlete.metrics.recovery": {
    title: "Recuperación (h)",
    body: "Horas estimadas para recuperar tras la carga reciente. Alto → espera o baja intensidad; bajo → listo para entrenar fuerte."
  },
  "trainingLoad.acute": {
    title: "Carga aguda",
    body: "Carga reciente (día/semana). Sube con cada WOD según su impacto. Úsala para evitar picos bruscos."
  },
  "trainingLoad.chronic": {
    title: "Carga crónica",
    body: "Promedio de carga de las últimas 1–3 semanas. Más estable; protege frente a lesiones si crece de forma gradual."
  },
  "trainingLoad.ratio": {
    title: "Ratio carga",
    body: "Relación aguda/crónica. Objetivo 0.8–1.2. Por encima, riesgo de fatiga/lesión; por debajo, posible falta de estímulo."
  },
  "wod.fatigueReal": {
    title: "Fatiga real",
    body: "Estimación de fatiga del WOD. Rango 0–100. Incluye intensidad, dominio energético y transferencia HYROX si aplica."
  },
  "wod.capacityFocus": {
    title: "Capacidades foco",
    body: "Capacidades más impactadas por el WOD (ej. resistencia 88/100). Úsalas para balancear la semana."
  },
  "wod.athleteImpact": {
    title: "Impacto en tu perfil",
    body: "Cómo cambia tu estado tras aplicar el WOD (fatiga, carga, capacidades). Valores positivos indican aumento; revisa fatiga antes de otro WOD duro."
  },
  "wodBuilder.fatigueEstimated": {
    title: "Fatiga estimada",
    body: "0–10 (aprox). Calculada con volumen, intensidad y dominio energético. Úsala para equilibrar la semana: >7 es un WOD exigente."
  },
  "wodBuilder.energyDomain": {
    title: "Dominio energético",
    body: "Qué sistema predomina en el WOD (metcon, fuerza, potencia, resistencia). Te ayuda a no repetir el mismo dominio varios días seguidos."
  },
  "wodBuilder.xpEstimate": {
    title: "XP estimada",
    body: "Experiencia aproximada que ganarías al aplicar este WOD. Basada en la fatiga y tu nivel: más fatiga → más XP; niveles altos progresan un poco más lento."
  },
  "wodBuilder.capacityFocus": {
    title: "Capacidades foco",
    body: "Capacidades más impactadas por este WOD. Rango 0–100. Sirve para ver si el bloque refuerza fuerza, resistencia, gimnásticos, etc."
  },
  "wodBuilder.muscleLoad": {
    title: "Carga muscular",
    body: "Mide qué grupos musculares se repiten en el WOD. Valores altos en un mismo grupo sugieren moderar volumen o alternar zonas en la semana."
  },
  "wodBuilder.timePacing": {
    title: "Tiempo y pacing",
    body: "Duración total estimada y ritmo sugerido. Útil para ajustar descansos y densidad: más tiempo o pacing rápido suben fatiga."
  },
  "wodBuilder.blockType": {
    title: "Tipo de bloque",
    body: "STANDARD: lista simple de movimientos. ROUNDS: repite escenario(s) N veces sin descanso. INTERVALS: trabajo/descanso por escenario con patrón A/B."
  },
  "wodBuilder.executionMode": {
    title: "Modo de ejecución",
    body: "INDIVIDUAL: cada atleta hace su parte. SÍNCRO: se mueven a la vez (más fatiga). COMPARTIDO/SHARED: alternan, fatiga menor por descansos."
  },
  "wodBuilder.rounds": {
    title: "Rounds / escenarios",
    body: "Cuántas veces repites el escenario (A/B...). Más rounds = más volumen/fatiga. Útil para EMOM/AMRAP por intervalos o series cortas."
  },
  "wodBuilder.workRest": {
    title: "Trabajo y descanso",
    body: "En intervalos, el trabajo por escenario (work_seconds) y el descanso entre escenarios (rest_seconds) ajustan densidad y fatiga total."
  },
  "forms.required": {
    title: "Campo obligatorio",
    body: "Debes rellenar este dato para guardar el WOD. Usa valores realistas; si no aplica, deja vacío sólo si el campo es opcional."
  },
  "forms.generic": {
    title: "Ayuda de campo",
    body: "Pasa el cursor o enfoca el icono para ver qué significa este campo y cómo rellenarlo. Usa valores realistas y consistentes."
  }
};

export function getHelpCopy(key: string): HelpCopy {
  const entry = helpText[key];
  if (!entry && process.env.NODE_ENV !== "production") {
    console.warn(`[helpText] key not found: ${key}`);
  }
  return entry ?? { title: "Ayuda no disponible", body: "No hay descripción para este elemento todavía." };
}
