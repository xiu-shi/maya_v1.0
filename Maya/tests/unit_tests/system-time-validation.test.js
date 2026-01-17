/**
 * System Time Validation Tests
 * 
 * Validates system time configuration before capturing any date/time information.
 * Ensures correct timezone (GMT) and date accuracy.
 * 
 * Created: January 11, 2026
 * Purpose: Prevent timezone-related documentation errors
 */

import { describe, test, expect, beforeAll } from '@jest/globals';
import { execSync } from 'child_process';

/**
 * Get system time information
 */
function getSystemTime() {
  try {
    // Get system date command output
    const dateOutput = execSync('date', { encoding: 'utf-8' }).trim();
    const gmtOutput = execSync('TZ=GMT date', { encoding: 'utf-8' }).trim();
    const formattedOutput = execSync('date +"%Y-%m-%d %H:%M:%S %Z %A"', { encoding: 'utf-8' }).trim();
    
    // Parse formatted output
    const [datePart, timePart, timezone, dayOfWeek] = formattedOutput.split(' ');
    const [year, month, day] = datePart.split('-').map(Number);
    
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
      dayOfWeek,
      timezone,
      jsDate: now,
      utcDate: utcNow,
      utcDay: utcNow.getUTCDay(), // 0 = Sunday, 1 = Monday, etc.
      utcDateNum: utcNow.getUTCDate(),
      utcMonth: utcNow.getUTCMonth() + 1,
      utcYear: utcNow.getUTCFullYear()
    };
  } catch (error) {
    throw new Error(`Failed to get system time: ${error.message}`);
  }
}

describe('System Time Validation', () => {
  let systemTime;
  
  beforeAll(() => {
    systemTime = getSystemTime();
    console.log('\n📅 System Time Information:');
    console.log(`   System Date: ${systemTime.systemDate}`);
    console.log(`   GMT Date: ${systemTime.gmtDate}`);
    console.log(`   Formatted: ${systemTime.formatted}`);
    console.log(`   UTC Date: ${systemTime.utcDate.toUTCString()}`);
    console.log(`   UTC Day: ${systemTime.utcDay} (0=Sunday)`);
    console.log(`   UTC Date: ${systemTime.utcYear}-${String(systemTime.utcMonth).padStart(2, '0')}-${String(systemTime.utcDateNum).padStart(2, '0')}`);
  });
  
  describe('Date Validation - Current Date', () => {
    test('should have correct year (2026)', () => {
      expect(systemTime.utcYear).toBe(2026);
      expect(systemTime.year).toBe(2026);
    });
    
    test('should have correct month (January = 1)', () => {
      expect(systemTime.utcMonth).toBe(1);
      expect(systemTime.month).toBe(1);
    });
    
    test('should have valid day (1-31)', () => {
      expect(systemTime.utcDateNum).toBeGreaterThanOrEqual(1);
      expect(systemTime.utcDateNum).toBeLessThanOrEqual(31);
      expect(systemTime.day).toBeGreaterThanOrEqual(1);
      expect(systemTime.day).toBeLessThanOrEqual(31);
    });
    
    test('should have valid day of week (0-6)', () => {
      expect(systemTime.utcDay).toBeGreaterThanOrEqual(0);
      expect(systemTime.utcDay).toBeLessThanOrEqual(6);
      expect(systemTime.dayOfWeek).toBeTruthy();
    });
    
    test('should have correct date string format', () => {
      const dateStr = `${systemTime.utcYear}-${String(systemTime.utcMonth).padStart(2, '0')}-${String(systemTime.utcDateNum).padStart(2, '0')}`;
      expect(dateStr).toMatch(/^2026-01-\d{2}$/);
    });
  });
  
  describe('Timezone Validation', () => {
    test('should be in GMT timezone', () => {
      // Check if timezone is GMT or UTC
      const tz = systemTime.timezone.toUpperCase();
      expect(['GMT', 'UTC', 'Z', '+0000', '+00:00']).toContain(tz);
    });
    
    test('should have consistent UTC and system dates', () => {
      // UTC date should match system date when in GMT
      expect(systemTime.utcYear).toBe(systemTime.year);
      expect(systemTime.utcMonth).toBe(systemTime.month);
      expect(systemTime.utcDateNum).toBe(systemTime.day);
    });
  });
  
  describe('Time Format Validation', () => {
    test('should have valid date format', () => {
      expect(systemTime.formatted).toMatch(/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}/);
    });
    
    test('should have valid day of week', () => {
      const validDays = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
      expect(validDays).toContain(systemTime.dayOfWeek);
    });
    
    test('should have valid timezone format', () => {
      expect(systemTime.timezone).toBeTruthy();
      expect(systemTime.timezone.length).toBeGreaterThan(0);
    });
  });
  
  describe('JavaScript Date Object Validation', () => {
    test('should have valid Date object', () => {
      expect(systemTime.jsDate).toBeInstanceOf(Date);
      expect(systemTime.jsDate.getTime()).toBeGreaterThan(0);
      expect(!isNaN(systemTime.jsDate.getTime())).toBe(true);
    });
    
    test('should have valid UTC Date object', () => {
      expect(systemTime.utcDate).toBeInstanceOf(Date);
      expect(systemTime.utcDate.getTime()).toBeGreaterThan(0);
      expect(!isNaN(systemTime.utcDate.getTime())).toBe(true);
    });
    
    test('should have correct UTC day of week', () => {
      // UTC day should be valid (0-6, where 0=Sunday)
      expect(systemTime.utcDay).toBeGreaterThanOrEqual(0);
      expect(systemTime.utcDay).toBeLessThanOrEqual(6);
    });
  });
  
  describe('Documentation Date Format', () => {
    test('should format date correctly for documentation', () => {
      const docDate = `${systemTime.utcYear}-${String(systemTime.utcMonth).padStart(2, '0')}-${String(systemTime.utcDateNum).padStart(2, '0')}`;
      expect(docDate).toMatch(/^2026-01-\d{2}$/);
    });
    
    test('should format date with time for documentation', () => {
      const hours = String(systemTime.utcDate.getUTCHours()).padStart(2, '0');
      const minutes = String(systemTime.utcDate.getUTCMinutes()).padStart(2, '0');
      const docDateTime = `${systemTime.utcYear}-${String(systemTime.utcMonth).padStart(2, '0')}-${String(systemTime.utcDateNum).padStart(2, '0')}, ${hours}:${minutes} GMT`;
      expect(docDateTime).toMatch(/^2026-01-\d{2}, \d{2}:\d{2} GMT$/);
    });
  });
});

/**
 * Helper function to get current date/time for documentation
 * Use this function instead of hardcoding dates
 */
export function getCurrentDateTime() {
  const systemTime = getSystemTime();
  
  const year = systemTime.utcYear;
  const month = String(systemTime.utcMonth).padStart(2, '0');
  const day = String(systemTime.utcDateNum).padStart(2, '0');
  const hours = String(systemTime.utcDate.getUTCHours()).padStart(2, '0');
  const minutes = String(systemTime.utcDate.getUTCMinutes()).padStart(2, '0');
  
  return {
    date: `${year}-${month}-${day}`,
    dateTime: `${year}-${month}-${day}, ${hours}:${minutes} GMT`,
    iso: systemTime.utcDate.toISOString(),
    utc: systemTime.utcDate.toUTCString(),
    dayOfWeek: systemTime.dayOfWeek,
    year,
    month: systemTime.utcMonth,
    day: systemTime.utcDateNum
  };
}
