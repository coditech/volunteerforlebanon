import React from 'react'
import classnames from 'classnames'
import { Img } from './Img'

export const FullWidthImage = ({ ratioWidth, src, url, description, className, children }) =>
  <div className={classnames(className,'full-width-image')} style={{width:'100%', paddingBottom:(ratioWidth*100)+'%'}} title={description}>
    <Img alt={description} src={ src || url } width="100%" height="100%"/>
    { children }
  </div>
