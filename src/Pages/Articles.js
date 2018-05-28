import React, { createElement as el } from 'react'
import { FirebaseProvider, upload, removeFile, CREATE, DELETE, UPDATE } from '../Components/FirebaseProvider' 
import { isEditMode, renderMarkdown, serializeForm, slugify, toast } from '../utils'
import { Page, Content, Pane, Link, FullWidthImage, Loading, Title } from '../Components'
import { Editor } from '../Components/Editor'
import { read_image_from_file } from 'convenable'
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

const validate = ( {values:{title}}, errors ) => {
  if(!title){
    errors.title = 'title is mandatory'
  }
}

const transform = ( form ) => {
  const slug = slugify(form.values.title)
  const html = renderMarkdown(form.values.text)
  return { ...form, values:{...form.values, slug, html }}
}

const Control = ({ errors, values, onChange, name, id, inputType, label, items }) => {

  return (<div>
    <label htmlFor={id}>
      { inputType !== 'checkbox' && inputType !== 'radio'
      ? <span>{label}</span>
      : false
      }
      { inputType === 'textarea'
      ? <textarea id={id} defaultValue={values[name]} value={onChange ? values[name] : '' }/>
      : inputType === 'checkbox'
      ? <input id={id} type={inputType} checked={values[name]}/>
      : inputType === 'select'
      ? <select>
          { items.map( item => <option key={item.value} value={item.value}>{item.label}</option>) }
        </select>
      : inputType === 'radio'
      ? items.map( item => <label><input type='radio' key={item.value} value={item.value}/><span>{item.label}</span></label>)
      : <input id={id} type={inputType} defaultValue={values[name]}/>
      }
      { inputType === 'checkbox'
      ? <span>{label}</span>
      : false
      }
    </label>
    { errors && errors[name] && <label htmlFor={id}>errors[name]</label>}
  </div>)
}

const onFileChange = (file,set) => {
  read_image_from_file(file).then(image => set('image',image))
}

const ArticleEditor = ({ id, slug, title, text, html, image }) => 
  <Editor transform={ transform } validate={validate} values={{id, slug, title,  text, html, image }} onSubmit={(things)=>console.log(things)}>
    { ({ values, errors, onChange }) => <fieldset>
        <input type="hidden" name="id" defaultValue={values.id}/>
        <input type="hidden" name="slug" defaultValue={values.slug}/>
        <input type="hidden" name="html" defaultValue={values.html}/>
        <input name="title" defaultValue={values.title}/>
        <textarea name="text" defaultValue={values.text} onChange={onChange()}/>
        <Pane value={renderMarkdown(values.text)}/>
        <input type="file" name="image" onChange={onChange(onFileChange)}/>
        { values.image && <FullWidthImage {...values.image}/> }
        <input type="submit" value="ok"/>
      </fieldset>
    }
  </Editor>

class ArticlseEditor extends React.Component{
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
    { isEditMode() && <ArticleEditor action="update" image={image} text={text} title={title} id={id} slug={slug} process={process}/> }
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
      content = <ArticleEditor action="create" process={process}/>
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