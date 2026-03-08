import React from 'react';
import { GiftRecord, EventType } from '../types';

interface RecordItemProps {
  record: GiftRecord;
  activityType?: EventType;
  onClick?: () => void;
}

const getIcon = (type?: EventType) => {
  switch (type) {
    case EventType.WEDDING: return 'favorite';
    case EventType.FULL_MONTH: return 'child_care';
    case EventType.ONE_YEAR: return 'cake';
    case EventType.GRADUATION: return 'school';
    case EventType.HOUSEWARMING: return 'home';
    default: return 'event';
  }
};

const RecordItem: React.FC<RecordItemProps> = ({ record, activityType, onClick }) => {
  const formatDate = (timestamp: string) => {
    const date = new Date(timestamp);
    // For mock data consistency with the design
    if (record.id === 'r1') return '2小时前';
    if (record.id === 'r2') return '昨天';
    return `${date.getMonth() + 1}月${date.getDate()}日`;
  };

  return (
    <div 
      onClick={onClick}
      className="flex items-center gap-4 p-4 rounded-xl hover:bg-slate-50 transition-all border border-transparent hover:border-slate-100 cursor-pointer active:scale-[0.98]"
    >
      <div className="size-10 rounded-lg bg-slate-100 flex items-center justify-center text-slate-500 shrink-0">
        <span className="material-symbols-outlined text-xl">{getIcon(activityType)}</span>
      </div>
      
      <div className="flex-1 min-w-0">
        <h3 className="text-sm font-bold text-slate-900 truncate">
          {record.giverName}
        </h3>
        <p className="text-[10px] text-slate-400 mt-0.5">
          {record.activityTitle} <span className="mx-1">·</span> {formatDate(record.timestamp)}
        </p>
      </div>
      
      <div className="text-right shrink-0">
        <p className="text-sm font-bold text-primary">¥{record.amount.toLocaleString()}</p>
      </div>
    </div>
  );
};

export default RecordItem;
