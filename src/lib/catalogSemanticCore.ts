import { createHash } from "node:crypto";
import { tmpdir } from "node:os";
import path from "node:path";

import { CATEGORY_GROUP_META } from "@/lib/catalog";
import { prisma } from "@/lib/prisma";

const TRANSFORMERS_CACHE_DIR =
  process.env.TRANSFORMERS_CACHE_DIR ||
  path.join(tmpdir(), "alternative-location-transformers");
const EMBEDDING_BATCH_SIZE = 24;
const DEFAULT_SEARCH_LIMIT = 18;

type SemanticSearchMode = "semantic" | "approximate" | "none" | "unavailable";

type SemanticSearchResult = {
  mode: SemanticSearchMode;
  itemIds: string[];
};

type EmbeddingTensor = {
  data: ArrayLike<number>;
  dims: number[];
};

type EmbeddingExtractor = (
  input: string | string[],
  options?: {
    pooling?: "mean" | "cls";
    normalize?: boolean;
  }
) => Promise<EmbeddingTensor>;

type EmbeddingDType =
  | "auto"
  | "fp32"
  | "fp16"
  | "int8"
  | "uint8"
  | "q8"
  | "q4"
  | "bnb4"
  | "q4f16"
  | "q2"
  | "q2f16"
  | "q1"
  | "q1f16";

const SUPPORTED_EMBEDDING_DTYPES: EmbeddingDType[] = [
  "auto",
  "fp32",
  "fp16",
  "int8",
  "uint8",
  "q8",
  "q4",
  "bnb4",
  "q4f16",
  "q2",
  "q2f16",
  "q1",
  "q1f16",
];

function parseEmbeddingDType(value: string | undefined): EmbeddingDType {
  if (!value) return "q8";
  return SUPPORTED_EMBEDDING_DTYPES.includes(value as EmbeddingDType)
    ? (value as EmbeddingDType)
    : "q8";
}

const SEMANTIC_EMBEDDING_MODEL =
  process.env.HF_EMBEDDING_MODEL || "Xenova/paraphrase-multilingual-MiniLM-L12-v2";
const SEMANTIC_EMBEDDING_DTYPE = parseEmbeddingDType(process.env.HF_EMBEDDING_DTYPE);
const SEMANTIC_EMBEDDING_KEY = `hf:${SEMANTIC_EMBEDDING_MODEL}:${SEMANTIC_EMBEDDING_DTYPE}`;

async function fetchSearchableItems() {
  return prisma.item.findMany({
    where: { active: true },
    include: {
      category: true,
      embedding: true,
    },
    orderBy: { name: "asc" },
  });
}

type SearchableItem = Awaited<ReturnType<typeof fetchSearchableItems>>[number];

type EmbeddingCandidate = {
  itemId: string;
  sourceText: string;
  contentHash: string;
  storedVector: number[] | null;
  shouldRefresh: boolean;
};

let embeddingExtractorPromise: Promise<EmbeddingExtractor> | null = null;

function normalizeVector(vector: number[]) {
  const magnitude = Math.sqrt(
    vector.reduce((sum, value) => sum + value * value, 0)
  );

  if (!Number.isFinite(magnitude) || magnitude === 0) {
    return vector;
  }

  return vector.map((value) => value / magnitude);
}

function dotProduct(left: number[], right: number[]) {
  if (left.length === 0 || right.length === 0 || left.length !== right.length) {
    return 0;
  }

  let sum = 0;
  for (let index = 0; index < left.length; index += 1) {
    sum += left[index] * right[index];
  }

  return sum;
}

function isNumberArray(value: unknown): value is number[] {
  return Array.isArray(value) && value.every((entry) => typeof entry === "number");
}

function readStoredEmbeddingVector(item: SearchableItem) {
  const rawEmbedding = item.embedding?.embedding;
  return isNumberArray(rawEmbedding) ? rawEmbedding : null;
}

