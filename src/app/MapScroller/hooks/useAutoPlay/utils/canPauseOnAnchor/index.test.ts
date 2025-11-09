import { canPauseOnAnchor } from './index';

describe('canPauseOnAnchor', () => {
  let lastPausedTimeRef: React.MutableRefObject<Map<string, number>>;
  let mockPerformanceNow: jest.SpyInstance;

  beforeEach(() => {
    lastPausedTimeRef = { current: new Map() };
    mockPerformanceNow = jest.spyOn(performance, 'now');
  });

  afterEach(() => {
    mockPerformanceNow.mockRestore();
  });

  it('devrait retourner false si anchorId est undefined', () => {
    const result = canPauseOnAnchor(undefined, lastPausedTimeRef);
    expect(result).toBe(false);
  });

  it('devrait retourner false si anchorId est une chaîne vide', () => {
    const result = canPauseOnAnchor('', lastPausedTimeRef);
    expect(result).toBe(false);
  });

  it('devrait retourner true si l\'anchor n\'a jamais été pausé', () => {
    const result = canPauseOnAnchor('anchor1', lastPausedTimeRef);
    expect(result).toBe(true);
  });

  it('devrait retourner false si le cooldown de 5 secondes n\'est pas écoulé', () => {
    const anchorId = 'anchor1';
    const now = 1000;
    mockPerformanceNow.mockReturnValue(now);
    
    // Enregistrer une pause à t=1000
    lastPausedTimeRef.current.set(anchorId, now);
    
    // Vérifier à t=5000 (4 secondes plus tard, moins de 5 secondes)
    mockPerformanceNow.mockReturnValue(now + 4000);
    const result = canPauseOnAnchor(anchorId, lastPausedTimeRef);
    
    expect(result).toBe(false);
  });

  it('devrait retourner true si le cooldown de 5 secondes est écoulé', () => {
    const anchorId = 'anchor1';
    const now = 1000;
    mockPerformanceNow.mockReturnValue(now);
    
    // Enregistrer une pause à t=1000
    lastPausedTimeRef.current.set(anchorId, now);
    
    // Vérifier à t=6001 (5.001 secondes plus tard)
    mockPerformanceNow.mockReturnValue(now + 6001);
    const result = canPauseOnAnchor(anchorId, lastPausedTimeRef);
    
    expect(result).toBe(true);
  });

  it('devrait retourner true si exactement 5 secondes se sont écoulées', () => {
    const anchorId = 'anchor1';
    const now = 1000;
    mockPerformanceNow.mockReturnValue(now);
    
    // Enregistrer une pause à t=1000
    lastPausedTimeRef.current.set(anchorId, now);
    
    // Vérifier à t=6000 (exactement 5 secondes plus tard)
    mockPerformanceNow.mockReturnValue(now + 5000);
    const result = canPauseOnAnchor(anchorId, lastPausedTimeRef);
    
    expect(result).toBe(true);
  });

  it('devrait gérer plusieurs anchors indépendamment', () => {
    const anchor1 = 'anchor1';
    const anchor2 = 'anchor2';
    const now = 1000;
    mockPerformanceNow.mockReturnValue(now);
    
    // Enregistrer une pause pour anchor1 à t=1000
    lastPausedTimeRef.current.set(anchor1, now);
    
    // Vérifier anchor2 (jamais pausé) - devrait retourner true
    mockPerformanceNow.mockReturnValue(now + 1000);
    expect(canPauseOnAnchor(anchor2, lastPausedTimeRef)).toBe(true);
    
    // Vérifier anchor1 (pausé il y a 1 seconde) - devrait retourner false
    expect(canPauseOnAnchor(anchor1, lastPausedTimeRef)).toBe(false);
  });
});

