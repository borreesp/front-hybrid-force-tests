import { useCallback, useEffect, useMemo, useState } from "react";
import { Text, View } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Button, Card, Input, Screen, Section } from "@thrifty/ui";
import { api } from "../../../src/core/api";
import type { Workout, WorkoutExecution, WorkoutResultWithXp } from "../../../src/core/types";
import { ErrorState, EmptyState } from "../../../src/components/State";
import { getTestFormSchema, type TestFormField } from "../../../src/features/tests/testFormSchema";
import { invalidateAfterRepeatWorkout } from "../../../src/query/invalidate";

const parseNumber = (raw: string) => {
  if (raw === undefined || raw === null) return null;
  const cleaned = raw.replace(",", ".");
  if (!cleaned) return null;
  const num = Number(cleaned);
  return Number.isFinite(num) ? num : null;
};

const asRecord = (value: unknown): Record<string, unknown> | null => {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return null;
  }
  return value as Record<string, unknown>;
};

const pickNumber = (...candidates: unknown[]): number | null => {
  for (const candidate of candidates) {
    if (candidate === undefined || candidate === null || candidate === "") continue;
    const num = typeof candidate === "number" ? candidate : parseNumber(String(candidate));
    if (num !== null) return num;
  }
  return null;
};

const extractPrefill = (
  meta: Record<string, unknown> | null,
  fields: TestFormField[]
): Record<string, string> => {
  if (!meta) return {};
  const testInputs = asRecord(meta.test_inputs) ?? meta;
  const out: Record<string, string> = {};

  fields.forEach((field) => {
    const key = field.key;
    let value: number | null = null;

    if (key === "reps") {
      value = pickNumber(testInputs.reps, testInputs.total_reps, testInputs.deadlift_reps);
    } else if (key === "load_kg") {
      value = pickNumber(
        testInputs.load_kg,
        testInputs.load,
        testInputs.deadlift_load,
        testInputs.deadlift_load_kg,
        testInputs.weight_kg,
        testInputs.sled_load,
        testInputs.sled_load_kg
      );
    } else if (key === "bodyweight_kg") {
      value = pickNumber(testInputs.bodyweight_kg, testInputs.bodyweight);
    } else if (key === "carry_meters") {
      value = pickNumber(testInputs.carry_meters, testInputs.meters, testInputs.distance_meters);
    } else if (key === "meters") {
      value = pickNumber(testInputs.meters, testInputs.distance_meters, testInputs.carry_meters);
    } else {
      value = pickNumber(testInputs[key]);
    }

    if (value !== null) {
      out[key] = String(value);
    }
  });

  return out;
};

const buildImpactRows = (impact?: Record<string, number> | null) => {
  if (!impact) return [] as { key: string; value: number }[];
  return Object.entries(impact)
    .map(([key, value]) => ({ key, value: Number(value) }))
    .sort((a, b) => b.value - a.value);
};

