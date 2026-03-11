import * as TaskManager from 'expo-task-manager';
import { processLocationUpdate } from '../modules/tracking/service';

export const LOCATION_TASK_NAME = 'background-location-task';

TaskManager.defineTask(LOCATION_TASK_NAME, async ({ data, error }: any) => {
  if (error) {
    console.error('Task Manager Error:', error);
    return;
  }
  
  if (data) {
    const { locations } = data;
    // Delega o processamento pesado para o serviço de tracking
    await processLocationUpdate(locations);
  }
});
