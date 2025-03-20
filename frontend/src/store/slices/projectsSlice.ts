import { createSlice, PayloadAction } from '@reduxjs/toolkit';

interface Project {
  id: string;
  name: string;
  description: string;
  brandId: string;
  status: 'planning' | 'in_progress' | 'review' | 'completed' | 'archived';
  startDate: string;
  dueDate?: string;
  completedDate?: string;
  assignees: string[];
  tags: string[];
  priority: 'low' | 'medium' | 'high' | 'urgent';
  progress: number;
  tasks: {
    id: string;
    title: string;
    completed: boolean;
    assignee?: string;
    dueDate?: string;
  }[];
  createdAt: string;
  updatedAt: string;
}

interface ProjectsState {
  projects: Project[];
  selectedProject: Project | null;
  isLoading: boolean;
  error: string | null;
  filters: {
    status?: string;
    brandId?: string;
    priority?: string;
    assignee?: string;
    searchQuery?: string;
  };
}

const initialState: ProjectsState = {
  projects: [],
  selectedProject: null,
  isLoading: false,
  error: null,
  filters: {},
};

const projectsSlice = createSlice({
  name: 'projects',
  initialState,
  reducers: {
    fetchProjectsStart: (state) => {
      state.isLoading = true;
      state.error = null;
    },
    fetchProjectsSuccess: (state, action: PayloadAction<Project[]>) => {
      state.isLoading = false;
      state.projects = action.payload;
    },
    fetchProjectsFailure: (state, action: PayloadAction<string>) => {
      state.isLoading = false;
      state.error = action.payload;
    },
    selectProject: (state, action: PayloadAction<string>) => {
      state.selectedProject = state.projects.find(project => project.id === action.payload) || null;
    },
    clearSelectedProject: (state) => {
      state.selectedProject = null;
    },
    createProjectStart: (state) => {
      state.isLoading = true;
      state.error = null;
    },
    createProjectSuccess: (state, action: PayloadAction<Project>) => {
      state.isLoading = false;
      state.projects.push(action.payload);
    },
    createProjectFailure: (state, action: PayloadAction<string>) => {
      state.isLoading = false;
      state.error = action.payload;
    },
    updateProject: (state, action: PayloadAction<Project>) => {
      const index = state.projects.findIndex(project => project.id === action.payload.id);
      if (index !== -1) {
        state.projects[index] = action.payload;
      }
      if (state.selectedProject && state.selectedProject.id === action.payload.id) {
        state.selectedProject = action.payload;
      }
    },
    updateProjectStart: (state) => {
      state.isLoading = true;
      state.error = null;
    },
    updateProjectSuccess: (state, action: PayloadAction<Project>) => {
      state.isLoading = false;
      const index = state.projects.findIndex(project => project.id === action.payload.id);
      if (index !== -1) {
        state.projects[index] = action.payload;
      }
      if (state.selectedProject && state.selectedProject.id === action.payload.id) {
        state.selectedProject = action.payload;
      }
    },
    updateProjectFailure: (state, action: PayloadAction<string>) => {
      state.isLoading = false;
      state.error = action.payload;
    },
    deleteProjectStart: (state) => {
      state.isLoading = true;
      state.error = null;
    },
    deleteProjectSuccess: (state, action: PayloadAction<string>) => {
      state.isLoading = false;
      state.projects = state.projects.filter(project => project.id !== action.payload);
      if (state.selectedProject && state.selectedProject.id === action.payload) {
        state.selectedProject = null;
      }
    },
    deleteProjectFailure: (state, action: PayloadAction<string>) => {
      state.isLoading = false;
      state.error = action.payload;
    },
    setProjectFilters: (state, action: PayloadAction<Partial<ProjectsState['filters']>>) => {
      state.filters = { ...state.filters, ...action.payload };
    },
    clearProjectFilters: (state) => {
      state.filters = {};
    },
    updateProjectTask: (state, action: PayloadAction<{
      projectId: string;
      taskId: string;
      updates: Partial<Project['tasks'][0]>;
    }>) => {
      const { projectId, taskId, updates } = action.payload;
      const projectIndex = state.projects.findIndex(project => project.id === projectId);
      
      if (projectIndex !== -1) {
        const project = state.projects[projectIndex];
        const taskIndex = project.tasks.findIndex(task => task.id === taskId);
        
        if (taskIndex !== -1) {
          project.tasks[taskIndex] = { ...project.tasks[taskIndex], ...updates };
          
          // Update project progress if task completion changed
          if (updates.completed !== undefined) {
            const completedTasks = project.tasks.filter(task => task.completed).length;
            project.progress = Math.round((completedTasks / project.tasks.length) * 100);
          }
        }
      }
      
      // Update selected project if needed
      if (state.selectedProject && state.selectedProject.id === projectId) {
        const taskIndex = state.selectedProject.tasks.findIndex(task => task.id === taskId);
        
        if (taskIndex !== -1) {
          state.selectedProject.tasks[taskIndex] = { 
            ...state.selectedProject.tasks[taskIndex], 
            ...updates 
          };
          
          // Update project progress if task completion changed
          if (updates.completed !== undefined) {
            const completedTasks = state.selectedProject.tasks.filter(task => task.completed).length;
            state.selectedProject.progress = Math.round(
              (completedTasks / state.selectedProject.tasks.length) * 100
            );
          }
        }
      }
    },
  },
});

export const {
  fetchProjectsStart,
  fetchProjectsSuccess,
  fetchProjectsFailure,
  selectProject,
  clearSelectedProject,
  createProjectStart,
  createProjectSuccess,
  createProjectFailure,
  updateProject,
  updateProjectStart,
  updateProjectSuccess,
  updateProjectFailure,
  deleteProjectStart,
  deleteProjectSuccess,
  deleteProjectFailure,
  setProjectFilters,
  clearProjectFilters,
  updateProjectTask,
} = projectsSlice.actions;

export default projectsSlice.reducer;