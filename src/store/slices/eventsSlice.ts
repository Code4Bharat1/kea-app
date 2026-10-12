import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { EventItem } from '../../types';

interface EventsState {
  events: EventItem[];
  loading: boolean;
  activeFilter: string;
}

const initialState: EventsState = {
  events: [],
  loading: false,
  activeFilter: 'Upcoming',
};

const eventsSlice = createSlice({
  name: 'events',
  initialState,
  reducers: {
    setEvents: (state, action: PayloadAction<EventItem[]>) => {
      state.events = action.payload;
    },
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.loading = action.payload;
    },
    setActiveFilter: (state, action: PayloadAction<string>) => {
      state.activeFilter = action.payload;
    },
  },
});

export const { setEvents, setLoading, setActiveFilter } = eventsSlice.actions;
export default eventsSlice.reducer;
