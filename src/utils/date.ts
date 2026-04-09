
/**
 * Utility functions for date and time handling
 */

/**
 * Validates if the end date is after the start date
 * @param start - Start date
 * @param end - End date
 * @returns boolean
 */
export const isValidSessionInterval = (start: Date, end: Date): boolean => {
  return end.getTime() > start.getTime();
};

/**
 * Parses an ISO string into a Date object safely
 * @param dateStr - ISO date string
 * @returns Date object
 */
export const parseISODate = (dateStr: string | null | undefined): Date => {
  if (!dateStr) return new Date();
  const date = new Date(dateStr);
  return isNaN(date.getTime()) ? new Date() : date;
};

/**
 * Formats a Date object to a readable string for display in the picker UI
 * @param date - Date object
 * @returns string
 */
export const formatDisplayDate = (date: Date): string => {
  return date.toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  });
};

/**
 * Formats a Date object to a readable time string
 * @param date - Date object
 * @returns string
 */
export const formatDisplayTime = (date: Date): string => {
  return date.toLocaleTimeString('pt-BR', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true
  });
};

/**
 * Combines a date part from one Date object and a time part from another
 * @param datePart - Date object providing year, month, day
 * @param timePart - Date object providing hour, minute, second
 * @returns Combined Date object
 */
export const combineDateAndTime = (datePart: Date, timePart: Date): Date => {
  const result = new Date(datePart);
  result.setHours(timePart.getHours());
  result.setMinutes(timePart.getMinutes());
  result.setSeconds(timePart.getSeconds());
  result.setMilliseconds(timePart.getMilliseconds());
  return result;
};
