import React, { createElement as el } from 'react'
import { FirebaseProvider, upload, removeFile, CREATE, DELETE, UPDATE } from '../Components/FirebaseProvider' 
import { isEditMode, renderMarkdown, serializeForm, slugify, toast } from '../utils'
import { Page, Content, Pane, Link, FullWidthImage, Loading, Title } from '../Components'

const prepare = (item, action, batch) => {
  if(action === CREATE || action === UPDATE ){
    const { image, title, text, slug:_slug, id } = item
    const slug = _slug || slugify(title)
    const props = {
      title,
      text,
      html:renderMarkdown(text),
      slug,
      id:id||slug
    }
    if(image){
      const toastId = toast(`⏳ uploading ${image.name} 0%`, { type: toast.TYPE.INFO, autoClose: false });
      const onProgress = ( file, progress ) => toast.update(toastId, { render:`⏳ uploading ${file.name} ${ parseInt(progress*100,10) }%` });
      return upload(`/articles`,image, {}, onProgress).then( ({ free, image:img, ...image }) => {
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
  onChange = (evt) => {
    const value = evt.target.value
    this.setState({html:renderMarkdown(value)})
  }
  render(){
    const { id, slug, title, text } = this.props
    const { html, error } = this.state
    return (
      <form onSubmit={this.handleForm}>
        { error && <div>{error}</div>}
        <input type="hidden" name="id" defaultValue={id}/>
        <input type="hidden" name="slug" defaultValue={slug}/>
        <input name="title" placeholder="title" defaultValue={title}/>
        <textarea onChange={this.onChange} name="text" placeholder="text" defaultValue={text}/>
        <input type="file" name="image"/>
        <Pane value={html}/>
        <input type="submit" value="ok"/>
      </form>
    )
  }
} 

const Article = ({ id, slug, html, title, text, image, process, editMode }) => 
  <div>
    <Title value={title}/>
    { image && <FullWidthImage {...image}/>
    }
    <h1>{title}</h1>
    { isEditMode() && <button onClick={()=>process(DELETE,{id})}>delete</button> }
    <Pane value={html}/>
    { isEditMode() && <Editor action="update" text={text} title={title} id={id} slug={slug} process={process}/> }
  </div>

const ArticleMini = ({ slug, title }) => 
  <h3>
    <Link to={`/articles/${slug}`}>{title}</Link>
  </h3>

const ArticlesList = (article_slug) => ({ process, items, loading, updating }) => {
  let content;
  if(loading){
    content = <Loading/>
  }
  else if(!article_slug){
    content = items.map( article => el(ArticleMini, { key:article.id, process, ...article }))
  }else{
    if(article_slug==='new'){
      content = <Editor action="create" process={process}/>
    }else{
      const article = items.find(({slug})=>(slug===article_slug))
      if(article){
        content = el(Article, { process, ...article })
      }
    }
  }
  return (
    <Page>
      <Content>
        { content }
      </Content>
    </Page>
  )
}

export const Articles = ({match:{ params:{article} }}) => 
  <FirebaseProvider collection='articles' prepare={prepare}>
    { ArticlesList(article) }
  </FirebaseProvider>