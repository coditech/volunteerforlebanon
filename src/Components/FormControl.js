import React from 'react'

let ids = 0

export const FormControl = ({ errors, values, onChange, name, id, type:inputType, label, items }) => {
  if(inputType === 'hidden'){
    return <input name={name} type='hidden' defaultValue={values[name]}/>
  }
  id = id || `control-${ids++}`
  label = typeof label === 'undefined' ? name : label
  return (<div>
    <label className='control' htmlFor={id}>
      { inputType !== 'checkbox' && inputType !== 'radio'
      ? <span>{label}</span>
      : false
      }
      { inputType === 'textarea'
      ? <textarea name={name} placeholder={label} id={id} defaultValue={values[name]} onChange={onChange}/>
      : inputType === 'checkbox'
      ? <input name={name} placeholder={label} id={id} type={inputType} defaultChecked={values[name]} onChange={onChange}/>
      : inputType === 'select'
      ? <select name={name} defaultValue={values[name]} onChange={onChange}>
          { items.map( item => <option key={item.value} value={item.value}>{item.label}</option>) }
        </select>
      : inputType === 'radio'
      ? items.map( item => <label><input type='radio' key={item.value} value={item.value}/><span>{item.label}</span></label>)
      : <input name={name} id={id} placeholder={label} type={inputType} defaultValue={values[name]} onChange={onChange}/>
      }
      { inputType === 'checkbox'
      ? <span>{label}</span>
      : false
      }
    </label>
    { errors && errors[name] && <label className="label error" htmlFor={id}>{errors[name]}</label>}
  </div>)
}

export default FormControl