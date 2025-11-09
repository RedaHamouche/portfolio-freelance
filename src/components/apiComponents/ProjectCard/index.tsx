import React from 'react';
import ResponsiveImage from '@/components/apiComponents/ResponsiveImage';
import { ResponsiveImage as ResponsiveImageType } from '@/types/image';
import styles from './index.module.scss';

interface ProjectCardProps extends Record<string, unknown> {
  title: string;
  description: string;
  image: ResponsiveImageType;
  technologies: string[];
  link?: string;
  githubLink?: string;
  onClick?: () => void;
}


export default function ProjectCard({
  title,
  description,
  image,
  technologies,
  link,
  githubLink,
  onClick,
}: ProjectCardProps) {
  const handleImageClick = () => {
    if (onClick) {
      onClick();
    } else if (link) {
      window.open(link, '_blank');
    }
  };

  return (
    <div className={styles.projectCard}>
      <div className={styles.imageWrapper}>
        <ResponsiveImage
          {...image}
          width={400}
          height={300}
          className={styles.projectImage}
          onClick={handleImageClick}
          priority={false}
          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
        />
      </div>
      
      <div className={styles.content}>
        <h3 className={styles.title}>{title}</h3>
        <p className={styles.description}>{description}</p>
        
        <div className={styles.technologies}>
          {technologies.map((tech, index) => (
            <span key={index} className={styles.tech}>
              {tech}
            </span>
          ))}
        </div>
        
        <div className={styles.links}>
          {link && (
            <a
              href={link}
              target="_blank"
              rel="noopener noreferrer"
              className={styles.link}
            >
              Voir le projet
            </a>
          )}
          {githubLink && (
            <a
              href={githubLink}
              target="_blank"
              rel="noopener noreferrer"
              className={styles.githubLink}
            >
              Code source
            </a>
          )}
        </div>
      </div>
    </div>
  );
} 