export default function ApplyTestScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ workout_id?: string; test_code?: string }>();
  const workoutId = Array.isArray(params.workout_id) ? params.workout_id[0] : params.workout_id;
  const rawTestCode = Array.isArray(params.test_code) ? params.test_code[0] : params.test_code;
  const normalizedTestCode = rawTestCode ? rawTestCode.toUpperCase().trim() : null;

  const schema = useMemo(() => getTestFormSchema(normalizedTestCode), [normalizedTestCode]);
  const [workout, setWorkout] = useState<Workout | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [values, setValues] = useState<Record<string, string>>({});
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<WorkoutResultWithXp | null>(null);
  const [prefilled, setPrefilled] = useState(false);

  const loadWorkout = useCallback(async () => {
    if (!workoutId) {
      setLoading(false);
      setError("Test no encontrado.");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const found = await api.getWorkout(workoutId);
      setWorkout(found ?? null);
    } catch (err: any) {
      setError(err?.message ?? "No pudimos cargar el test.");
    } finally {
      setLoading(false);
    }
  }, [workoutId]);

  useEffect(() => {
    loadWorkout();
  }, [loadWorkout]);

  useEffect(() => {
    if (!schema || prefilled) return;
    let mounted = true;
    (async () => {
      try {
        const executions = await api.getWorkoutExecutions();
        const matching = (executions || []).filter((exec: WorkoutExecution) => {
          const meta = asRecord(exec.execution_meta);
          const code = typeof meta?.test_code === "string" ? meta.test_code.toUpperCase().trim() : null;
          return code === schema.testCode;
        });
        const sorted = matching.sort((a, b) => {
          const aTime = a.executed_at ? new Date(a.executed_at).getTime() : 0;
          const bTime = b.executed_at ? new Date(b.executed_at).getTime() : 0;
          return bTime - aTime;
        });
        const latest = sorted[0];
        if (latest) {
          const prefillValues = extractPrefill(asRecord(latest.execution_meta), schema.fields);
          if (mounted && Object.keys(prefillValues).length > 0) {
            setValues((prev) => {
              const next = { ...prev };
              schema.fields.forEach((field) => {
                if (!next[field.key] && prefillValues[field.key]) {
                  next[field.key] = prefillValues[field.key];
                }
              });
              return next;
            });
          }
        }
      } catch {
        // ignore prefill errors
      } finally {
        if (mounted) setPrefilled(true);
      }
    })();
    return () => {
      mounted = false;
    };
  }, [schema, prefilled]);

  useEffect(() => {
    if (!result) return;
    const timer = setTimeout(() => {
      router.replace("/(tabs)");
    }, 1200);
    return () => clearTimeout(timer);
  }, [result, router]);

  const handleChange = (field: TestFormField, text: string) => {
    setValues((prev) => ({ ...prev, [field.key]: text }));
    if (fieldErrors[field.key]) {
      setFieldErrors((prev) => ({ ...prev, [field.key]: "" }));
    }
  };

  const validateForm = () => {
    if (!schema) return false;
    const nextErrors: Record<string, string> = {};
    schema.fields.forEach((field) => {
      const raw = values[field.key];
      if (!raw || raw.trim() === "") {
        if (field.required) {
          nextErrors[field.key] = "Campo requerido";
        }
        return;
      }
      const num = parseNumber(raw.trim());
      if (num === null) {
        nextErrors[field.key] = "Valor inválido";
        return;
      }
      if (field.min !== undefined && num < field.min) {
        nextErrors[field.key] = `Mínimo ${field.min}`;
      }
    });
    setFieldErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!schema || !workoutId) return;
    if (!validateForm()) return;

    const testInputs: Record<string, number> = {};
    schema.fields.forEach((field) => {
      const raw = values[field.key];
      if (!raw || raw.trim() === "") return;
      const num = parseNumber(raw.trim());
      if (num === null) return;
      testInputs[field.key] = num;
    });

    setSubmitting(true);
    setError(null);
    setFieldErrors({});
    try {
      const response = await api.submitTestResult(workoutId, {
        test_code: schema.testCode,
        test_inputs: testInputs,
        total_time_sec: schema.durationSeconds,
      });
      setResult(response);
      invalidateAfterRepeatWorkout();
    } catch (err: any) {
      const details = err?.details;
      const nextFieldErrors: Record<string, string> = {};

      if (details && Array.isArray(details.detail)) {
        details.detail.forEach((item: any) => {
          const loc = Array.isArray(item?.loc) ? item.loc : [];
          const msg = item?.msg || item?.message || "Valor inválido";
          const testInputsIndex = loc.indexOf("test_inputs");
          if (testInputsIndex >= 0 && loc[testInputsIndex + 1]) {
            const key = String(loc[testInputsIndex + 1]);
            nextFieldErrors[key] = msg;
          }
        });
      }

      if (Object.keys(nextFieldErrors).length > 0) {
        setFieldErrors(nextFieldErrors);
      } else {
        setError(err?.message ?? "No pudimos guardar el resultado.");
      }
    } finally {
      setSubmitting(false);
    }
  };

  const impactRows = useMemo(() => buildImpactRows(result?.capacity_impact ?? null), [result]);

  return (
    <Screen>
      <Section title="Aplicar test" description="Registra tu resultado.">
        {loading ? (
          <Card>
            <Text className="text-sm text-slate-300">Cargando test...</Text>
          </Card>
        ) : null}

        {error && !loading ? <ErrorState message={error} /> : null}

        {!schema && !loading ? (
          <EmptyState
            title="Test sin formulario"
            description="No se encontró la configuración de este test."
          />
        ) : null}

        {schema && !loading ? (
          <>
            <Card>
              <Text className="text-lg font-semibold text-white">{schema.title}</Text>
              {workout?.title && workout.title !== schema.title ? (
                <Text className="text-xs text-slate-400 mt-1">{workout.title}</Text>
              ) : null}
              {schema.description ? (
                <Text className="text-sm text-slate-300 mt-2">{schema.description}</Text>
              ) : null}
            </Card>

            <Card title="Resultados">
              {schema.fields.map((field) => (
                <View key={field.key}>
                  <Input
                    label={field.label}
                    hint={field.hint}
                    keyboardType="numeric"
                    inputMode="numeric"
                    value={values[field.key] ?? ""}
                    placeholder={field.placeholder}
                    onChangeText={(text) => handleChange(field, text)}
                  />
                  {fieldErrors[field.key] ? (
                    <Text className="text-xs text-amber-300 mb-2">
                      {fieldErrors[field.key]}
                    </Text>
                  ) : null}
                </View>
              ))}
              <Button
                className="mt-2"
                label={submitting ? "Guardando..." : "Enviar resultado"}
                onPress={handleSubmit}
                disabled={submitting}
              />
            </Card>
          </>
        ) : null}

        {result ? (
          <Card title="Resultado registrado">
            <Text className="text-sm text-slate-200">Score: {result.test_score ?? "-"}</Text>
            {impactRows.length > 0 ? (
              <View className="mt-2 gap-1">
                {impactRows.slice(0, 5).map((row) => (
                  <Text key={row.key} className="text-xs text-slate-300">
                    {row.key}: {row.value.toFixed(1)}
                  </Text>
                ))}
              </View>
            ) : null}
            <Text className="text-xs text-slate-500 mt-2">
              Volviendo al dashboard...
            </Text>
            <Button
              className="mt-3"
              label="Volver al dashboard"
              variant="secondary"
              onPress={() => router.replace("/(tabs)")}
            />
          </Card>
        ) : null}
      </Section>
    </Screen>
  );
}
