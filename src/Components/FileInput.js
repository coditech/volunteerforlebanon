import React from "react";
import classnames from "classnames";
import {
  fileList_to_array,
  get_file_extension,
  log,
  read_image_from_file
} from "convenable";

export const FileInputView = ({
  style,
  className,
  disabled,
  multiple,
  files,
  Comp,
  onRemove,
  labelClassName,
  ...props
}) => (
  <div
    style={style}
    className={classnames("drop-container", className, {
      disabled,
      multiple
    })}
  >
    <label className={labelClassName||"dropfile"}>
      <input disabled={disabled} multiple={multiple} type="file" {...props} />
    </label>
    <div className="drop-files-container">
    { files && files.length
    ? files.map( ( file, index ) => <Comp key={file.name} {...file} onClick={onRemove(index)} />)
    : false
    }
    </div>
  </div>
);

export const FileInputFile = ({ name, image, url, extension, onClick }) => (
  <article className={"card drop-container-file ext-"+extension}>
    <header>
      { url 
      ? <span className="drop-container-file-image" style={urlToStyle(url)}/>
      : <h3>{extension}</h3>
      }
    </header>
    <footer>
      <span>{name}</span>
      <button className="close pseudo" onClick={onClick}>×</button>
    </footer>
  </article>
);

export class FileInput extends React.Component {
  state = {
    files:[],
    previousValue:null
  };

  static getDefaultProps = {
    title: "Drop file or click me"
  };

  static getDerivedStateFromProps(props, state) {
    const { value, defaultValue } = props;
    const previousValue = value || defaultValue
    if( previousValue && (previousValue !== state.previousValue) ){
      if(!Array.isArray(previousValue) && state.files[0] !== previousValue){
        return { files:[previousValue], previousValue}
      }
      else{
        for(let i = state.files.length - 1; i >= 0 ; i--){
          if(state.files[i] !== previousValue[i]){
            return { files:previousValue, previousValue }
          }
        }
      }
    }
    return null
  }

  isValidFile = file => {
    const { accept, isValidFile:_isValid } = this.props;
    if(!_isValid){ return true }
    const extension = get_file_extension(file.name);
    const type = file.type;
    return _isValid(file,{ accept, extension, type })
  };

  onFileChange = files => {
    this.setState({ files });
    const { multiple } = this.props;
    const dispatched = multiple ? files : files[0];
    this.props.onFileChange && this.props.onFileChange(dispatched);
  };

  readFilesAndSetInState = files => {
    const { max:limit } = this.props
    const filesArr = fileList_to_array(files)
    const _files = !filesArr ? [] : limit ? filesArr.slice(0,limit) : filesArr
    if (!_files.length) {
      this.onFileChange(_files);
    } else {
      
      Promise
        .all(_files.map(file=>read_image_from_file(file,true)))
        .then(this.onFileChange)
        .catch(log('error reading file'))
    }
    return _files;
  };

  onChange = evt => {
    evt.preventDefault();
    evt.stopPropagation();
    const input = evt.target;
    this.readFilesAndSetInState(input.files);
    this.props.onChange && this.props.onChange(evt);
  };

  onRemove = (index) => evt => {
    evt.preventDefault();
    evt.stopPropagation();
    const files = this.state.files.slice()
    files.splice(index,1)
    this.setState({files})
  }

  gatherProps() {
    const {
      style,
      className,
      disabled,
      multiple,
      title,
      name,
      fileComponent,
      labelClassName,
      accept,
      id
    } = this.props;
    const { files } = this.state;
    const { onChange, onRemove } = this;
    const props = {
      style,
      className,
      disabled,
      multiple,
      accept,
      title,
      onChange,
      onRemove,
      labelClassName,
      name,
      id,
      Comp:fileComponent || FileInputFile,
      files: files
    };
    return props;
  }

  render() {
    const props = this.gatherProps();
    return <FileInputView {...props} />;
  }
}

export const urlToStyle = url =>
  !!url ? { backgroundImage: `url("${url}")` } : null;

const defaultAccept = ".jpg,.gif,.png,.tif,file/*";

export const isValidImageFile = (file, { accept, extension, type }) => {
  if (!accept) {
    return true;
  }
  if(type.split('/')[0] === 'image'){
    return true
  }
};

export const ImageInput = ( props) => {
  props = { accept:defaultAccept, className:'drop-container-image', labelClassName:'dropimage', isValidFile:isValidImageFile, ...props }
  return <FileInput {...props} />;
}
