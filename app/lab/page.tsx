import { AppShell } from "@/components/app-shell";
import { LabCanvas } from "@/components/lab-canvas";
import { PageHeader } from "@/components/page-header";
import { getData } from "@/lib/store";

export default async function LabPage() {
  const data = await getData();

  return (
    <AppShell wide>
      <PageHeader
        eyebrow="Multi-agent lab"
        title="Drag, inspect, and test the real-estate workflow."
        description="The canvas shows agent modules and dependencies. V1 supports simulation/live test traces without arbitrary production workflow editing."
      />
      <LabCanvas
        modules={data.agentModules}
        edges={data.agentEdges}
        runs={data.agentRuns}
        steps={data.agentRunSteps}
        properties={data.properties}
        clients={data.clients}
      />
    </AppShell>
  );
}
