import React from 'react'
import { db, storage } from '../data/firebaseConfig'
import { readImageFromFile } from '../utils/readImageFromFile'

export const upload = (path, file, meta, onProgress) => (
  file
  ? readImageFromFile(file)
    .then(  metadata => ({ ...metadata, contentType:file.type, file }) )
    .then( ({ file, image, ...rest }) => {
      const metadata = { ...rest, ...meta }
      const name = file.name
      const id = path + '/' + file.name
      const uploadTask = storage.child(id).put(file, metadata );
      const update = ( snapshot ) => onProgress && onProgress(file, (snapshot.bytesTransferred / snapshot.totalBytes))

      return new Promise( ( ok, reject ) => 
        uploadTask.on('state_changed', update, reject, 
          () => uploadTask.snapshot.ref.getDownloadURL().then( url => {
            const props = { ...metadata, name, id, url }
            return image ?  ok({...props, image }) : ok(props)
          })
        )
      )
    })
  : Promise.resolve(null)
)

export const uploadMultiple = ( path, files, meta ) => 
  Promise.all(Array.prototype.slice.call(files).map( file => upload( path, file, meta )))

export const collectionToArray = docList =>{
  const docs = []
  docList.forEach(doc=>docs.push({...doc.data(),id:doc.id}))
  return docs
}

export const removeFile = (id) => storage.child(id).delete()

export const CREATE = 0
export const UPDATE = 1
export const DELETE = 2

export const resolve = (anything) => Promise.resolve(anything)
export const reject = (message) => Promise.reject(new Error(message))

export class FirebaseProvider extends React.Component{

  state = { items: [], loading:true, updating:false }

  getCollection(){
    const name = this.props.collection
    return db.collection( name )
  }

  getList(){
    const collection = this.getCollection()
    if(this.props.orderBy){
      const [prop,direction] = Array.isArray(this.props.orderBy) ? this.props.orderBy : [this.props.orderBy,'asc']
      return collection.orderBy(prop,direction)
    }
    return collection
  }

  getOne(id){
    return this.getCollection().doc(id)
  }

  receiveDocs(docs){
    const items = collectionToArray(docs)
    this.setState({items,loading:false,updating:false})
   } 

  componentDidMount(){ 
    this.unsubscribe = this.getList().onSnapshot((docs)=>this.receiveDocs(docs))
  }

  componentWillUnmount(){ 
    this.unsubscribe && this.unsubscribe(); 
  }

  prepareItem(item, action, batch){
    if(this.props.prepare){
      const result = this.props.prepare(item, action, batch)
      if(typeof result !== 'undefined'){
        return result
      }
      return item
    }
    return item
  }

  validate( item, action ){
    if(this.props.validate){
      const result = this.props.validate(item, action)
      if(typeof result !== 'undefined'){
        return result
      }
      return item
    }
    return item
  }

  transaction( item, action, batch ){
    return resolve(this.prepareItem(item, action, batch ))
      .then( preparedItem  => this.validate(preparedItem, action))
      .then( validatedItem => {
        if(!('id' in validatedItem)){
          throw new Error(`updating an item without an id`)
        }
        return validatedItem
      })
      .then( validatedItem  => new Promise( (ok, no ) => 
          this.setState( {updating:true}, () =>  ok(validatedItem))
        )
      )
  }

  create(item, batch){
    return this.transaction(item, CREATE, batch)
      .then( item => {
        batch.set(this.getOne(item.id), item, { merge:true });
        return item
      })
  }
  
  update(item, batch){
    return this.transaction(item, UPDATE, batch)
      .then( item => { 
        batch.set(this.getOne(item.id), item, { merge:true });
        return item 
      })
  }

  remove(item, batch){
    if(!('id' in item)){
      return Promise.reject(new Error(`updating an item without an id`))
    }
    const id = item.id
    const ref = this.getOne(id)
    return ref.get().then( doc => {
      const item = doc.data()
      return this.transaction({ ...item, id }, DELETE, batch)
        .then( item => { 
          batch.delete(ref);
          return item 
        })
    })
  }

  normalizeAction(action){
    if(typeof action === 'undefined'){ throw new Error(`no action specified`)}
    if(action === CREATE || action === UPDATE || action === DELETE){ return action }
    if( action === 'create' ){ return CREATE }
    if( action === 'update' ){ return UPDATE }
    if( action === 'delete' ){ return DELETE }
    throw new Error(`unknown action \`${action}\``)
  }

  resolveAction(action,item,batch){
    switch(action){
      case CREATE: return this.create(item,batch)
      case UPDATE: return this.update(item,batch)
      case DELETE: return this.remove(item,batch)
      default: return null
    }
  }

  process = ( action, values ) =>
    resolve().then(()=>this.normalizeAction(action)).then( action => {
      const batch = db.batch()
      if(!Array.isArray(values)){
        values = [values]
      }
      const promises = values.map(item => this.resolveAction(action, item, batch)).filter(Boolean)
      return Promise.all(promises)
        .then( items => {
          return batch.commit()
        })
    })

  render(){
    const { process, state:{ items, loading, updating }, props:{ children:renderFunction } } = this
    const props = { process, items, loading, updating }
    return renderFunction(props)
  }

}