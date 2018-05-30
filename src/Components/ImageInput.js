import React from "react";
import { read_image_from_file } from "convenable";

const imageUrlToBackground = (image) =>
  image && image.url ? { backgroundImage:`url("${image.url}")`} : null

export class ImageInput extends React.Component {
  state = {
    images: [],
    image: null,
    acceptRegex: /jpg|gif|png|tif|image\/*/,
    accept: ".jpg,.gif,.png,.tif,image/*"
  };
  static getDerivedStateFromProps(props, state) {
    const acceptState = {};
    if (props.accept && props.accept !== state.accept) {
      acceptState = {
        accept: props.accept,
        acceptRegex: new Regex(
          props.accept
            .replace(/\.|,/g, "")
            .split(/\s+/)
            .map(s => s.trim())
            .join("|")
            .replace(/\//g, "/")
        )
      };
    }
    if (
      props.image &&
      props.image.url &&
      (!!state.image.url || props.image.url !== state.image.url)
    ) {
      return { image: props.image };
    }
    if (props.images && props.images !== state.images) {
      return { images: props.images };
    }
  }
  isImage = (file, ext) => {
    const { accept, acceptRegex } = this.state;
    if (!accept) {
      return true;
    }
    const type = file.type;
    if (acceptRegex.test(ext) || acceptRegex.test(type)) {
      return true;
    }
    return false;
  };
  onChange = evt => {
    evt.preventDefault();
    evt.stopPropagation();
    const input = evt.target;
    const files = input.files;
    if (!files.length) {
      return null;
    }
    const { multiple, onChange, onImageChange } = this.props;
    if (!multiple) {
      read_image_from_file(file, this.isImage).then(data => {
        this.setState({ image: data });
        onImageChange && onImageChange(data);
      });
    } else {
      const images = [];
      Array.prototype.slice
        .call(files)
        .reduce((previousImageRead, file) => {
          previousImageRead.then(() =>
            read_image_from_file(file, this.isImage).then(data => {
              if (data.image) {
                images.push(data);
              }
            })
          );
        }, Promise.resolve())
        .then(() => {
          this.setState({ images });
          onImageChange && onImageChange(images);
        });
    }
    onChange && onChange(evt);
  };
  render() {
    const { style, className, extensions, disabled, multiple } = this.props;
    const single = !multiple
    const { accept, image, images } = this.state;
    const backgroundImage = single && imageUrlToBackground(image)
    const classNames =
      "dropimage-container" +
      (className ? " " + className : "") +
      (disabled ? " disabled" : "") +
      (multiple ? " multiple" : "");
    return (
      <div style={style} className={classNames}>
        <label class={"dropimage"} style={single && backgroundImage ? backgroundImage:null}>
          <input
            title="Drop image or click me"
            disabled={disabled}
            accept={accept}
            type="file"
          />
          { multiple && images && images.length && images.map((image)=><span className='dropimage-image' key={image.url} style={imageUrlToBackground(image)}/>) }
        </label>
      </div>
    );
  }
}
