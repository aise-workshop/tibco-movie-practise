/**
 * Test setup configuration
 */

// Set test environment
process.env.NODE_ENV = 'test';

// Disable verbose logging in tests
process.env.VERBOSE = 'false';

// Mock console methods to reduce noise in tests
const originalConsole = { ...console };

beforeEach(() => {
  // Reset console mocks before each test
  console.log = jest.fn();
  console.error = jest.fn();
  console.warn = jest.fn();
  console.debug = jest.fn();
});

afterEach(() => {
  // Restore console after each test
  Object.assign(console, originalConsole);
});

// Global test timeout
jest.setTimeout(30000);
