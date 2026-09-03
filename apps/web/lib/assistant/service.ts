import { Prisma } from "@prisma/client";

import { prisma } from "@/lib/db/prisma";
import { auth } from "@/lib/auth";
import {
  assistantResponseSchema,
  assistantRequestSchema,
  type AssistantResponse,
  type AssistantCitationRecord,
  type AssistantRequest,
} from "@/lib/db/zod/assistant";
import { buildKnowledgeDocuments, loadTenantDataset, type KnowledgeDocument } from "@/lib/assistant/knowledge-base";
import { getAssistantProvider, getFallbackAssistantProvider } from "@/lib/assistant/providers";
import { retrieveRelevantDocuments } from "@/lib/assistant/retrieval";
import { loadAutomationKnowledgeDocuments } from "@/lib/automation/simulator";

const SUPER_ADMIN_EMAIL = "achyutunivk@gmail.com";

type SessionActor = {
  userId: string | null;
  email: string | null;
  isSuperAdmin: boolean;
  tenantId: string | null;
};

function toCitation(document: ReturnType<typeof retrieveRelevantDocuments>[number]): AssistantCitationRecord {
  return {
    sourceType: document.sourceType,
    sourceId: document.sourceId,
    title: document.title,
    excerpt: document.excerpt,
    score: document.score,
  };
}

function toJsonValue(value: unknown): Prisma.InputJsonValue {
  return value as Prisma.InputJsonValue;
}

async function resolveActor(headers: Headers): Promise<SessionActor> {
  try {
    const session = await auth.api.getSession({ headers });
    const email = session?.user?.email?.toLowerCase() ?? null;
    const appUser = email
      ? await prisma.appUser.findUnique({
          where: { email },
          select: { id: true, role: true, tenantId: true },
        }).catch(() => null)
      : null;

    return {
      userId: appUser?.id ?? session?.user?.id ?? null,
      email,
      isSuperAdmin: email === SUPER_ADMIN_EMAIL || appUser?.role === "super_admin" || appUser?.role === "superadmin",
      tenantId: appUser?.tenantId ?? null,
    };
  } catch {
    return {
      userId: null,
      email: null,
      isSuperAdmin: false,
      tenantId: null,
    };
  }
}

async function persistKnowledgeDocuments(tenantId: string, documents: KnowledgeDocument[]) {
  try {
    // Keep a tenant-scoped searchable document set in sync so the assistant can
    // later move from purely in-memory retrieval to persisted retrieval paths.
    await Promise.all(
      documents.map((document) =>
        prisma.assistantDocument.upsert({
          where: { fingerprint: document.fingerprint },
          update: {
            title: document.title,
            content: document.content,
            searchText: document.searchText,
            keywords: toJsonValue(document.keywords),
            metadata: toJsonValue(document.metadata),
            sourceType: document.sourceType,
            sourceId: document.sourceId,
            embeddingModel: process.env.LOCAL_EMBEDDING_MODEL ?? null,
            embeddingRef: null,
          },
          create: {
            tenantId,
            sourceType: document.sourceType,
            sourceId: document.sourceId,
            title: document.title,
            content: document.content,
            searchText: document.searchText,
            keywords: toJsonValue(document.keywords),
            metadata: toJsonValue(document.metadata),
            embeddingModel: process.env.LOCAL_EMBEDDING_MODEL ?? null,
            embeddingRef: null,
            fingerprint: document.fingerprint,
          },
        })
      )
    );
  } catch {
    // Assistant persistence should not block the response path in demo mode.
  }
}

async function ensureThread(tenantId: string, actor: SessionActor, request: AssistantRequest) {
  if (request.threadId) {
    try {
      const existing = await prisma.assistantThread.findFirst({
        where: { id: request.threadId, tenantId },
        select: { id: true },
      });
      if (existing) return existing.id;
    } catch {
      // Fall through to stateless thread creation.
    }
  }

  try {
    const thread = await prisma.assistantThread.create({
      data: {
        tenantId,
        createdByUserId: actor.userId,
        title: request.question.slice(0, 160),
        status: "active",
        source: "tenant_copilot",
      },
      select: { id: true },
    });
    return thread.id;
  } catch {
    return `ephemeral-${tenantId}-${Date.now()}`;
  }
}

