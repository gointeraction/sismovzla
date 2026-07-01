import React from 'react';

function Bar({ className = '' }: { className?: string }) {
  return <div className={`bg-white/10 rounded animate-pulse ${className}`} />;
}

function Card() {
  return (
    <div className="bg-white/5 border border-white/10 rounded-xl p-4 space-y-3">
      <Bar className="h-4 w-1/3" />
      <Bar className="h-3 w-2/3" />
      <div className="flex gap-2 pt-2">
        <Bar className="h-6 w-16 rounded-full" />
        <Bar className="h-6 w-20 rounded-full" />
      </div>
    </div>
  );
}

function MapSkeleton() {
  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        <Bar className="h-8 w-24 rounded-lg" />
        <Bar className="h-8 w-32 rounded-lg" />
      </div>
      <div className="bg-white/5 border border-white/10 rounded-xl h-80 md:h-96 flex items-center justify-center">
        <div className="flex flex-col items-center gap-2">
          <div className="w-10 h-10 border-2 border-[#D32F2F] border-t-transparent rounded-full animate-spin" />
          <Bar className="h-3 w-32" />
        </div>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[1, 2, 3, 4].map(i => (
          <div key={i} className="bg-white/5 border border-white/10 rounded-lg p-3 space-y-2">
            <Bar className="h-5 w-5 rounded" />
            <Bar className="h-4 w-full" />
            <Bar className="h-3 w-2/3" />
          </div>
        ))}
      </div>
    </div>
  );
}

function TableSkeleton({ rows = 5 }: { rows?: number }) {
  return (
    <div className="space-y-4">
      <div className="flex gap-2 flex-wrap">
        <Bar className="h-8 w-20 rounded-lg" />
        <Bar className="h-8 w-24 rounded-lg" />
        <Bar className="h-8 w-28 rounded-lg" />
      </div>
      <div className="bg-white/5 border border-white/10 rounded-xl overflow-hidden">
        <div className="bg-white/5 px-4 py-3 flex gap-4">
          <Bar className="h-3 w-16" />
          <Bar className="h-3 w-24" />
          <Bar className="h-3 w-20" />
          <Bar className="h-3 w-16" />
        </div>
        {Array.from({ length: rows }).map((_, i) => (
          <div key={i} className="px-4 py-3 flex gap-4 border-t border-white/5">
            <Bar className="h-3 w-16" />
            <Bar className="h-3 w-24" />
            <Bar className="h-3 w-20" />
            <Bar className="h-3 w-16" />
          </div>
        ))}
      </div>
    </div>
  );
}

function FormSkeleton() {
  return (
    <div className="bg-white/5 border border-white/10 rounded-xl p-6 space-y-4">
      <Bar className="h-5 w-40" />
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {[1, 2, 3, 4, 5, 6].map(i => (
          <div key={i} className="space-y-1">
            <Bar className="h-3 w-20" />
            <Bar className="h-10 w-full rounded-lg" />
          </div>
        ))}
      </div>
      <Bar className="h-10 w-32 rounded-lg mt-4" />
    </div>
  );
}

function StatsSkeleton() {
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
      {[1, 2, 3, 4].map(i => (
        <div key={i} className="bg-white/5 border border-white/10 rounded-xl p-4 space-y-2">
          <Bar className="h-4 w-4 rounded" />
          <Bar className="h-7 w-16" />
          <Bar className="h-3 w-24" />
        </div>
      ))}
    </div>
  );
}

function DashboardSkeleton() {
  return (
    <div className="space-y-4">
      <StatsSkeleton />
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card />
        <Card />
      </div>
      <TableSkeleton rows={4} />
    </div>
  );
}

const SKELETONS: Record<string, React.ReactNode> = {
  map_reports: <MapSkeleton />,
  report_form: <FormSkeleton />,
  survival_guides: <TableSkeleton rows={3} />,
  missing_search: <TableSkeleton rows={5} />,
  shelters: <TableSkeleton rows={5} />,
  shelter_tactical: <MapSkeleton />,
  blood_donors: <TableSkeleton rows={5} />,
  hospital_patients: <TableSkeleton rows={5} />,
  reports_console: <DashboardSkeleton />,
  volunteer_gate: <DashboardSkeleton />,
  evacuation_routes: <TableSkeleton rows={5} />,
  triage: <TableSkeleton rows={5} />,
  cascade_events: <TableSkeleton rows={4} />,
  search_rescue: <MapSkeleton />,
  supply_logistics: <TableSkeleton rows={5} />,
  eoc: <DashboardSkeleton />,
  water_sanitation: <TableSkeleton rows={5} />,
  deceased: <TableSkeleton rows={5} />,
  psychosocial: <TableSkeleton rows={4} />,
  comms: <TableSkeleton rows={5} />,
  volunteers: <TableSkeleton rows={5} />,
  interagency: <TableSkeleton rows={4} />,
  aerial_ops: <TableSkeleton rows={5} />,
  fuel_energy: <TableSkeleton rows={5} />,
  weather_alerts: <MapSkeleton />,
  public_alerts: <TableSkeleton rows={5} />,
  family_reunification: <TableSkeleton rows={5} />,
  child_protection: <TableSkeleton rows={5} />,
  legal_aid: <TableSkeleton rows={5} />,
  press_center: <TableSkeleton rows={4} />,
  training: <TableSkeleton rows={5} />,
  lessons_learned: <TableSkeleton rows={4} />,
  volunteer_shifts: <TableSkeleton rows={5} />,
  resource_map: <MapSkeleton />,
  education: <TableSkeleton rows={5} />,
  temporary_housing: <MapSkeleton />,
};

export default function ModuleSkeleton({ tabKey, label }: { tabKey: string; label: string }) {
  return (
    <div className="space-y-4 animate-in fade-in duration-300">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-8 h-8 border-2 border-[#D32F2F] border-t-transparent rounded-full animate-spin" />
        <div>
          <p className="text-xs font-mono font-bold text-white/70 uppercase tracking-wider">{label}</p>
          <p className="text-[10px] font-mono text-white/30">Cargando módulo...</p>
        </div>
      </div>
      {SKELETONS[tabKey] || <TableSkeleton />}
    </div>
  );
}
