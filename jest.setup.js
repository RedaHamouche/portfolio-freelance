// Import testing-library jest-dom matchers
// eslint-disable-next-line @typescript-eslint/no-require-imports
require("@testing-library/jest-dom");

// Mock requestAnimationFrame/cancelAnimationFrame pour tous les tests
beforeEach(() => {
  window.requestAnimationFrame = jest.fn((cb) => setTimeout(cb, 0));
  window.cancelAnimationFrame = jest.fn((id) => clearTimeout(id));
});
