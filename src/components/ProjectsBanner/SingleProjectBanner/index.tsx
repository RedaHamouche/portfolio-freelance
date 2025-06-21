import React from 'react'
import styles from './index.module.scss'

export type SingleProjectBannerType = {
  text?: string
}

const SingleProjectBanner = ({text}: SingleProjectBannerType) => {
  return (
    <div className={styles.main} data-clickable>{text} Chanels</div>
  )
}

export default SingleProjectBanner