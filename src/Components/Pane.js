import { createElement as el } from 'react'

export const Pane = ({value:__html, ...rest }) => el('div',{ dangerouslySetInnerHTML:{__html}, ...rest })