function buildItemEmbeddingText(item: SearchableItem) {
  const category = item.category;
  const groupMeta = category ? CATEGORY_GROUP_META[category.group] : null;

  return [
    `Article: ${item.name}`,
    item.description ? `Description: ${item.description}` : null,
    category ? `Categorie: ${category.name}` : null,
    category?.description
      ? `Description de categorie: ${category.description}`
      : null,
    groupMeta ? `Famille: ${groupMeta.label}` : null,
    groupMeta?.description
      ? `Description de famille: ${groupMeta.description}`
      : null,
    item.unit ? `Unite: ${item.unit}` : null,
    item.totalQty > 0 ? `Quantite disponible: ${item.totalQty}` : null,
  ]
    .filter(Boolean)
    .join("\n");
}

function buildQueryEmbeddingText(query: string) {
  return [
    "Recherche semantique locale dans un catalogue de location de materiel evenementiel.",
    `Recherche utilisateur: ${query.trim()}`,
  ].join("\n");
}

function buildContentHash(sourceText: string) {
  return createHash("sha256")
    .update(`${SEMANTIC_EMBEDDING_KEY}\n${sourceText}`)
    .digest("hex");
}

function buildEmbeddingCandidate(item: SearchableItem): EmbeddingCandidate {
  const sourceText = buildItemEmbeddingText(item);
  const contentHash = buildContentHash(sourceText);
  const storedVector = readStoredEmbeddingVector(item);
  const shouldRefresh =
    !item.embedding ||
    item.embedding.embeddingModel !== SEMANTIC_EMBEDDING_KEY ||
    item.embedding.contentHash !== contentHash ||
    !storedVector;

  return {
    itemId: item.id,
    sourceText,
    contentHash,
    storedVector,
    shouldRefresh,
  };
}

async function getEmbeddingExtractor() {
  if (!embeddingExtractorPromise) {
    embeddingExtractorPromise = (async () => {
      const { LogLevel, env, pipeline } = await import("@huggingface/transformers");
      env.logLevel = LogLevel.ERROR;
      env.cacheDir = TRANSFORMERS_CACHE_DIR;

      return (await pipeline("feature-extraction", SEMANTIC_EMBEDDING_MODEL, {
        dtype: SEMANTIC_EMBEDDING_DTYPE,
      })) as EmbeddingExtractor;
    })();
  }

  return embeddingExtractorPromise;
}

function splitEmbeddingTensor(output: EmbeddingTensor) {
  const dimensions = output.dims.at(-1) ?? 0;
  if (dimensions <= 0) return [];

  const flatValues = Array.from(output.data || []);
  if (flatValues.length === 0) return [];

  const batchSize = output.dims.length > 1 ? output.dims[0] : 1;
  const vectors: number[][] = [];

  for (let index = 0; index < batchSize; index += 1) {
    const start = index * dimensions;
    const end = start + dimensions;
    vectors.push(normalizeVector(flatValues.slice(start, end)));
  }

  return vectors;
}

async function createEmbeddings(inputs: string[]) {
  if (inputs.length === 0) return [];

  const extractor = await getEmbeddingExtractor();
  const output = await extractor(inputs, {
    pooling: "mean",
    normalize: true,
  });

  return splitEmbeddingTensor(output);
}

async function refreshEmbeddingCandidates(candidates: EmbeddingCandidate[]) {
  const refreshedVectors = new Map<string, number[]>();
  const candidatesToRefresh = candidates.filter((candidate) => candidate.shouldRefresh);

  for (let index = 0; index < candidatesToRefresh.length; index += EMBEDDING_BATCH_SIZE) {
    const batch = candidatesToRefresh.slice(index, index + EMBEDDING_BATCH_SIZE);
    const rawEmbeddings = await createEmbeddings(batch.map((candidate) => candidate.sourceText));
    const normalizedEmbeddings = rawEmbeddings.map((embedding) =>
      normalizeVector(embedding)
    );

    await prisma.$transaction(
      batch.map((candidate, batchIndex) =>
        prisma.itemEmbedding.upsert({
          where: { itemId: candidate.itemId },
          update: {
            contentHash: candidate.contentHash,
            embeddingModel: SEMANTIC_EMBEDDING_KEY,
            sourceText: candidate.sourceText,
            embedding: normalizedEmbeddings[batchIndex],
            dimensions: normalizedEmbeddings[batchIndex].length,
          },
          create: {
            itemId: candidate.itemId,
            contentHash: candidate.contentHash,
            embeddingModel: SEMANTIC_EMBEDDING_KEY,
            sourceText: candidate.sourceText,
            embedding: normalizedEmbeddings[batchIndex],
            dimensions: normalizedEmbeddings[batchIndex].length,
          },
        })
      )
    );

    batch.forEach((candidate, batchIndex) => {
      refreshedVectors.set(candidate.itemId, normalizedEmbeddings[batchIndex]);
    });
  }

  return refreshedVectors;
}

