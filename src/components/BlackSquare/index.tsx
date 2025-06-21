import styles from './index.module.scss'
export type BlackSquareType = {
  mapWidth: number
  mapHeight: number
}

export default function BlackSquare({ mapWidth, mapHeight }: BlackSquareType ) {
  return (
    <div
      style={{
        width: 100,
        height: 100,
        background: 'black',
        zIndex: 10,
      }}
    />
  );
} 