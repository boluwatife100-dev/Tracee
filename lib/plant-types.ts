export type PlantCandidate = {
  species: string;
  commonName: string | null;
  confidence: number;
  source?: "owner";
};

export type DiseaseCandidate = {
  name: string;
  confidence: number;
  evidence: string;
};

export type PlantSymptom = {
  name: string;
  detail: string;
};

export type SuggestedCareTask = {
  title: string;
  detail: string;
  dueInDays: number;
  recurrence: string | null;
};

export function asRecord(value: unknown): Record<string, unknown> | null {
  return typeof value === "object" && value !== null
    ? (value as Record<string, unknown>)
    : null;
}

function confidence(value: unknown): number {
  return typeof value === "number" && Number.isFinite(value)
    ? Math.min(1, Math.max(0, value))
    : 0;
}

export function parsePlantCandidates(value: unknown): PlantCandidate[] {
  if (!Array.isArray(value)) return [];
  return value.flatMap((entry) => {
    const candidate = asRecord(entry);
    if (typeof candidate?.species !== "string") return [];
    return [{
      species: candidate.species,
      commonName:
        typeof candidate.commonName === "string" ? candidate.commonName : null,
      confidence: confidence(candidate.confidence),
      ...(candidate.source === "owner" ? { source: "owner" as const } : {}),
    }];
  });
}

export function parsePlantFindings(value: unknown): {
  diseases: DiseaseCandidate[];
  symptoms: PlantSymptom[];
} {
  const record = asRecord(value);
  const diseases = Array.isArray(record?.diseases)
    ? record.diseases.flatMap((entry) => {
        const disease = asRecord(entry);
        if (typeof disease?.name !== "string") return [];
        return [{
          name: disease.name,
          confidence: confidence(disease.confidence),
          evidence:
            typeof disease.evidence === "string" ? disease.evidence : "",
        }];
      })
    : [];
  const symptoms = Array.isArray(record?.symptoms)
    ? record.symptoms.flatMap((entry) => {
        const symptom = asRecord(entry);
        if (
          typeof symptom?.name !== "string" ||
          typeof symptom.detail !== "string"
        ) {
          return [];
        }
        return [{ name: symptom.name, detail: symptom.detail }];
      })
    : [];
  return { diseases, symptoms };
}
