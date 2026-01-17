/**
 * System Time Utility
 * 
 * Provides validated system time information for documentation and logging.
 * Validates timezone (GMT) and date accuracy before use.
 * 
 * Created: January 11, 2026
 * Purpose: Ensure accurate date/time capture in GMT timezone
 */

import { execSync } from 'child_process';

/**
 * Get validated system time information
 * @returns {Object} System time information
 */
export function getSystemTime() {
  try {
    // Get system date command output
    const dateOutput = execSync('date', { encoding: 'utf-8' }).trim();
    const gmtOutput = execSync('TZ=GMT date', { encoding: 'utf-8' }).trim();
    const formattedOutput = execSync('date +"%Y-%m-%d %H:%M:%S %Z %A"', { encoding: 'utf-8' }).trim();
    
    // Parse formatted output
    const [datePart, timePart, timezone, dayOfWeek] = formattedOutput.split(' ');
    const [year, month, day] = datePart.split('-').map(Number);
    const [hours, minutes, seconds] = timePart.split(':').map(Number);
    
    // Get JavaScript Date object
    const now = new Date();
    const utcNow = new Date(now.toUTCString());
    
    return {
      systemDate: dateOutput,
      gmtDate: gmtOutput,
      formatted: formattedOutput,
      year,
      month,
      day,
      hours,
      minutes,
      seconds,
      dayOfWeek,
      timezone,
      jsDate: now,
      utcDate: utcNow,
      utcDay: utcNow.getUTCDay(), // 0 = Sunday, 1 = Monday, etc.
      utcDateNum: utcNow.getUTCDate(),
      utcMonth: utcNow.getUTCMonth() + 1,
      utcYear: utcNow.getUTCFullYear(),
      utcHours: utcNow.getUTCHours(),
      utcMinutes: utcNow.getUTCMinutes()
    };
  } catch (error) {
    throw new Error(`Failed to get system time: ${error.message}`);
  }
}

/**
 * Get current date/time formatted for documentation
 * Format: "YYYY-MM-DD, HH:MM GMT"
 * @returns {string} Formatted date/time string
 */
export function getCurrentDateTime() {
  const systemTime = getSystemTime();
  
  const year = systemTime.utcYear;
  const month = String(systemTime.utcMonth).padStart(2, '0');
  const day = String(systemTime.utcDateNum).padStart(2, '0');
  const hours = String(systemTime.utcHours).padStart(2, '0');
  const minutes = String(systemTime.utcMinutes).padStart(2, '0');
  
  return `${year}-${month}-${day}, ${hours}:${minutes} GMT`;
}

/**
 * Get current date formatted for documentation
 * Format: "YYYY-MM-DD"
 * @returns {string} Formatted date string
 */
export function getCurrentDate() {
  const systemTime = getSystemTime();
  
  const year = systemTime.utcYear;
  const month = String(systemTime.utcMonth).padStart(2, '0');
  const day = String(systemTime.utcDateNum).padStart(2, '0');
  
  return `${year}-${month}-${day}`;
}

/**
 * Validate system time is correct
 * Expected: January 11, 2026, Sunday, GMT timezone
 * @returns {Object} Validation result
 */
export function validateSystemTime() {
  const systemTime = getSystemTime();
  
  const expectedYear = 2026;
  const expectedMonth = 1; // January
  const expectedDay = 11;
  const expectedDayOfWeek = 0; // Sunday
  
  const isValid = 
    systemTime.utcYear === expectedYear &&
    systemTime.utcMonth === expectedMonth &&
    systemTime.utcDateNum === expectedDay &&
    systemTime.utcDay === expectedDayOfWeek &&
    (systemTime.timezone.toUpperCase() === 'GMT' || systemTime.timezone.toUpperCase() === 'UTC');
  
  return {
    isValid,
    systemTime,
    expected: {
      year: expectedYear,
      month: expectedMonth,
      day: expectedDay,
      dayOfWeek: expectedDayOfWeek,
      dayOfWeekName: 'Sunday',
      timezone: 'GMT'
    },
    actual: {
      year: systemTime.utcYear,
      month: systemTime.utcMonth,
      day: systemTime.utcDateNum,
      dayOfWeek: systemTime.utcDay,
      dayOfWeekName: systemTime.dayOfWeek,
      timezone: systemTime.timezone
    }
  };
}