async function persistMessage(params: {
  threadId: string;
  tenantId: string;
  role: "user" | "assistant";
  content: string;
  citations?: AssistantCitationRecord[];
  metadata?: Record<string, unknown>;
}) {
  if (params.threadId.startsWith("ephemeral-")) return;

  try {
    await prisma.assistantMessage.create({
      data: {
        threadId: params.threadId,
        tenantId: params.tenantId,
        role: params.role,
        content: params.content,
        citations: params.citations ? toJsonValue(params.citations) : Prisma.JsonNull,
        metadata: params.metadata ? toJsonValue(params.metadata) : Prisma.JsonNull,
      },
    });
  } catch {
    // Ignore persistence failures in demo mode.
  }
}

export async function handleAssistantRequest(rawBody: unknown, headers: Headers): Promise<AssistantResponse> {
  const request = assistantRequestSchema.parse(rawBody);
  const actor = await resolveActor(headers);
  const dataset = loadTenantDataset(request.tenantSlug);

  if (!dataset) {
    throw new Error(`Unknown tenant '${request.tenantSlug}'.`);
  }

  const dbTenant = await prisma.tenant.findUnique({
    where: { slug: request.tenantSlug },
    select: { id: true, slug: true, name: true },
  }).catch(() => null);

  if (actor.tenantId && dbTenant && actor.tenantId !== dbTenant.id && !actor.isSuperAdmin) {
    throw new Error("You do not have access to this tenant.");
  }

  const tenantId = dbTenant?.id ?? dataset.tenant.slug;
  // The assistant answer is always assembled from the current tenant dataset plus
  // recent operational event documents. This keeps the response bounded to one
  // workspace even when the product is running in a shared demo environment.
  const documents = [
    ...buildKnowledgeDocuments(dataset),
    ...(await loadAutomationKnowledgeDocuments(dataset.tenant.slug)),
  ];
  const fallbackRetrieved = retrieveRelevantDocuments(request.question, documents, 6);
  const fallbackCitations = fallbackRetrieved.map(toCitation);

  void persistKnowledgeDocuments(tenantId, documents);

  const threadId = await ensureThread(tenantId, actor, request);
  await persistMessage({
    threadId,
    tenantId,
    role: "user",
    content: request.question,
    metadata: {
      actorEmail: actor.email,
      tenantSlug: dataset.tenant.slug,
    },
  });

  const providerInput = {
    tenantSlug: dataset.tenant.slug,
    tenantName: dataset.tenant.name,
    question: request.question,
    dataset,
    documents,
    mode: request.mode,
    nodeContext: request.nodeContext,
  };
  const provider = getAssistantProvider();
  let generated;
  try {
    generated = await provider.generate(providerInput);
  } catch {
    generated = await getFallbackAssistantProvider().generate(providerInput);
  }

  const response = assistantResponseSchema.parse({
    threadId,
    provider: generated.provider,
    mode: generated.mode,
    answer: generated.answer,
    summary: generated.summary,
    followUps: generated.followUps,
    alerts: generated.alerts,
    actions: generated.actions,
    investigation: generated.investigation,
    morningBrief: generated.morningBrief,
    nodeInsight: generated.nodeInsight,
    citations: generated.citations.length ? generated.citations : fallbackCitations,
    groundedAt: new Date().toISOString(),
  });

  await persistMessage({
    threadId,
    tenantId,
    role: "assistant",
    content: response.answer,
    citations: response.citations,
    metadata: {
      provider: response.provider,
      mode: response.mode,
      summary: response.summary,
      followUps: response.followUps,
      alerts: response.alerts,
      actions: response.actions,
      investigation: response.investigation,
      morningBrief: response.morningBrief,
      nodeInsight: response.nodeInsight,
    },
  });

  return response;
}
