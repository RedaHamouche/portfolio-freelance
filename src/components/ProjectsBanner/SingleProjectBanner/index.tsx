import React from 'react'
import styles from './index.module.scss'

export type SingleProjectBannerType = {

}

const SingleProjectBanner = ({}: SingleProjectBannerType) => {
  return (
    <div className={styles.main} data-clickable>Chanels</div>
  )
}

export default SingleProjectBanner