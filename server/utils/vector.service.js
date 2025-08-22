import { Pinecone } from "@pinecone-database/pinecone";

const pc = new Pinecone({
  apiKey: process.env.PINECONE_API_KEY,
});

const talkVerseIndex = pc.Index("talkverse");

const createMemory = async ({ vectors, metadata, messageId }) => {
  await talkVerseIndex.upsert([
    {
      id: messageId,
      values: vectors,
      metadata,
    },
  ]);
};

const quaryMemory = async ({ quaryVector, limit = 5, metadata }) => {
  const data = await talkVerseIndex.query({
    vector: quaryVector,
    topK: limit,
    filter: metadata || undefined,
    includeMetadata: true,
  });
 return data?.matches ?? [];
};

export { createMemory, quaryMemory };
