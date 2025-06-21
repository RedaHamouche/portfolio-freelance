export type ArrowType = {
    className?: string
}

function Arrow({className}: ArrowType) {
  return (
        <svg
        xmlns="http://www.w3.org/2000/svg"
        width={7}
        height={18}
        fill="none"
        className={className}
    >
        <path
        fill="#fff"
        d="M1.167 13.14 0 14.354 3.5 18 7 14.355 5.833 13.14 3.5 15.57zm4.666-8.28L7 3.646 3.5 0 0 3.646 1.167 4.86 3.5 2.43z"
        />
        <path
        fill="#fff"
        fillRule="evenodd"
        d="M3.5 6.422c.656 0 1.286.272 1.75.755.464.484.725 1.14.725 1.823 0 .684-.261 1.34-.725 1.823a2.43 2.43 0 0 1-1.75.755 2.43 2.43 0 0 1-1.75-.755A2.63 2.63 0 0 1 1.025 9c0-.684.261-1.34.725-1.823a2.43 2.43 0 0 1 1.75-.755m0 1.719c.219 0 .429.09.583.251.155.162.242.38.242.608a.88.88 0 0 1-.242.608.8.8 0 0 1-.583.251.8.8 0 0 1-.583-.251A.88.88 0 0 1 2.675 9c0-.228.087-.446.242-.608a.8.8 0 0 1 .583-.251"
        clipRule="evenodd"
        />
    </svg>
  );
}

export default Arrow;