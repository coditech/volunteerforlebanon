import React, { createElement as el } from 'react'
import { FirebaseProvider, CREATE, DELETE, UPDATE } from '../Components/FirebaseProvider' 
import { isEditMode, renderMarkdown, slugify, uploadFileWithToaster, deleteFileWithToaster } from '../utils'
import { Page, Content, Pane, Link, FullWidthImage, Loading, Title } from '../Components'
import { Editor } from '../Components/Editor'
import { FormControl as Control } from '../Components/FormControl'
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
      uploadFileWithToaster('/articles',image).then( image => ({ ...props, image }))
    }
    return props
  }
  if( action === DELETE && item.image && item.image.id ){
    const image = item.image
    return deleteFileWithToaster(image)
  }
}

const onSubmit = (process) => (form) => {
  console.log(form)
} 

const onRemove = (process) => (form) => {
  evt.preventDefault()
  return deleteFileWithToaster(item.image).then(()=>process(DELETE,{id:form.values.id}))
}

const validate = ( form, errors ) => {
  if(!form.values.title){
    errors.title = 'title is mandatory'
  }
}

const transform = ( form ) => {
  const slug = form.values.title ? slugify(form.values.title) : ''
  const html = renderMarkdown(form.values.text)
  return { ...form, values:{...form.values, slug, html }}
}

const onFileChange = (file,set) => {
  read_image_from_file(file).then(image => set('image',image))
}

const ArticleEditor = ({action, ...values}) => 
  <Editor {...{action,transform,validate,values,onSubmit}}>
    { ({ values, errors, onChange }) => <div>
        <Control name="id" type="hidden" values={values} errors={errors}/>
        <Control name="title" type="text" values={values} errors={errors}/>
        <Control name="text" type="textarea" values={values} errors={errors} onChange={onChange()}/>
        <Pane value={renderMarkdown(values.text)}/>
        <input type="file" name="image" onChange={onChange(onFileChange)}/>
        { values.image && <FullWidthImage {...values.image}/> }
        <input type="submit" value="ok"/>
      </div>
    }
  </Editor>

const Article = ({ id, slug, html, title, text, image, process, editMode }) => 
  <div>
    <Title value={title}/>
    { image && <FullWidthImage {...image}/>
    }
    <h1>{title}</h1>
    { isEditMode() && <button onClick={()=>process(DELETE,{id})}>delete</button> }
    <Pane value={html}/>
    { isEditMode() && <ArticleEditor action="update" {...{ id, slug, html, title, text, image }}/> }
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