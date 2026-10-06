import type { Collection, Db } from "mongodb";

export type ScanDocument = {
  userId: string;
  kind: "product" | "plant";
  photoPublicIds: {
    front: string;
    back?: string;
  };
  ocrText: string;
  ocrConfidence: number | null;
  ocrReviewedAt: Date | null;
  mediaConsentAt: Date;
  status: "awaiting_catalog" | "awaiting_plant_diagnosis";
  createdAt: Date;
};

export type ScanCollection = Collection<ScanDocument>;

export function getScanModel(database: Db): ScanCollection {
  return database.collection<ScanDocument>("scans");
}