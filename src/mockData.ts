import { Activity, EventType, GiftRecord, Guest } from './types';

export const MOCK_ACTIVITIES: Activity[] = [
  { id: '1', title: '婚礼：小王 & 小李', type: EventType.WEDDING, totalAmount: 2450, date: '2024-10-26' },
  { id: '2', title: '满月酒：张三家', type: EventType.FULL_MONTH, totalAmount: 850, date: '2024-10-25' },
  { id: '3', title: '周岁礼：李四家', type: EventType.ONE_YEAR, totalAmount: 1200, date: '2024-10-24' },
  { id: '4', title: '升学宴：王五家', type: EventType.GRADUATION, totalAmount: 3100, date: '2024-10-22', participantCount: 54 },
  { id: '5', title: '乔迁礼：赵六家', type: EventType.HOUSEWARMING, totalAmount: 600, date: '2024-10-20' },
];

export const MOCK_RECORDS: GiftRecord[] = [
  { 
    id: 'r1', 
    activityId: '4', 
    activityTitle: '科技峰会 2024', 
    giverName: '赵敏', 
    amount: 2450, 
    timestamp: '2024-10-26T10:00:00Z',
  },
  { 
    id: 'r2', 
    activityId: '1', 
    activityTitle: '慈善晚宴', 
    giverName: '孙悟空', 
    amount: 890, 
    timestamp: '2024-10-25T15:00:00Z',
  },
  { 
    id: 'r3', 
    activityId: '3', 
    activityTitle: '企业研讨会', 
    giverName: '周杰伦', 
    amount: 1200, 
    timestamp: '2024-10-24T09:00:00Z',
  },
  { 
    id: 'r4', 
    activityId: '4', 
    activityTitle: '54 位参与者', 
    giverName: '年度会议', 
    amount: 12800, 
    timestamp: '2024-10-22T14:00:00Z'
  },
  { 
    id: 'r5', 
    activityId: '5', 
    activityTitle: '设计周', 
    giverName: '李白', 
    amount: 3150, 
    timestamp: '2024-10-20T11:00:00Z',
  },
];

export const MOCK_GUESTS: Guest[] = [
  { id: 'g1', name: '张伟' },
  { id: 'g2', name: '王芳' },
  { id: 'g3', name: '陈静' },
  { id: 'g4', name: '李娜' },
];
