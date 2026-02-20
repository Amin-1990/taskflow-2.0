/**
 * Composant MaintenanceChart
 * Affiche les interventions de maintenance avec un BarChart
 */

import { type FunctionComponent } from 'preact';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import type { MaintenanceChartData } from '../../hooks/useChartData';

interface MaintenanceChartProps {
  data: MaintenanceChartData[];
  loading?: boolean;
}

export const MaintenanceChart: FunctionComponent<MaintenanceChartProps> = ({
  data,
  loading = false,
}) => {
  if (loading) {
    return (
      <div className="w-full h-80 flex items-center justify-center bg-white rounded-lg shadow-sm">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-yellow-600 mx-auto"></div>
          <p className="mt-2 text-sm text-gray-600">Chargement...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-sm p-6">
      <h3 className="text-lg font-semibold text-gray-800 mb-4">
        Interventions Maintenance Hebdomadaire
      </h3>
      
      {data.length === 0 ? (
        <div className="h-80 flex items-center justify-center text-gray-500">
          Aucune donnée disponible
        </div>
      ) : (
        <ResponsiveContainer width="100%" height={320}>
          <BarChart
            data={data}
            margin={{ top: 5, right: 30, left: 0, bottom: 5 }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis
              dataKey="day"
              stroke="#9ca3af"
              style={{ fontSize: '12px' }}
            />
            <YAxis stroke="#9ca3af" style={{ fontSize: '12px' }} />
            <Tooltip
              contentStyle={{
                backgroundColor: '#ffffff',
                border: '1px solid #e5e7eb',
                borderRadius: '0.5rem',
              }}
              formatter={(value) => [Math.round(value as number), '']}
              labelStyle={{ color: '#374151' }}
            />
            <Legend
              wrapperStyle={{ paddingTop: '20px' }}
            />
            <Bar
              dataKey="interventions"
              fill="#eab308"
              name="Interventions"
              radius={[8, 8, 0, 0]}
            />
            <Bar
              dataKey="machines_panne"
              fill="#ef4444"
              name="Machines en panne"
              radius={[8, 8, 0, 0]}
            />
          </BarChart>
        </ResponsiveContainer>
      )}
    </div>
  );
};

export default MaintenanceChart;
