export type BlackSquareType = {
  mapWidth: number
  mapHeight: number
}

export default function BlackSquare({ mapWidth, mapHieght }: BlackSquareType ) {
  return (
    <div
      style={{
        width: 2000,
        height: 2000,
        background: 'black',
        zIndex: 10,
      }}
    />
  );
} 