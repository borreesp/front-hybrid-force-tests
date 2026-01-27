export type ParsedMovement = {
  name_raw: string;
  movement_id?: number;
  matchConfidence?: number;
  reps?: number;
  load?: number;
  load_unit?: string;
  distance_meters?: number;
  duration_seconds?: number;
  calories?: number;
  mode?: "individual" | "sync" | "shared";
  cap?: boolean;
};

const uid = () => `blk-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`;

export type ParsedScenario = {
  code: string;
  movements: ParsedMovement[];
};

export type ParsedBlock = {
  id: string;
  block_type: "for_time" | "amrap" | "emom" | "intervals" | "rounds" | "unknown";
  title?: string;
  rounds?: number;
  work_seconds?: number;
  rest_seconds?: number;
  pattern?: "A" | "A_B" | "A_B_C" | null;
  scenarios: ParsedScenario[];
};

export type ParsedWod = {
  title?: string;
  notes?: string;
  blocks: ParsedBlock[];
};

const clean = (line: string) => line.replace(/[•\-–—]/g, "").trim();

const parseDurationToSeconds = (raw?: string | null) => {
  if (!raw) return undefined;
  const match = raw.match(/(\d+)\s*(min|m)/i);
  if (match) return Number(match[1]) * 60;
  const sec = raw.match(/(\d+)\s*s(ec)?/i);
  if (sec) return Number(sec[1]);
  return undefined;
};

const parseMovementsLine = (line: string): ParsedMovement[] => {
  const parts = line.split("+").map((p) => clean(p)).filter(Boolean);
  return parts.map((part) => {
    const repsMatch = part.match(/^\s*(\d+)\s+(reps?)?/i);
    const distanceMatch = part.match(/(\d+)\s*m\b/i);
    const calMatch = part.match(/(\d+)\s*cal/i);
    const loadMatch = part.match(/(\d+)\s*(kg|lb|lbs|k?s)/i);
    const secondsMatch = part.match(/(\d+)\s*s(ec)?\b/i);
    const mode = /sync|synchro|pareja|compartido|altern/i.test(part) ? "sync" : undefined;
    let name = part;
    if (part.includes("max")) {
      name = part.replace(/max/gi, "").trim();
    }
    return {
      name_raw: name || "Movimiento",
      reps: repsMatch ? Number(repsMatch[1]) : undefined,
      distance_meters: distanceMatch ? Number(distanceMatch[1]) : undefined,
      calories: calMatch ? Number(calMatch[1]) : undefined,
      load: loadMatch ? Number(loadMatch[1]) : undefined,
      load_unit: loadMatch ? loadMatch[2] : undefined,
      duration_seconds: secondsMatch ? Number(secondsMatch[1]) : undefined,
      mode
    };
  });
};

const detectBlockType = (line: string): ParsedBlock["block_type"] => {
  const upper = line.toUpperCase();
  if (upper.includes("AMRAP")) return "amrap";
  if (upper.includes("EMOM")) return "emom";
  if (upper.includes("FOR TIME")) return "for_time";
  if (upper.includes("ON") && upper.includes("OFF")) return "intervals";
  if (upper.includes("ROUND")) return "rounds";
  return "unknown";
};

const parseBlockHeader = (line: string) => {
  const blockType = detectBlockType(line);
  const duration = parseDurationToSeconds(line);
  const roundsMatch = line.match(/(\d+)\s*round/i);
  const workRestMatch = line.match(/(\d+)\s*on\s*(\d+)\s*off/i);
  const title = clean(line.replace(/[:]/g, ""));
  return {
    blockType,
    duration,
    rounds: roundsMatch ? Number(roundsMatch[1]) : undefined,
    workSeconds: workRestMatch ? Number(workRestMatch[1]) * 60 : undefined,
    restSeconds: workRestMatch ? Number(workRestMatch[2]) * 60 : undefined,
    title
  };
};

const parseScenarioCode = (line: string): string | null => {
  const match = line.trim().match(/^(A|B|C)[\)\:]/i);
  return match ? match[1].toUpperCase() : null;
};

export function parseWodText(rawText: string): ParsedWod {
  const lines = rawText
    .split(/\r?\n/)
    .map((l) => clean(l))
    .filter(Boolean);

  if (!lines.length) {
    return { title: undefined, blocks: [] };
  }

  const titleCandidate = lines[0].length > 6 ? lines[0] : undefined;
  const blocks: ParsedBlock[] = [];
  let currentBlock: ParsedBlock | null = null;

  lines.forEach((line) => {
    const isScenario = parseScenarioCode(line);
    const isHeader = /(AMRAP|EMOM|FOR TIME|ROUND|ON.*OFF)/i.test(line);

    if (isHeader) {
      const header = parseBlockHeader(line);
      currentBlock = {
        id: uid(),
        block_type: header.blockType,
        title: header.title,
        rounds: header.rounds,
        work_seconds: header.workSeconds,
        rest_seconds: header.restSeconds,
        pattern: null,
        scenarios: [{ code: "A", movements: [] }]
      };
      blocks.push(currentBlock);
      return;
    }

    if (!currentBlock) {
      currentBlock = {
        id: uid(),
        block_type: "unknown",
        title: "Bloque detectado",
        scenarios: [{ code: "A", movements: [] }]
      };
      blocks.push(currentBlock);
    }

    if (isScenario) {
      const scenario = { code: isScenario, movements: parseMovementsLine(line.replace(/^[A-C][\)\:]/i, "").trim()) };
      currentBlock.scenarios.push(scenario);
      currentBlock.pattern = "A_B";
      return;
    }

    const movements = parseMovementsLine(line);
    if (!movements.length) return;
    currentBlock.scenarios[0]?.movements.push(...movements);
  });

  return { title: titleCandidate, blocks };
}
