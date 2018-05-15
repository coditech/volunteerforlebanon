import React from 'react'
import classnames from 'classnames'

export const Content = ({ children, className, title }) => (
  <div className={classnames('content',className)}>
    { title && <h1>{title}</h1>}
    { children }
  </div>
)

export default Content;