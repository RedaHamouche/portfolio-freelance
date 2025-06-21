import MapScroller from './MapScroller';

export default function Home() {
  return (
    <>
      <MapScroller />
      
      {/* Éléments de test pour le cursor */}
      <div style={{ 
        position: 'fixed', 
        top: '100px', 
        right: '50px', 
        zIndex: 1000,
        display: 'flex',
        flexDirection: 'column',
        gap: '20px'
      }}>
        <a href="#" style={{ 
          padding: '10px 20px', 
          background: '#007bff', 
          color: 'white', 
          textDecoration: 'none',
          borderRadius: '5px'
        }}>
          Lien clickable
        </a>
        
        <button style={{ 
          padding: '10px 20px', 
          background: '#28a745', 
          color: 'white', 
          border: 'none',
          borderRadius: '5px',
        }}>
          Bouton clickable
        </button>
        
        <div data-clickable style={{ 
          padding: '10px 20px', 
          background: '#dc3545', 
          color: 'white',
          borderRadius: '5px',
        }}>
          Div avec data-clickable
        </div>
      </div>
    </>
  );
}
