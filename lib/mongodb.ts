import "server-only";
import type { User } from "@clerk/nextjs/server";
import { MongoClient } from "mongodb";
import type { PreferenceSelection } from "@/lib/api";
import {
  getUserModel,
  type UserCollection,
  type UserDocument,
} from "@/models/User";

const globalForMongo = globalThis as typeof globalThis & {
  traceeMongoClientPromise?: Promise<MongoClient>;
};

let productionClientPromise: Promise<MongoClient> | undefined;
let userCollectionPromise: Promise<UserCollection> | undefined;

function getMongoClientPromise(): Promise<MongoClient> {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    throw new Error("MONGODB_URI must be configured to use MongoDB.");
  }

  if (process.env.NODE_ENV === "development") {
    globalForMongo.traceeMongoClientPromise ??= new MongoClient(uri).connect();
    return globalForMongo.traceeMongoClientPromise;
  }

  productionClientPromise ??= new MongoClient(uri).connect();
  return productionClientPromise;
}

export async function getUserCollection(): Promise<UserCollection> {
  userCollectionPromise ??= (async () => {
    const client = await getMongoClientPromise();
    const collection = getUserModel(client.db());
    await collection.createIndex({ userId: 1 }, { unique: true });
    return collection;
  })();

  return userCollectionPromise;
}

export async function syncTraceeUser(
  user: User,
  selection?: PreferenceSelection
): Promise<void> {
  const collection = await getUserCollection();
  const now = new Date();
  const primaryEmail = user.emailAddresses.find(
    (email) => email.id === user.primaryEmailAddressId
  );

  const profile: Partial<UserDocument> = {
    userId: user.id,
    email: primaryEmail?.emailAddress ?? null,
    username: user.username,
    firstName: user.firstName,
    lastName: user.lastName,
    imageUrl: user.imageUrl,
    lastSignInAt:
      user.lastSignInAt === null ? null : new Date(user.lastSignInAt),
    updatedAt: now,
  };

  const setOnInsert: Partial<UserDocument> = {
    createdAt: new Date(user.createdAt),
    ...(selection
      ? {}
      : { allergies: [], dietary: [], onboardingCompleted: false }),
  };

  await collection.updateOne(
    { userId: user.id },
    {
      $set: {
        ...profile,
        ...(selection ? { ...selection, onboardingCompleted: true } : {}),
      },
      $setOnInsert: setOnInsert,
    },
    { upsert: true }
  );
}

export async function isOnboardingComplete(userId: string): Promise<boolean> {
  const collection = await getUserCollection();
  const record = await collection.findOne(
    { userId },
    { projection: { onboardingCompleted: 1 } }
  );

  return record?.onboardingCompleted === true;
}