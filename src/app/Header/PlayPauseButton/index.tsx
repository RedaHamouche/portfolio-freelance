import React from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { RootState } from '../../../store';
import { setAutoScrollDirection, setAutoPlaying } from '../../../store/scrollSlice';

const PlayPauseButton: React.FC = () => {
  const isAutoPlaying = useSelector((state: RootState) => state.scroll.isAutoPlaying);
  const autoScrollDirection = useSelector((state: RootState) => state.scroll.autoScrollDirection);
  const isAutoScrollTemporarilyPaused = useSelector((state: RootState) => state.scroll.isAutoScrollTemporarilyPaused);
  const dispatch = useDispatch();

  const handlePlayPause = () => {
    dispatch(setAutoPlaying(!isAutoPlaying));
  };

  const handleDirectionChange = () => {
    dispatch(setAutoScrollDirection(autoScrollDirection === 1 ? -1 : 1));
  };

  let buttonColor = 'red';
  if (isAutoPlaying && isAutoScrollTemporarilyPaused) {
    buttonColor = 'orange';
  } else if (isAutoPlaying) {
    buttonColor = 'green';
  }

  return (
    <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
      <button type="button" onClick={handlePlayPause} style={{ background: buttonColor, color: 'white', fontWeight: 'bold' }}>
        {isAutoPlaying ? 'Pause' : 'Play'}
      </button>
      <button type="button" onClick={handleDirectionChange}>
        Direction: {autoScrollDirection === 1 ? '→' : '←'}
      </button>
    </div>
  );
};

export default PlayPauseButton; 