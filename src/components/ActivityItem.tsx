import React from 'react';
import { Activity, EventType } from '../types';

const getIcon = (type: EventType) => {
  switch (type) {
    case EventType.WEDDING: return 'favorite';
    case EventType.FULL_MONTH: return 'child_care';
    case EventType.ONE_YEAR: return 'cake';
    case EventType.GRADUATION: return 'school';
    case EventType.HOUSEWARMING: return 'home';
    default: return 'event';
  }
};

const ActivityItem: React.FC<{ activity: Activity; onClick?: () => void }> = ({ activity, onClick }) => {
  return (
    <div 
      onClick={onClick}
      className="flex items-center justify-between bg-white p-4 rounded-xl border border-slate-100 shadow-sm hover:bg-slate-50 transition-colors cursor-pointer"
    >
      <div className="flex items-center gap-4">
        <div className="size-12 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
          <span className="material-symbols-outlined">{getIcon(activity.type)}</span>
        </div>
        <div>
          <h3 className="font-semibold text-slate-900">{activity.title}</h3>
          <p className="text-[10px] text-slate-400 mt-0.5">
            {activity.participantCount ? `${activity.participantCount}人参与` : '暂无参与者'}
          </p>
        </div>
      </div>
      <div className="text-right">
        <p className="font-bold text-primary">¥{activity.totalAmount.toLocaleString()}</p>
      </div>
    </div>
  );
};

export default ActivityItem;
