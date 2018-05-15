import React, { createElement as el } from 'react'
import { FirebaseProvider, upload, removeFile, CREATE, DELETE, UPDATE } from '../Components/FirebaseProvider' 
import { isEditMode, seasonFromMonth, toast } from '../utils'
import { Page, Content, Loading, Title } from '../Components'

const prepare = (item, action, batch) => {
  if(action === CREATE || action === UPDATE ){
    const { file, year:_year, month:_month, day:_day, title, ...rest } = item
    const year = _year || '2000'
    const month = _month || '01'
    const day = _day || '01'
    const time = [year,month,day].join('-')
    const id = time+'-'+title
    const props = { year, month, day, time, title, id, ...rest }
    if(file){
      const toastId = toast(`⏳ uploading ${file.name} 0%`, { type: toast.TYPE.INFO, autoClose: false });
      const onProgress = ( file, progress ) => toast.update(toastId, { render:`⏳ uploading ${file.name} ${ parseInt(progress*100,10) }%` });
      return upload(`/press/${year}`,file, {}, onProgress).then( (file) => {
        toast.update(toastId, { render:`✓ ${file.name} uploaded!`, autoClose:3000 });
        const obj = ({ ...props, file })
        console.log(obj)
        return obj
      })
    }
    return props
  }
  if( action === DELETE && item.file && item.file.id ){
    const file = item.file
    const id = file.id
    const toastId = toast(`⏳ deleting ${file.name}`, { type: toast.TYPE.INFO, autoClose: false });
    return removeFile(id)
      .catch(e=>{
        toast.update(toastId, { render:`❌ error deleting {file.name}`,type:'error', autoClose:3000})
        return true
      })
      .then((isError)=>{
        !isError && toast.update(toastId, { render:`✓ ${file.name} deleted`, autoClose:3000})
        return item
      })
  }
}

const handleFiles = (process) => (evt) => {
  const files = Array.prototype.slice.call(evt.target.files)
    .filter( file => {
      const type = file.type.split('/')[1]
      return type === 'pdf' || type === 'documents'
    })
    .map( file => {
      const name = file.name.replace(/\.*?$/,'')
      const [ year, month, day, ...rest ] = name.split('-')
      const title = rest.join(' ')
      const obj = { title, name, year, month, day, file }
      return obj
    })
  if(files.length){
    process(CREATE, files)
  }
}

const PressItem = ({ year, month, name, day, title, url, extension, process }) =>
  <div className="press-file">
    { seasonFromMonth(month) } { year } - { title }
    <a href={url} title={`download ${name}`} data-tooltip={`download ${name}`}>
      <span>▼ download</span>
    </a>
  </div>

const PressItems = (_year) => ({ process, items, loading, updating }) => {
  let content;
  if(loading){
    content = <Loading/>
  }
  else{
    content = [
      ...(_year ? items.filter(({year})=>(year === _year)) : items ).map(({id, file, ...props }) => el(PressItem, { key:id, process, ...file, ...props })),
    isEditMode() && <input key="file" type="file" multiple onChange={handleFiles(process)}/> ]
  }
  return (  
    <Page>
      <Content>
        <Title value="Press"/>
        { content }
      </Content>
    </Page>
  )
}

export const Press = ({match:{ params:{year} }}) => 
  <FirebaseProvider collection="press" prepare={prepare} orderBy={['time','desc']}>
    { PressItems(year) }
  </FirebaseProvider>