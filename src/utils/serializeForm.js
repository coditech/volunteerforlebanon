const toArray = (thing) =>Array.prototype.slice.call(thing)

export const getFiles = (fileInput) => {
  const files = toArray(fileInput.files)
  if(!files.length){ return }
  if(fileInput.multiple){
    return files
  }
  return files[0]
}

export const serializeForm = (form) => {
  const url = window.location.protocol+'//'+window.location.host
  const regex = new RegExp('^'+url+'/?','ig')
  const { elements, name, action:_action, method } = form;
  const action = _action.replace(regex,'')
  const inputs = toArray(elements)
  const serialized = {}
  inputs.forEach( input =>{
    const { nodeName, name, type, value, checked } = input
    if(!name || nodeName === 'BUTTON'){ return; }
    if(type === 'checkbox'){
      serialized[name] = !!checked; return;
    }
    if(typeof value === 'undefined' || value === ''){ return }
    if(type === 'radio' && checked){
      serialized[name] = value; return;
    }
    if(type === 'number' || type === 'range'){
      if(!value){
        serialized[name] = 0; return;  
      }
      serialized[name] = parseFloat(value); return;
    }
    if( type === 'file' ){
      const files = getFiles(input)
      if(!files){ return }
      serialized[name] = files
      return;
    }
    serialized[name] = value
  })
  return { name, action, method, values:serialized }
}