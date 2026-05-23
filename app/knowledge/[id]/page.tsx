import { Metadata } from "next";
import { getKnowledgeCard } from "@/lib/knowledge-store";
import KnowledgeCardView from "@/components/KnowledgeCardView";

interface Props {
  params: { id: string };
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const card = await getKnowledgeCard(params.id);
  return {
    title: card
      ? `Wissensskarte: ${card.documentName} — MaschineRAG`
      : "Wissensskarte nicht gefunden — MaschineRAG",
    description: card?.summary,
  };
}

export default async function KnowledgeCardPage({ params }: Props) {
  const card = await getKnowledgeCard(params.id);
  return <KnowledgeCardView card={card} />;
}
