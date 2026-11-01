import { Globe, Smartphone } from "lucide-react";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { IntegrationPlatform } from "@/lib/scripts/types";

export function IntegrationModeTabs({
  platform,
  onChange,
  botName,
}: {
  platform: IntegrationPlatform;
  onChange: (platform: IntegrationPlatform) => void;
  botName: string;
}) {
  return (
    <Tabs
      value={platform}
      onValueChange={(value) => onChange(value as IntegrationPlatform)}
      className="mt-4"
    >
      <TabsList className="grid h-11 w-full grid-cols-2 rounded-xl bg-muted/70 p-1">
        <TabsTrigger
          value="web"
          aria-label={`${botName} web integration`}
          className="h-9 justify-center gap-1.5 rounded-lg px-2 text-xs font-semibold data-[state=active]:bg-card data-[state=active]:text-primary data-[state=active]:shadow-soft"
        >
          <Globe className="h-3.5 w-3.5" /> Web
        </TabsTrigger>
        <TabsTrigger
          value="mobile"
          aria-label={`${botName} app integration`}
          className="h-9 justify-center gap-1.5 rounded-lg px-2 text-xs font-semibold data-[state=active]:bg-card data-[state=active]:text-violet-600 data-[state=active]:shadow-soft"
        >
          <Smartphone className="h-3.5 w-3.5" /> App
        </TabsTrigger>
      </TabsList>
    </Tabs>
  );
}
