export enum EventType {
  WEDDING = 'wedding',
  FULL_MONTH = 'full_month',
  ONE_YEAR = 'one_year',
  GRADUATION = 'graduation',
  HOUSEWARMING = 'housewarming',
  OTHER = 'other'
}

export interface Activity {
  id: string;
  title: string;
  type: EventType;
  totalAmount: number;
  date: string;
  participantCount?: number;
}

export interface GiftRecord {
  id: string;
  activityId: string;
  activityTitle: string;
  giverName: string;
  amount: number;
  timestamp: string;
}

export interface Guest {
  id: string;
  name: string;
  lastGiftAmount?: number;
}
