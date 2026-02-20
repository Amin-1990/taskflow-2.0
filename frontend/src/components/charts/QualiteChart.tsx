/**
 * Composant QualiteChart
 * Affiche la répartition des défauts avec un PieChart
 */

import { type FunctionComponent } from 'preact';
import {
  PieChart,
  Pie,
  Cell,
  Legend,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import type { QualiteChartData } from '../../hooks/useChartData';

interface QualiteChartProps {
  data: QualiteChartData[];
  loading?: boolean;
}

export const QualiteChart: FunctionComponent<QualiteChartProps> = ({
  data,
  loading = false,
}) => {
  if (loading) {
    return (
      <div className="w-full h-80 flex items-center justify-center bg-white rounded-lg shadow-sm">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600 mx-auto"></div>
          <p className="mt-2 text-sm text-gray-600">Chargement...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-sm p-6">
      <h3 className="text-lg font-semibold text-gray-800 mb-4">
        Répartition des Défauts
      </h3>
      
      {data.length === 0 ? (
        <div className="h-80 flex items-center justify-center text-gray-500">
          <div className="text-center">
            <p className="font-medium">Aucun défaut détecté</p>
            <p className="text-sm mt-1">Production conforme</p>
          </div>
        </div>
      ) : (
        <ResponsiveContainer width="100%" height={320}>
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              labelLine={false}
              label={({ name, value }: any) => `${name}: ${value}`}
              outerRadius={100}
              fill="#8884d8"
              dataKey="value"
            >
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Pie>
            <Tooltip
              contentStyle={{
                backgroundColor: '#ffffff',
                border: '1px solid #e5e7eb',
                borderRadius: '0.5rem',
              }}
              formatter={(value) => [value, 'Défauts']}
            />
            <Legend
              wrapperStyle={{ paddingTop: '20px' }}
              verticalAlign="bottom"
              height={36}
            />
          </PieChart>
        </ResponsiveContainer>
      )}
    </div>
  );
};

export default QualiteChart;
