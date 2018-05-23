import { React } from 'react'
import { handle_form_submit } from 'convenable'

export class Editor extends React.Component{
  state = { html:'' }
  
  onError = ({ message:error }) => this.setState({error})

  onValidForm = ( serialized ) => this.props.onSubmit && this.props.onSubmit(serialized)

  handleForm = handle_form_submit( ( serialized ) => {
    const { validate, transform } = this.props
    if(validate){
      return Promise.resolve()
        .then( () => validate(serialized) )
        .then( () => transform ? transform(serialized) : serialized )
        .then(this.onValidForm)
        .catch(this.onError)
    }
    if(transform){
      return Promise.resolve()
        .then( () => transform(serialized) )
        .then(this.onValidForm)
        .catch(this.onError)
    }
    return this.onValidForm(serialized)
  })

  render(){
    const { children } = this.props
    const { error } = this.state
    return (
      <form onSubmit={this.handleForm}>
        { children }
        <input type="submit" value="ok"/>
      </form>
    )
  }
} 
