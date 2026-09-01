export type EventCategory = 'spot' | 'food' | 'hotel' | 'transport' | 'custom';
export type TransportMode = 'drive' | 'flight' | 'walk';
export type EventStatus = 'planned' | 'active' | 'done' | 'skipped' | 'changed' | 'cancelled';
export type TodoScope = 'trip' | 'day' | 'event';
export type TodoStatus = 'open' | 'done' | 'blocked';

export interface TripInput {
  title: string;
  destination: string;
  startDate?: string;
  endDate?: string;
}

export interface TripEvent {
  id: string;
  dayId: string;
  tripId: string;
  startTime?: string;
  endTime?: string;
  isTimeFlexible?: boolean;
  title: string;
  description?: string;
  category: EventCategory;
  locationName?: string;
  address?: string;
  geo?: {
    lat: number;
    lng: number;
  };
  externalLink?: string;
  navigationUrl?: string;
  sortOrder?: number;
  isCompleted?: boolean;
  actualAt?: string;
  actualStatus?: 'completed';
  status?: EventStatus;
  transportMode?: TransportMode;
}

export interface TripTodo {
  id: string;
  tripId: string;
  dayId?: string;
  eventId?: string;
  scope: TodoScope;
  title: string;
  dueDate?: string;
  status: TodoStatus;
  sortOrder: number;
}

export interface TripDay {
  id: string;
  tripId: string;
  dayIndex: number;
  date?: string;
  summary?: string;
  events: TripEvent[];
}

export interface TripWithDaysAndEvents {
  id: string;
  userId: string;
  planRevision?: number;
  title: string;
  destination: string;
  startDate?: string;
  endDate?: string;
  status: 'planning' | 'active' | 'completed';
  days: TripDay[];
  todos?: TripTodo[];
}

export interface GeneratedItinerary {
  tripTitle: string;
  tripHighlights: {
    destination: string;
    travelDates: string;
    travelers: string;
    weatherInfo: string;
  };
  overview: {
    dailyArrangement: string[];
    transportationSummary: string[];
    accommodationSummary: string[];
    practicalSummary: string[];
  };
  detailedItinerary: Array<{
    dayIndex: number;
    date: string;
    theme: string;
    events: Array<{
      time: string;
      title: string;
      category: EventCategory;
      description: string;
      location: string;
      geo: {
        lat: number;
        lng: number;
      };
      transport: string;
      tips: string;
    }>;
  }>;
  transportation: {
    cityTransfers: string[];
    inCityTransport: string[];
  };
  accommodationDining: {
    stayRecommendations: string[];
    diningRecommendations: string[];
  };
  mapNavigation: Array<{
    dayIndex: number;
    routeName: string;
    waypoints: Array<{
      name: string;
      lat: number;
      lng: number;
    }>;
  }>;
  practicalInfo: {
    packingChecklist: string[];
    budgetTips: string[];
    emergencyInfo: string[];
    familyFriendlyTips: string[];
  };
}
