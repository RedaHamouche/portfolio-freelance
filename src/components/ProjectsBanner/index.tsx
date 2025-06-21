import React from 'react'
import styles from './index.module.scss'
import classnames from 'classnames';
import SingleProjectBanner from './SingleProjectBanner';

export type ProjectsBannerType = {
  customStyle?: any
  className?: string
}

const ProjectsBanner = ({customStyle, className}: ProjectsBannerType) => {
  return (
    <div 
        className={classnames(styles.main, className)} 
         style={customStyle}
         >
            <SingleProjectBanner />
            <SingleProjectBanner />
    </div>
  )
}

export default ProjectsBanner;