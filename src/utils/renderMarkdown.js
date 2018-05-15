import Remarkable from 'remarkable'

const md = new Remarkable({
  html: true,
  xhtmlOut: true,
  breaks: true,
  linkify: true,
  typographer: true,
  quotes: '“”‘’',
});

export const renderMarkdown = (text) => md.render(text)