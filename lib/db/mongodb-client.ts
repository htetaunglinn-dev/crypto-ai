import { MongoClient } from 'mongodb';

const uri = process.env.MONGODB_URI;

/** Accounts, saved API keys and the analysis cache need MongoDB; market data does not. */
export const isDatabaseConfigured = Boolean(uri);

const options = {};

let clientPromise: Promise<MongoClient> | null = null;

if (uri) {
  if (process.env.NODE_ENV === 'development') {
    const globalWithMongo = global as typeof globalThis & {
      _mongoClientPromise?: Promise<MongoClient>;
    };

    if (!globalWithMongo._mongoClientPromise) {
      const client = new MongoClient(uri, options);
      globalWithMongo._mongoClientPromise = client.connect();
    }
    clientPromise = globalWithMongo._mongoClientPromise;
  } else {
    const client = new MongoClient(uri, options);
    clientPromise = client.connect();
  }
}

export default clientPromise;
