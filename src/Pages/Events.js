import React, { createElement as el } from 'react'
import { FirebaseProvider, upload, removeFile, CREATE, DELETE, UPDATE } from '../Components/FirebaseProvider' 
import { isEditMode, renderMarkdown, serializeForm, slugify, toast, readImageFromFile } from '../utils'
import { Page, Img, Content, Pane, Link, Loading, Title } from '../Components'

const prepare = (item, action, batch) => {
  if(action === CREATE || action === UPDATE ){
    const { image, title, text, slug:_slug, id, date_from, date_to } = item
    const slug = _slug || slugify(title)
    const props = {
      title,
      text,
      html:renderMarkdown(text),
      slug,
      id:id||slug ,
      date_from,
      date_to
    }
    console.log(props)
    if(image){
      const toastId = toast(`⏳ uploading ${image.name} 0%`, { type: toast.TYPE.INFO, autoClose: false });
      const onProgress = ( file, progress ) => toast.update(toastId, { render:`⏳ uploading ${file.name} ${ parseInt(progress*100,10) }%` });
      return upload(`/events`,image, {}, onProgress).then( ({ free, image:img, ...image }) => {
        toast.update(toastId, { render:`✓ ${image.name} uploaded!`, autoClose:3000 });
        free && free()
        return ({ ...props, image })
      })
    }
    return props
  }
  if( action === DELETE && item.image && item.image.id ){
    const image = item.image
    const id = image.id
    const toastId = toast(`⏳ deleting ${image.name}`, { type: toast.TYPE.INFO, autoClose: false });
    return removeFile(id)
      .catch(e=>{
        toast.update(toastId, { render:`❌ error deleting {file.name}`,type:'error', autoClose:3000})
        return true
      })
      .then((isError)=>{
        !isError && toast.update(toastId, { render:`✓ ${image.name} deleted`, autoClose:3000})
        return item
      })
  }
}

const Image = ({ratioHeight, url, description, process, id}) =>
  <div className="event-image">
    <Img alt={description} src={url} width="100%" height="100%"/>
  </div>

const fileToImage = (files) => {
  if(!files || !files[0]){
    return null
  }
  return readImageFromFile(files[0]).then(({url})=>url)
}

class Editor extends React.Component{
  state = { html:'' }
  handleForm = (evt) => {
    evt.preventDefault();
    evt.stopPropagation();
    const form = evt.target;
    const data = serializeForm(form)
    const { action, process } = this.props
    const { title, text } = data.values
    if(!title){ return this.setState({error:`title is mandatory`}) }
    if(!text){ return this.setState({error:`text is mandatory`}) }
    this.setState({error:null})
    process(action, data.values)
  }
  // TODO: MEMOIZE
  onChange = (transform) => (evt) => { 
    const input = evt.target
    const name = input.name
    if(!name){ throw new Error(' onChange requires the input to have a name')}
    const type = input.type
    const inputValue = type === 'file' ? input.files : type === 'checkbox' ? input.checked : input.value
    Promise.resolve(transform ? transform(inputValue) : inputValue).then((value)=>{
      if(typeof value !== 'undefined'){
        this.setState({[name]:value})
      }
    })
  }
  render(){
    const { id, title, text, date_from, date_to, html:pHtml, image, published } = this.props
    const { text:sHtml, error, image:sImage } = this.state
    const html = sHtml || pHtml
    const src = sImage ? sImage : image ? image.url : null
    const imageStyle = src ? { backgroundImage:`url("${src}")`} : null
    const style = { width:'50%', float:'left', padding:'2em', overflow:'auto', height:'15em' }
    return (
      <form onSubmit={this.handleForm}>
        { error && <div>{error}</div>}
        <div style={{width:'100%',float:'left'}}>
            <input type="hidden" name="id" defaultValue={id}/>
            <input name="title" placeholder="title" defaultValue={title}/>
            <input name="date_from" placeholder="starting date" type="date" defaultValue={date_from}/>
            <input name="date_to" placeholder="end date" type="date" defaultValue={date_to}/> 
            <div style={{float:'left', width:'100%'}}>
              <textarea style={style} onChange={this.onChange(renderMarkdown)} name="text" placeholder="text" defaultValue={text}/>
              <Pane value={html} style={style}/>
              <div style={{width:'100%', float:'left'}} className="mini-text">
                <a href="https://github.com/adam-p/markdown-here/wiki/Markdown-Cheatsheet" target="_blank" rel="noopener noreferrer">help</a>
              </div>
            </div>
            <div style={{width:'200px', clear:'both'}}>
              <label className="dropimage" style={imageStyle}>
                <input title="Drop image or click me" name="image" type="file" onChange={this.onChange(fileToImage)}/>
              </label>
            </div>
            { (window.location.href.indexOf('admin') >= 0 ) && <label>
                <input type="checkbox" name="published" defaultValue={published}/>
                <span class="checkable">published</span>
              </label>
            }
        </div>
        <input type="submit" value="ok"/>
      </form>
    )
  }
} 

const formatDate = (date) => date.replace(/-/g,'/')

const EventMini = ({ id, slug, html, full, title, text, date_from, date_to, editMode, image, process }) => 
  <div className={`event${full?' full':''}`}>
    { ( editMode && full ) 
    ? <Editor action="update" text={text} title={title} id={id} slug={slug} process={process} image={image}/>
    : null 
    }
    <div className="event-content">
      <h1>
        <Link to={`/events/${slug}`}>{title}</Link>
      </h1>
      { editMode && id && <button onClick={()=>process(DELETE,{id})}>delete</button> }
      { date_from && date_to 
      ? <p>from { formatDate(date_from) } to { formatDate(date_to) }</p>
      : date_from 
      ? <p>{ formatDate(date_from) }</p>
      : null
      }
      <Pane value={html}/>
    </div>
    { image && <Image {...image}/>
    }
    { full
    ? <button style={{position:'absolute',bottom:10, left:10}}>apply to this</button>
    : <Link style={{position:'absolute',bottom:10, left:10}} to={`/events/${slug}`}>read more</Link>
    }
  </div>

const EventsList = (event_slug) => ({ process, items, loading, updating }) => {
  let content;
  const editMode = isEditMode()
  if(loading){
    content = <Loading/>
  }
  else if(!event_slug){
    content = items.map( event => el(EventMini, { key:event.id, process, editMode, ...event }))
  }else{
    if(event_slug==='new'){
      content = <Editor action="create" process={process}/>
    }else{
      const event = items.find(({slug})=>(slug===event_slug))
      if(event){
        content = el(EventMini, { process, editMode, full:true, ...event })
      }
    }
  }
  return (
    <Page>
      <Content>
        <Title value="Exhibitions & Events"/>
        { content }
      </Content>
    </Page>
  )
}

export const Events = ({match:{ params:{event} }}) => 
  <FirebaseProvider collection='events' prepare={prepare}>
    { EventsList(event) }
  </FirebaseProvider>