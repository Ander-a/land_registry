import React from 'react';
import { LineChart as RechartsLineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import './Charts.css';

const LineChart = ({ data, dataKeys, colors, height = 300, title }) => {
  const defaultColors = ['#3b82f6', '#10b981', '#f59e0b', '#8b5cf6'];

  return (
    <div className="chart-container">
      {title && <h3 className="chart-title">{title}</h3>}
      <ResponsiveContainer width="100%" height={height}>
        <RechartsLineChart
          data={data}
          margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
          <XAxis 
            dataKey="month_short" 
            stroke="#6b7280"
            style={{ fontSize: '0.875rem' }}
          />
          <YAxis 
            stroke="#6b7280"
            style={{ fontSize: '0.875rem' }}
          />
          <Tooltip 
            contentStyle={{
              backgroundColor: 'white',
              border: '1px solid #e5e7eb',
              borderRadius: '8px',
              boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)'
            }}
          />
          <Legend 
            wrapperStyle={{ fontSize: '0.875rem' }}
          />
          {dataKeys.map((key, index) => (
            <Line
              key={key.key}
              type="monotone"
              dataKey={key.key}
              name={key.name}
              stroke={colors ? colors[index] : defaultColors[index % defaultColors.length]}
              strokeWidth={2}
              dot={{ r: 4 }}
              activeDot={{ r: 6 }}
            />
          ))}
        </RechartsLineChart>
      </ResponsiveContainer>
    </div>
  );
};

export default LineChart;
