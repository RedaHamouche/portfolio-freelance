// Mock requestAnimationFrame/cancelAnimationFrame pour tous les tests
beforeEach(() => {
  window.requestAnimationFrame = jest.fn((cb) => setTimeout(cb, 0));
  window.cancelAnimationFrame = jest.fn((id) => clearTimeout(id));
});
