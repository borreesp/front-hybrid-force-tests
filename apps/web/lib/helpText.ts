export type HelpCopy = {
  title?: string;
  body: string;
};

type HelpRegistry = Record<string, HelpCopy>;

export const helpText: HelpRegistry = {
  "dashboard.xp": {
    title: "XP total",
    body: "Suma de experiencia ganada. Aumenta con cada WOD registrado o aplicado segun la dificultad y tu nivel."
  },
  "dashboard.sessionsWeek": {
    title: "Tests 7d",
    body: "Numero de tests registrados en los ultimos 7 dias. Sirve para seguir constancia semanal."
  },
  "dashboard.testsTotal": {
    title: "Tests totales",
    body: "Cantidad acumulada de tests registrados. Util para ver volumen historico de mediciones."
  },
  "dashboard.capacities": {
    title: "Capacidades",
    body: "Radar/anel con tus capacidades clave (fuerza, resistencia, metcon, gimnasticos, etc.). Rango 0-100."
  },
  "athlete.radar": {
    title: "Radar de capacidades",
    body: "Comparativa de capacidades frente a tu nivel actual. Util para detectar desequilibrios."
  },
  "athlete.progress": {
    title: "Progreso y nivel",
    body: "Nivel y XP alcanzados. El progreso % indica cuanto falta para el siguiente nivel."
  },
  "wodBuilder.difficultyEstimated": {
    title: "Dificultad estimada",
    body: "0-10 aprox. Calculada con volumen, intensidad y dominio energetico. Ayuda a equilibrar la semana."
  },
  "wodBuilder.energyDomain": {
    title: "Dominio energetico",
    body: "Sistema predominante del WOD (metcon, fuerza, potencia, resistencia). Ayuda a no repetir el mismo dominio seguido."
  },
  "wodBuilder.xpEstimate": {
    title: "XP estimada",
    body: "Experiencia aproximada al aplicar este WOD. Basada en la dificultad y tu nivel."
  },
  "wodBuilder.capacityFocus": {
    title: "Capacidades foco",
    body: "Capacidades mas impactadas por este WOD. Rango 0-100."
  },
  "wodBuilder.muscleLoad": {
    title: "Carga muscular",
    body: "Mide que grupos musculares se repiten en el WOD. Valores altos sugieren moderar volumen o alternar zonas."
  },
  "wodBuilder.timePacing": {
    title: "Tiempo y pacing",
    body: "Duracion total estimada y ritmo sugerido. Util para ajustar descansos y densidad."
  },
  "forms.required": {
    title: "Campo obligatorio",
    body: "Debes rellenar este dato para guardar el WOD. Usa valores realistas."
  },
  "forms.generic": {
    title: "Ayuda de campo",
    body: "Pasa el cursor o enfoca el icono para ver que significa este campo."
  }
};

export function getHelpCopy(key: string): HelpCopy {
  const entry = helpText[key];
  if (!entry && process.env.NODE_ENV !== "production") {
    console.warn(`[helpText] key not found: ${key}`);
  }
  return entry ?? { title: "Ayuda no disponible", body: "No hay descripcion para este elemento todavia." };
}