async function ensureItemEmbeddings(items: SearchableItem[]) {
  const candidates = items.map(buildEmbeddingCandidate);
  const vectorMap = new Map<string, number[]>();

  candidates.forEach((candidate) => {
    if (!candidate.shouldRefresh && candidate.storedVector) {
      vectorMap.set(candidate.itemId, candidate.storedVector);
    }
  });

  if (candidates.some((candidate) => candidate.shouldRefresh)) {
    const refreshedVectors = await refreshEmbeddingCandidates(candidates);
    refreshedVectors.forEach((vector, itemId) => {
      vectorMap.set(itemId, vector);
    });
  }

  return vectorMap;
}

function selectSemanticMatches(
  scoredItems: Array<{ itemId: string; score: number }>,
  limit: number
): SemanticSearchResult {
  if (scoredItems.length === 0) {
    return { mode: "none", itemIds: [] };
  }

  const topScore = scoredItems[0].score;
  if (!Number.isFinite(topScore) || topScore <= 0) {
    return { mode: "none", itemIds: [] };
  }

  const semanticThreshold = Math.max(0.28, topScore - 0.08);
  const semanticMatches = scoredItems
    .filter(({ score }) => score >= semanticThreshold)
    .slice(0, limit);

  if (semanticMatches.length > 0) {
    return {
      mode: semanticMatches[0].score >= 0.45 ? "semantic" : "approximate",
      itemIds: semanticMatches.map(({ itemId }) => itemId),
    };
  }

  const approximateThreshold = Math.max(0.18, topScore - 0.05);
  const approximateMatches = scoredItems
    .filter(({ score }) => score >= approximateThreshold)
    .slice(0, limit);

  if (approximateMatches.length > 0) {
    return {
      mode: "approximate",
      itemIds: approximateMatches.map(({ itemId }) => itemId),
    };
  }

  return { mode: "none", itemIds: [] };
}

export async function syncItemSemanticEmbedding(itemId: string) {
  const item = await prisma.item.findUnique({
    where: { id: itemId },
    include: {
      category: true,
      embedding: true,
    },
  });

  if (!item || !item.active) return;

  await ensureItemEmbeddings([item]);
}

export async function syncAllItemSemanticEmbeddings() {
  const items = await fetchSearchableItems();
  if (items.length === 0) {
    return {
      totalItems: 0,
    };
  }

  await ensureItemEmbeddings(items);

  return {
    totalItems: items.length,
  };
}

export async function searchCatalogSemantically(
  query: string,
  limit = DEFAULT_SEARCH_LIMIT
): Promise<SemanticSearchResult> {
  const normalizedQuery = query.trim();

  if (!normalizedQuery) {
    return { mode: "none", itemIds: [] };
  }

  const items = await fetchSearchableItems();
  if (items.length === 0) {
    return { mode: "none", itemIds: [] };
  }

  const [itemVectors, queryEmbeddings] = await Promise.all([
    ensureItemEmbeddings(items),
    createEmbeddings([buildQueryEmbeddingText(normalizedQuery)]),
  ]);

  const normalizedQueryVector = normalizeVector(queryEmbeddings[0] || []);
  const scoredItems = items
    .map((item) => ({
      itemId: item.id,
      score: dotProduct(normalizedQueryVector, itemVectors.get(item.id) || []),
    }))
    .filter(({ score }) => Number.isFinite(score))
    .sort((left, right) => right.score - left.score);

  return selectSemanticMatches(scoredItems, limit);
}
