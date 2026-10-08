import { createSlice, type PayloadAction } from "@reduxjs/toolkit";

interface UiState {
  currentWorkspaceId: string | null;
  isTaskModalOpen: boolean;
  selectedTaskId: string | null;
}

const initialState: UiState = {
  currentWorkspaceId: null,
  isTaskModalOpen: false,
  selectedTaskId: null,
};

const uiSlice = createSlice({
  name: "ui",
  initialState,
  reducers: {
    setCurrentWorkspaceId(state, action: PayloadAction<string | null>) {
      state.currentWorkspaceId = action.payload;
    },

    openTaskModal(
      state,
      action: PayloadAction<string>,
    ) {
      state.isTaskModalOpen = true;
      state.selectedTaskId = action.payload;
    },

    closeTaskModal(state) {
      state.isTaskModalOpen = false;
      state.selectedTaskId = null;
    },
  },
});

export const {
  setCurrentWorkspaceId,
  openTaskModal,
  closeTaskModal,
} = uiSlice.actions;

export default uiSlice.reducer;


