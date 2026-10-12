import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { JobItem } from '../../types';

interface JobsState {
  jobs: JobItem[];
  savedJobs: JobItem[];
  loading: boolean;
  filterCategory: string;
  searchQuery: string;
}

const initialState: JobsState = {
  jobs: [],
  savedJobs: [],
  loading: false,
  filterCategory: 'All',
  searchQuery: '',
};

const jobsSlice = createSlice({
  name: 'jobs',
  initialState,
  reducers: {
    setJobs: (state, action: PayloadAction<JobItem[]>) => {
      state.jobs = action.payload;
    },
    setSavedJobs: (state, action: PayloadAction<JobItem[]>) => {
      state.savedJobs = action.payload;
    },
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.loading = action.payload;
    },
    setFilterCategory: (state, action: PayloadAction<string>) => {
      state.filterCategory = action.payload;
    },
    setSearchQuery: (state, action: PayloadAction<string>) => {
      state.searchQuery = action.payload;
    },
  },
});

export const { setJobs, setSavedJobs, setLoading, setFilterCategory, setSearchQuery } = jobsSlice.actions;
export default jobsSlice.reducer;
