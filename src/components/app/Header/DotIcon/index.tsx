import styles from './index.module.scss';
import classnames from 'classnames';

export type DotIconType = {
  className?: string
  color: string
}

const DotIcon = ({className, color}: DotIconType) => (
  <svg
    aria-hidden="true"
    xmlns="http://www.w3.org/2000/svg"
    width={10}
    height={10}
    fill="none"
    className={classnames(styles.main, className, styles[color])}
  >
    <circle
      className={styles.circle}
      cx={5}
      cy={5}
      r={3.5}
      stroke="#C7E7D7"
      // strokeDasharray="2 2"
      strokeWidth={3}
    />
  </svg>
);
export default DotIcon;