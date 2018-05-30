import React, { createElement as el } from 'react'
import { FirebaseProvider } from '../Components/FirebaseProvider' 
import { isEditMode, renderMarkdown, slugify, uploadFileWithToaster, deleteFileWithToaster } from '../utils'
import { Page, Content, Pane, Link, FullWidthImage, Loading, Title } from '../Components'
import { Editor } from '../Components/Editor'
import { FormControl as Control } from '../Components/FormControl'
import { read_image_from_file } from 'convenable'

const onSubmit = (process) => (form) => {
  console.log(form)
  // uploadFileWithToaster('/articles',form.values.image).then( image => process(form.action,{ ...props, image }))
} 

const onRemove = (process) => (form) => {
  return deleteFileWithToaster(form.values.image).then(()=>process('delete',{id:form.values.id}))
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

const onFileChange = ( file, set ) => {
  read_image_from_file(file).then(image => set('image',image))
}

const ArticleEditor = ({action, onSubmit, ...values}) => 
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

const Article = ({ id, slug, html, title, text, image, onSubmit, editMode }) => 
  <div>
    <Title value={title}/>
    { image && <FullWidthImage {...image}/>
    }
    <h1>{title}</h1>
    { isEditMode() && <button onClick={()=>onRemove({id,image})}>delete</button> }
    <Pane value={html}/>
    { isEditMode() && <ArticleEditor action="update" onSubmit={onSubmit} {...{ id, slug, html, title, text, image }}/> }
  </div>

const ArticleMini = ({ slug, title }) => 
  <h3>
    <Link to={`/articles/${slug}`}>{title}</Link>
  </h3>

const getArticleAndRender = (process, article_slug) => {
  const article = items.find(({slug})=>(slug===article_slug))
  if(article){
    return <Article onSubmit={onSubmit(process)} onRemove={onRemove(process)} { ...article}/>
  }
  return <div>not found</div>
}

export const Articles = ({match:{ params:{article:article_slug} }}) => 
  <FirebaseProvider collection='articles'>
    { ({ process, items, loading, updating }) => {
      const content = (
        loading 
      ? <Loading/>
      : !article_slug
      ? items.map( article => <ArticleMini key={article.id} {...article}/>)
      : article_slug === 'new'
      ? <ArticleEditor action="create" onSubmit={onSubmit(process)}/>
      : getArticleAndRender(process, article_slug)
      )
      return (
        <Page>
          <Content>
            { content }
          </Content>
        </Page>
      )
    } 
  }
  </FirebaseProvider>