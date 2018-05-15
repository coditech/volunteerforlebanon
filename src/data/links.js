
export const links = [
  { children:'Events', to:'/events', className:'main'},
  { children:'About', to:'/articles/about', className:'main'},
  { children:'Contact', to:'/articles/contact', className:'main'},
  { children:'Submit', to:'/events/new', className:'main'},
].map(item=>({...item,key:item.to}))