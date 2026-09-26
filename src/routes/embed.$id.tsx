import { createFileRoute } from "@tanstack/react-router";
import { ChatWidget } from "@/components/widget/ChatWidget";

export const Route = createFileRoute("/embed/$id")({
  component: EmbedChatWidget,
});

function EmbedChatWidget() {
  const { id } = Route.useParams();
  return <ChatWidget botId={id} />;
}
