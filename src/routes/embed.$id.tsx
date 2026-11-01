import { createFileRoute } from "@tanstack/react-router";
import { ChatWidget } from "@/components/widget/ChatWidget";
import { noindexHead } from "@/lib/seo";

export const Route = createFileRoute("/embed/$id")({
  head: () => noindexHead("Chat Widget — Webotme"),
  component: EmbedChatWidget,
});

function EmbedChatWidget() {
  const { id } = Route.useParams();
  return <ChatWidget botId={id} />;
}
