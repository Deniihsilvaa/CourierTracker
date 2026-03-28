import * as TaskManager from 'expo-task-manager';
import * as Location from 'expo-location';
import { processLocationUpdate } from '../modules/tracking/service';
import { logger } from '../utils/logger';

export const LOCATION_TASK_NAME = 'background-location-task';

/**
 * Background Task for Location Tracking.
 * This MUST be defined at the top level of the app (RootLayout or via side-effect import).
 */
TaskManager.defineTask(LOCATION_TASK_NAME, async ({ data, error }: any) => {
  if (error) {
    logger.error(`[TaskManager] Background task error: ${error.message}`);
    return;
  }
  
  if (data) {
    const { locations } = data as { locations: Location.LocationObject[] };
    
    try {
      // Delegates heavy processing to the tracking service
      await processLocationUpdate(locations);
    } catch (err) {
      logger.error('[TaskManager] Error processing location update:', err);
    }
  }
});
