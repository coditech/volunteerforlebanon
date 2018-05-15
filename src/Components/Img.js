import React from 'react'
import LazyLoad from 'react-lazyload'

export const Img = ({ description, src, url, width='100%', height='100%', className, style }) =>
  <LazyLoad height={height}>
    <img className={className} style={style} alt={description||''} src={src||url} width={width} height={height}/>
  </LazyLoad>