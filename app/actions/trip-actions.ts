'use server';

import type { TripInput, TripWithDaysAndEvents } from '@/lib/domain/trip';
import { mockTrip } from '@/lib/mock/trip';
import { shanxiActualTrip } from '@/lib/mock/shanxi-actual';
import { shanxiLoopTrip } from '@/lib/mock/shanxi-loop';
import { southwestLoopTrip } from '@/lib/mock/southwest-loop';

/**
 * PRD/SDD 对齐：createTrip(data: TripInput): Promise<Trip>
 * 当前为 MVP 占位逻辑，后续接入 Supabase insert。
 */
export async function createTrip(data: TripInput): Promise<{ id: string }> {
  if (!data.title || !data.destination) {
    throw new Error('title and destination are required');
  }

  return {
    id: `trip-${Date.now()}`,
  };
}

/**
 * PRD/SDD 对齐：getTripDetails(id: string): Promise<TripWithDaysAndEvents>
 */
export async function getTripDetails(id: string): Promise<TripWithDaysAndEvents> {
  if (id === shanxiActualTrip.id) {
    return shanxiActualTrip;
  }

  if (id === shanxiLoopTrip.id) {
    return shanxiLoopTrip;
  }

  if (id === southwestLoopTrip.id) {
    return southwestLoopTrip;
  }

  return {
    ...mockTrip,
    id,
  };
}

/**
 * PRD/SDD 对齐：deleteTrip(id: string): Promise<void>
 */
export async function deleteTrip(id: string): Promise<void> {
  if (!id) {
    throw new Error('trip id is required');
  }
}
