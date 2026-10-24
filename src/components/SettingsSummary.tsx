
import { Card } from "@/components/ui/card";
import { PhotoSettings } from "@/pages/Index";
import { FilterDef } from "./FilterSelector";

interface SettingsSummaryProps {
  settings: PhotoSettings;
  filters: FilterDef[];
  selectedFilter: string;
}

const SettingsSummary = ({
  settings,
  filters,
  selectedFilter,
}: SettingsSummaryProps) => (
  <Card className="mt-6 p-4 bg-slate-800/30 border-slate-700">
    <div className="flex justify-center gap-6 text-sm text-slate-300">
      <span>Photos: {settings.photoCount}</span>
      <span>Timer: {settings.countdownDuration}s</span>
      <span>Frame: {settings.frameColor}</span>
      <span>
        Filter: {filters.find((f) => f.id === selectedFilter)?.name}
      </span>
    </div>
  </Card>
);

export default SettingsSummary;
