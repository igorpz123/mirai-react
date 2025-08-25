import React from 'react';
import { Card, CardContent } from '@/components/ui/card';

const MetricCard = ({ title, value, icon: Icon, color = 'blue' }) => {
  const colorClasses = {
    blue: 'text-blue-600',
    yellow: 'text-yellow-600',
    red: 'text-red-600',
    green: 'text-green-600'
  };

  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-center">
          <div className="flex-shrink-0">
            <Icon className={`h-12 w-12 ${colorClasses[color]}`} />
          </div>
          <div className="ml-4">
            <h2 className={`text-xl font-semibold ${colorClasses[color]}`}>
              {title}
            </h2>
            <p className="text-2xl font-bold text-foreground">
              {value}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default MetricCard;

