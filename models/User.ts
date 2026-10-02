import "server-only";
import type { Collection, Db } from "mongodb";

export type UserDocument = {
  userId: string;
  email: string | null;
  username: string | null;
  firstName: string | null;
  lastName: string | null;
  imageUrl: string;
  allergies: string[];
  dietary: string[];
  onboardingCompleted: boolean;
  lastSignInAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
};

export type UserCollection = Collection<UserDocument>;

export function getUserModel(database: Db): UserCollection {
  return database.collection<UserDocument>("tracee");
}